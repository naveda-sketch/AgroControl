'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

export function EquipoForm({ user }: { user: SessionUser }) {
  const [equipos, setEquipos] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadEquipos(); }, []);

  async function loadEquipos() {
    const { data } = await supabase.from('equipo_capex').select('*').order('nombre');
    setEquipos(data ?? []);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const fd = new FormData(e.currentTarget);

    const { error } = await supabase.from('equipo_capex').insert({
      nombre: fd.get('nombre'),
      valor_adquisicion: Number(fd.get('valor_adquisicion')),
      vida_util_horas: Number(fd.get('vida_util_horas')),
      costo_x_hectarea: fd.get('costo_x_hectarea') ? Number(fd.get('costo_x_hectarea')) : null,
    });

    setLoading(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('Equipo registrado');
    e.currentTarget.reset();
    loadEquipos();
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Equipos (CAPEX)</h2>
      <p className="text-sm text-gray-500 mb-4">El costo se calcula por hora de uso. No se registra el valor total como gasto.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4 max-w-lg mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Equipo</label>
          <input name="nombre" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Tractor John Deere 6110B" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Adquisición ($)</label>
            <input name="valor_adquisicion" type="number" step="0.01" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="850000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vida Útil (horas)</label>
            <input name="vida_util_horas" type="number" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="12000" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Hectárea (opcional)</label>
          <input name="costo_x_hectarea" type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="450" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300">
          {loading ? 'Guardando...' : 'Registrar Equipo'}
        </button>
        {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      </form>

      {equipos.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Equipo</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500">Valor</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500">$/hora</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500">Horas Usadas</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((eq) => (
                <tr key={eq.id_equipo} className="border-t">
                  <td className="px-4 py-2 text-gray-800">{eq.nombre}</td>
                  <td className="px-4 py-2 text-right">${Number(eq.valor_adquisicion).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-medium">${Number(eq.costo_x_hora).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{Number(eq.horas_acumuladas).toFixed(1)} / {eq.vida_util_horas.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
