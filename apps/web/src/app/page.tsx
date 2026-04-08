import {
  mockProyecto,
  mockGastosPorEtapa,
  mockBurnRateSemanal,
  mockAlmacen,
  mockCalendarioLunar,
  mockAlertas,
  getKPIs,
} from '@/lib/mock-data';

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

function AlertBadge({ nivel }: { nivel: string }) {
  const colors: Record<string, string> = {
    OK: 'bg-green-100 text-green-800',
    ALERTA: 'bg-yellow-100 text-yellow-800',
    CRITICO: 'bg-orange-100 text-orange-800',
    EXCEDIDO: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[nivel] ?? 'bg-gray-100'}`}>
      {nivel}
    </span>
  );
}

function FaseLunarIcon({ fase }: { fase: string }) {
  const icons: Record<string, string> = { nueva: '🌑', creciente: '🌓', llena: '🌕', menguante: '🌗' };
  return <span className="text-2xl">{icons[fase] ?? '🌙'}</span>;
}

export default function DashboardPage() {
  const kpis = getKPIs();
  const etapas = Object.entries(mockGastosPorEtapa) as [string, typeof mockGastosPorEtapa.PREPARACION][];

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🌽</span>
          <h1 className="text-2xl md:text-3xl font-bold text-agro-800">AgroControl</h1>
          <span className="bg-agro-100 text-agro-700 text-xs font-semibold px-2 py-1 rounded-full">
            {mockProyecto.temporada}
          </span>
        </div>
        <p className="text-gray-500 ml-11">{mockProyecto.nombre} &middot; {mockProyecto.hectareas_totales} ha</p>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard label="Costo / Hectárea" value={formatMoney(kpis.costoXHa)} sub={`Budget: ${formatMoney(mockProyecto.presupuesto_x_ha)}`} accent={kpis.costoXHa > mockProyecto.presupuesto_x_ha ? 'red' : 'green'} />
        <KPICard label="Costo / Tonelada" value={formatMoney(kpis.costoXTon)} sub="Est. 10 ton/ha" accent="green" />
        <KPICard label="% Ejercido" value={`${kpis.porcentajeEjercido}%`} sub={`${formatMoney(kpis.gastoTotal)} de ${formatMoney(kpis.presupuestoTotal)}`} accent={kpis.porcentajeEjercido > 80 ? 'red' : 'green'} />
        <KPICard label="Burn Rate Semanal" value={formatMoney(kpis.burnRateSemanal)} sub="Promedio últimas semanas" accent="blue" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Budget vs Ejercido */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Budget vs. Ejercido por Etapa</h2>
          <div className="space-y-4">
            {etapas.map(([key, data]) => {
              const pct = data.presupuestado > 0 ? Math.round((data.ejercido / data.presupuestado) * 100) : 0;
              const barColor = pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-orange-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-agro-500';
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{data.label}</span>
                    <span className="text-gray-500">{formatMoney(data.ejercido)} / {formatMoney(data.presupuestado)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className={`${barColor} h-4 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Burn Rate Semanal */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Burn Rate Semanal</h2>
          <div className="flex items-end gap-2 h-48">
            {mockBurnRateSemanal.map((s) => {
              const maxMonto = Math.max(...mockBurnRateSemanal.map((x) => x.monto));
              const heightPct = maxMonto > 0 ? (s.monto / maxMonto) * 100 : 0;
              return (
                <div key={s.semana} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-xs text-gray-600 mb-1">{formatMoney(s.monto)}</span>
                  <div
                    className="w-full bg-agro-400 rounded-t-md transition-all"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  />
                  <span className="text-[10px] text-gray-500 mt-1 text-center leading-tight">{s.semana.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 border-t pt-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-3 h-0.5 bg-red-400" />
              <span>Límite semanal: {formatMoney(kpis.presupuestoTotal / 26)}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* OPEX / CAPEX Donut */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Desglose OPEX / CAPEX</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3"
                  strokeDasharray={`${(135942 / 183800) * 100} ${100 - (135942 / 183800) * 100}`}
                  strokeDashoffset="25" strokeLinecap="round" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"
                  strokeDasharray={`${(2858 / 183800) * 100} ${100 - (2858 / 183800) * 100}`}
                  strokeDashoffset={`${25 - (135942 / 183800) * 100}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-gray-800">{formatMoney(183800)}</span>
                <span className="text-xs text-gray-500">Total</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-agro-500" />
                <div>
                  <p className="text-sm font-medium">OPEX</p>
                  <p className="text-xs text-gray-500">{formatMoney(135942)} (73.9%)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium">CAPEX</p>
                  <p className="text-xs text-gray-500">{formatMoney(2858)} (1.6%)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Almacén Virtual */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Almacén Virtual</h2>
          <div className="space-y-3">
            {mockAlmacen.map((item) => {
              const usoPct = Math.round(((item.cantidad_comprada - item.cantidad_disponible) / item.cantidad_comprada) * 100);
              return (
                <div key={item.id_item}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 truncate">{item.producto}</span>
                    <span className="text-gray-500 whitespace-nowrap ml-2">{item.cantidad_disponible}/{item.cantidad_comprada} {item.unidad_medida}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-earth-400 h-2 rounded-full" style={{ width: `${usoPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Alertas y Calendario Lunar */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Alertas & Fase Lunar</h2>
          <div className="space-y-3 mb-4">
            {mockAlertas.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate">{a.concepto}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{a.porcentaje}%</span>
                  <AlertBadge nivel={a.nivel} />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Calendario Lunar</h3>
            {mockCalendarioLunar.map((cl) => (
              <div key={cl.id} className="flex items-start gap-3 mb-3">
                <FaseLunarIcon fase={cl.fase_lunar} />
                <div>
                  <p className="text-sm font-medium text-gray-700">{cl.fecha} &middot; {cl.fase_lunar}</p>
                  {cl.recomendacion_siembra && (
                    <p className="text-xs text-gray-500">{cl.recomendacion_siembra}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="text-center text-xs text-gray-400 mt-8">
        AgroControl v0.0.1 &middot; Datos de demostración
      </footer>
    </main>
  );
}

function KPICard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: 'green' | 'red' | 'blue' }) {
  const accentColors = {
    green: 'border-agro-500 text-agro-700',
    red: 'border-red-500 text-red-700',
    blue: 'border-blue-500 text-blue-700',
  };
  return (
    <div className={`bg-white rounded-xl shadow p-4 border-l-4 ${accentColors[accent]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
