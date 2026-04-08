'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

const TIPO_STYLES: Record<string, string> = {
  plaga: 'bg-red-100 text-red-800',
  maleza: 'bg-emerald-100 text-emerald-800',
};

export function PlagasForm({ user }: { user: SessionUser }) {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [selectedParcela, setSelectedParcela] = useState('');
  const [registros, setRegistros] = useState<any[]>([]);
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

  useEffect(() => { loadRegistros(); }, [etapas]);

  async function loadRegistros() {
    if (etapas.length === 0) return;
    const etapaIds = etapas.map((e) => e.id_etapa);
    const { data } = await supabase
      .from('registro_plagas')
      .select('*, usuario:registrado_por(nombre), etapa:id_etapa(tipo)')
      .eq('tipo', 'plaga')
      .in('id_etapa', etapaIds)
      .order('fecha_deteccion', { ascending: false })
      .limit(30);
    setRegistros(data ?? []);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const fd = new FormData(e.currentTarget);

    const { error } = await supabase.from('registro_plagas').insert({
      id_etapa: fd.get('id_etapa'),
      tipo: fd.get('tipo'),
      nombre: fd.get('nombre'),
      descripcion: fd.get('descripcion') || null,
      producto_usado: fd.get('producto_usado') || null,
      dosis: fd.get('dosis') || null,
      fecha_deteccion: fd.get('fecha_deteccion'),
      fecha_tratamiento: fd.get('fecha_tratamiento') || null,
      resultado: fd.get('resultado') || null,
      registrado_por: user.id_usuario,
    });

    setLoading(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('Registro de plaga/maleza guardado correctamente');
    e.currentTarget.reset();
    loadRegistros();
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Registro de Plagas</h2>
      <p className="text-sm text-gray-500 mb-4">Documenta insectos y organismos que dañan el cultivo: qué se detectó, qué insecticida se usó y el resultado.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-4 max-w-2xl mb-8">
        {/* Cascading selects */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Proyecto</label>
            <select required className="w-full border rounded-lg px-3 py-2.5 text-sm" onChange={(e) => setSelectedProyecto(e.target.value)}>
              <option value="">Seleccionar...</option>
              {proyectos.map((p) => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Parcela</label>
            <select required className="w-full border rounded-lg px-3 py-2.5 text-sm" onChange={(e) => setSelectedParcela(e.target.value)}>
              <option value="">Seleccionar...</option>
              {parcelas.map((p) => <option key={p.id_parcela} value={p.id_parcela}>{p.nombre_potrero}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Etapa</label>
            <select name="id_etapa" required className="w-full border rounded-lg px-3 py-2.5 text-sm">
              <option value="">Seleccionar...</option>
              {etapas.map((e) => <option key={e.id_etapa} value={e.id_etapa}>{e.tipo}</option>)}
            </select>
          </div>
        </div>

        {/* Problem details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="hidden" name="tipo" value="plaga" />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
            <input name="nombre" required className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Ej: Gusano cogollero, Gallina ciega, Pulgón" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción del problema</label>
          <textarea name="descripcion" rows={2} className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none" placeholder="Describe la severidad, área afectada, síntomas observados..." />
        </div>

        {/* Treatment */}
        <div className="border-t pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tratamiento aplicado</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Insecticida usado</label>
              <input name="producto_usado" className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Ej: Cipermetrina 25%, Clorpirifos" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dosis</label>
              <input name="dosis" className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Ej: 250 ml/ha, 2 L/ha" />
            </div>
          </div>
        </div>

        {/* Dates and result */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Fecha detección</label>
            <input name="fecha_deteccion" type="date" required className="w-full border rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Fecha tratamiento</label>
            <input name="fecha_tratamiento" type="date" className="w-full border rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Resultado</label>
            <input name="resultado" className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Ej: Control al 90%" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
          Registrado por: <strong>{user.nombre}</strong> ({user.rol})
        </div>

        <button type="submit" disabled={loading} className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 disabled:bg-gray-300 transition-colors">
          {loading ? 'Guardando...' : 'Registrar Plaga'}
        </button>
        {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      </form>

      {/* History table */}
      {registros.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Historial de Registros</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Fecha</th>
                  <th className="px-3 py-2 text-center text-xs text-gray-500">Tipo</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Nombre</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Etapa</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Producto</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Dosis</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Resultado</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Registró</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.fecha_deteccion}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${TIPO_STYLES[r.tipo] ?? ''}`}>
                        {r.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-800">{r.nombre}</td>
                    <td className="px-3 py-2 text-gray-600">{r.etapa?.tipo ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.producto_usado ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.dosis ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.resultado ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{r.usuario?.nombre ?? '—'}</td>
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
