'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

export function InsumoForm({ user }: { user: SessionUser }) {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [almacen, setAlmacen] = useState<any[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('proyecto').select('id_proyecto, nombre').eq('status', 'activo').then(({ data }) => setProyectos(data ?? []));
  }, []);

  useEffect(() => {
    if (selectedProyecto) {
      supabase.from('almacen_virtual').select('*').eq('id_proyecto', selectedProyecto).order('producto').then(({ data }) => setAlmacen(data ?? []));
    }
  }, [selectedProyecto]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const fd = new FormData(e.currentTarget);
    const cantidad = Number(fd.get('cantidad_comprada'));

    const { error } = await supabase.from('almacen_virtual').insert({
      id_proyecto: fd.get('id_proyecto'),
      producto: fd.get('producto'),
      unidad_medida: fd.get('unidad_medida'),
      cantidad_comprada: cantidad,
      cantidad_disponible: cantidad,
      costo_unitario_prom: Number(fd.get('costo_unitario_prom')),
      fecha_entrada: fd.get('fecha_entrada'),
    });

    setLoading(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('Insumo agregado al almacén (no impacta costo del proyecto hasta que se aplique)');
    e.currentTarget.reset();
    supabase.from('almacen_virtual').select('*').eq('id_proyecto', selectedProyecto).order('producto').then(({ data }) => setAlmacen(data ?? []));
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Almacén Virtual</h2>
      <p className="text-sm text-gray-500 mb-4">Comprar insumos NO impacta el costo del proyecto. El costo se detona al registrar la APLICACIÓN en campo.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4 max-w-lg mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
          <select name="id_proyecto" required className="w-full border rounded-lg px-3 py-2 text-sm" onChange={(e) => setSelectedProyecto(e.target.value)}>
            <option value="">Seleccionar...</option>
            {proyectos.map((p) => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <input name="producto" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Fertilizante DAP 18-46-00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
            <select name="unidad_medida" required className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="kg">kg</option>
              <option value="litros">litros</option>
              <option value="toneladas">toneladas</option>
              <option value="piezas">piezas</option>
              <option value="bultos">bultos</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input name="cantidad_comprada" type="number" step="0.001" required className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario</label>
            <input name="costo_unitario_prom" type="number" step="0.01" required className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Entrada</label>
            <input name="fecha_entrada" type="date" required className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-earth-600 text-white py-2.5 rounded-lg font-semibold hover:bg-earth-700 disabled:bg-gray-300">
          {loading ? 'Guardando...' : 'Agregar al Almacén'}
        </button>
        {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      </form>

      {almacen.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Inventario Actual</h3>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Producto</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">Disponible</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">Comprado</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">Costo Unit.</th>
                  <th className="px-4 py-2 text-center text-xs text-gray-500">Consumo</th>
                </tr>
              </thead>
              <tbody>
                {almacen.map((item) => {
                  const pct = Math.round(((Number(item.cantidad_comprada) - Number(item.cantidad_disponible)) / Number(item.cantidad_comprada)) * 100);
                  return (
                    <tr key={item.id_item} className="border-t">
                      <td className="px-4 py-2 text-gray-800">{item.producto}</td>
                      <td className="px-4 py-2 text-right">{Number(item.cantidad_disponible).toLocaleString()} {item.unidad_medida}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{Number(item.cantidad_comprada).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">${Number(item.costo_unitario_prom).toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-earth-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-500">{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
