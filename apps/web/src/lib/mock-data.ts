import type {
  Proyecto,
  Parcela,
  Etapa,
  Gasto,
  AlmacenVirtual,
  PresupuestoBase,
  CalendarioLunar,
} from '@agrocontrol/shared';

export const mockProyecto: Proyecto = {
  id_proyecto: 'b1000000-0000-0000-0000-000000000001',
  nombre: 'Maíz Rancho El Porvenir PV-2026',
  temporada: 'PV-2026',
  hectareas_totales: 120,
  presupuesto_x_ha: 28000,
  fecha_inicio: '2026-03-15',
  fecha_fin: null,
  status: 'activo',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-04-08T00:00:00Z',
};

export const mockParcelas: Parcela[] = [
  { id_parcela: 'c1', id_proyecto: 'b1000000-0000-0000-0000-000000000001', nombre_potrero: 'Potrero Norte', hectareas: 45, coordenadas_gps: null, tipo_suelo: 'Vertisol' },
  { id_parcela: 'c2', id_proyecto: 'b1000000-0000-0000-0000-000000000001', nombre_potrero: 'Potrero Sur', hectareas: 40, coordenadas_gps: null, tipo_suelo: 'Vertisol' },
  { id_parcela: 'c3', id_proyecto: 'b1000000-0000-0000-0000-000000000001', nombre_potrero: 'Potrero Oriente', hectareas: 35, coordenadas_gps: null, tipo_suelo: 'Feozem' },
];

export const mockGastosPorEtapa = {
  PREPARACION: { presupuestado: 840000, ejercido: 138800, label: 'Preparación' },
  SIEMBRA: { presupuestado: 720000, ejercido: 45000, label: 'Siembra' },
  DESARROLLO: { presupuestado: 1080000, ejercido: 0, label: 'Desarrollo' },
  COSECHA: { presupuestado: 720000, ejercido: 0, label: 'Cosecha' },
};

export const mockBurnRateSemanal = [
  { semana: 'S11 (Mar 10-16)', monto: 79350 },
  { semana: 'S12 (Mar 17-23)', monto: 52683 },
  { semana: 'S13 (Mar 24-30)', monto: 36050 },
  { semana: 'S14 (Mar 31-Abr 6)', monto: 15717 },
  { semana: 'S15 (Abr 7-13)', monto: 0 },
];

export const mockAlmacen: AlmacenVirtual[] = [
  { id_item: 'f1', id_proyecto: 'b1', producto: 'Semilla Híbrida DK-7500', unidad_medida: 'kg', cantidad_comprada: 3000, cantidad_disponible: 2400, costo_unitario_prom: 85.5, fecha_entrada: '2026-03-10' },
  { id_item: 'f2', id_proyecto: 'b1', producto: 'Fertilizante DAP 18-46-00', unidad_medida: 'kg', cantidad_comprada: 12000, cantidad_disponible: 10500, costo_unitario_prom: 18.75, fecha_entrada: '2026-03-12' },
  { id_item: 'f3', id_proyecto: 'b1', producto: 'Urea 46-00-00', unidad_medida: 'kg', cantidad_comprada: 8000, cantidad_disponible: 8000, costo_unitario_prom: 14.2, fecha_entrada: '2026-03-12' },
  { id_item: 'f4', id_proyecto: 'b1', producto: 'Herbicida Glifosato', unidad_medida: 'litros', cantidad_comprada: 500, cantidad_disponible: 420, costo_unitario_prom: 165, fecha_entrada: '2026-03-08' },
  { id_item: 'f5', id_proyecto: 'b1', producto: 'Insecticida Clorpirifos', unidad_medida: 'litros', cantidad_comprada: 200, cantidad_disponible: 200, costo_unitario_prom: 320, fecha_entrada: '2026-03-14' },
  { id_item: 'f6', id_proyecto: 'b1', producto: 'Diésel', unidad_medida: 'litros', cantidad_comprada: 5000, cantidad_disponible: 3200, costo_unitario_prom: 24.5, fecha_entrada: '2026-03-10' },
];

export const mockCalendarioLunar: CalendarioLunar[] = [
  { id: 1, fecha: '2026-04-08', fase_lunar: 'llena', recomendacion_siembra: 'Evitar siembra. Buen momento para fertilización foliar', recomendacion_cosecha: null },
  { id: 2, fecha: '2026-04-15', fase_lunar: 'menguante', recomendacion_siembra: 'Ideal para control de malezas', recomendacion_cosecha: null },
  { id: 3, fecha: '2026-04-22', fase_lunar: 'nueva', recomendacion_siembra: 'Evitar labores de siembra', recomendacion_cosecha: null },
];

export const mockAlertas = [
  { etapa: 'PREPARACION', concepto: 'Diésel y combustibles', porcentaje: 62.9, nivel: 'OK' as const },
  { etapa: 'PREPARACION', concepto: 'Mano de obra (jornales)', porcentaje: 66.7, nivel: 'OK' as const },
  { etapa: 'SIEMBRA', concepto: 'Semilla', porcentaje: 0, nivel: 'OK' as const },
];

// Computed KPIs
export function getKPIs() {
  const presupuestoTotal = mockProyecto.presupuesto_x_ha * mockProyecto.hectareas_totales;
  const gastoTotal = Object.values(mockGastosPorEtapa).reduce((sum, e) => sum + e.ejercido, 0);
  const porcentajeEjercido = Math.round((gastoTotal / presupuestoTotal) * 10000) / 100;
  const costoXHa = Math.round((gastoTotal / mockProyecto.hectareas_totales) * 100) / 100;
  const toneladasEstimadas = mockProyecto.hectareas_totales * 10; // 10 ton/ha estimate
  const costoXTon = Math.round((gastoTotal / toneladasEstimadas) * 100) / 100;
  const burnRateSemanal =
    mockBurnRateSemanal.filter((s) => s.monto > 0).reduce((sum, s) => sum + s.monto, 0) /
    mockBurnRateSemanal.filter((s) => s.monto > 0).length;

  return {
    presupuestoTotal,
    gastoTotal,
    porcentajeEjercido,
    costoXHa,
    costoXTon,
    burnRateSemanal: Math.round(burnRateSemanal),
  };
}
