-- ============================================================
-- AgroControl - Schema Inicial (12 Tablas)
-- Control financiero para producción de maíz
-- ============================================================

-- ── Extensiones ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ── ENUMs ──
CREATE TYPE proyecto_status AS ENUM ('activo', 'cerrado', 'pausado');
CREATE TYPE etapa_tipo AS ENUM ('PREPARACION', 'SIEMBRA', 'DESARROLLO', 'COSECHA');
CREATE TYPE etapa_status AS ENUM ('pendiente', 'activa', 'completada');
CREATE TYPE gasto_tipo AS ENUM ('OPEX', 'CAPEX');
CREATE TYPE sync_status AS ENUM ('pendiente', 'sincronizado', 'error');
CREATE TYPE metodo_aplicacion AS ENUM ('manual', 'dron', 'mecanico');
CREATE TYPE rol_usuario AS ENUM ('OPERADOR', 'CFO', 'ADMIN');
CREATE TYPE fase_lunar AS ENUM ('nueva', 'creciente', 'llena', 'menguante');

-- ============================================================
-- 1. USUARIO
-- ============================================================
CREATE TABLE usuario (
    id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    rol rol_usuario NOT NULL,
    telefono VARCHAR(20),
    pin_acceso VARCHAR(6) NOT NULL CHECK (pin_acceso ~ '^\d{6}$'),
    ultimo_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. PROYECTO
-- ============================================================
CREATE TABLE proyecto (
    id_proyecto UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    temporada VARCHAR(20) NOT NULL,
    hectareas_totales DECIMAL(10,2) NOT NULL CHECK (hectareas_totales > 0),
    presupuesto_x_ha DECIMAL(12,2) NOT NULL CHECK (presupuesto_x_ha > 0),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    status proyecto_status NOT NULL DEFAULT 'activo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. PARCELA
-- ============================================================
CREATE TABLE parcela (
    id_parcela UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_proyecto UUID NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
    nombre_potrero VARCHAR(100) NOT NULL,
    hectareas DECIMAL(10,2) NOT NULL CHECK (hectareas > 0),
    coordenadas_gps GEOMETRY(POINT, 4326),
    tipo_suelo VARCHAR(50)
);

-- ============================================================
-- 4. ETAPA
-- ============================================================
CREATE TABLE etapa (
    id_etapa UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_parcela UUID NOT NULL REFERENCES parcela(id_parcela) ON DELETE CASCADE,
    tipo etapa_tipo NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    presupuesto_etapa DECIMAL(12,2) NOT NULL CHECK (presupuesto_etapa >= 0),
    status etapa_status NOT NULL DEFAULT 'pendiente'
);

-- ============================================================
-- 5. COMPROBANTE
-- ============================================================
CREATE TABLE comprobante (
    id_comprobante UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    foto_url TEXT NOT NULL,
    foto_local_path TEXT,
    ocr_proveedor VARCHAR(200),
    ocr_fecha DATE,
    ocr_subtotal DECIMAL(12,2),
    ocr_iva DECIMAL(12,2),
    ocr_total DECIMAL(12,2),
    validado BOOLEAN NOT NULL DEFAULT false,
    sync_status sync_status NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. ALMACEN_VIRTUAL
-- ============================================================
CREATE TABLE almacen_virtual (
    id_item UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_proyecto UUID NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
    producto VARCHAR(200) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL,
    cantidad_comprada DECIMAL(12,3) NOT NULL CHECK (cantidad_comprada > 0),
    cantidad_disponible DECIMAL(12,3) NOT NULL CHECK (cantidad_disponible >= 0),
    costo_unitario_prom DECIMAL(12,4) NOT NULL CHECK (costo_unitario_prom > 0),
    fecha_entrada DATE NOT NULL
);

-- ============================================================
-- 7. APLICACION_INSUMO
-- ============================================================
CREATE TABLE aplicacion_insumo (
    id_aplicacion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_item_almacen UUID NOT NULL REFERENCES almacen_virtual(id_item),
    id_etapa UUID NOT NULL REFERENCES etapa(id_etapa),
    cantidad_aplicada DECIMAL(12,3) NOT NULL CHECK (cantidad_aplicada > 0),
    hectareas_cubiertas DECIMAL(10,2) NOT NULL CHECK (hectareas_cubiertas > 0),
    fecha_aplicacion DATE NOT NULL,
    metodo metodo_aplicacion NOT NULL,
    operador UUID NOT NULL REFERENCES usuario(id_usuario)
);

-- ============================================================
-- 8. GASTO
-- ============================================================
CREATE TABLE gasto (
    id_gasto UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_etapa UUID NOT NULL REFERENCES etapa(id_etapa),
    id_comprobante UUID REFERENCES comprobante(id_comprobante),
    id_aplicacion UUID REFERENCES aplicacion_insumo(id_aplicacion),
    concepto VARCHAR(200) NOT NULL,
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    tipo gasto_tipo NOT NULL,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    registrado_por UUID NOT NULL REFERENCES usuario(id_usuario),
    sync_id UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4()
);

-- ============================================================
-- 9. EQUIPO_CAPEX
-- ============================================================
CREATE TABLE equipo_capex (
    id_equipo UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    valor_adquisicion DECIMAL(14,2) NOT NULL CHECK (valor_adquisicion > 0),
    vida_util_horas INTEGER NOT NULL CHECK (vida_util_horas > 0),
    costo_x_hora DECIMAL(10,2) NOT NULL GENERATED ALWAYS AS (
        ROUND(valor_adquisicion / vida_util_horas, 2)
    ) STORED,
    costo_x_hectarea DECIMAL(10,2),
    horas_acumuladas DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- 10. USO_EQUIPO
-- ============================================================
CREATE TABLE uso_equipo (
    id_uso UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_equipo UUID NOT NULL REFERENCES equipo_capex(id_equipo),
    id_etapa UUID NOT NULL REFERENCES etapa(id_etapa),
    horas_uso DECIMAL(8,2) NOT NULL CHECK (horas_uso > 0),
    hectareas_trabajadas DECIMAL(10,2) NOT NULL CHECK (hectareas_trabajadas > 0),
    costo_calculado DECIMAL(12,2) NOT NULL,
    fecha DATE NOT NULL,
    operador UUID NOT NULL REFERENCES usuario(id_usuario)
);

-- ============================================================
-- 11. PRESUPUESTO_BASE
-- ============================================================
CREATE TABLE presupuesto_base (
    id_budget UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_proyecto UUID NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
    etapa_tipo etapa_tipo NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    monto_presupuestado DECIMAL(12,2) NOT NULL CHECK (monto_presupuestado > 0)
);

-- ============================================================
-- 12. CALENDARIO_LUNAR
-- ============================================================
CREATE TABLE calendario_lunar (
    id SERIAL PRIMARY KEY,
    fecha DATE UNIQUE NOT NULL,
    fase_lunar fase_lunar NOT NULL,
    recomendacion_siembra TEXT,
    recomendacion_cosecha TEXT
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- TRIGGER: Al insertar aplicacion_insumo, decrementar stock en almacen_virtual
CREATE OR REPLACE FUNCTION fn_aplicacion_decrementa_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_disponible DECIMAL(12,3);
    v_costo_unit DECIMAL(12,4);
    v_producto VARCHAR(200);
BEGIN
    SELECT cantidad_disponible, costo_unitario_prom, producto
    INTO v_disponible, v_costo_unit, v_producto
    FROM almacen_virtual WHERE id_item = NEW.id_item_almacen FOR UPDATE;

    IF NEW.cantidad_aplicada > v_disponible THEN
        RAISE EXCEPTION 'Stock insuficiente de "%". Disponible: %, solicitado: %',
            v_producto, v_disponible, NEW.cantidad_aplicada;
    END IF;

    UPDATE almacen_virtual
    SET cantidad_disponible = cantidad_disponible - NEW.cantidad_aplicada
    WHERE id_item = NEW.id_item_almacen;

    -- Crear registro de gasto OPEX automáticamente
    INSERT INTO gasto (id_etapa, id_aplicacion, concepto, monto, tipo, registrado_por, sync_id)
    VALUES (
        NEW.id_etapa,
        NEW.id_aplicacion,
        'Aplicación: ' || v_producto,
        ROUND(NEW.cantidad_aplicada * v_costo_unit, 2),
        'OPEX',
        NEW.operador,
        uuid_generate_v4()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_aplicacion_stock
AFTER INSERT ON aplicacion_insumo
FOR EACH ROW EXECUTE FUNCTION fn_aplicacion_decrementa_stock();

-- TRIGGER: Al insertar uso_equipo, actualizar horas acumuladas y crear gasto CAPEX
CREATE OR REPLACE FUNCTION fn_uso_equipo_acumula()
RETURNS TRIGGER AS $$
DECLARE
    v_costo_hora DECIMAL(10,2);
    v_nombre VARCHAR(100);
BEGIN
    SELECT costo_x_hora, nombre INTO v_costo_hora, v_nombre
    FROM equipo_capex WHERE id_equipo = NEW.id_equipo;

    -- Actualizar horas acumuladas
    UPDATE equipo_capex
    SET horas_acumuladas = horas_acumuladas + NEW.horas_uso
    WHERE id_equipo = NEW.id_equipo;

    -- Crear gasto CAPEX
    INSERT INTO gasto (id_etapa, concepto, monto, tipo, registrado_por, sync_id)
    VALUES (
        NEW.id_etapa,
        'Uso equipo: ' || v_nombre || ' (' || NEW.horas_uso || ' hrs)',
        NEW.costo_calculado,
        'CAPEX',
        NEW.operador,
        uuid_generate_v4()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_uso_equipo_acumula
AFTER INSERT ON uso_equipo
FOR EACH ROW EXECUTE FUNCTION fn_uso_equipo_acumula();

-- TRIGGER: Auto-update updated_at
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_proyecto_updated_at
BEFORE UPDATE ON proyecto FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_usuario_updated_at
BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ============================================================
-- VIEWS
-- ============================================================

-- Vista: Presupuesto vs Ejercido por etapa y concepto
CREATE OR REPLACE VIEW v_presupuesto_vs_ejercido AS
SELECT
    pb.id_budget,
    pb.id_proyecto,
    pb.etapa_tipo,
    pb.concepto,
    pb.monto_presupuestado,
    COALESCE(SUM(g.monto), 0) AS monto_ejercido,
    CASE
        WHEN pb.monto_presupuestado > 0 THEN
            ROUND(((COALESCE(SUM(g.monto), 0) - pb.monto_presupuestado) / pb.monto_presupuestado) * 100, 2)
        ELSE 0
    END AS desviacion_pct,
    CASE
        WHEN pb.monto_presupuestado > 0 THEN
            ROUND((COALESCE(SUM(g.monto), 0) / pb.monto_presupuestado) * 100, 2)
        ELSE 0
    END AS porcentaje_ejercido
FROM presupuesto_base pb
LEFT JOIN etapa e ON e.tipo = pb.etapa_tipo
    AND e.id_parcela IN (SELECT id_parcela FROM parcela WHERE id_proyecto = pb.id_proyecto)
LEFT JOIN gasto g ON g.id_etapa = e.id_etapa AND g.concepto ILIKE '%' || pb.concepto || '%'
GROUP BY pb.id_budget, pb.id_proyecto, pb.etapa_tipo, pb.concepto, pb.monto_presupuestado;

-- Vista: Resumen por proyecto
CREATE OR REPLACE VIEW v_resumen_proyecto AS
SELECT
    p.id_proyecto,
    p.nombre,
    p.temporada,
    p.hectareas_totales,
    p.presupuesto_x_ha,
    p.presupuesto_x_ha * p.hectareas_totales AS presupuesto_total,
    COALESCE(SUM(g.monto), 0) AS gasto_total,
    CASE
        WHEN p.hectareas_totales > 0 THEN
            ROUND(COALESCE(SUM(g.monto), 0) / p.hectareas_totales, 2)
        ELSE 0
    END AS costo_x_hectarea,
    CASE
        WHEN (p.presupuesto_x_ha * p.hectareas_totales) > 0 THEN
            ROUND((COALESCE(SUM(g.monto), 0) / (p.presupuesto_x_ha * p.hectareas_totales)) * 100, 2)
        ELSE 0
    END AS porcentaje_ejercido,
    COALESCE(SUM(g.monto) FILTER (WHERE g.tipo = 'OPEX'), 0) AS total_opex,
    COALESCE(SUM(g.monto) FILTER (WHERE g.tipo = 'CAPEX'), 0) AS total_capex
FROM proyecto p
LEFT JOIN parcela pa ON pa.id_proyecto = p.id_proyecto
LEFT JOIN etapa e ON e.id_parcela = pa.id_parcela
LEFT JOIN gasto g ON g.id_etapa = e.id_etapa
GROUP BY p.id_proyecto;

-- Vista: Alertas presupuestales
CREATE OR REPLACE VIEW v_alertas_presupuesto AS
SELECT
    pb.id_proyecto,
    pb.etapa_tipo,
    pb.concepto,
    pb.monto_presupuestado,
    COALESCE(sub.ejercido, 0) AS monto_ejercido,
    CASE
        WHEN pb.monto_presupuestado > 0 THEN
            ROUND((COALESCE(sub.ejercido, 0) / pb.monto_presupuestado) * 100, 2)
        ELSE 0
    END AS porcentaje,
    CASE
        WHEN pb.monto_presupuestado > 0 AND COALESCE(sub.ejercido, 0) >= pb.monto_presupuestado THEN 'EXCEDIDO'
        WHEN pb.monto_presupuestado > 0 AND COALESCE(sub.ejercido, 0) >= pb.monto_presupuestado * 0.9 THEN 'CRITICO'
        WHEN pb.monto_presupuestado > 0 AND COALESCE(sub.ejercido, 0) >= pb.monto_presupuestado * 0.8 THEN 'ALERTA'
        ELSE 'OK'
    END AS nivel_alerta
FROM presupuesto_base pb
LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(g.monto), 0) AS ejercido
    FROM gasto g
    JOIN etapa e ON g.id_etapa = e.id_etapa
    JOIN parcela pa ON e.id_parcela = pa.id_parcela
    WHERE pa.id_proyecto = pb.id_proyecto AND e.tipo = pb.etapa_tipo
) sub ON true;

-- ============================================================
-- INDICES
-- ============================================================
CREATE INDEX idx_parcela_proyecto ON parcela(id_proyecto);
CREATE INDEX idx_etapa_parcela ON etapa(id_parcela);
CREATE INDEX idx_etapa_tipo ON etapa(tipo);
CREATE INDEX idx_gasto_etapa ON gasto(id_etapa);
CREATE INDEX idx_gasto_sync_id ON gasto(sync_id);
CREATE INDEX idx_gasto_fecha ON gasto(fecha_registro);
CREATE INDEX idx_almacen_proyecto ON almacen_virtual(id_proyecto);
CREATE INDEX idx_aplicacion_etapa ON aplicacion_insumo(id_etapa);
CREATE INDEX idx_aplicacion_almacen ON aplicacion_insumo(id_item_almacen);
CREATE INDEX idx_uso_equipo_etapa ON uso_equipo(id_etapa);
CREATE INDEX idx_uso_equipo_equipo ON uso_equipo(id_equipo);
CREATE INDEX idx_presupuesto_proyecto ON presupuesto_base(id_proyecto);
CREATE INDEX idx_calendario_fecha ON calendario_lunar(fecha);
