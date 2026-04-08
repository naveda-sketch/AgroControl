/**
 * REGLA 2 — OPEX vs CAPEX
 * OPEX = consumo inmediato. Va directo al costo de la etapa.
 * CAPEX = activos depreciables. Se registra USO por hora o hectárea.
 */
import type { GastoTipo } from '@agrocontrol/shared';

export function calcularCostoUsoEquipo(horasUso: number, costoXHora: number): number {
  if (horasUso < 0 || costoXHora < 0) {
    throw new Error('Horas de uso y costo por hora deben ser positivos.');
  }
  return Math.round(horasUso * costoXHora * 100) / 100;
}

export function calcularCostoXHora(valorAdquisicion: number, vidaUtilHoras: number): number {
  if (vidaUtilHoras <= 0) {
    throw new Error('Vida útil en horas debe ser mayor a cero.');
  }
  return Math.round((valorAdquisicion / vidaUtilHoras) * 100) / 100;
}

export function determinarTipoGasto(esEquipo: boolean): GastoTipo {
  return esEquipo ? 'CAPEX' : 'OPEX';
}
