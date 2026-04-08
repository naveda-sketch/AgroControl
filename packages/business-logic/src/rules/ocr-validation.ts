/**
 * REGLA 6 — OCR de Comprobantes
 * Datos OCR son editables. El comprobante debe validarse antes de ser firme.
 */
export interface OcrResult {
  proveedor: string | null;
  fecha: string | null;
  subtotal: number | null;
  iva: number | null;
  total: number | null;
}

export function validateOcrTotals(subtotal: number | null, iva: number | null, total: number | null): {
  valid: boolean;
  expectedTotal: number | null;
  message: string | null;
} {
  if (subtotal === null || iva === null || total === null) {
    return { valid: false, expectedTotal: null, message: 'Datos OCR incompletos. Verifique manualmente.' };
  }

  const expected = Math.round((subtotal + iva) * 100) / 100;
  const diff = Math.round(Math.abs(expected - total) * 100) / 100;

  if (diff > 0.01) {
    return {
      valid: false,
      expectedTotal: expected,
      message: `Total no coincide. Subtotal (${subtotal}) + IVA (${iva}) = ${expected}, pero OCR detectó ${total}.`,
    };
  }

  return { valid: true, expectedTotal: expected, message: null };
}

export function isComprobanteReady(validado: boolean): boolean {
  return validado;
}

export function canIncludeInReports(validado: boolean): boolean {
  return validado;
}
