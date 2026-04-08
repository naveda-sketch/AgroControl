-- ============================================================
-- AgroControl - Auditoría, Seguridad y Candados
-- ============================================================

-- ── 1. TABLA AUDIT_LOG ──
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    tabla VARCHAR(100) NOT NULL,
    operacion VARCHAR(10) NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id UUID,
    usuario_id UUID REFERENCES usuario(id_usuario),
    usuario_nombre VARCHAR(100),
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    ip_address INET,
    origen VARCHAR(20) DEFAULT 'web', -- 'web' | 'mobile' | 'api'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tabla ON audit_log(tabla);
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_fecha ON audit_log(created_at);
CREATE INDEX idx_audit_registro ON audit_log(registro_id);

-- ── 2. FUNCIÓN GENÉRICA DE AUDITORÍA ──
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_old JSONB;
    v_new JSONB;
    v_id UUID;
    v_user_id UUID;
    v_user_name VARCHAR(100);
BEGIN
    -- Determinar el ID del registro
    IF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_new := NULL;
        v_id := (v_old ->> (TG_ARGV[0]))::UUID;
    ELSIF TG_OP = 'INSERT' THEN
        v_old := NULL;
        v_new := to_jsonb(NEW);
        v_id := (v_new ->> (TG_ARGV[0]))::UUID;
    ELSE -- UPDATE
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_id := (v_new ->> (TG_ARGV[0]))::UUID;
    END IF;

    -- Intentar obtener el usuario de la sesión (Supabase auth)
    BEGIN
        v_user_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::UUID;
        SELECT nombre INTO v_user_name FROM usuario WHERE id_usuario = v_user_id;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
        v_user_name := 'sistema';
    END;

    INSERT INTO audit_log (tabla, operacion, registro_id, usuario_id, usuario_nombre, valores_anteriores, valores_nuevos)
    VALUES (TG_TABLE_NAME, TG_OP, v_id, v_user_id, v_user_name, v_old, v_new);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. APLICAR TRIGGERS DE AUDITORÍA A TODAS LAS TABLAS ──
CREATE TRIGGER audit_proyecto AFTER INSERT OR UPDATE OR DELETE ON proyecto
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id_proyecto');

CREATE TRIGGER audit_parcela AFTER INSERT OR UPDATE OR DELETE ON parcela
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id_parcela');

CREATE TRIGGER audit_etapa AFTER INSERT OR UPDATE OR DELETE ON etapa
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id_etapa');

CREATE TRIGGER audit_gasto AFTER INSERT OR UPDATE OR DELETE ON gasto
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id_gasto');

CREATE TRIGGER audit_comprobante AFTER INSERT OR UPDATE OR DELETE ON comprobante
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id_comprobante');

CREATE TRIGGER audit_almacen AFTER INSERT OR UPDATE OR DELETE ON almacen_virtual
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id_item');

CREATE TRIGGER audit_aplicacion AFTER INSERT OR UPDATE OR DELETE ON aplicacion_insumo
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id_aplicacion');

CREATE TRIGGER audit_equipo AFTER INSERT OR UPDATE OR DELETE ON equipo_capex
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id_equipo');

CREATE TRIGGER audit_uso_equipo AFTER INSERT OR UPDATE OR DELETE ON uso_equipo
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id_uso');

CREATE TRIGGER audit_presupuesto AFTER INSERT OR UPDATE OR DELETE ON presupuesto_base
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id_budget');

CREATE TRIGGER audit_usuario AFTER INSERT OR UPDATE OR DELETE ON usuario
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id_usuario');

-- ── 4. CANDADO: Aprobación de gastos grandes ──
ALTER TABLE gasto ADD COLUMN requiere_aprobacion BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE gasto ADD COLUMN aprobado_por UUID REFERENCES usuario(id_usuario);
ALTER TABLE gasto ADD COLUMN fecha_aprobacion TIMESTAMPTZ;
ALTER TABLE gasto ADD COLUMN estado_aprobacion VARCHAR(20) DEFAULT 'aprobado'
    CHECK (estado_aprobacion IN ('pendiente', 'aprobado', 'rechazado'));

-- Trigger: gastos > $50,000 requieren aprobación
CREATE OR REPLACE FUNCTION fn_gasto_requiere_aprobacion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.monto > 50000 THEN
        NEW.requiere_aprobacion := true;
        NEW.estado_aprobacion := 'pendiente';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gasto_aprobacion
BEFORE INSERT ON gasto
FOR EACH ROW EXECUTE FUNCTION fn_gasto_requiere_aprobacion();

-- ── 5. CANDADO: Etapa cerrada no acepta gastos ──
CREATE OR REPLACE FUNCTION fn_validar_etapa_abierta()
RETURNS TRIGGER AS $$
DECLARE
    v_status etapa_status;
BEGIN
    SELECT status INTO v_status FROM etapa WHERE id_etapa = NEW.id_etapa;

    IF v_status = 'completada' THEN
        RAISE EXCEPTION 'No se pueden agregar gastos a una etapa completada. Contacte al administrador para reabrir.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gasto_etapa_abierta
BEFORE INSERT ON gasto
FOR EACH ROW EXECUTE FUNCTION fn_validar_etapa_abierta();

-- ── 6. CANDADO: Comprobante obligatorio para gastos > $10,000 ──
-- Nota: Se implementa como warning en la app, no como constraint duro,
-- porque en campo a veces no hay ticket inmediato.
-- El audit_log registra quién creó el gasto sin comprobante.

-- ── 7. CANDADO: Proyecto cerrado es inmutable ──
CREATE OR REPLACE FUNCTION fn_proyecto_cerrado_inmutable()
RETURNS TRIGGER AS $$
DECLARE
    v_status proyecto_status;
BEGIN
    -- Para gastos: verificar que el proyecto no esté cerrado
    SELECT p.status INTO v_status
    FROM proyecto p
    JOIN parcela pa ON pa.id_proyecto = p.id_proyecto
    JOIN etapa e ON e.id_parcela = pa.id_parcela
    WHERE e.id_etapa = NEW.id_etapa
    LIMIT 1;

    IF v_status = 'cerrado' THEN
        RAISE EXCEPTION 'El proyecto está cerrado. No se pueden registrar más gastos.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gasto_proyecto_abierto
BEFORE INSERT ON gasto
FOR EACH ROW EXECUTE FUNCTION fn_proyecto_cerrado_inmutable();

-- ── 8. Agregar campo de password hash a usuario para auth web ──
ALTER TABLE usuario ADD COLUMN email VARCHAR(200) UNIQUE;
ALTER TABLE usuario ADD COLUMN password_hash TEXT;
ALTER TABLE usuario ADD COLUMN activo BOOLEAN NOT NULL DEFAULT true;

-- ── 9. Disable RLS temporalmente para desarrollo ──
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;
