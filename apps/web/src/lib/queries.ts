import { supabase } from './supabase';

export async function getProyectoActivo() {
  const { data } = await supabase
    .from('proyecto')
    .select('*')
    .eq('status', 'activo')
    .limit(1)
    .single();
  return data;
}

export async function getResumenProyecto(idProyecto: string) {
  const { data } = await supabase
    .from('v_resumen_proyecto')
    .select('*')
    .eq('id_proyecto', idProyecto)
    .single();
  return data;
}

export async function getGastosPorEtapaTipo(idProyecto: string) {
  const { data } = await supabase.rpc('get_gastos_por_etapa', { p_id_proyecto: idProyecto });
  // Fallback: query manually
  if (!data) {
    const { data: etapas } = await supabase
      .from('etapa')
      .select('tipo, presupuesto_etapa, id_etapa, parcela!inner(id_proyecto)')
      .eq('parcela.id_proyecto', idProyecto);

    if (!etapas) return {};

    const { data: gastos } = await supabase
      .from('gasto')
      .select('id_etapa, monto');

    const gastoMap = new Map<string, number>();
    gastos?.forEach((g: { id_etapa: string; monto: number }) => {
      gastoMap.set(g.id_etapa, (gastoMap.get(g.id_etapa) ?? 0) + g.monto);
    });

    const result: Record<string, { presupuestado: number; ejercido: number; label: string }> = {};
    const labels: Record<string, string> = {
      PREPARACION: 'Preparación',
      SIEMBRA: 'Siembra',
      DESARROLLO: 'Desarrollo',
      COSECHA: 'Cosecha',
    };

    etapas.forEach((e: { tipo: string; presupuesto_etapa: number; id_etapa: string }) => {
      if (!result[e.tipo]) {
        result[e.tipo] = { presupuestado: 0, ejercido: 0, label: labels[e.tipo] ?? e.tipo };
      }
      result[e.tipo]!.presupuestado += Number(e.presupuesto_etapa);
      result[e.tipo]!.ejercido += gastoMap.get(e.id_etapa) ?? 0;
    });

    return result;
  }
  return data;
}

export async function getAlmacen(idProyecto: string) {
  const { data } = await supabase
    .from('almacen_virtual')
    .select('*')
    .eq('id_proyecto', idProyecto)
    .order('producto');
  return data ?? [];
}

export async function getAlertas(idProyecto: string) {
  const { data } = await supabase
    .from('v_alertas_presupuesto')
    .select('*')
    .eq('id_proyecto', idProyecto);
  return data ?? [];
}

export async function getCalendarioLunar() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('calendario_lunar')
    .select('*')
    .gte('fecha', today)
    .order('fecha')
    .limit(3);
  return data ?? [];
}

export async function getBurnRateSemanal(idProyecto: string) {
  const { data: gastos } = await supabase
    .from('gasto')
    .select('monto, fecha_registro, etapa!inner(parcela!inner(id_proyecto))')
    .eq('etapa.parcela.id_proyecto', idProyecto)
    .order('fecha_registro');

  if (!gastos || gastos.length === 0) return [];

  const weekMap = new Map<string, number>();
  gastos.forEach((g: { monto: number; fecha_registro: string }) => {
    const d = new Date(g.fecha_registro);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0]!;
    weekMap.set(key, (weekMap.get(key) ?? 0) + Number(g.monto));
  });

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-5)
    .map(([semana, monto]) => ({ semana: `S${semana.slice(5, 10)}`, monto }));
}

export async function getOpexCapex(idProyecto: string) {
  const { data } = await supabase
    .from('gasto')
    .select('tipo, monto, etapa!inner(parcela!inner(id_proyecto))')
    .eq('etapa.parcela.id_proyecto', idProyecto);

  let opex = 0;
  let capex = 0;
  data?.forEach((g: { tipo: string; monto: number }) => {
    if (g.tipo === 'OPEX') opex += Number(g.monto);
    else capex += Number(g.monto);
  });

  return { opex, capex, total: opex + capex };
}

// ── Alertas detalladas ──
export async function getAlertasDetalladas(idProyecto: string) {
  const { data } = await supabase
    .from('v_alertas_presupuesto')
    .select('*')
    .eq('id_proyecto', idProyecto)
    .order('porcentaje', { ascending: false });
  return data ?? [];
}

// ── Calendario lunar por mes ──
export async function getCalendarioLunarMes(year: number, month: number) {
  const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
  const { data } = await supabase
    .from('calendario_lunar')
    .select('*')
    .gte('fecha', firstDay)
    .lte('fecha', lastDay)
    .order('fecha');
  return data ?? [];
}

// ── Registro de plagas ──
export async function getRegistroPlagas(idEtapa: string) {
  const { data } = await supabase
    .from('registro_plagas')
    .select('*, usuario:registrado_por(nombre)')
    .eq('id_etapa', idEtapa)
    .order('fecha_deteccion', { ascending: false });
  return data ?? [];
}

export async function getRegistroPlagasPorProyecto(idProyecto: string) {
  const { data: etapas } = await supabase
    .from('etapa')
    .select('id_etapa, tipo, parcela!inner(id_proyecto, nombre_potrero)')
    .eq('parcela.id_proyecto', idProyecto);

  if (!etapas || etapas.length === 0) return [];

  const etapaIds = etapas.map((e: any) => e.id_etapa);
  const { data } = await supabase
    .from('registro_plagas')
    .select('*, usuario:registrado_por(nombre)')
    .in('id_etapa', etapaIds)
    .order('fecha_deteccion', { ascending: false })
    .limit(50);

  return data ?? [];
}
