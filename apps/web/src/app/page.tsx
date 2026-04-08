import {
  getProyectoActivo,
  getResumenProyecto,
  getGastosPorEtapaTipo,
  getAlmacen,
  getAlertas,
  getCalendarioLunar,
  getBurnRateSemanal,
  getOpexCapex,
} from '@/lib/queries';
import { Tooltip } from '@/components/Tooltip';

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

function AlertBadge({ nivel }: { nivel: string }) {
  const colors: Record<string, string> = {
    OK: 'bg-green-100 text-green-800',
    ALERTA: 'bg-amber-100 text-amber-800',
    CRITICO: 'bg-orange-100 text-orange-800',
    EXCEDIDO: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[nivel] ?? 'bg-gray-100'}`}>
      {nivel}
    </span>
  );
}

function LunarDot({ fase }: { fase: string }) {
  const colors: Record<string, string> = {
    nueva: 'bg-gray-800',
    creciente: 'bg-amber-400',
    llena: 'bg-amber-200 border border-amber-300',
    menguante: 'bg-gray-400',
  };
  return <div className={`w-3 h-3 rounded-full ${colors[fase] ?? 'bg-gray-300'} shrink-0 mt-0.5`} />;
}

export const revalidate = 60;

export default async function DashboardPage() {
  const proyecto = await getProyectoActivo();

  if (!proyecto) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C9 2 7 5 7 9c0 3 1.5 5 5 5s5-2 5-5c0-4-2-7-5-7z" fill="#F59E0B" stroke="#D97706" /><path d="M12 14v8M9 17l3-3 3 3" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">No hay proyecto activo</h1>
          <p className="text-gray-500 mt-2">Crea un proyecto en <a href="/admin" className="text-green-700 underline">/admin</a> para comenzar</p>
        </div>
      </main>
    );
  }

  const [resumen, gastosPorEtapa, almacen, alertas, calendario, burnRate, opexCapex] = await Promise.all([
    getResumenProyecto(proyecto.id_proyecto),
    getGastosPorEtapaTipo(proyecto.id_proyecto),
    getAlmacen(proyecto.id_proyecto),
    getAlertas(proyecto.id_proyecto),
    getCalendarioLunar(),
    getBurnRateSemanal(proyecto.id_proyecto),
    getOpexCapex(proyecto.id_proyecto),
  ]);

  const presupuestoTotal = Number(proyecto.presupuesto_x_ha) * Number(proyecto.hectareas_totales);
  const gastoTotal = resumen?.gasto_total ? Number(resumen.gasto_total) : 0;
  const costoXHa = resumen?.costo_x_hectarea ? Number(resumen.costo_x_hectarea) : 0;
  const porcentajeEjercido = resumen?.porcentaje_ejercido ? Number(resumen.porcentaje_ejercido) : 0;
  const toneladasEstimadas = Number(proyecto.hectareas_totales) * 10;
  const costoXTon = toneladasEstimadas > 0 ? Math.round((gastoTotal / toneladasEstimadas) * 100) / 100 : 0;
  const burnRateAvg = burnRate.length > 0
    ? Math.round(burnRate.reduce((s: number, b: { monto: number }) => s + b.monto, 0) / burnRate.length)
    : 0;

  const etapas = Object.entries(gastosPorEtapa || {}) as [string, { presupuestado: number; ejercido: number; label: string }][];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C9 2 7 5 7 9c0 3 1.5 5 5 5s5-2 5-5c0-4-2-7-5-7z" fill="#F59E0B" stroke="#D97706" /><path d="M12 14v8M9 17l3-3 3 3" /></svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">AgroControl</h1>
              <span className="bg-green-100 text-green-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">{proyecto.temporada}</span>
              <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">EN VIVO</span>
            </div>
            <p className="text-sm text-gray-500">{proyecto.nombre} &middot; {proyecto.hectareas_totales} ha</p>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <KPICard
            label="Costo / Hectárea"
            tooltip="Gasto total acumulado dividido entre el número de hectáreas del proyecto. Compáralo con el budget para saber si vas dentro del presupuesto."
            value={formatMoney(costoXHa)}
            sub={`Budget: ${formatMoney(Number(proyecto.presupuesto_x_ha))}`}
            accent={costoXHa > Number(proyecto.presupuesto_x_ha) ? 'red' : 'green'}
          />
          <KPICard
            label="Costo / Tonelada"
            tooltip="Gasto total dividido entre las toneladas estimadas de producción (10 ton/ha). Indica cuánto te cuesta producir cada tonelada de maíz."
            value={formatMoney(costoXTon)}
            sub="Est. 10 ton/ha"
            accent="green"
          />
          <KPICard
            label="% Ejercido"
            tooltip="Porcentaje del presupuesto total que ya se ha gastado. Alertas automáticas al 80%, 90% y 100%."
            value={`${porcentajeEjercido}%`}
            sub={`${formatMoney(gastoTotal)} de ${formatMoney(presupuestoTotal)}`}
            accent={porcentajeEjercido > 80 ? 'red' : 'green'}
          />
          <KPICard
            label="Burn Rate"
            tooltip="Burn Rate Semanal: Promedio de gasto por semana. Te indica la velocidad a la que se consume el presupuesto. Si es muy alto, podrías quedarte sin recursos antes de terminar."
            value={formatMoney(burnRateAvg)}
            sub="Promedio semanal"
            accent="blue"
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Budget vs Ejercido */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-1">
              Budget vs. Ejercido
              <Tooltip text="Budget (Presupuesto): Es el monto planeado para cada etapa del cultivo. Ejercido: Es lo que realmente se ha gastado. La barra muestra qué porcentaje del presupuesto ya se usó." />
            </h2>
            <div className="space-y-4">
              {etapas.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Crea parcelas y etapas para ver el desglose</p>}
              {etapas.map(([key, data]) => {
                const pct = data.presupuestado > 0 ? Math.round((data.ejercido / data.presupuestado) * 100) : 0;
                const barColor = pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-orange-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500';
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{data.label}</span>
                      <span className="text-gray-500 text-xs md:text-sm">{formatMoney(data.ejercido)} / {formatMoney(data.presupuestado)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className={`${barColor} h-3 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Burn Rate Semanal */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-1">
              Burn Rate Semanal
              <Tooltip text="Muestra cuánto se gastó cada semana. Sirve para identificar picos de gasto y controlar el ritmo de consumo del presupuesto." />
            </h2>
            {burnRate.length > 0 ? (
              <div className="flex items-end gap-2 h-48">
                {burnRate.map((s: { semana: string; monto: number }) => {
                  const maxMonto = Math.max(...burnRate.map((x: { monto: number }) => x.monto));
                  const heightPct = maxMonto > 0 ? (s.monto / maxMonto) * 100 : 0;
                  return (
                    <div key={s.semana} className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="text-[10px] md:text-xs text-gray-600 mb-1">{formatMoney(s.monto)}</span>
                      <div className="w-full bg-green-400 rounded-t-md transition-all" style={{ height: `${Math.max(heightPct, 2)}%` }} />
                      <span className="text-[9px] md:text-[10px] text-gray-500 mt-1 text-center">{s.semana}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-16 text-sm">Sin datos de gastos aún</p>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* OPEX / CAPEX */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-1">
              OPEX / CAPEX
              <Tooltip text="OPEX (Gasto Operativo): Gastos de consumo inmediato como diésel, semilla, jornales, fertilizantes. CAPEX (Gasto de Capital): Uso de activos depreciables como tractores e implementos. Se registra el costo por hora de uso, no el valor total del equipo." />
            </h2>
            <div className="flex items-center justify-center gap-6">
              <div className="relative w-28 h-28 md:w-32 md:h-32">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                  {opexCapex.total > 0 && (
                    <>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3"
                        strokeDasharray={`${(opexCapex.opex / opexCapex.total) * 100} ${100 - (opexCapex.opex / opexCapex.total) * 100}`}
                        strokeDashoffset="25" strokeLinecap="round" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"
                        strokeDasharray={`${(opexCapex.capex / opexCapex.total) * 100} ${100 - (opexCapex.capex / opexCapex.total) * 100}`}
                        strokeDashoffset={`${25 - (opexCapex.opex / opexCapex.total) * 100}`} strokeLinecap="round" />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm md:text-lg font-bold text-gray-800">{formatMoney(opexCapex.total)}</span>
                  <span className="text-[10px] text-gray-500">Total</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">OPEX</p>
                    <p className="text-xs text-gray-500">{formatMoney(opexCapex.opex)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">CAPEX</p>
                    <p className="text-xs text-gray-500">{formatMoney(opexCapex.capex)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Almacén Virtual */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-1">
              Almacén Virtual
              <Tooltip text="Inventario de insumos comprados. La barra muestra qué porcentaje ya se aplicó en campo. Comprar no genera gasto; el costo se registra al momento de la aplicación." />
            </h2>
            <div className="space-y-3">
              {almacen.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin insumos registrados</p>}
              {almacen.map((item: { id_item: string; producto: string; cantidad_comprada: number; cantidad_disponible: number; unidad_medida: string }) => {
                const usoPct = Math.round(((Number(item.cantidad_comprada) - Number(item.cantidad_disponible)) / Number(item.cantidad_comprada)) * 100);
                return (
                  <div key={item.id_item}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 truncate">{item.producto}</span>
                      <span className="text-gray-500 whitespace-nowrap ml-2">{item.cantidad_disponible}/{item.cantidad_comprada} {item.unidad_medida}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${usoPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Alertas y Calendario Lunar */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">Alertas</h2>
            <div className="space-y-2.5 mb-4">
              {alertas.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Sin alertas</p>}
              {alertas.slice(0, 5).map((a: { etapa_tipo: string; concepto: string; porcentaje: number; nivel_alerta: string }, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate text-xs">{a.concepto}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-gray-500 text-xs">{a.porcentaje}%</span>
                    <AlertBadge nivel={a.nivel_alerta} />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Calendario Lunar</h3>
              {calendario.length > 0 ? calendario.map((cl: { id: number; fecha: string; fase_lunar: string; recomendacion_siembra: string | null }) => (
                <div key={cl.id} className="flex items-start gap-2.5 mb-2.5">
                  <LunarDot fase={cl.fase_lunar} />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{cl.fecha} &middot; <span className="capitalize">{cl.fase_lunar}</span></p>
                    {cl.recomendacion_siembra && (
                      <p className="text-[11px] text-gray-500 leading-snug">{cl.recomendacion_siembra}</p>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-400">Sin datos lunares próximos</p>
              )}
            </div>
          </section>
        </div>

        <footer className="text-center text-xs text-gray-400 pb-4">
          AgroControl v0.1.0 &middot; Conectado a Supabase
        </footer>
      </div>
    </main>
  );
}

function KPICard({ label, value, sub, accent, tooltip }: { label: string; value: string; sub: string; accent: 'green' | 'red' | 'blue'; tooltip: string }) {
  const accentColors = {
    green: 'border-l-green-500',
    red: 'border-l-red-500',
    blue: 'border-l-blue-500',
  };
  const valueColors = {
    green: 'text-green-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
  };
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4 border-l-4 ${accentColors[accent]}`}>
      <p className="text-xs md:text-sm text-gray-500 flex items-center gap-0.5">
        {label}
        <Tooltip text={tooltip} />
      </p>
      <p className={`text-lg md:text-2xl font-bold mt-1 ${valueColors[accent]}`}>{value}</p>
      <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
