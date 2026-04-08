'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

const LEVEL_STYLES: Record<string, { border: string; bg: string; badge: string; text: string }> = {
  EXCEDIDO: { border: 'border-l-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800', text: 'text-red-700' },
  CRITICO: { border: 'border-l-orange-500', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800', text: 'text-orange-700' },
  ALERTA: { border: 'border-l-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-700' },
  OK: { border: 'border-l-green-500', bg: 'bg-white', badge: 'bg-green-100 text-green-800', text: 'text-green-700' },
};

const ETAPA_LABELS: Record<string, string> = {
  PREPARACION: 'Preparación', SIEMBRA: 'Siembra', DESARROLLO: 'Desarrollo', COSECHA: 'Cosecha',
};

export function AlertasPanel({ user }: { user: SessionUser }) {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [filterEtapa, setFilterEtapa] = useState('');
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('proyecto').select('id_proyecto, nombre').eq('status', 'activo').then(({ data }) => setProyectos(data ?? []));
  }, []);

  useEffect(() => {
    if (selectedProyecto) loadAlertas();
  }, [selectedProyecto]);

  async function loadAlertas() {
    setLoading(true);
    const { data } = await supabase
      .from('v_alertas_presupuesto')
      .select('*')
      .eq('id_proyecto', selectedProyecto)
      .order('porcentaje', { ascending: false });
    setAlertas(data ?? []);
    setLoading(false);
  }

  const filtered = filterEtapa ? alertas.filter((a) => a.etapa_tipo === filterEtapa) : alertas;

  const counts = { EXCEDIDO: 0, CRITICO: 0, ALERTA: 0, OK: 0 };
  filtered.forEach((a) => { if (counts[a.nivel_alerta as keyof typeof counts] !== undefined) counts[a.nivel_alerta as keyof typeof counts]++; });

  function formatMoney(n: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Alertas de Presupuesto</h2>
      <p className="text-sm text-gray-500 mb-4">Monitorea en tiempo real el avance del gasto contra el presupuesto por concepto y etapa.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select className="border rounded-lg px-3 py-2 text-sm flex-1" onChange={(e) => setSelectedProyecto(e.target.value)}>
          <option value="">Seleccionar proyecto...</option>
          {proyectos.map((p) => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm" value={filterEtapa} onChange={(e) => setFilterEtapa(e.target.value)}>
          <option value="">Todas las etapas</option>
          {Object.entries(ETAPA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {selectedProyecto && !loading && filtered.length > 0 && (
        <>
          {/* Summary counters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {counts.EXCEDIDO > 0 && <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 text-sm font-semibold">{counts.EXCEDIDO} Excedido{counts.EXCEDIDO > 1 ? 's' : ''}</span>}
            {counts.CRITICO > 0 && <span className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-800 text-sm font-semibold">{counts.CRITICO} Crítico{counts.CRITICO > 1 ? 's' : ''}</span>}
            {counts.ALERTA > 0 && <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-sm font-semibold">{counts.ALERTA} Alerta{counts.ALERTA > 1 ? 's' : ''}</span>}
            {counts.OK > 0 && <span className="px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-sm font-semibold">{counts.OK} OK</span>}
          </div>

          {/* Alert cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((a, i) => {
              const style = LEVEL_STYLES[a.nivel_alerta] ?? LEVEL_STYLES['OK']!;
              const pct = Number(a.porcentaje);
              return (
                <div key={i} className={`${style.bg} rounded-xl border border-gray-100 border-l-4 ${style.border} p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{a.concepto}</p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">
                        {ETAPA_LABELS[a.etapa_tipo] ?? a.etapa_tipo}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${style.badge}`}>
                      {a.nivel_alerta}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div
                      className={`h-2.5 rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-orange-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Ejercido: {formatMoney(Number(a.monto_ejercido))}</span>
                    <span>Budget: {formatMoney(Number(a.monto_presupuestado))}</span>
                  </div>
                  <p className={`text-right text-sm font-bold mt-1 ${style.text}`}>{pct}%</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedProyecto && !loading && filtered.length === 0 && (
        <p className="text-gray-400 text-center py-12">No hay partidas de presupuesto definidas. Ve a la sección Presupuesto para crearlas.</p>
      )}

      {loading && <p className="text-gray-400 text-center py-12">Cargando alertas...</p>}

      {!selectedProyecto && <p className="text-gray-400 text-center py-12">Selecciona un proyecto para ver las alertas</p>}
    </div>
  );
}
