import Anthropic from '@anthropic-ai/sdk';
import { crearClienteServidor } from '@/lib/supabase/server';
import { PROMPT_SISTEMA_ENTREVISTA } from '@/lib/claude/prompt-entrevista';
import { HERRAMIENTA_GUARDAR_CLIENTE } from '@/lib/claude/herramientas';
import { guardarClienteDeEntrevista } from '@/lib/clientes';
import type { Mensaje } from '@/types/mensaje';

// Tope técnico de mensajes por entrevista (cliente + agente). La plantilla ya
// cierra la conversación sola a los ~12 intercambios (docs/criterio/
// plantilla-entrevista.md); esto es solo la red de seguridad si no lo hace.
const MAX_MENSAJES = 40;
const LONGITUD_MAXIMA_MENSAJE = 2000;

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
    .select('id, expira_en')
    .eq('token', token)
    .maybeSingle<{ id: string; expira_en: string }>();

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

  let respuesta = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system: PROMPT_SISTEMA_ENTREVISTA,
    tools: [HERRAMIENTA_GUARDAR_CLIENTE],
    messages: mensajesParaClaude,
  });

  let clienteCreado = false;

  if (respuesta.stop_reason === 'tool_use') {
    const bloqueHerramienta = respuesta.content.find((b) => b.type === 'tool_use');

    if (bloqueHerramienta && bloqueHerramienta.type === 'tool_use') {
      const entrada = bloqueHerramienta.input as { nombre?: string; email?: string };
      let resultadoHerramienta: string;

      if (entrada.nombre && entrada.email) {
        try {
          await guardarClienteDeEntrevista(supabase, entrevista.id, entrada.nombre, entrada.email);
          clienteCreado = true;
          resultadoHerramienta = 'Cliente guardado correctamente.';
        } catch {
          resultadoHerramienta = 'No se pudo guardar el cliente, sigue la conversación con normalidad.';
        }
      } else {
        resultadoHerramienta = 'Faltan nombre o email, pídelos de nuevo.';
      }

      mensajesParaClaude.push({ role: 'assistant', content: respuesta.content });
      mensajesParaClaude.push({
        role: 'user',
        content: [
          { type: 'tool_result', tool_use_id: bloqueHerramienta.id, content: resultadoHerramienta },
        ],
      });

      respuesta = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: PROMPT_SISTEMA_ENTREVISTA,
        tools: [HERRAMIENTA_GUARDAR_CLIENTE],
        messages: mensajesParaClaude,
      });
    }
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

  return Response.json({ respuesta: textoFinal, clienteCreado });
}
