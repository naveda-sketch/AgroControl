'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { deleteRecord, restoreRecord } from '@/lib/delete-helpers';
import { UndoToast } from '@/components/UndoToast';
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

  async function handleDelete(id: string, nombre: string) {
    try {
      const record = await deleteRecord('registro_plagas', 'id', id);
      setUndoData({ message: `Plaga "${nombre}" eliminada`, record });
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
      // Strip the data URL prefix to get raw base64
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
        body: JSON.stringify({ imageBase64: fotoBase64, mimeType: fotoMime, tipo: 'plaga' }),
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
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Registro de Plagas</h2>
      <p className="text-sm text-gray-500 mb-4">Documenta insectos y organismos que dañan el cultivo: qué se detectó, qué insecticida se usó y el resultado.</p>

      <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-4 max-w-2xl mb-8">
        {/* Photo analysis */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Identificar con IA (opcional)</p>
            <span className="text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Gemini Vision</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm bg-white border border-amber-300 text-amber-800 px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              {fotoPreview ? 'Cambiar foto' : 'Subir foto de campo'}
            </button>
            {fotoPreview && !analizando && (
              <button
                type="button"
                onClick={handleAnalizarFoto}
                className="flex items-center gap-2 text-sm bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-semibold"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M11 8v6M8 11h6" /></svg>
                Analizar con IA
              </button>
            )}
            {analizando && <span className="text-sm text-amber-700 animate-pulse">Analizando imagen...</span>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoChange} />
          {fotoPreview && (
            <div className="flex gap-3 items-start">
              <img src={fotoPreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-amber-200" />
              {iaResult && (
                <div className="flex-1 bg-white rounded-lg border border-amber-200 p-3 space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-700">{iaResult.nombre}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${iaResult.confianza === 'alta' ? 'bg-green-100 text-green-800' : iaResult.confianza === 'media' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                      Confianza {iaResult.confianza}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{iaResult.descripcion}</p>
                  {iaResult.producto_recomendado && (
                    <p className="text-[11px] text-gray-500">
                      <span className="font-semibold">Producto:</span> {iaResult.producto_recomendado} · {iaResult.dosis_recomendada}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={aplicarSugerencia}
                    className="mt-2 text-[11px] bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors font-semibold"
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
                  <th className="px-3 py-2 w-10"></th>
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
