import { describe, it, expect } from 'vitest';
import {
  calcularCostoAplicacion,
  validarDisponibilidadAlmacen,
  calcularNuevoDisponible,
  calcularCostoPromedioPonderado,
} from '../almacen-virtual';

describe('Regla 3 — Almacén Virtual', () => {
  describe('calcularCostoAplicacion', () => {
    it('calcula costo = cantidad × costo_unitario_prom', () => {
      // 500 kg de DAP × $18.75/kg = $9,375.00
      expect(calcularCostoAplicacion(500, 18.75)).toBe(9375);
    });

    it('redondea a 2 decimales', () => {
      expect(calcularCostoAplicacion(3, 33.333)).toBe(100);
    });

    it('lanza error con cantidad negativa', () => {
      expect(() => calcularCostoAplicacion(-10, 18.75)).toThrow('positivos');
    });

    it('devuelve 0 si cantidad es 0', () => {
      expect(calcularCostoAplicacion(0, 18.75)).toBe(0);
    });
  });

  describe('validarDisponibilidadAlmacen', () => {
    it('no lanza error si hay stock suficiente', () => {
      expect(() => validarDisponibilidadAlmacen(1000, 500)).not.toThrow();
    });

    it('no lanza error si solicita exactamente lo disponible', () => {
      expect(() => validarDisponibilidadAlmacen(500, 500)).not.toThrow();
    });

    it('lanza error si no hay stock suficiente', () => {
      expect(() => validarDisponibilidadAlmacen(100, 150)).toThrow('Stock insuficiente');
    });
  });

  describe('calcularNuevoDisponible', () => {
    it('resta la cantidad aplicada', () => {
      expect(calcularNuevoDisponible(1000, 300)).toBe(700);
    });

    it('permite llegar a cero', () => {
      expect(calcularNuevoDisponible(500, 500)).toBe(0);
    });

    it('lanza error si resultado sería negativo', () => {
      expect(() => calcularNuevoDisponible(100, 200)).toThrow('no puede ser negativa');
    });

    it('redondea a 3 decimales', () => {
      expect(calcularNuevoDisponible(10.555, 3.111)).toBe(7.444);
    });
  });

  describe('calcularCostoPromedioPonderado', () => {
    it('calcula promedio ponderado correctamente', () => {
      // 1000 kg a $18.75 + 500 kg a $20.00
      // = (1000*18.75 + 500*20) / 1500 = 28750 / 1500 = 19.1667
      expect(calcularCostoPromedioPonderado(1000, 18.75, 500, 20)).toBe(19.1667);
    });

    it('devuelve costo nuevo si no hay existencia previa', () => {
      expect(calcularCostoPromedioPonderado(0, 0, 100, 25)).toBe(25);
    });

    it('devuelve 0 si total cantidad es 0', () => {
      expect(calcularCostoPromedioPonderado(0, 0, 0, 25)).toBe(0);
    });
  });
});
