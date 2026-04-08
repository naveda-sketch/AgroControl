'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

const SUBTIPO_LABELS: Record<string, string> = {
  hoja_ancha: 'Hoja ancha',
  hoja_angosta: 'Hoja angosta',
  cyperacea: 'Cyperácea',
  mixta: 'Mixta',
};

const SUBTIPO_COLORS: Record<string, string> = {
  hoja_ancha: 'bg-emerald-100 text-emerald-800',
  hoja_angosta: 'bg-teal-100 text-teal-800',
  cyperacea: 'bg-cyan-100 text-cyan-800',
  mixta: 'bg-gray-100 text-gray-800',
};

const SEVERIDAD_COLORS: Record<string, string> = {
  leve: 'bg-green-100 text-green-800',
  moderada: 'bg-amber-100 text-amber-800',
  severa: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
};

export function MalezasForm({ user }: { user: SessionUser }) {
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
    if (selectedProyecto) supabase.from('parcela').select('id_parcela, nombre_potrero').eq('id_proyecto', selectedProyecto).then(({ data }) => setParcelas(data ?? []));
  }, [selectedProyecto]);

  useEffect(() => {
    if (selectedParcela) supabase.from('etapa').select('id_etapa, tipo, status').eq('id_parcela', selectedParcela).then(({ data }) => setEtapas(data ?? []));
  }, [selectedParcela]);

  useEffect(() => { loadRegistros(); }, [etapas]);

  async function loadRegistros() {
    if (etapas.length === 0) return;
    const ids = etapas.map((e) => e.id_etapa);
    const { data } = await supabase
      .from('registro_plagas')
      .select('*, usuario:registrado_por(nombre), etapa:id_etapa(tipo)')
      .eq('tipo', 'maleza')
      .in('id_etapa', ids)
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
      tipo: 'maleza',
      nombre: fd.get('nombre'),
      descripcion: fd.get('descripcion') || null,
      subtipo_maleza: fd.get('subtipo_maleza') || null,
      producto_usado: fd.get('producto_usado') || null,
      dosis: fd.get('dosis') || null,
      metodo_aplicacion: fd.get('metodo_aplicacion') || null,
      hectareas_afectadas: fd.get('hectareas_afectadas') ? Number(fd.get('hectareas_afectadas')) : null,
      severidad: fd.get('severidad') || null,
      fecha_deteccion: fd.get('fecha_deteccion'),
      fecha_tratamiento: fd.get('fecha_tratamiento') || null,
      resultado: fd.get('resultado') || null,
      registrado_por: user.id_usuario,
    });

    setLoading(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('Registro de maleza guardado correctamente');
    e.currentTarget.reset();
    loadRegistros();
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Registro de Malezas</h2>
      <p className="text-sm text-gray-500 mb-4">Documenta plantas silvestres no deseadas en el cultivo. Clasifica por tipo de hoja para seleccionar el herbicida correcto.</p>

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

        {/* Maleza identification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre de la maleza</label>
            <input name="nombre" required className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Ej: Zacate Johnson, Quelite, Correhuela" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo de hoja</label>
            <select name="subtipo_maleza" required className="w-full border rounded-lg px-3 py-2.5 text-sm">
              <option value="">Seleccionar...</option>
              <option value="hoja_ancha">Hoja ancha (dicotiledónea)</option>
              <option value="hoja_angosta">Hoja angosta (gramínea)</option>
              <option value="cyperacea">Cyperácea (junco/tule)</option>
              <option value="mixta">Mixta / Varias</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Severidad</label>
            <select name="severidad" className="w-full border rounded-lg px-3 py-2.5 text-sm">
              <option value="">Seleccionar...</option>
              <option value="leve">Leve (&lt;20% cobertura)</option>
              <option value="moderada">Moderada (20-50%)</option>
              <option value="severa">Severa (50-80%)</option>
              <option value="critica">Crítica (&gt;80%)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Hectáreas afectadas</label>
            <input name="hectareas_afectadas" type="number" step="0.01" className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Ej: 5.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
          <textarea name="descripcion" rows={2} className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none" placeholder="Densidad de población, distribución en la parcela, estado de crecimiento..." />
        </div>

        {/* Treatment */}
        <div className="border-t pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tratamiento con herbicida</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Herbicida aplicado</label>
              <input name="producto_usado" className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Ej: Glifosato, Atrazina, 2,4-D" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dosis</label>
              <input name="dosis" className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Ej: 2 L/ha, 1.5 kg/ha" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Método de aplicación</label>
              <select name="metodo_aplicacion" className="w-full border rounded-lg px-3 py-2.5 text-sm">
                <option value="">Seleccionar...</option>
                <option value="aspersión terrestre">Aspersión terrestre</option>
                <option value="aspersión aérea">Aspersión aérea (dron/avioneta)</option>
                <option value="aplicación dirigida">Aplicación dirigida</option>
                <option value="preemergente">Preemergente</option>
                <option value="postemergente">Postemergente</option>
                <option value="manual">Deshierbe manual</option>
              </select>
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
            <label className="block text-xs text-gray-600 mb-1">Fecha aplicación herbicida</label>
            <input name="fecha_tratamiento" type="date" className="w-full border rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Resultado</label>
            <input name="resultado" className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Ej: Control al 85%" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
          Registrado por: <strong>{user.nombre}</strong> ({user.rol})
        </div>

        <button type="submit" disabled={loading} className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-800 disabled:bg-gray-300 transition-colors">
          {loading ? 'Guardando...' : 'Registrar Maleza'}
        </button>
        {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      </form>

      {/* History */}
      {registros.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Historial de Malezas</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Fecha</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Maleza</th>
                  <th className="px-3 py-2 text-center text-xs text-gray-500">Tipo hoja</th>
                  <th className="px-3 py-2 text-center text-xs text-gray-500">Severidad</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Herbicida</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Dosis</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Método</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.fecha_deteccion}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{r.nombre}</td>
                    <td className="px-3 py-2 text-center">
                      {r.subtipo_maleza && <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${SUBTIPO_COLORS[r.subtipo_maleza] ?? ''}`}>{SUBTIPO_LABELS[r.subtipo_maleza] ?? r.subtipo_maleza}</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.severidad && <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${SEVERIDAD_COLORS[r.severidad] ?? ''}`}>{r.severidad}</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{r.producto_usado ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.dosis ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.metodo_aplicacion ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.resultado ?? '—'}</td>
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
