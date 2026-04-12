-- ============================================================
-- AgroControl - Fix audit user attribution
-- The trigger previously fell back to 'sistema' because the app
-- uses custom PIN auth (not Supabase Auth). This migration:
--   1. Adds creado_por to proyecto and parcela
--   2. Updates fn_audit_trigger to read registrado_por / creado_por
--      from the record being written, so the correct user name is
--      always captured in audit_log without relying on JWT claims.
-- ============================================================

-- 1. Add creado_por to proyecto and parcela
ALTER TABLE proyecto ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES usuario(id_usuario);
ALTER TABLE parcela  ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES usuario(id_usuario);

-- 2. Replace the audit trigger function
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_old       JSONB;
    v_new       JSONB;
    v_id        UUID;
    v_user_id   UUID;
    v_user_name VARCHAR(100);
BEGIN
    -- Build old/new snapshots and extract PK
    IF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_new := NULL;
        v_id  := (v_old ->> TG_ARGV[0])::UUID;
    ELSIF TG_OP = 'INSERT' THEN
        v_old := NULL;
        v_new := to_jsonb(NEW);
        v_id  := (v_new ->> TG_ARGV[0])::UUID;
    ELSE
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_id  := (v_new ->> TG_ARGV[0])::UUID;
    END IF;

    -- Priority 1: Supabase Auth JWT (future-proofing)
    BEGIN
        v_user_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::UUID;
        IF v_user_id IS NOT NULL THEN
            SELECT nombre INTO v_user_name FROM usuario WHERE id_usuario = v_user_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    -- Priority 2: Read user from record fields (registrado_por / creado_por)
    IF v_user_id IS NULL THEN
        DECLARE
            v_ref JSONB := COALESCE(v_new, v_old);
            v_field_val TEXT;
        BEGIN
            -- Try registrado_por first, then creado_por
            v_field_val := COALESCE(
                v_ref ->> 'registrado_por',
                v_ref ->> 'creado_por'
            );
            IF v_field_val IS NOT NULL THEN
                v_user_id := v_field_val::UUID;
                SELECT nombre INTO v_user_name FROM usuario WHERE id_usuario = v_user_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_user_id := NULL;
        END;
    END IF;

    -- Fallback
    IF v_user_name IS NULL THEN
        v_user_name := 'sistema';
    END IF;

    INSERT INTO audit_log (
        tabla, operacion, registro_id,
        usuario_id, usuario_nombre,
        valores_anteriores, valores_nuevos
    )
    VALUES (
        TG_TABLE_NAME, TG_OP, v_id,
        v_user_id, v_user_name,
        v_old, v_new
    );

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
