import Anthropic from '@anthropic-ai/sdk';
import { crearClienteServidor } from '@/lib/supabase/server';
import { construirPromptSistema } from '@/lib/claude/prompt-entrevista';
import { HERRAMIENTA_GUARDAR_CLIENTE, HERRAMIENTA_GUARDAR_DATO } from '@/lib/claude/herramientas';
import { guardarClienteDeEntrevista } from '@/lib/clientes';
import { guardarDatoEnFicha, obtenerFichaEntrevista, construirEstadoFicha } from '@/lib/fichas';
import { calcularProgreso, type DatosFicha } from '@/types/ficha';
import type { Mensaje } from '@/types/mensaje';

// Tope técnico de mensajes por entrevista (cliente + agente). La plantilla ya
// cierra la conversación sola a los ~12 intercambios (docs/criterio/
// plantilla-entrevista.md); esto es solo la red de seguridad si no lo hace.
const MAX_MENSAJES = 40;
const LONGITUD_MAXIMA_MENSAJE = 2000;
// Ida y vuelta con herramientas: nombre+correo y varios datos pueden resolverse
// en el mismo turno. Techo de seguridad para no encadenar llamadas sin fin.
const MAX_ITERACIONES_HERRAMIENTAS = 6;

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cuerpo = await request.json().catch(() => null);
  const mensajeCliente = typeof cuerpo?.mensaje === 'string' ? cuerpo.mensaje.trim() : '';

  if (!mensajeCliente || mensajeCliente.length > LONGITUD_MAXIMA_MENSAJE) {
    return Response.json({ error: 'Mensaje vacío o demasiado largo.' }, { status: 400 });
  }

  const supabase = crearClienteServidor();

  const { data: entrevista } = await supabase
    .from('entrevistas')
    .select('id, cliente_id, expira_en')
    .eq('token', token)
    .maybeSingle<{ id: string; cliente_id: string | null; expira_en: string }>();

  if (!entrevista) {
    return Response.json({ error: 'Entrevista no encontrada.' }, { status: 404 });
  }
  if (new Date(entrevista.expira_en) < new Date()) {
    return Response.json({ error: 'Esta entrevista ha caducado.' }, { status: 410 });
  }

  const { count: mensajesPrevios } = await supabase
    .from('mensajes')
    .select('*', { count: 'exact', head: true })
    .eq('entrevista_id', entrevista.id);

  if ((mensajesPrevios ?? 0) >= MAX_MENSAJES) {
    return Response.json(
      { error: 'Esta entrevista ha llegado a su límite de mensajes.' },
      { status: 409 },
    );
  }

  await supabase
    .from('mensajes')
    .insert({ entrevista_id: entrevista.id, rol: 'cliente', contenido: mensajeCliente });

  const { data: historial } = await supabase
    .from('mensajes')
    .select('id, rol, contenido, creado_en')
    .eq('entrevista_id', entrevista.id)
    .order('id', { ascending: true })
    .returns<Mensaje[]>();

  const mensajesParaClaude: Anthropic.MessageParam[] = (historial ?? []).map((m) => ({
    role: m.rol === 'cliente' ? 'user' : 'assistant',
    content: m.contenido,
  }));

  const anthropic = new Anthropic();

  // Cliente aún puede no existir (todavía no dio nombre+correo): guardar_dato
  // solo se puede ejecutar una vez hay cliente_id. Se rellena en el bucle si
  // guardar_cliente se llama en este mismo turno.
  let clienteId = entrevista.cliente_id;
  let clienteCreado = false;
  let datosFicha: DatosFicha | null = clienteId
    ? ((await obtenerFichaEntrevista(supabase, entrevista.id))?.datos ?? null)
    : null;

  let respuesta = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system: construirPromptSistema(construirEstadoFicha(datosFicha)),
    tools: [HERRAMIENTA_GUARDAR_CLIENTE, HERRAMIENTA_GUARDAR_DATO],
    messages: mensajesParaClaude,
  });

  let iteraciones = 0;
  while (respuesta.stop_reason === 'tool_use' && iteraciones < MAX_ITERACIONES_HERRAMIENTAS) {
    iteraciones += 1;
    const bloquesHerramienta = respuesta.content.filter((b) => b.type === 'tool_use');
    if (bloquesHerramienta.length === 0) break;

    const resultados: Anthropic.ToolResultBlockParam[] = [];

    for (const bloque of bloquesHerramienta) {
      if (bloque.type !== 'tool_use') continue;

      if (bloque.name === 'guardar_cliente') {
        const entrada = bloque.input as { nombre?: string; email?: string };
        if (entrada.nombre && entrada.email) {
          try {
            const resultado = await guardarClienteDeEntrevista(
              supabase,
              entrevista.id,
              entrada.nombre,
              entrada.email,
            );
            clienteId = resultado.clienteId;
            clienteCreado = true;
            resultados.push({
              type: 'tool_result',
              tool_use_id: bloque.id,
              content: 'Cliente guardado correctamente.',
            });
          } catch {
            resultados.push({
              type: 'tool_result',
              tool_use_id: bloque.id,
              content: 'No se pudo guardar el cliente, sigue la conversación con normalidad.',
            });
          }
        } else {
          resultados.push({
            type: 'tool_result',
            tool_use_id: bloque.id,
            content: 'Faltan nombre o email, pídelos de nuevo.',
          });
        }
        continue;
      }

      if (bloque.name === 'guardar_dato') {
        if (!clienteId) {
          resultados.push({
            type: 'tool_result',
            tool_use_id: bloque.id,
            content: 'Todavía no hay cliente creado: llama primero a guardar_cliente.',
            is_error: true,
          });
          continue;
        }
        const entrada = bloque.input as {
          clave?: string;
          valor?: unknown;
          etiqueta?: string;
          cita?: string;
          supuesto?: string;
        };
        const resultado = await guardarDatoEnFicha(
          supabase,
          entrevista.id,
          clienteId,
          entrada.clave ?? '',
          entrada.valor,
          entrada.etiqueta ?? '',
          entrada.cita,
          entrada.supuesto,
        );
        if (resultado.ok) {
          datosFicha = resultado.datos;
          resultados.push({ type: 'tool_result', tool_use_id: bloque.id, content: 'Guardado.' });
        } else {
          resultados.push({
            type: 'tool_result',
            tool_use_id: bloque.id,
            content: resultado.error,
            is_error: true,
          });
        }
        continue;
      }

      resultados.push({
        type: 'tool_result',
        tool_use_id: bloque.id,
        content: 'Herramienta desconocida.',
        is_error: true,
      });
    }

    mensajesParaClaude.push({ role: 'assistant', content: respuesta.content });
    mensajesParaClaude.push({ role: 'user', content: resultados });

    respuesta = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: construirPromptSistema(construirEstadoFicha(datosFicha)),
      tools: [HERRAMIENTA_GUARDAR_CLIENTE, HERRAMIENTA_GUARDAR_DATO],
      messages: mensajesParaClaude,
    });
  }

  const textoRespuesta = respuesta.content
    .filter((b) => b.type === 'text')
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('\n')
    .trim();

  const textoFinal = textoRespuesta || 'Perdona, se me ha ido el hilo. ¿Puedes repetirlo?';

  await supabase
    .from('mensajes')
    .insert({ entrevista_id: entrevista.id, rol: 'agente', contenido: textoFinal });

  return Response.json({
    respuesta: textoFinal,
    clienteCreado,
    progreso: calcularProgreso(datosFicha),
  });
}
