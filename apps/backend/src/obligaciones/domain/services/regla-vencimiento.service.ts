import type { TipoObligacion } from '@numerito/shared';
import { TIPO_OBLIGACION } from '@numerito/shared';

// Tabla de vencimientos por terminación de CUIT para obligaciones mensuales
// La terminación del CUIT determina el día de vencimiento del mes siguiente
const TABLA_VENCIMIENTO_IVA: Record<string, number> = {
  '0': 13, '1': 13, '2': 14, '3': 14,
  '4': 15, '5': 15, '6': 18, '7': 18,
  '8': 19, '9': 19,
};

const TABLA_VENCIMIENTO_IIBB: Record<string, number> = {
  '0': 13, '1': 13, '2': 14, '3': 14,
  '4': 15, '5': 15, '6': 16, '7': 16,
  '8': 17, '9': 17,
};

export class ReglaVencimientoService {
  calcularFechaVencimiento(
    tipo: TipoObligacion,
    cuitRaw: string,
    periodo: string,
  ): Date {
    const [year, month] = periodo.split('-').map(Number);
    const terminacion = cuitRaw.charAt(cuitRaw.length - 1);
    const mesSiguiente = month; // periodo es el mes del impuesto, vence el mes siguiente
    const anio = mesSiguiente === 12 ? year + 1 : year;
    const mes = mesSiguiente === 12 ? 0 : mesSiguiente;

    let dia: number;

    switch (tipo) {
      case TIPO_OBLIGACION.IVA:
      case TIPO_OBLIGACION.DDJJ_IVA:
      case TIPO_OBLIGACION.SICORE:
      case TIPO_OBLIGACION.SIRE:
        dia = TABLA_VENCIMIENTO_IVA[terminacion] ?? 15;
        break;

      case TIPO_OBLIGACION.MONOTRIBUTO:
        dia = 20;
        break;

      case TIPO_OBLIGACION.IIBB_ARBA:
      case TIPO_OBLIGACION.IIBB_AGIP:
      case TIPO_OBLIGACION.IIBB_CONVENIO_MULTILATERAL:
        dia = TABLA_VENCIMIENTO_IIBB[terminacion] ?? 15;
        break;

      case TIPO_OBLIGACION.GANANCIAS:
      case TIPO_OBLIGACION.DDJJ_GANANCIAS:
        dia = TABLA_VENCIMIENTO_IVA[terminacion] ?? 15;
        break;

      case TIPO_OBLIGACION.F931:
      case TIPO_OBLIGACION.SUSS:
      case TIPO_OBLIGACION.SICOSS:
        dia = 11;
        break;

      case TIPO_OBLIGACION.LIBRO_IVA_DIGITAL:
        dia = TABLA_VENCIMIENTO_IVA[terminacion] ?? 15;
        break;

      default:
        dia = 15;
    }

    return new Date(anio, mes, dia);
  }
}
