'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/lib/auth';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const FASE_COLORS: Record<string, { dot: string; bg: string; label: string }> = {
  nueva: { dot: 'bg-gray-800', bg: 'bg-gray-50', label: 'Luna Nueva' },
  creciente: { dot: 'bg-amber-400', bg: 'bg-amber-50', label: 'Luna Creciente' },
  llena: { dot: 'bg-amber-200 border border-amber-300', bg: 'bg-yellow-50', label: 'Luna Llena' },
  menguante: { dot: 'bg-gray-400', bg: 'bg-slate-50', label: 'Luna Menguante' },
};

export function CalendarioPanel({ user }: { user: SessionUser }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [dias, setDias] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadMes(); }, [year, month]);

  async function loadMes() {
    setLoading(true);
    setSelectedDay(null);
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDate = new Date(year, month + 1, 0);
    const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;

    const { data } = await supabase
      .from('calendario_lunar')
      .select('*')
      .gte('fecha', firstDay)
      .lte('fecha', lastDay)
      .order('fecha');
    setDias(data ?? []);
    setLoading(false);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const startDow = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const diaMap = new Map(dias.map((d) => [d.fecha, d]));

  const cells: (any | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push(diaMap.get(dateStr) ?? { fecha: dateStr, fase_lunar: null });
  }

  const todayStr = now.toISOString().split('T')[0];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Calendario Lunar</h2>
      <p className="text-sm text-gray-500 mb-6">Fases lunares calculadas astronómicamente con recomendaciones para siembra y cosecha de maíz.</p>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4 max-w-lg">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-800">{MESES[month]} {year}</h3>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {Object.entries(FASE_COLORS).map(([fase, style]) => (
          <div key={fase} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className={`w-3 h-3 rounded-full ${style.dot}`} />
            <span>{style.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-lg">
        <div className="grid grid-cols-7">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2 bg-gray-50 border-b">{d}</div>
          ))}
          {cells.map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} className="border-b border-r border-gray-50 p-1 min-h-[52px]" />;
            const day = parseInt(cell.fecha.split('-')[2], 10);
            const fase = cell.fase_lunar;
            const style = fase ? FASE_COLORS[fase] : null;
            const isToday = cell.fecha === todayStr;
            const isSelected = selectedDay?.fecha === cell.fecha;

            return (
              <button
                key={cell.fecha}
                onClick={() => fase && setSelectedDay(cell)}
                className={`border-b border-r border-gray-50 p-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 transition-colors
                  ${isSelected ? 'bg-green-100 ring-2 ring-green-400' : style?.bg ?? 'bg-white'}
                  ${isToday ? 'ring-1 ring-green-500' : ''}
                  ${fase ? 'hover:bg-green-50 cursor-pointer' : 'opacity-40'}
                `}
              >
                <span className={`text-sm ${isToday ? 'font-bold text-green-700' : 'text-gray-700'}`}>{day}</span>
                {style && <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && selectedDay.fase_lunar && (
        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-5 max-w-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-5 h-5 rounded-full ${FASE_COLORS[selectedDay.fase_lunar]?.dot}`} />
            <div>
              <p className="font-semibold text-gray-800">{selectedDay.fecha}</p>
              <p className="text-sm text-gray-500 capitalize">{FASE_COLORS[selectedDay.fase_lunar]?.label}</p>
            </div>
          </div>
          {selectedDay.recomendacion_siembra && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Siembra</p>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedDay.recomendacion_siembra}</p>
            </div>
          )}
          {selectedDay.recomendacion_cosecha && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cosecha</p>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedDay.recomendacion_cosecha}</p>
            </div>
          )}
        </div>
      )}

      {loading && <p className="text-gray-400 text-center py-8">Cargando calendario...</p>}

      {!loading && dias.length === 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-lg">
          <p className="text-sm text-amber-800">No hay datos lunares para este mes. El calendario cubre 2026-2027. Contacta al administrador para ampliar el rango.</p>
        </div>
      )}
    </div>
  );
}
