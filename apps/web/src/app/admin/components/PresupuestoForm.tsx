'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

const ETAPAS = ['PREPARACION', 'SIEMBRA', 'DESARROLLO', 'COSECHA'] as const;
const ETAPA_LABELS: Record<string, string> = {
  PREPARACION: 'Preparación',
  SIEMBRA: 'Siembra',
  DESARROLLO: 'Desarrollo',
  COSECHA: 'Cosecha',
};

export function PresupuestoForm({ user }: { user: SessionUser }) {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('proyecto').select('id_proyecto, nombre, hectareas_totales, presupuesto_x_ha').eq('status', 'activo').then(({ data }) => setProyectos(data ?? []));
  }, []);

  useEffect(() => {
    if (selectedProyecto) loadPresupuestos();
  }, [selectedProyecto]);

  async function loadPresupuestos() {
    const { data } = await supabase
      .from('presupuesto_base')
      .select('*')
      .eq('id_proyecto', selectedProyecto)
      .order('etapa_tipo')
      .order('concepto');
    setPresupuestos(data ?? []);
  }

  const proyecto = proyectos.find((p) => p.id_proyecto === selectedProyecto);
  const presupuestoTotal = proyecto ? Number(proyecto.hectareas_totales) * Number(proyecto.presupuesto_x_ha) : 0;
  const totalAsignado = presupuestos.reduce((s, p) => s + Number(p.monto_presupuestado), 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const fd = new FormData(e.currentTarget);

    const { error } = await supabase.from('presupuesto_base').insert({
      id_proyecto: selectedProyecto,
      etapa_tipo: fd.get('etapa_tipo'),
      concepto: fd.get('concepto'),
      monto_presupuestado: Number(fd.get('monto_presupuestado')),
    });

    setLoading(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('Partida presupuestal creada');
    e.currentTarget.reset();
    loadPresupuestos();
  }

  async function handleDelete(id: string) {
    await supabase.from('presupuesto_base').delete().eq('id_budget', id);
    loadPresupuestos();
  }

  // Group by etapa
  const porEtapa: Record<string, { items: any[]; total: number }> = {};
  for (const etapa of ETAPAS) {
    const items = presupuestos.filter((p) => p.etapa_tipo === etapa);
    porEtapa[etapa] = { items, total: items.reduce((s, p) => s + Number(p.monto_presupuestado), 0) };
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Presupuesto Base</h2>
      <p className="text-sm text-gray-500 mb-4">
        Define cuánto planeas gastar por concepto en cada etapa. Esto alimenta las alertas del dashboard.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
        <select className="border rounded-lg px-3 py-2 text-sm w-full max-w-lg" onChange={(e) => setSelectedProyecto(e.target.value)}>
          <option value="">Seleccionar proyecto...</option>
          {proyectos.map((p) => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
        </select>
      </div>

      {selectedProyecto && (
        <>
          {/* Summary bar */}
          <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center justify-between max-w-lg">
            <div>
              <p className="text-sm text-gray-500">Presupuesto total del proyecto</p>
              <p className="text-xl font-bold text-gray-800">${presupuestoTotal.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Asignado en partidas</p>
              <p className={`text-xl font-bold ${totalAsignado > presupuestoTotal ? 'text-red-600' : 'text-agro-700'}`}>
                ${totalAsignado.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Disponible</p>
              <p className={`text-xl font-bold ${presupuestoTotal - totalAsignado < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                ${(presupuestoTotal - totalAsignado).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Add form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4 max-w-lg mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
                <select name="etapa_tipo" required className="w-full border rounded-lg px-3 py-2 text-sm">
                  {ETAPAS.map((e) => <option key={e} value={e}>{ETAPA_LABELS[e]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                <input name="monto_presupuestado" type="number" step="0.01" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="120000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
              <input name="concepto" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Diésel y combustibles, Semilla, Jornales..." />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-agro-700 text-white py-2.5 rounded-lg font-semibold hover:bg-agro-800 disabled:bg-gray-300">
              {loading ? 'Guardando...' : 'Agregar Partida'}
            </button>
            {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
          </form>

          {/* Budget table grouped by etapa */}
          {presupuestos.length > 0 && (
            <div className="space-y-4">
              {ETAPAS.map((etapa) => {
                const grupo = porEtapa[etapa]!;
                if (grupo.items.length === 0) return null;
                const pctTotal = presupuestoTotal > 0 ? Math.round((grupo.total / presupuestoTotal) * 100) : 0;
                return (
                  <div key={etapa} className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="bg-agro-50 px-4 py-2 flex justify-between items-center">
                      <span className="font-semibold text-agro-800">{ETAPA_LABELS[etapa]}</span>
                      <span className="text-sm text-agro-600">${grupo.total.toLocaleString()} ({pctTotal}%)</span>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {grupo.items.map((p) => (
                          <tr key={p.id_budget} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-800">{p.concepto}</td>
                            <td className="px-4 py-2 text-right font-medium">${Number(p.monto_presupuestado).toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => handleDelete(p.id_budget)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
