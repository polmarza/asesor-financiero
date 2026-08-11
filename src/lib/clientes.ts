import type { SupabaseClient } from '@supabase/supabase-js';

interface ResultadoGuardarCliente {
  clienteId: string;
  yaExistia: boolean;
}

// Crea el cliente al primer dato de contacto que suelta durante la
// entrevista, o lo enlaza si ya existía por correo (docs/data-model.md
// «Por qué el correo es único»: un cliente, varias entrevistas).
export async function guardarClienteDeEntrevista(
  supabase: SupabaseClient,
  entrevistaId: string,
  nombre: string,
  emailBruto: string,
): Promise<ResultadoGuardarCliente> {
  const email = emailBruto.trim().toLowerCase();

  const { data: existente } = await supabase
    .from('clientes')
    .select('id')
    .eq('email', email)
    .maybeSingle<{ id: string }>();

  let clienteId: string;
  let yaExistia: boolean;

  if (existente) {
    clienteId = existente.id;
    yaExistia = true;
  } else {
    const { data: nuevo, error } = await supabase
      .from('clientes')
      .insert({ nombre: nombre.trim(), email })
      .select('id')
      .single<{ id: string }>();
    if (error || !nuevo) throw new Error('No se pudo crear el cliente.');
    clienteId = nuevo.id;
    yaExistia = false;
  }

  await supabase.from('entrevistas').update({ cliente_id: clienteId }).eq('id', entrevistaId);

  return { clienteId, yaExistia };
}
