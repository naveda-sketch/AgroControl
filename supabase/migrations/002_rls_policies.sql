-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcela ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapa ENABLE ROW LEVEL SECURITY;
ALTER TABLE gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobante ENABLE ROW LEVEL SECURITY;
ALTER TABLE almacen_virtual ENABLE ROW LEVEL SECURITY;
ALTER TABLE aplicacion_insumo ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipo_capex ENABLE ROW LEVEL SECURITY;
ALTER TABLE uso_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario_lunar ENABLE ROW LEVEL SECURITY;

-- ── ADMIN: Full access ──
CREATE POLICY admin_all_usuario ON usuario FOR ALL
    USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY admin_all_proyecto ON proyecto FOR ALL
    USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY admin_all_parcela ON parcela FOR ALL
    USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY admin_all_etapa ON etapa FOR ALL
    USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY admin_all_gasto ON gasto FOR ALL
    USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY admin_all_comprobante ON comprobante FOR ALL
    USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY admin_all_almacen ON almacen_virtual FOR ALL
    USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY admin_all_aplicacion ON aplicacion_insumo FOR ALL
    USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY admin_all_equipo ON equipo_capex FOR ALL
    USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY admin_all_uso ON uso_equipo FOR ALL
    USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY admin_all_presupuesto ON presupuesto_base FOR ALL
    USING (auth.jwt() ->> 'role' = 'ADMIN');

-- ── CFO: Read all, write presupuesto ──
CREATE POLICY cfo_read_all ON proyecto FOR SELECT
    USING (auth.jwt() ->> 'role' = 'CFO');

CREATE POLICY cfo_read_parcela ON parcela FOR SELECT
    USING (auth.jwt() ->> 'role' = 'CFO');

CREATE POLICY cfo_read_etapa ON etapa FOR SELECT
    USING (auth.jwt() ->> 'role' = 'CFO');

CREATE POLICY cfo_read_gasto ON gasto FOR SELECT
    USING (auth.jwt() ->> 'role' = 'CFO');

CREATE POLICY cfo_read_comprobante ON comprobante FOR SELECT
    USING (auth.jwt() ->> 'role' = 'CFO');

CREATE POLICY cfo_read_almacen ON almacen_virtual FOR SELECT
    USING (auth.jwt() ->> 'role' = 'CFO');

CREATE POLICY cfo_read_aplicacion ON aplicacion_insumo FOR SELECT
    USING (auth.jwt() ->> 'role' = 'CFO');

CREATE POLICY cfo_read_equipo ON equipo_capex FOR SELECT
    USING (auth.jwt() ->> 'role' = 'CFO');

CREATE POLICY cfo_read_uso ON uso_equipo FOR SELECT
    USING (auth.jwt() ->> 'role' = 'CFO');

CREATE POLICY cfo_manage_presupuesto ON presupuesto_base FOR ALL
    USING (auth.jwt() ->> 'role' = 'CFO');

-- ── OPERADOR: Insert gastos, comprobantes, aplicaciones, uso equipo ──
CREATE POLICY operador_insert_gasto ON gasto FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'OPERADOR');

CREATE POLICY operador_read_own_gastos ON gasto FOR SELECT
    USING (auth.jwt() ->> 'role' = 'OPERADOR');

CREATE POLICY operador_insert_comprobante ON comprobante FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'OPERADOR');

CREATE POLICY operador_read_comprobante ON comprobante FOR SELECT
    USING (auth.jwt() ->> 'role' = 'OPERADOR');

CREATE POLICY operador_insert_aplicacion ON aplicacion_insumo FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'OPERADOR');

CREATE POLICY operador_read_etapa ON etapa FOR SELECT
    USING (auth.jwt() ->> 'role' = 'OPERADOR');

CREATE POLICY operador_read_proyecto ON proyecto FOR SELECT
    USING (auth.jwt() ->> 'role' = 'OPERADOR');

CREATE POLICY operador_read_almacen ON almacen_virtual FOR SELECT
    USING (auth.jwt() ->> 'role' = 'OPERADOR');

CREATE POLICY operador_insert_uso ON uso_equipo FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'OPERADOR');

CREATE POLICY operador_read_equipo ON equipo_capex FOR SELECT
    USING (auth.jwt() ->> 'role' = 'OPERADOR');

-- ── Calendario lunar: público (lectura) ──
CREATE POLICY calendario_read_all ON calendario_lunar FOR SELECT
    USING (true);
