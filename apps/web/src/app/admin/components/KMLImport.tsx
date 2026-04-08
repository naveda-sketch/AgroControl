'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

function parseKML(kml: string): { nombre: string; hectareas: number }[] {
  const parcelas: { nombre: string; hectareas: number }[] = [];
  const placemarkRegex = /<Placemark>([\s\S]*?)<\/Placemark>/g;
  let match;

  while ((match = placemarkRegex.exec(kml)) !== null) {
    const block = match[1]!;
    const nameMatch = block.match(/<name>(.*?)<\/name>/);
    const nombre = nameMatch ? nameMatch[1]! : `Parcela ${parcelas.length + 1}`;
    const coordMatch = block.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
    let hectareas = 0;

    if (coordMatch) {
      const points = coordMatch[1]!.trim().split(/\s+/).map((c) => {
        const [lng, lat] = c.split(',').map(Number);
        return { lat: lat ?? 0, lng: lng ?? 0 };
      });

      if (points.length >= 3) {
        const toRad = (d: number) => (d * Math.PI) / 180;
        let area = 0;
        for (let i = 0; i < points.length; i++) {
          const j = (i + 1) % points.length;
          const p1 = points[i]!;
          const p2 = points[j]!;
          const avgLat = toRad((p1.lat + p2.lat) / 2);
          const x1 = p1.lng * 111320 * Math.cos(avgLat);
          const y1 = p1.lat * 110540;
          const x2 = p2.lng * 111320 * Math.cos(avgLat);
          const y2 = p2.lat * 110540;
          area += x1 * y2 - x2 * y1;
        }
        hectareas = Math.round((Math.abs(area) / 2 / 10000) * 100) / 100;
      }
    }

    parcelas.push({ nombre, hectareas });
  }

  return parcelas;
}

export function KMLImport({ user }: { user: SessionUser }) {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [parsed, setParsed] = useState<{ nombre: string; hectareas: number }[]>([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('proyecto').select('id_proyecto, nombre').eq('status', 'activo').then(({ data }) => setProyectos(data ?? []));
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parcelas = parseKML(text);
    setParsed(parcelas);
    setMsg(parcelas.length > 0 ? `${parcelas.length} parcelas detectadas en el archivo` : 'No se encontraron polígonos en el archivo KML');
  }

  async function handleImport() {
    if (!selectedProyecto || parsed.length === 0) return;
    setLoading(true);
    setMsg('');

    let count = 0;
    for (const p of parsed) {
      const { error } = await supabase.from('parcela').insert({
        id_proyecto: selectedProyecto,
        nombre_potrero: p.nombre,
        hectareas: p.hectareas || 1,
        tipo_suelo: null,
      });
      if (!error) count++;
    }

    setLoading(false);
    setMsg(`${count} parcelas importadas exitosamente`);
    setParsed([]);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Importar desde Google Earth</h2>
      <p className="text-sm text-gray-500 mb-4">
        Exporta tus parcelas de Google Earth como archivo KML y súbelo aquí. Se extraerán los polígonos con nombre y hectáreas calculadas.
      </p>

      <div className="bg-white rounded-xl shadow p-6 space-y-4 max-w-lg mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto destino</label>
          <select required className="w-full border rounded-lg px-3 py-2 text-sm" onChange={(e) => setSelectedProyecto(e.target.value)}>
            <option value="">Seleccionar...</option>
            {proyectos.map((p) => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Archivo KML</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <span className="text-4xl">🌍</span>
            <p className="text-sm text-gray-500 mt-2">Arrastra tu archivo .kml o haz click para seleccionar</p>
            <input type="file" accept=".kml,.kmz" onChange={handleFileUpload} className="mt-3 text-sm" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
          <strong>Cómo exportar de Google Earth:</strong>
          <ol className="list-decimal ml-4 mt-1 space-y-1">
            <li>Abre Google Earth Pro</li>
            <li>Selecciona tus parcelas en "Mis lugares"</li>
            <li>Click derecho → "Guardar lugar como..."</li>
            <li>Guarda como .kml (no .kmz)</li>
            <li>Sube el archivo aquí</li>
          </ol>
        </div>

        {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      </div>

      {parsed.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 max-w-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Parcelas detectadas</h3>
          <div className="space-y-2 mb-4">
            {parsed.map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2">
                <span className="font-medium text-gray-800">{p.nombre}</span>
                <span className="text-sm text-gray-500">{p.hectareas} ha</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleImport}
            disabled={loading || !selectedProyecto}
            className="w-full bg-agro-700 text-white py-2.5 rounded-lg font-semibold hover:bg-agro-800 disabled:bg-gray-300"
          >
            {loading ? 'Importando...' : `Importar ${parsed.length} Parcelas`}
          </button>
        </div>
      )}
    </div>
  );
}
