export const ETAPA_TIPOS = ['PREPARACION', 'SIEMBRA', 'DESARROLLO', 'COSECHA'] as const;

export const PROYECTO_STATUS = ['activo', 'cerrado', 'pausado'] as const;

export const ETAPA_STATUS = ['pendiente', 'activa', 'completada'] as const;

export const GASTO_TIPOS = ['OPEX', 'CAPEX'] as const;

export const SYNC_STATUS = ['pendiente', 'sincronizado', 'error'] as const;

export const METODO_APLICACION = ['manual', 'dron', 'mecanico'] as const;

export const ROL_USUARIO = ['OPERADOR', 'CFO', 'ADMIN'] as const;

export const FASE_LUNAR = ['nueva', 'creciente', 'llena', 'menguante'] as const;

export const BUDGET_ALERT_THRESHOLDS = [80, 90, 100] as const;
