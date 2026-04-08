/**
 * REGLA 3 — Almacén Virtual (Inventario vs. Aplicación)
 * Comprar no impacta costo del proyecto.
 * El costo se detona al registrar la APLICACIÓN.
 * costo_gasto = cantidad_aplicada × costo_unitario_promedio_ponderado
 */
export function calcularCostoAplicacion(
  cantidadAplicada: number,
  costoUnitarioProm: number,
): number {
  if (cantidadAplicada < 0 || costoUnitarioProm < 0) {
    throw new Error('Cantidad aplicada y costo unitario deben ser positivos.');
  }
  return Math.round(cantidadAplicada * costoUnitarioProm * 100) / 100;
}

export function validarDisponibilidadAlmacen(
  cantidadDisponible: number,
  cantidadSolicitada: number,
): void {
  if (cantidadSolicitada > cantidadDisponible) {
    throw new Error(
      `Stock insuficiente. Disponible: ${cantidadDisponible}, solicitado: ${cantidadSolicitada}.`,
    );
  }
}

export function calcularNuevoDisponible(
  cantidadDisponible: number,
  cantidadAplicada: number,
): number {
  const nuevo = cantidadDisponible - cantidadAplicada;
  if (nuevo < 0) {
    throw new Error('La cantidad disponible no puede ser negativa.');
  }
  return Math.round(nuevo * 1000) / 1000;
}

export function calcularCostoPromedioPonderado(
  cantidadExistente: number,
  costoExistente: number,
  cantidadNueva: number,
  costoNuevo: number,
): number {
  const totalCantidad = cantidadExistente + cantidadNueva;
  if (totalCantidad <= 0) return 0;
  const costoTotal = cantidadExistente * costoExistente + cantidadNueva * costoNuevo;
  return Math.round((costoTotal / totalCantidad) * 10000) / 10000;
}
