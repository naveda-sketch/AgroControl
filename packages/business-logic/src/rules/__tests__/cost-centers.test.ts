import { describe, it, expect } from 'vitest';
import { isValidEtapa, validateGastoHasEtapa } from '../cost-centers';

describe('Regla 1 — Centros de Costo', () => {
  describe('isValidEtapa', () => {
    it('acepta las 4 etapas válidas', () => {
      expect(isValidEtapa('PREPARACION')).toBe(true);
      expect(isValidEtapa('SIEMBRA')).toBe(true);
      expect(isValidEtapa('DESARROLLO')).toBe(true);
      expect(isValidEtapa('COSECHA')).toBe(true);
    });

    it('rechaza etapas inválidas', () => {
      expect(isValidEtapa('GENERAL')).toBe(false);
      expect(isValidEtapa('MANTENIMIENTO')).toBe(false);
      expect(isValidEtapa('')).toBe(false);
      expect(isValidEtapa('preparacion')).toBe(false); // case sensitive
    });
  });

  describe('validateGastoHasEtapa', () => {
    it('no lanza error cuando tiene etapa', () => {
      expect(() => validateGastoHasEtapa('d1000000-0000-0000-0000-000000000001')).not.toThrow();
    });

    it('lanza error si id_etapa es null', () => {
      expect(() => validateGastoHasEtapa(null)).toThrow('Todo gasto debe asignarse a una etapa');
    });

    it('lanza error si id_etapa es undefined', () => {
      expect(() => validateGastoHasEtapa(undefined)).toThrow('Todo gasto debe asignarse a una etapa');
    });

    it('lanza error si id_etapa es string vacío', () => {
      expect(() => validateGastoHasEtapa('')).toThrow('Todo gasto debe asignarse a una etapa');
    });
  });
});
