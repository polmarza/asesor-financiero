import type { Ficha } from '@/lib/motor/ficha';
import { CLAVES_FICHA, type DatosFicha } from '@/types/ficha';

// El motor exige la Ficha completa (todas las claves presentes). Lo que
// falta en la captura se rellena como `pendiente` — nunca con un valor
// inventado (docs/architecture.md, «El modelo no calcula ni completa»).
export function construirFichaCompleta(datos: DatosFicha, nombre: string, fechaEntrevista: string): Ficha {
  const pendientes: string[] = [];
  const conDefecto = (clave: (typeof CLAVES_FICHA)[number]) => {
    const dato = datos[clave];
    if (dato === undefined) {
      pendientes.push(clave);
      return { valor: null, etiqueta: 'pendiente' as const };
    }
    return dato;
  };

  return {
    nombre,
    fechaEntrevista,
    objetivoDescripcion: conDefecto('objetivoDescripcion'),
    objetivoCifra: conDefecto('objetivoCifra'),
    objetivoPlazo: conDefecto('objetivoPlazo'),
    ingresosNetosMes: conDefecto('ingresosNetosMes'),
    ingresosEstabilidad: conDefecto('ingresosEstabilidad'),
    gastoTotalMes: conDefecto('gastoTotalMes'),
    aportacionMensualActual: conDefecto('aportacionMensualActual'),
    patrimonioTotal: conDefecto('patrimonioTotal'),
    patrimonioDistribucion: conDefecto('patrimonioDistribucion'),
    deudas: conDefecto('deudas'),
    colchonMeses: conDefecto('colchonMeses'),
    riesgoExperiencia: conDefecto('riesgoExperiencia'),
    riesgoEscenario: conDefecto('riesgoEscenario'),
    riesgoPerfilDerivado: conDefecto('riesgoPerfilDerivado'),
    pendientes,
  } as Ficha;
}
