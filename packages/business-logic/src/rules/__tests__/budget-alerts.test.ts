import { describe, it, expect } from 'vitest';
import {
  calcularDesviacionPct,
  determinarAlertLevel,
  calcularBudgetStatus,
  validarPresupuestoExiste,
  calcularCostoXHectarea,
  calcularCostoXTonelada,
} from '../budget-alerts';

describe('Regla 4 — Budget vs. Actuals', () => {
  describe('calcularDesviacionPct', () => {
    it('calcula desviación positiva (sobre presupuesto)', () => {
      // Ejercido 110,000 vs presupuestado 100,000 = +10%
      expect(calcularDesviacionPct(110000, 100000)).toBe(10);
    });

    it('calcula desviación negativa (bajo presupuesto)', () => {
      expect(calcularDesviacionPct(80000, 100000)).toBe(-20);
    });

    it('devuelve 0 si presupuesto es 0', () => {
      expect(calcularDesviacionPct(5000, 0)).toBe(0);
    });

    it('devuelve 0 cuando ejercido = presupuestado', () => {
      expect(calcularDesviacionPct(100000, 100000)).toBe(0);
    });
  });

  describe('determinarAlertLevel', () => {
    it('retorna ok cuando < 80%', () => {
      expect(determinarAlertLevel(50)).toBe('ok');
      expect(determinarAlertLevel(79.99)).toBe('ok');
    });

    it('retorna warning cuando >= 80% y < 90%', () => {
      expect(determinarAlertLevel(80)).toBe('warning');
      expect(determinarAlertLevel(89.99)).toBe('warning');
    });

    it('retorna critical cuando >= 90% y < 100%', () => {
      expect(determinarAlertLevel(90)).toBe('critical');
      expect(determinarAlertLevel(99.99)).toBe('critical');
    });

    it('retorna exceeded cuando >= 100%', () => {
      expect(determinarAlertLevel(100)).toBe('exceeded');
      expect(determinarAlertLevel(150)).toBe('exceeded');
    });
  });

  describe('calcularBudgetStatus', () => {
    it('calcula status completo correctamente', () => {
      const status = calcularBudgetStatus(85000, 100000);
      expect(status.presupuestado).toBe(100000);
      expect(status.ejercido).toBe(85000);
      expect(status.porcentaje).toBe(85);
      expect(status.alertLevel).toBe('warning');
    });

    it('maneja presupuesto excedido', () => {
      const status = calcularBudgetStatus(120000, 100000);
      expect(status.porcentaje).toBe(120);
      expect(status.alertLevel).toBe('exceeded');
      expect(status.desviacion).toBe(20);
    });

    it('lanza error con presupuesto negativo', () => {
      expect(() => calcularBudgetStatus(5000, -1000)).toThrow('no puede ser negativo');
    });
  });

  describe('validarPresupuestoExiste', () => {
    it('no lanza error cuando presupuesto es positivo', () => {
      expect(() => validarPresupuestoExiste(28000)).not.toThrow();
    });

    it('lanza error cuando presupuesto es null', () => {
      expect(() => validarPresupuestoExiste(null)).toThrow('Se requiere un presupuesto inicial');
    });

    it('lanza error cuando presupuesto es 0', () => {
      expect(() => validarPresupuestoExiste(0)).toThrow('Se requiere un presupuesto inicial');
    });
  });

  describe('calcularCostoXHectarea', () => {
    it('calcula $/ha correctamente', () => {
      // $3,360,000 total / 120 ha = $28,000/ha
      expect(calcularCostoXHectarea(3360000, 120)).toBe(28000);
    });

    it('lanza error si hectáreas es 0', () => {
      expect(() => calcularCostoXHectarea(100000, 0)).toThrow('mayor a cero');
    });
  });

  describe('calcularCostoXTonelada', () => {
    it('calcula $/ton correctamente', () => {
      // $3,360,000 / 1200 ton = $2,800/ton
      expect(calcularCostoXTonelada(3360000, 1200)).toBe(2800);
    });

    it('lanza error si toneladas es 0', () => {
      expect(() => calcularCostoXTonelada(100000, 0)).toThrow('mayor a cero');
    });
  });
});
