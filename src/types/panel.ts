import type { BandaProbabilidad, PerfilRiesgo } from '@/lib/motor/supuestos';

// Una fila del listado del panel (docs/user-flows.md, Flujo 2). Se
// construye en el servidor a partir de `fichas` + `clientes` + `entrevistas`
// + `analisis`, no es una tabla propia.
export interface FilaCliente {
  clienteId: string;
  nombre: string;
  email: string;
  objetivoDescripcion: string | null;
  objetivoCifra: number | null;
  objetivoPlazo: number | null;
  perfil: PerfilRiesgo | null;
  estadoEntrevista: string;
  banda: BandaProbabilidad | null;
  probabilidadCumplimiento: number | null;
  modo: string | null;
}

// De más en riesgo a menos: es lo que responde «¿quién necesita que le
// llame?» (docs/design-system.md).
export const ORDEN_BANDA: Record<BandaProbabilidad | 'sin_datos', number> = {
  Baja: 0,
  Frágil: 1,
  Razonable: 2,
  Alta: 3,
  sin_datos: -1,
};
