'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

const OP_COLORS: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
};

const OP_LABELS: Record<string, string> = {
  INSERT: 'Creó',
  UPDATE: 'Modificó',
  DELETE: 'Eliminó',
};

export function AuditLog({ user }: { user: SessionUser }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTabla, setFilterTabla] = useState('');

  useEffect(() => { loadLogs(); }, [filterTabla]);

  async function loadLogs() {
    setLoading(true);
    let query = supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100);
    if (filterTabla) query = query.eq('tabla', filterTabla);
    const { data } = await query;
    setLogs(data ?? []);
    setLoading(false);
  }

  const tablas = ['proyecto', 'parcela', 'etapa', 'gasto', 'comprobante', 'almacen_virtual', 'aplicacion_insumo', 'equipo_capex', 'uso_equipo', 'presupuesto_base', 'usuario'];

  if (user.rol === 'OPERADOR') {
    return (
      <div className="text-center py-16">
        <span className="text-5xl">🔒</span>
        <p className="text-gray-600 mt-4">Solo CFO y ADMIN pueden ver el registro de auditoría</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Registro de Auditoría</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterTabla}
            onChange={(e) => setFilterTabla(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">Todas las tablas</option>
            {tablas.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={loadLogs} className="text-sm text-agro-700 hover:text-agro-800">Actualizar</button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Cada acción en el sistema queda registrada: quién la hizo, cuándo, y qué cambió.
      </p>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Cargando...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No hay registros de auditoría</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Fecha</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Usuario</th>
                <th className="px-4 py-2 text-center text-xs text-gray-500">Acción</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Tabla</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const detail = log.operacion === 'INSERT'
                  ? extractDetail(log.valores_nuevos)
                  : log.operacion === 'DELETE'
                  ? extractDetail(log.valores_anteriores)
                  : extractChanges(log.valores_anteriores, log.valores_nuevos);

                return (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {log.usuario_nombre || 'sistema'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${OP_COLORS[log.operacion] ?? 'bg-gray-100'}`}>
                        {OP_LABELS[log.operacion] ?? log.operacion}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600 font-mono text-xs">{log.tabla}</td>
                    <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">{detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function extractDetail(values: any): string {
  if (!values) return '—';
  const keys = ['nombre', 'concepto', 'producto', 'nombre_potrero', 'tipo'];
  for (const k of keys) {
    if (values[k]) return `${k}: ${values[k]}`;
  }
  if (values.monto) return `monto: $${Number(values.monto).toLocaleString()}`;
  return JSON.stringify(values).slice(0, 80);
}

function extractChanges(old: any, nuevo: any): string {
  if (!old || !nuevo) return '—';
  const changes: string[] = [];
  for (const key of Object.keys(nuevo)) {
    if (key === 'updated_at') continue;
    if (JSON.stringify(old[key]) !== JSON.stringify(nuevo[key])) {
      changes.push(`${key}: ${old[key]} → ${nuevo[key]}`);
    }
  }
  return changes.join(', ') || 'Sin cambios visibles';
}
