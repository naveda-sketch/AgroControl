import { describe, it, expect } from 'vitest';
import { validateOcrTotals, isComprobanteReady, canIncludeInReports } from '../ocr-validation';

describe('Regla 6 — OCR de Comprobantes', () => {
  describe('validateOcrTotals', () => {
    it('valida cuando subtotal + IVA = total', () => {
      const result = validateOcrTotals(44100, 7056, 51156);
      expect(result.valid).toBe(true);
      expect(result.message).toBeNull();
    });

    it('detecta cuando total no coincide', () => {
      const result = validateOcrTotals(44100, 7056, 50000);
      expect(result.valid).toBe(false);
      expect(result.expectedTotal).toBe(51156);
      expect(result.message).toContain('Total no coincide');
    });

    it('tolera diferencia de centavos (<=0.01)', () => {
      // 100.00 + 16.00 = 116.00, OCR dice 116.01
      const result = validateOcrTotals(100, 16, 116.01);
      expect(result.valid).toBe(true);
    });

    it('reporta datos incompletos cuando subtotal es null', () => {
      const result = validateOcrTotals(null, 7056, 51156);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('incompletos');
    });

    it('reporta datos incompletos cuando IVA es null', () => {
      const result = validateOcrTotals(44100, null, 51156);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('incompletos');
    });

    it('reporta datos incompletos cuando total es null', () => {
      const result = validateOcrTotals(44100, 7056, null);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('incompletos');
    });

    it('funciona con montos pequeños', () => {
      const result = validateOcrTotals(86.21, 13.79, 100);
      expect(result.valid).toBe(true);
    });
  });

  describe('isComprobanteReady', () => {
    it('retorna true si está validado', () => {
      expect(isComprobanteReady(true)).toBe(true);
    });

    it('retorna false si no está validado', () => {
      expect(isComprobanteReady(false)).toBe(false);
    });
  });

  describe('canIncludeInReports', () => {
    it('solo incluye comprobantes validados en reportes', () => {
      expect(canIncludeInReports(true)).toBe(true);
      expect(canIncludeInReports(false)).toBe(false);
    });
  });
});
