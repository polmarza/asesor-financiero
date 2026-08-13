import { crearClienteServidor } from '@/lib/supabase/server';
import { obtenerFichaEntrevista } from '@/lib/fichas';
import { construirFichaCompleta } from '@/lib/diagnostico/construir-ficha';
import { ejecutarDiagnostico } from '@/lib/diagnostico/ejecutar';
import { construirHechosPlan } from '@/lib/diagnostico/hechos-plan';
import { construirMarkdownPlan } from '@/lib/diagnostico/markdown-plan';
import { VERSION_MOTOR, VERSION_REGLAS } from '@/lib/diagnostico/version';
import { generarPlan } from '@/lib/claude/generar-plan';
import { LETRA_PEQUENA } from '@/types/plan';

// Fase 6: cierre de la entrevista. A partir de aquí la ficha se considera
// cerrada — una corrección posterior (fuera del alcance actual: Marta no
// edita, ver docs/user-flows.md) tendría que versionarse, no sobrescribirse.
//
// Fase 7: el cierre es también el disparador del diagnóstico
// (docs/user-flows.md, paso 6 «Cálculo»): con la ficha ya confirmada, se
// ejecuta el motor y se guarda en `analisis`.
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = crearClienteServidor();

  const { data: entrevista } = await supabase
    .from('entrevistas')
    .select('id, cliente_id, completada_en')
    .eq('token', token)
    .maybeSingle<{ id: string; cliente_id: string | null; completada_en: string | null }>();

  if (!entrevista || !entrevista.cliente_id) {
    return Response.json({ error: 'Entrevista no encontrada.' }, { status: 404 });
  }

  const fechaCierre = new Date().toISOString();
  const { error } = await supabase
    .from('entrevistas')
    .update({ estado: 'completada', completada_en: fechaCierre })
    .eq('id', entrevista.id);

  if (error) {
    return Response.json({ error: 'No se pudo cerrar la entrevista.' }, { status: 500 });
  }

  const [{ data: cliente }, ficha] = await Promise.all([
    supabase.from('clientes').select('nombre').eq('id', entrevista.cliente_id).single<{ nombre: string }>(),
    obtenerFichaEntrevista(supabase, entrevista.id),
  ]);

  if (cliente && ficha) {
    const fichaCompleta = construirFichaCompleta(ficha.datos, cliente.nombre, fechaCierre);
    const resultado = ejecutarDiagnostico(fichaCompleta);

    const { data: analisis } = await supabase
      .from('analisis')
      .insert({
        ficha_id: ficha.id,
        modo: resultado.modo,
        resultado,
        version_motor: VERSION_MOTOR,
        version_reglas: VERSION_REGLAS,
      })
      .select('id')
      .single<{ id: string }>();

    // Fase 8: el plan se redacta a partir del JSON del motor, nunca al
    // revés — si esto falla, el análisis ya quedó guardado y trazable.
    if (analisis) {
      try {
        const hechos = construirHechosPlan(cliente.nombre, ficha.datos, resultado);
        const secciones = await generarPlan(hechos);
        const markdown = construirMarkdownPlan(cliente.nombre, secciones);

        await supabase.from('planes').insert({
          analisis_id: analisis.id,
          secciones,
          markdown,
          descargo: LETRA_PEQUENA,
        });
      } catch {
        // El diagnóstico ya está guardado; el cliente puede reintentar ver
        // su plan más tarde sin perder el análisis.
      }
    }
  }

  return Response.json({ ok: true });
}
