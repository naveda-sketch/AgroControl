'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

export function ParcelaForm({ user }: { user: SessionUser }) {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('proyecto').select('id_proyecto, nombre').eq('status', 'activo').then(({ data }) => setProyectos(data ?? []));
  }, []);

  useEffect(() => {
    if (selectedProyecto) {
      supabase.from('parcela').select('*').eq('id_proyecto', selectedProyecto).then(({ data }) => setParcelas(data ?? []));
    }
  }, [selectedProyecto]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const fd = new FormData(e.currentTarget);

    const { error } = await supabase.from('parcela').insert({
      id_proyecto: fd.get('id_proyecto'),
      nombre_potrero: fd.get('nombre_potrero'),
      hectareas: Number(fd.get('hectareas')),
      tipo_suelo: fd.get('tipo_suelo') || null,
    });

    setLoading(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('Parcela creada');
    e.currentTarget.reset();
    if (selectedProyecto) {
      supabase.from('parcela').select('*').eq('id_proyecto', selectedProyecto).then(({ data }) => setParcelas(data ?? []));
    }
  }

  async function crearEtapas(idParcela: string, hectareas: number) {
    const presupuestoHa = proyectos.find((p) => p.id_proyecto === selectedProyecto)?.presupuesto_x_ha || 28000;
    const total = hectareas * presupuestoHa;
    const dist = { PREPARACION: 0.25, SIEMBRA: 0.25, DESARROLLO: 0.30, COSECHA: 0.20 };

    for (const [tipo, pct] of Object.entries(dist)) {
      await supabase.from('etapa').insert({
        id_parcela: idParcela,
        tipo,
        fecha_inicio: new Date().toISOString().split('T')[0],
        presupuesto_etapa: Math.round(total * pct),
        status: 'pendiente',
      });
    }
    setMsg('4 etapas creadas para la parcela');
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Parcelas</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4 max-w-lg mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
          <select name="id_proyecto" required className="w-full border rounded-lg px-3 py-2 text-sm"
            onChange={(e) => setSelectedProyecto(e.target.value)}>
            <option value="">Seleccionar...</option>
            {proyectos.map((p) => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Potrero</label>
            <input name="nombre_potrero" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Potrero Norte" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hectáreas</label>
            <input name="hectareas" type="number" step="0.01" required className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Suelo (opcional)</label>
          <input name="tipo_suelo" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Vertisol, Feozem, etc." />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-agro-700 text-white py-2.5 rounded-lg font-semibold hover:bg-agro-800 disabled:bg-gray-300">
          {loading ? 'Guardando...' : 'Crear Parcela'}
        </button>
        {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      </form>

      {parcelas.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Parcelas del Proyecto</h3>
          <div className="space-y-2">
            {parcelas.map((p) => (
              <div key={p.id_parcela} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{p.nombre_potrero}</p>
                  <p className="text-xs text-gray-500">{p.hectareas} ha {p.tipo_suelo ? `· ${p.tipo_suelo}` : ''}</p>
                </div>
                <button
                  onClick={() => crearEtapas(p.id_parcela, p.hectareas)}
                  className="text-xs bg-agro-100 text-agro-700 px-3 py-1.5 rounded-lg hover:bg-agro-200"
                >
                  + Crear 4 Etapas
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
