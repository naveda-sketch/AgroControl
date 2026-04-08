import type {
  ETAPA_TIPOS,
  PROYECTO_STATUS,
  ETAPA_STATUS,
  GASTO_TIPOS,
  SYNC_STATUS,
  METODO_APLICACION,
  ROL_USUARIO,
  FASE_LUNAR,
} from './constants';

// ── Utility types ──
export type EtapaTipo = (typeof ETAPA_TIPOS)[number];
export type ProyectoStatus = (typeof PROYECTO_STATUS)[number];
export type EtapaStatus = (typeof ETAPA_STATUS)[number];
export type GastoTipo = (typeof GASTO_TIPOS)[number];
export type SyncStatus = (typeof SYNC_STATUS)[number];
export type MetodoAplicacion = (typeof METODO_APLICACION)[number];
export type RolUsuario = (typeof ROL_USUARIO)[number];
export type FaseLunar = (typeof FASE_LUNAR)[number];

// ── Entities ──

export interface Proyecto {
  id_proyecto: string;
  nombre: string;
  temporada: string;
  hectareas_totales: number;
  presupuesto_x_ha: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  status: ProyectoStatus;
  created_at: string;
  updated_at: string;
}

export interface Parcela {
  id_parcela: string;
  id_proyecto: string;
  nombre_potrero: string;
  hectareas: number;
  coordenadas_gps: { x: number; y: number } | null;
  tipo_suelo: string | null;
}

export interface Etapa {
  id_etapa: string;
  id_parcela: string;
  tipo: EtapaTipo;
  fecha_inicio: string;
  fecha_fin: string | null;
  presupuesto_etapa: number;
  status: EtapaStatus;
}

export interface Gasto {
  id_gasto: string;
  id_etapa: string;
  id_comprobante: string | null;
  id_aplicacion: string | null;
  concepto: string;
  monto: number;
  tipo: GastoTipo;
  fecha_registro: string;
  registrado_por: string;
  sync_id: string;
}

export interface Comprobante {
  id_comprobante: string;
  foto_url: string;
  foto_local_path: string | null;
  ocr_proveedor: string | null;
  ocr_fecha: string | null;
  ocr_subtotal: number | null;
  ocr_iva: number | null;
  ocr_total: number | null;
  validado: boolean;
  sync_status: SyncStatus;
}

export interface AlmacenVirtual {
  id_item: string;
  id_proyecto: string;
  producto: string;
  unidad_medida: string;
  cantidad_comprada: number;
  cantidad_disponible: number;
  costo_unitario_prom: number;
  fecha_entrada: string;
}

export interface AplicacionInsumo {
  id_aplicacion: string;
  id_item_almacen: string;
  id_etapa: string;
  cantidad_aplicada: number;
  hectareas_cubiertas: number;
  fecha_aplicacion: string;
  metodo: MetodoAplicacion;
  operador: string;
}

export interface EquipoCapex {
  id_equipo: string;
  nombre: string;
  valor_adquisicion: number;
  vida_util_horas: number;
  costo_x_hora: number;
  costo_x_hectarea: number | null;
  horas_acumuladas: number;
}

export interface UsoEquipo {
  id_uso: string;
  id_equipo: string;
  id_etapa: string;
  horas_uso: number;
  hectareas_trabajadas: number;
  costo_calculado: number;
  fecha: string;
  operador: string;
}

export interface Usuario {
  id_usuario: string;
  nombre: string;
  rol: RolUsuario;
  telefono: string | null;
  pin_acceso: string;
  ultimo_sync: string | null;
}

export interface PresupuestoBase {
  id_budget: string;
  id_proyecto: string;
  etapa_tipo: EtapaTipo;
  concepto: string;
  monto_presupuestado: number;
  // Computed
  monto_ejercido?: number;
  desviacion_pct?: number;
}

export interface CalendarioLunar {
  id: number;
  fecha: string;
  fase_lunar: FaseLunar;
  recomendacion_siembra: string | null;
  recomendacion_cosecha: string | null;
}
