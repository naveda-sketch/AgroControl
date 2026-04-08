import { describe, it, expect } from 'vitest';
import { calcularCostoUsoEquipo, calcularCostoXHora, determinarTipoGasto } from '../opex-capex';

describe('Regla 2 — OPEX vs CAPEX', () => {
  describe('calcularCostoUsoEquipo', () => {
    it('calcula correctamente horas × costo/hora', () => {
      // Tractor: 18 horas × $70.83/hr = $1274.94
      expect(calcularCostoUsoEquipo(18, 70.83)).toBe(1274.94);
    });

    it('devuelve 0 cuando horas es 0', () => {
      expect(calcularCostoUsoEquipo(0, 100)).toBe(0);
    });

    it('lanza error con horas negativas', () => {
      expect(() => calcularCostoUsoEquipo(-5, 100)).toThrow('positivos');
    });

    it('lanza error con costo negativo', () => {
      expect(() => calcularCostoUsoEquipo(5, -100)).toThrow('positivos');
    });

    it('redondea a 2 decimales', () => {
      expect(calcularCostoUsoEquipo(3, 33.333)).toBe(100);
    });
  });

  describe('calcularCostoXHora', () => {
    it('calcula depreciación por hora correctamente', () => {
      // Tractor $850,000 / 12,000 hrs = $70.83
      expect(calcularCostoXHora(850000, 12000)).toBe(70.83);
    });

    it('lanza error si vida útil es 0', () => {
      expect(() => calcularCostoXHora(100000, 0)).toThrow('mayor a cero');
    });

    it('lanza error si vida útil es negativa', () => {
      expect(() => calcularCostoXHora(100000, -500)).toThrow('mayor a cero');
    });
  });

  describe('determinarTipoGasto', () => {
    it('retorna CAPEX para equipos', () => {
      expect(determinarTipoGasto(true)).toBe('CAPEX');
    });

    it('retorna OPEX para no-equipos', () => {
      expect(determinarTipoGasto(false)).toBe('OPEX');
    });
  });
});
