/**
 * REGLA 1 — Centros de Costo
 * Todo gasto DEBE asignarse a una de las 4 etapas.
 * No existen gastos "generales" o sin etapa.
 */
import type { EtapaTipo } from '@agrocontrol/shared';
import { ETAPA_TIPOS } from '@agrocontrol/shared';

export function isValidEtapa(tipo: string): tipo is EtapaTipo {
  return (ETAPA_TIPOS as readonly string[]).includes(tipo);
}

export function validateGastoHasEtapa(idEtapa: string | null | undefined): void {
  if (!idEtapa) {
    throw new Error('Todo gasto debe asignarse a una etapa (PREPARACION, SIEMBRA, DESARROLLO, COSECHA).');
  }
}
