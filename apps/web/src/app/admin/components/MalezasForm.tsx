'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { deleteRecord, restoreRecord } from '@/lib/delete-helpers';
import { UndoToast } from '@/components/UndoToast';
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
  const [undoData, setUndoData] = useState<{ message: string; record: any } | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState<string>('image/jpeg');
  const [analizando, setAnalizando] = useState(false);
  const [iaResult, setIaResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  async function handleDelete(id: string, nombre: string) {
    try {
      const record = await deleteRecord('registro_plagas', 'id', id);
      setUndoData({ message: `Maleza "${nombre}" eliminada`, record });
      loadRegistros();
    } catch (err: any) { setMsg('Error al eliminar: ' + err.message); }
  }

  const handleUndo = useCallback(async () => {
    if (!undoData) return;
    await restoreRecord('registro_plagas', undoData.record);
    loadRegistros();
  }, [undoData]);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoMime(file.type);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setFotoPreview(dataUrl);
      setFotoBase64(dataUrl.split(',')[1] ?? null);
    };
    reader.readAsDataURL(file);
    setIaResult(null);
  }

  async function handleAnalizarFoto() {
    if (!fotoBase64) return;
    setAnalizando(true);
    setIaResult(null);
    try {
      const res = await fetch('/api/analizar-foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: fotoBase64, mimeType: fotoMime, tipo: 'maleza' }),
      });
      const data = await res.json();
      if (data.error) { setMsg('Error IA: ' + data.error); return; }
      setIaResult(data);
    } catch (err: any) {
      setMsg('Error al conectar con IA: ' + err.message);
    } finally {
      setAnalizando(false);
    }
  }

  function aplicarSugerencia() {
    if (!iaResult || !formRef.current) return;
    const form = formRef.current;
    (form.elements.namedItem('nombre') as HTMLInputElement).value = iaResult.nombre ?? '';
    (form.elements.namedItem('descripcion') as HTMLTextAreaElement).value = iaResult.descripcion ?? '';
    (form.elements.namedItem('producto_usado') as HTMLInputElement).value = iaResult.producto_recomendado ?? '';
    (form.elements.namedItem('dosis') as HTMLInputElement).value = iaResult.dosis_recomendada ?? '';
    // Auto-select subtipo_maleza if IA returned it
    const subtipoEl = form.elements.namedItem('subtipo_maleza') as HTMLSelectElement;
    if (iaResult.subtipo_maleza && subtipoEl) subtipoEl.value = iaResult.subtipo_maleza;
    const severidadEl = form.elements.namedItem('severidad') as HTMLSelectElement;
    if (iaResult.severidad && severidadEl) severidadEl.value = iaResult.severidad;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Registro de Malezas</h2>
      <p className="text-sm text-gray-500 mb-4">Documenta plantas silvestres no deseadas en el cultivo. Clasifica por tipo de hoja para seleccionar el herbicida correcto.</p>

      <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-4 max-w-2xl mb-8">
        {/* Photo analysis */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Identificar con IA (opcional)</p>
            <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Gemini Vision</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm bg-white border border-emerald-300 text-emerald-800 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              {fotoPreview ? 'Cambiar foto' : 'Subir foto de campo'}
            </button>
            {fotoPreview && !analizando && (
              <button
                type="button"
                onClick={handleAnalizarFoto}
                className="flex items-center gap-2 text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M11 8v6M8 11h6" /></svg>
                Analizar con IA
              </button>
            )}
            {analizando && <span className="text-sm text-emerald-700 animate-pulse">Analizando imagen...</span>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoChange} />
          {fotoPreview && (
            <div className="flex gap-3 items-start">
              <img src={fotoPreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-emerald-200" />
              {iaResult && (
                <div className="flex-1 bg-white rounded-lg border border-emerald-200 p-3 space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-700">{iaResult.nombre}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${iaResult.confianza === 'alta' ? 'bg-green-100 text-green-800' : iaResult.confianza === 'media' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                      Confianza {iaResult.confianza}
                    </span>
                  </div>
                  {iaResult.subtipo_maleza && (
                    <p className="text-[11px] text-gray-500">
                      <span className="font-semibold">Tipo:</span> {SUBTIPO_LABELS[iaResult.subtipo_maleza] ?? iaResult.subtipo_maleza}
                      {iaResult.severidad && <> · <span className="font-semibold">Severidad:</span> {iaResult.severidad}</>}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-600 leading-relaxed">{iaResult.descripcion}</p>
                  {iaResult.producto_recomendado && (
                    <p className="text-[11px] text-gray-500">
                      <span className="font-semibold">Herbicida:</span> {iaResult.producto_recomendado} · {iaResult.dosis_recomendada}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={aplicarSugerencia}
                    className="mt-2 text-[11px] bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                  >
                    Aplicar sugerencia al formulario
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
                  <th className="px-3 py-2 w-10"></th>
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
                    <td className="px-3 py-2">
                      <button onClick={() => handleDelete(r.id, r.nombre)} className="text-red-400 hover:text-red-600 transition-colors" title="Eliminar">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {undoData && <UndoToast message={undoData.message} onUndo={handleUndo} onDismiss={() => setUndoData(null)} />}
    </div>
  );
}
