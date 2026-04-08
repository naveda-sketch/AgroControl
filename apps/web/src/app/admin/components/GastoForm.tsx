'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

export function GastoForm({ user }: { user: SessionUser }) {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [selectedParcela, setSelectedParcela] = useState('');
  const [gastos, setGastos] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('proyecto').select('id_proyecto, nombre').eq('status', 'activo').then(({ data }) => setProyectos(data ?? []));
  }, []);

  useEffect(() => {
    if (selectedProyecto) {
      supabase.from('parcela').select('id_parcela, nombre_potrero').eq('id_proyecto', selectedProyecto).then(({ data }) => setParcelas(data ?? []));
    }
  }, [selectedProyecto]);

  useEffect(() => {
    if (selectedParcela) {
      supabase.from('etapa').select('id_etapa, tipo, status').eq('id_parcela', selectedParcela).then(({ data }) => setEtapas(data ?? []));
    }
  }, [selectedParcela]);

  async function loadGastos() {
    if (!selectedParcela) return;
    const etapaIds = etapas.map((e) => e.id_etapa);
    if (etapaIds.length === 0) return;
    const { data } = await supabase.from('gasto').select('*, usuario:registrado_por(nombre)').in('id_etapa', etapaIds).order('fecha_registro', { ascending: false }).limit(20);
    setGastos(data ?? []);
  }

  useEffect(() => { loadGastos(); }, [etapas]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const fd = new FormData(e.currentTarget);
    const monto = Number(fd.get('monto'));

    const { error } = await supabase.from('gasto').insert({
      id_etapa: fd.get('id_etapa'),
      concepto: fd.get('concepto'),
      monto,
      tipo: fd.get('tipo'),
      registrado_por: user.id_usuario,
      sync_id: crypto.randomUUID(),
    });

    setLoading(false);
    if (error) { setMsg('Error: ' + error.message); return; }

    const warning = monto > 50000 ? ' (Requiere aprobación del CFO por ser >$50,000)' : '';
    const compWarning = monto > 10000 ? ' Recuerda adjuntar comprobante.' : '';
    setMsg('Gasto registrado' + warning + compWarning);
    e.currentTarget.reset();
    loadGastos();
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Registrar Gasto</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4 max-w-lg mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
            <select required className="w-full border rounded-lg px-3 py-2 text-sm" onChange={(e) => setSelectedProyecto(e.target.value)}>
              <option value="">Seleccionar...</option>
              {proyectos.map((p) => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parcela</label>
            <select required className="w-full border rounded-lg px-3 py-2 text-sm" onChange={(e) => setSelectedParcela(e.target.value)}>
              <option value="">Seleccionar...</option>
              {parcelas.map((p) => <option key={p.id_parcela} value={p.id_parcela}>{p.nombre_potrero}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
          <select name="id_etapa" required className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Seleccionar etapa...</option>
            {etapas.map((e) => (
              <option key={e.id_etapa} value={e.id_etapa} disabled={e.status === 'completada'}>
                {e.tipo} {e.status === 'completada' ? '(cerrada)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
          <input name="concepto" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ej: Diésel para rastreo" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
            <input name="monto" type="number" step="0.01" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="15000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select name="tipo" required className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="OPEX">OPEX (Gasto operativo)</option>
              <option value="CAPEX">CAPEX (Activo/Equipo)</option>
            </select>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
          Registrado por: <strong>{user.nombre}</strong> ({user.rol})
        </div>
        <button type="submit" disabled={loading} className="w-full bg-agro-700 text-white py-2.5 rounded-lg font-semibold hover:bg-agro-800 disabled:bg-gray-300">
          {loading ? 'Guardando...' : 'Registrar Gasto'}
        </button>
        {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      </form>

      {gastos.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Últimos Gastos</h3>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Concepto</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">Monto</th>
                  <th className="px-4 py-2 text-center text-xs text-gray-500">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Registró</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id_gasto} className="border-t">
                    <td className="px-4 py-2 text-gray-800">{g.concepto}</td>
                    <td className="px-4 py-2 text-right font-medium">${Number(g.monto).toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${g.tipo === 'OPEX' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{g.tipo}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{g.usuario?.nombre ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{new Date(g.fecha_registro).toLocaleString('es-MX')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
