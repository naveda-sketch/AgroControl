'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { deleteRecord, restoreRecord } from '@/lib/delete-helpers';
import { UndoToast } from '@/components/UndoToast';
import type { SessionUser } from '@/lib/auth';

const TIPO_OPTIONS = [
  { value: 'observacion', label: 'Observación general', color: 'bg-blue-100 text-blue-800' },
  { value: 'plaga', label: 'Plaga detectada', color: 'bg-red-100 text-red-800' },
  { value: 'maleza', label: 'Maleza detectada', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'aplicacion', label: 'Aplicación realizada', color: 'bg-purple-100 text-purple-800' },
  { value: 'clima', label: 'Evento climático', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'riego', label: 'Riego', color: 'bg-sky-100 text-sky-800' },
  { value: 'otro', label: 'Otro', color: 'bg-gray-100 text-gray-800' },
];

const TIPO_COLORS: Record<string, string> = Object.fromEntries(TIPO_OPTIONS.map((t) => [t.value, t.color]));
const TIPO_LABELS: Record<string, string> = Object.fromEntries(TIPO_OPTIONS.map((t) => [t.value, t.label]));

export function BitacoraPanel({ user }: { user: SessionUser }) {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [entradas, setEntradas] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [undoData, setUndoData] = useState<{ message: string; record: any } | null>(null);

  useEffect(() => {
    supabase.from('proyecto').select('id_proyecto, nombre').eq('status', 'activo').then(({ data }) => setProyectos(data ?? []));
  }, []);

  useEffect(() => {
    if (selectedProyecto) {
      supabase.from('parcela').select('id_parcela, nombre_potrero').eq('id_proyecto', selectedProyecto).then(({ data }) => setParcelas(data ?? []));
      loadEntradas();
    }
  }, [selectedProyecto]);

  async function loadEntradas() {
    if (!selectedProyecto) return;
    const { data } = await supabase
      .from('bitacora_campo')
      .select('*, usuario:registrado_por(nombre), parcela:id_parcela(nombre_potrero)')
      .eq('id_proyecto', selectedProyecto)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    setEntradas(data ?? []);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const fd = new FormData(e.currentTarget);

    const { error } = await supabase.from('bitacora_campo').insert({
      id_proyecto: selectedProyecto,
      id_parcela: fd.get('id_parcela') || null,
      tipo: fd.get('tipo'),
      titulo: fd.get('titulo'),
      descripcion: fd.get('descripcion') || null,
      fecha: fd.get('fecha'),
      registrado_por: user.id_usuario,
    });

    setLoading(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('Entrada de bitácora registrada');
    e.currentTarget.reset();
    loadEntradas();
  }

  async function handleDelete(id: string, titulo: string) {
    try {
      const record = await deleteRecord('bitacora_campo', 'id', id);
      setUndoData({ message: `"${titulo}" eliminado de la bitácora`, record });
      loadEntradas();
    } catch (err: any) { setMsg('Error: ' + err.message); }
  }

  const handleUndo = useCallback(async () => {
    if (!undoData) return;
    await restoreRecord('bitacora_campo', undoData.record);
    loadEntradas();
  }, [undoData]);

  // Group entries by date
  const grouped = new Map<string, any[]>();
  entradas.forEach((e) => {
    const key = e.fecha;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e);
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Bitácora de Campo</h2>
      <p className="text-sm text-gray-500 mb-4">Registro cronológico de actividades, observaciones y eventos en campo. Toda la información queda documentada con fecha, autor y tipo.</p>

      <div className="mb-6">
        <select className="border rounded-lg px-3 py-2.5 text-sm w-full max-w-md" onChange={(e) => setSelectedProyecto(e.target.value)}>
          <option value="">Seleccionar proyecto...</option>
          {proyectos.map((p) => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
        </select>
      </div>

      {selectedProyecto && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-4 max-w-2xl mb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nueva entrada</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo</label>
              <select name="tipo" required className="w-full border rounded-lg px-3 py-2.5 text-sm">
                {TIPO_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Parcela (opcional)</label>
              <select name="id_parcela" className="w-full border rounded-lg px-3 py-2.5 text-sm">
                <option value="">General / Todas</option>
                {parcelas.map((p) => <option key={p.id_parcela} value={p.id_parcela}>{p.nombre_potrero}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha</label>
              <input name="fecha" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border rounded-lg px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Título</label>
            <input name="titulo" required className="w-full border rounded-lg px-3 py-2.5 text-sm" placeholder="Ej: Se observó presencia de gusano cogollero en Potrero Norte" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Descripción detallada</label>
            <textarea name="descripcion" rows={3} className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none" placeholder="Detalles de la observación, condiciones del cultivo, acciones tomadas..." />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Por: {user.nombre}</span>
            <button type="submit" disabled={loading} className="bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-green-800 disabled:bg-gray-300 transition-colors">
              {loading ? 'Guardando...' : 'Agregar a Bitácora'}
            </button>
          </div>
          {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
        </form>
      )}

      {/* Timeline */}
      {entradas.length > 0 && (
        <div className="max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Línea de Tiempo</h3>
          {Array.from(grouped.entries()).map(([fecha, items]) => (
            <div key={fecha} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm font-semibold text-gray-600">{new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="ml-3 border-l-2 border-gray-200 pl-4 space-y-3">
                {items.map((entry: any) => (
                  <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 group">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${TIPO_COLORS[entry.tipo] ?? 'bg-gray-100'}`}>
                          {TIPO_LABELS[entry.tipo] ?? entry.tipo}
                        </span>
                        {entry.parcela?.nombre_potrero && (
                          <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{entry.parcela.nombre_potrero}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id, entry.titulo)}
                        className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                    <p className="font-medium text-gray-800 text-sm">{entry.titulo}</p>
                    {entry.descripcion && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{entry.descripcion}</p>}
                    <p className="text-[10px] text-gray-400 mt-2">{entry.usuario?.nombre} &middot; {new Date(entry.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProyecto && entradas.length === 0 && !loading && (
        <p className="text-gray-400 text-center py-8">No hay entradas en la bitácora. Agrega la primera observación.</p>
      )}

      {undoData && <UndoToast message={undoData.message} onUndo={handleUndo} onDismiss={() => setUndoData(null)} />}
    </div>
  );
}
