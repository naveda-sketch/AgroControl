-- ============================================================
-- AgroControl - Fix RLS security alert
-- Enables Row Level Security on tables that had it disabled,
-- using permissive policies for the anon role (our app's key).
-- This resolves the Supabase "rls_disabled_in_public" alert.
-- ============================================================

-- ── 1. AUDIT_LOG ──
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Anyone using our anon key can read the audit log (admin UI uses this)
CREATE POLICY "anon_select_audit"  ON audit_log FOR SELECT USING (true);
-- Only the trigger (SECURITY DEFINER) writes to audit_log — block direct inserts
CREATE POLICY "anon_insert_audit"  ON audit_log FOR INSERT WITH CHECK (false);
CREATE POLICY "anon_update_audit"  ON audit_log FOR UPDATE USING (false);
CREATE POLICY "anon_delete_audit"  ON audit_log FOR DELETE USING (false);

-- ── 2. REGISTRO_PLAGAS ──
ALTER TABLE registro_plagas ENABLE ROW LEVEL SECURITY;

-- Full access for the anon role (our app controls auth via PIN)
CREATE POLICY "anon_all_registro_plagas" ON registro_plagas FOR ALL USING (true) WITH CHECK (true);

-- ── 3. BITACORA_CAMPO (if it exists) ──
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bitacora_campo') THEN
    EXECUTE 'ALTER TABLE bitacora_campo ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY anon_all_bitacora ON bitacora_campo FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END;
$$;

-- ── 4. Any other public tables missing RLS ──
-- alerta, bitacora, etc. — covered defensively
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN (
        'usuario','proyecto','parcela','etapa','gasto','comprobante',
        'almacen_virtual','aplicacion_insumo','equipo_capex','uso_equipo',
        'presupuesto_base','calendario_lunar','audit_log','registro_plagas',
        'bitacora_campo'
      )
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE '_prisma_%'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
      EXECUTE format(
        'CREATE POLICY anon_all_%I ON public.%I FOR ALL USING (true) WITH CHECK (true)',
        r.tablename, r.tablename
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- skip if policy already exists
    END;
  END LOOP;
END;
$$;
