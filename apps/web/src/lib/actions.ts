'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ── Proyecto ──
export async function crearProyecto(formData: FormData) {
  const { data, error } = await supabase.from('proyecto').insert({
    nombre: formData.get('nombre') as string,
    temporada: formData.get('temporada') as string,
    hectareas_totales: Number(formData.get('hectareas_totales')),
    presupuesto_x_ha: Number(formData.get('presupuesto_x_ha')),
    fecha_inicio: formData.get('fecha_inicio') as string,
    status: 'activo',
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Parcela ──
export async function crearParcela(formData: FormData) {
  const { data, error } = await supabase.from('parcela').insert({
    id_proyecto: formData.get('id_proyecto') as string,
    nombre_potrero: formData.get('nombre_potrero') as string,
    hectareas: Number(formData.get('hectareas')),
    tipo_suelo: (formData.get('tipo_suelo') as string) || null,
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Etapa ──
export async function crearEtapa(formData: FormData) {
  const { data, error } = await supabase.from('etapa').insert({
    id_parcela: formData.get('id_parcela') as string,
    tipo: formData.get('tipo') as string,
    fecha_inicio: formData.get('fecha_inicio') as string,
    presupuesto_etapa: Number(formData.get('presupuesto_etapa')),
    status: 'pendiente',
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Gasto ──
export async function registrarGasto(formData: FormData) {
  const { data, error } = await supabase.from('gasto').insert({
    id_etapa: formData.get('id_etapa') as string,
    concepto: formData.get('concepto') as string,
    monto: Number(formData.get('monto')),
    tipo: formData.get('tipo') as string,
    registrado_por: formData.get('registrado_por') as string,
    sync_id: crypto.randomUUID(),
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Almacén Virtual ──
export async function agregarInsumo(formData: FormData) {
  const cantidad = Number(formData.get('cantidad_comprada'));
  const { data, error } = await supabase.from('almacen_virtual').insert({
    id_proyecto: formData.get('id_proyecto') as string,
    producto: formData.get('producto') as string,
    unidad_medida: formData.get('unidad_medida') as string,
    cantidad_comprada: cantidad,
    cantidad_disponible: cantidad,
    costo_unitario_prom: Number(formData.get('costo_unitario_prom')),
    fecha_entrada: formData.get('fecha_entrada') as string,
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Equipo CAPEX ──
export async function agregarEquipo(formData: FormData) {
  const { data, error } = await supabase.from('equipo_capex').insert({
    nombre: formData.get('nombre') as string,
    valor_adquisicion: Number(formData.get('valor_adquisicion')),
    vida_util_horas: Number(formData.get('vida_util_horas')),
    costo_x_hectarea: formData.get('costo_x_hectarea') ? Number(formData.get('costo_x_hectarea')) : null,
  }).select().single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Importar parcelas desde KML ──
export async function importarParcelasKML(idProyecto: string, kmlContent: string) {
  const parcelas = parseKML(kmlContent);

  const results = [];
  for (const p of parcelas) {
    const { data, error } = await supabase.from('parcela').insert({
      id_proyecto: idProyecto,
      nombre_potrero: p.nombre,
      hectareas: p.hectareas,
      tipo_suelo: null,
    }).select().single();

    if (error) throw new Error(error.message);
    results.push(data);
  }

  return results;
}

function parseKML(kml: string): { nombre: string; hectareas: number }[] {
  const parcelas: { nombre: string; hectareas: number }[] = [];

  // Extract Placemarks
  const placemarkRegex = /<Placemark>([\s\S]*?)<\/Placemark>/g;
  let match;

  while ((match = placemarkRegex.exec(kml)) !== null) {
    const block = match[1]!;

    // Extract name
    const nameMatch = block.match(/<name>(.*?)<\/name>/);
    const nombre = nameMatch ? nameMatch[1]! : `Parcela ${parcelas.length + 1}`;

    // Extract coordinates from Polygon
    const coordMatch = block.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
    let hectareas = 0;

    if (coordMatch) {
      const coordStr = coordMatch[1]!.trim();
      const points = coordStr.split(/\s+/).map((c) => {
        const [lng, lat] = c.split(',').map(Number);
        return { lat: lat ?? 0, lng: lng ?? 0 };
      });

      // Calculate area using Shoelace formula (approximate for small areas)
      if (points.length >= 3) {
        hectareas = calculateHectares(points);
      }
    }

    parcelas.push({ nombre, hectareas: Math.round(hectareas * 100) / 100 });
  }

  return parcelas;
}

function calculateHectares(points: { lat: number; lng: number }[]): number {
  // Shoelace formula with lat/lng to meters conversion
  const toRad = (d: number) => (d * Math.PI) / 180;
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const p1 = points[i]!;
    const p2 = points[j]!;

    // Convert to approximate meters
    const avgLat = toRad((p1.lat + p2.lat) / 2);
    const x1 = p1.lng * 111320 * Math.cos(avgLat);
    const y1 = p1.lat * 110540;
    const x2 = p2.lng * 111320 * Math.cos(avgLat);
    const y2 = p2.lat * 110540;

    area += x1 * y2 - x2 * y1;
  }

  const sqMeters = Math.abs(area) / 2;
  return sqMeters / 10000; // Convert to hectares
}

// ── Obtener datos para dropdowns ──
export async function getProyectos() {
  const { data } = await supabase.from('proyecto').select('id_proyecto, nombre, temporada, status').order('created_at', { ascending: false });
  return data ?? [];
}

export async function getParcelas(idProyecto: string) {
  const { data } = await supabase.from('parcela').select('id_parcela, nombre_potrero, hectareas').eq('id_proyecto', idProyecto);
  return data ?? [];
}

export async function getEtapas(idParcela: string) {
  const { data } = await supabase.from('etapa').select('id_etapa, tipo, status, presupuesto_etapa').eq('id_parcela', idParcela);
  return data ?? [];
}

export async function getAuditLog(limit = 50) {
  const { data } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
