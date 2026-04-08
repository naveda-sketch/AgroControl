/**
 * REGLA 4 — Budget vs. Actuals
 * Alertas automáticas cuando una etapa supera 80%, 90%, y 100% del budget.
 */
import { BUDGET_ALERT_THRESHOLDS } from '@agrocontrol/shared';

export type BudgetAlertLevel = 'ok' | 'warning' | 'critical' | 'exceeded';

export interface BudgetStatus {
  presupuestado: number;
  ejercido: number;
  porcentaje: number;
  alertLevel: BudgetAlertLevel;
  desviacion: number;
}

export function calcularDesviacionPct(ejercido: number, presupuestado: number): number {
  if (presupuestado <= 0) return 0;
  return Math.round(((ejercido - presupuestado) / presupuestado) * 10000) / 100;
}

export function determinarAlertLevel(porcentajeEjercido: number): BudgetAlertLevel {
  if (porcentajeEjercido >= BUDGET_ALERT_THRESHOLDS[2]!) return 'exceeded';
  if (porcentajeEjercido >= BUDGET_ALERT_THRESHOLDS[1]!) return 'critical';
  if (porcentajeEjercido >= BUDGET_ALERT_THRESHOLDS[0]!) return 'warning';
  return 'ok';
}

export function calcularBudgetStatus(ejercido: number, presupuestado: number): BudgetStatus {
  if (presupuestado < 0) throw new Error('Presupuesto no puede ser negativo.');
  const porcentaje = presupuestado > 0 ? Math.round((ejercido / presupuestado) * 10000) / 100 : 0;
  return {
    presupuestado,
    ejercido,
    porcentaje,
    alertLevel: determinarAlertLevel(porcentaje),
    desviacion: calcularDesviacionPct(ejercido, presupuestado),
  };
}

export function validarPresupuestoExiste(presupuestoXHa: number | null | undefined): void {
  if (!presupuestoXHa || presupuestoXHa <= 0) {
    throw new Error('Se requiere un presupuesto inicial ($/ha) antes de registrar gastos.');
  }
}

export function calcularCostoXHectarea(gastoTotal: number, hectareas: number): number {
  if (hectareas <= 0) throw new Error('Hectáreas deben ser mayor a cero.');
  return Math.round((gastoTotal / hectareas) * 100) / 100;
}

export function calcularCostoXTonelada(gastoTotal: number, toneladasEstimadas: number): number {
  if (toneladasEstimadas <= 0) throw new Error('Toneladas estimadas deben ser mayor a cero.');
  return Math.round((gastoTotal / toneladasEstimadas) * 100) / 100;
}
