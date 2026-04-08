-- ============================================================
-- AgroControl - Registro de Plagas/Malezas + Calendario Lunar Real
-- ============================================================

-- ── 1. TABLA REGISTRO_PLAGAS ──
CREATE TABLE registro_plagas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_etapa UUID NOT NULL REFERENCES etapa(id_etapa) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('plaga', 'maleza')),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    producto_usado VARCHAR(200),
    dosis VARCHAR(100),
    fecha_deteccion DATE NOT NULL,
    fecha_tratamiento DATE,
    resultado TEXT,
    registrado_por UUID NOT NULL REFERENCES usuario(id_usuario),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plagas_etapa ON registro_plagas(id_etapa);
CREATE INDEX idx_plagas_fecha ON registro_plagas(fecha_deteccion);

-- Audit trigger
CREATE TRIGGER audit_registro_plagas
AFTER INSERT OR UPDATE OR DELETE ON registro_plagas
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger('id');

-- Disable RLS (mismo patrón que audit_log)
ALTER TABLE registro_plagas DISABLE ROW LEVEL SECURITY;

-- ── 2. POBLAR CALENDARIO LUNAR 2026-2027 (Algoritmo Julian Date) ──
-- Fórmula: moon_age = (JD - 2451550.09765) MOD 29.530588853
-- Referencia: Luna Nueva del 6 de Enero de 2000 (JD 2451550.09765)
-- Período sinódico medio: 29.530588853 días

DELETE FROM calendario_lunar WHERE fecha >= '2026-01-01' AND fecha <= '2027-12-31';

DO $$
DECLARE
    v_date DATE;
    v_jd NUMERIC;
    v_moon_age NUMERIC;
    v_fase fase_lunar;
    v_rec_siembra TEXT;
    v_rec_cosecha TEXT;
    v_synodic CONSTANT NUMERIC := 29.530588853;
    v_ref_jd CONSTANT NUMERIC := 2451550.09765;
BEGIN
    v_date := '2026-01-01'::DATE;

    WHILE v_date <= '2027-12-31'::DATE LOOP
        -- Calcular Julian Date
        -- JD = days since J2000.0 epoch (2000-01-01 12:00 TT) + 2451545.0
        v_jd := 2451545.0 + (v_date - '2000-01-01'::DATE);

        -- Calcular edad lunar (días desde última luna nueva)
        v_moon_age := v_jd - v_ref_jd;
        v_moon_age := v_moon_age - FLOOR(v_moon_age / v_synodic) * v_synodic;

        -- Mapear a fase (dividir ciclo en 4 cuadrantes de ~7.38 días)
        IF v_moon_age < 1.85 OR v_moon_age > 27.68 THEN
            v_fase := 'nueva';
            v_rec_siembra := 'Evitar siembra. Buen momento para preparar suelo y eliminar malezas.';
            v_rec_cosecha := 'No recomendable para cosecha. Grano puede absorber humedad.';
        ELSIF v_moon_age >= 1.85 AND v_moon_age < 9.38 THEN
            v_fase := 'creciente';
            v_rec_siembra := 'Fase ideal para siembra de maíz. La savia asciende, favorece la germinación y el crecimiento aéreo.';
            v_rec_cosecha := NULL;
        ELSIF v_moon_age >= 9.38 AND v_moon_age < 16.91 THEN
            v_fase := 'llena';
            v_rec_siembra := 'No sembrar. Buena para fertilización foliar y trasplantes. Máxima luminosidad nocturna.';
            v_rec_cosecha := 'Favorable para cosecha. El grano tiende a estar más seco.';
        ELSE
            v_fase := 'menguante';
            v_rec_siembra := 'Buena para control de plagas y malezas. La savia desciende. Aplicar herbicidas e insecticidas.';
            v_rec_cosecha := 'Ideal para cosecha y almacenaje. Menor contenido de humedad en grano.';
        END IF;

        INSERT INTO calendario_lunar (fecha, fase_lunar, recomendacion_siembra, recomendacion_cosecha)
        VALUES (v_date, v_fase, v_rec_siembra, v_rec_cosecha)
        ON CONFLICT (fecha) DO UPDATE SET
            fase_lunar = EXCLUDED.fase_lunar,
            recomendacion_siembra = EXCLUDED.recomendacion_siembra,
            recomendacion_cosecha = EXCLUDED.recomendacion_cosecha;

        v_date := v_date + 1;
    END LOOP;
END;
$$;
