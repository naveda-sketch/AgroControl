import { z } from 'zod';
import {
  ETAPA_TIPOS,
  PROYECTO_STATUS,
  ETAPA_STATUS,
  GASTO_TIPOS,
  SYNC_STATUS,
  METODO_APLICACION,
  ROL_USUARIO,
  FASE_LUNAR,
} from './constants';

// ── Proyecto ──
export const proyectoSchema = z.object({
  nombre: z.string().min(1).max(100),
  temporada: z.string().min(1).max(20),
  hectareas_totales: z.number().positive(),
  presupuesto_x_ha: z.number().positive(),
  fecha_inicio: z.string().date(),
  fecha_fin: z.string().date().nullable().optional(),
  status: z.enum(PROYECTO_STATUS).default('activo'),
});

// ── Parcela ──
export const parcelaSchema = z.object({
  id_proyecto: z.string().uuid(),
  nombre_potrero: z.string().min(1).max(100),
  hectareas: z.number().positive(),
  coordenadas_gps: z
    .object({ x: z.number(), y: z.number() })
    .nullable()
    .optional(),
  tipo_suelo: z.string().max(50).nullable().optional(),
});

// ── Etapa ──
export const etapaSchema = z.object({
  id_parcela: z.string().uuid(),
  tipo: z.enum(ETAPA_TIPOS),
  fecha_inicio: z.string().date(),
  fecha_fin: z.string().date().nullable().optional(),
  presupuesto_etapa: z.number().nonnegative(),
  status: z.enum(ETAPA_STATUS).default('pendiente'),
});

// ── Gasto ──
export const gastoSchema = z.object({
  id_etapa: z.string().uuid(),
  id_comprobante: z.string().uuid().nullable().optional(),
  id_aplicacion: z.string().uuid().nullable().optional(),
  concepto: z.string().min(1).max(200),
  monto: z.number().positive(),
  tipo: z.enum(GASTO_TIPOS),
  registrado_por: z.string().uuid(),
  sync_id: z.string().uuid(),
});

// ── Comprobante ──
export const comprobanteSchema = z.object({
  foto_url: z.string().url(),
  foto_local_path: z.string().nullable().optional(),
  ocr_proveedor: z.string().max(200).nullable().optional(),
  ocr_fecha: z.string().date().nullable().optional(),
  ocr_subtotal: z.number().nonnegative().nullable().optional(),
  ocr_iva: z.number().nonnegative().nullable().optional(),
  ocr_total: z.number().nonnegative().nullable().optional(),
  validado: z.boolean().default(false),
  sync_status: z.enum(SYNC_STATUS).default('pendiente'),
});

// ── Almacen Virtual ──
export const almacenVirtualSchema = z.object({
  id_proyecto: z.string().uuid(),
  producto: z.string().min(1).max(200),
  unidad_medida: z.string().min(1).max(20),
  cantidad_comprada: z.number().positive(),
  cantidad_disponible: z.number().nonnegative(),
  costo_unitario_prom: z.number().positive(),
  fecha_entrada: z.string().date(),
});

// ── Aplicacion Insumo ──
export const aplicacionInsumoSchema = z.object({
  id_item_almacen: z.string().uuid(),
  id_etapa: z.string().uuid(),
  cantidad_aplicada: z.number().positive(),
  hectareas_cubiertas: z.number().positive(),
  fecha_aplicacion: z.string().date(),
  metodo: z.enum(METODO_APLICACION),
  operador: z.string().uuid(),
});

// ── Equipo CAPEX ──
export const equipoCapexSchema = z.object({
  nombre: z.string().min(1).max(100),
  valor_adquisicion: z.number().positive(),
  vida_util_horas: z.number().int().positive(),
  costo_x_hora: z.number().positive(),
  costo_x_hectarea: z.number().positive().nullable().optional(),
});

// ── Uso Equipo ──
export const usoEquipoSchema = z.object({
  id_equipo: z.string().uuid(),
  id_etapa: z.string().uuid(),
  horas_uso: z.number().positive(),
  hectareas_trabajadas: z.number().positive(),
  costo_calculado: z.number().nonnegative(),
  fecha: z.string().date(),
  operador: z.string().uuid(),
});

// ── Usuario ──
export const usuarioSchema = z.object({
  nombre: z.string().min(1).max(100),
  rol: z.enum(ROL_USUARIO),
  telefono: z.string().max(20).nullable().optional(),
  pin_acceso: z.string().length(6).regex(/^\d{6}$/),
});

// ── Presupuesto Base ──
export const presupuestoBaseSchema = z.object({
  id_proyecto: z.string().uuid(),
  etapa_tipo: z.enum(ETAPA_TIPOS),
  concepto: z.string().min(1).max(200),
  monto_presupuestado: z.number().positive(),
});

// ── Calendario Lunar ──
export const calendarioLunarSchema = z.object({
  fecha: z.string().date(),
  fase_lunar: z.enum(FASE_LUNAR),
  recomendacion_siembra: z.string().nullable().optional(),
  recomendacion_cosecha: z.string().nullable().optional(),
});
