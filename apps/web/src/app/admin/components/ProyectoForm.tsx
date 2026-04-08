'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

export function ProyectoForm({ user }: { user: SessionUser }) {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadProyectos(); }, []);

  async function loadProyectos() {
    const { data } = await supabase.from('proyecto').select('*').order('created_at', { ascending: false });
    setProyectos(data ?? []);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const fd = new FormData(e.currentTarget);

    const { error } = await supabase.from('proyecto').insert({
      nombre: fd.get('nombre'),
      temporada: fd.get('temporada'),
      hectareas_totales: Number(fd.get('hectareas_totales')),
      presupuesto_x_ha: Number(fd.get('presupuesto_x_ha')),
      fecha_inicio: fd.get('fecha_inicio'),
      status: 'activo',
    });

    setLoading(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('Proyecto creado exitosamente');
    e.currentTarget.reset();
    loadProyectos();
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Crear Proyecto</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4 max-w-lg mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto</label>
          <input name="nombre" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Maíz Rancho Jaltitán PV-2026" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temporada</label>
            <input name="temporada" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="PV-2026" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hectáreas Totales</label>
            <input name="hectareas_totales" type="number" step="0.01" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="30" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto $/ha</label>
            <input name="presupuesto_x_ha" type="number" step="0.01" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="28000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input name="fecha_inicio" type="date" required className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-agro-700 text-white py-2.5 rounded-lg font-semibold hover:bg-agro-800 disabled:bg-gray-300">
          {loading ? 'Guardando...' : 'Crear Proyecto'}
        </button>
        {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      </form>

      <h3 className="text-lg font-semibold text-gray-700 mb-3">Proyectos Existentes</h3>
      <div className="space-y-2">
        {proyectos.map((p) => (
          <div key={p.id_proyecto} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{p.nombre}</p>
              <p className="text-xs text-gray-500">{p.temporada} &middot; {p.hectareas_totales} ha &middot; ${Number(p.presupuesto_x_ha).toLocaleString()}/ha</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
