import { crearClienteServidor } from '@/lib/supabase/server';
import { hashearIp, obtenerIp } from '@/lib/ip-hash';
import { MENSAJE_APERTURA } from '@/lib/claude/prompt-entrevista';

// Anti-abuso: la landing es pública y cada entrevista, si llega a hablar,
// cuesta dinero en la API del modelo (docs/architecture.md «Protección del
// flujo público»). Umbral de partida, pendiente de ajustar con datos reales
// de uso — no viene del criterio financiero, es un límite técnico.
const LIMITE_ENTREVISTAS_POR_HORA = 5;

export async function POST(request: Request) {
  const ip = obtenerIp(request);
  const ipHash = hashearIp(ip);
  const supabase = crearClienteServidor();

  const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: errorConteo } = await supabase
    .from('limites_uso')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('accion', 'crear_entrevista')
    .gte('creado_en', haceUnaHora);

  if (errorConteo) {
    return Response.json({ error: 'No se pudo comprobar el límite de uso.' }, { status: 500 });
  }

  if ((count ?? 0) >= LIMITE_ENTREVISTAS_POR_HORA) {
    return Response.json(
      { error: 'Has alcanzado el límite de entrevistas nuevas por hora. Inténtalo más tarde.' },
      { status: 429 },
    );
  }

  const { data: entrevista, error: errorEntrevista } = await supabase
    .from('entrevistas')
    .insert({})
    .select('id, token')
    .single();

  if (errorEntrevista || !entrevista) {
    return Response.json({ error: 'No se pudo crear la entrevista.' }, { status: 500 });
  }

  await supabase.from('limites_uso').insert({ ip_hash: ipHash, accion: 'crear_entrevista' });

  // Guion literal, no generado por el modelo: no hace falta gastar una
  // llamada a la API para el primer mensaje.
  await supabase
    .from('mensajes')
    .insert({ entrevista_id: entrevista.id, rol: 'agente', contenido: MENSAJE_APERTURA });

  return Response.json({ token: entrevista.token });
}
