'use client';

import { useState } from 'react';
import { loginWithPin, type SessionUser } from '@/lib/auth';
import {
  IconCorn, IconProject, IconParcela, IconBudget, IconGasto,
  IconAlmacen, IconEquipo, IconEarth, IconAudit, IconMenu, IconX, IconLogout,
  IconAlert, IconCalendar, IconBug,
} from '@/components/Icons';

import { ProyectoForm } from './components/ProyectoForm';
import { ParcelaForm } from './components/ParcelaForm';
import { PresupuestoForm } from './components/PresupuestoForm';
import { GastoForm } from './components/GastoForm';
import { InsumoForm } from './components/InsumoForm';
import { EquipoForm } from './components/EquipoForm';
import { KMLImport } from './components/KMLImport';
import { AlertasPanel } from './components/AlertasPanel';
import { CalendarioPanel } from './components/CalendarioPanel';
import { PlagasForm } from './components/PlagasForm';
import { AuditLog } from './components/AuditLog';

const TABS = [
  { id: 'proyecto', label: 'Proyecto', Icon: IconProject },
  { id: 'parcelas', label: 'Parcelas', Icon: IconParcela },
  { id: 'presupuesto', label: 'Presupuesto', Icon: IconBudget },
  { id: 'gastos', label: 'Gastos', Icon: IconGasto },
  { id: 'alertas', label: 'Alertas', Icon: IconAlert },
  { id: 'insumos', label: 'Almacén', Icon: IconAlmacen },
  { id: 'equipos', label: 'Equipos', Icon: IconEquipo },
  { id: 'plagas', label: 'Plagas', Icon: IconBug },
  { id: 'calendario', label: 'Calendario', Icon: IconCalendar },
  { id: 'kml', label: 'Google Earth', Icon: IconEarth },
  { id: 'audit', label: 'Auditoría', Icon: IconAudit },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('proyecto');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const u = await loginWithPin(pin);
    setLoading(false);
    if (u) setUser(u);
    else setError('PIN incorrecto o usuario inactivo');
  };

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    setMenuOpen(false);
  };

  // ── LOGIN ──
  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm border border-green-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IconCorn className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AgroControl</h1>
            <p className="text-gray-500 text-sm mt-1">Panel de Administración</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PIN de acceso</label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3.5 text-center text-2xl tracking-[0.5em] border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="······"
                autoFocus
              />
            </div>
            {error && <p className="text-red-600 text-sm text-center bg-red-50 rounded-lg py-2">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={pin.length !== 6 || loading}
              className="w-full bg-green-700 text-white py-3.5 rounded-xl font-semibold hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── ADMIN PANEL ──
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-green-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-1 -ml-1">
            {menuOpen ? <IconX className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
          </button>
          <IconCorn className="w-7 h-7 hidden sm:block" />
          <h1 className="font-bold text-lg">AgroControl</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user.nombre}</p>
            <p className="text-xs text-green-300">{user.rol}</p>
          </div>
          <span className="sm:hidden text-sm text-green-200">{user.nombre.split(' ')[0]}</span>
          <button onClick={() => setUser(null)} className="p-2 rounded-lg hover:bg-green-800 transition-colors" title="Cerrar sesión">
            <IconLogout className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar - Desktop */}
        <nav className="hidden lg:block w-56 bg-white shadow-sm min-h-[calc(100vh-52px)] p-3 border-r border-gray-100">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-3 mb-2 mt-1">Menú</p>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-0.5 flex items-center gap-3 transition-colors ${
                activeTab === tab.id ? 'bg-green-50 text-green-800 font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.Icon className={`w-[18px] h-[18px] ${activeTab === tab.id ? 'text-green-700' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Mobile drawer overlay */}
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <nav className="relative w-72 bg-white shadow-2xl min-h-screen p-4 pt-2 z-40 animate-[slideIn_0.2s_ease-out]">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-3 mb-3 mt-2">Menú</p>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-base mb-1 flex items-center gap-3 transition-colors ${
                    activeTab === tab.id ? 'bg-green-50 text-green-800 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-green-700' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-4xl">
          {activeTab === 'proyecto' && <ProyectoForm user={user} />}
          {activeTab === 'parcelas' && <ParcelaForm user={user} />}
          {activeTab === 'presupuesto' && <PresupuestoForm user={user} />}
          {activeTab === 'gastos' && <GastoForm user={user} />}
          {activeTab === 'alertas' && <AlertasPanel user={user} />}
          {activeTab === 'insumos' && <InsumoForm user={user} />}
          {activeTab === 'equipos' && <EquipoForm user={user} />}
          {activeTab === 'plagas' && <PlagasForm user={user} />}
          {activeTab === 'calendario' && <CalendarioPanel user={user} />}
          {activeTab === 'kml' && <KMLImport user={user} />}
          {activeTab === 'audit' && <AuditLog user={user} />}
        </div>
      </div>
    </main>
  );
}
