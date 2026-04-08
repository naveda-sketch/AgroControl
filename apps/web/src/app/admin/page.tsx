'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { loginWithPin, type SessionUser } from '@/lib/auth';

// Tabs
import { ProyectoForm } from './components/ProyectoForm';
import { ParcelaForm } from './components/ParcelaForm';
import { GastoForm } from './components/GastoForm';
import { InsumoForm } from './components/InsumoForm';
import { EquipoForm } from './components/EquipoForm';
import { KMLImport } from './components/KMLImport';
import { AuditLog } from './components/AuditLog';

const TABS = [
  { id: 'proyecto', label: 'Proyecto', icon: '📋' },
  { id: 'parcelas', label: 'Parcelas', icon: '🗺️' },
  { id: 'gastos', label: 'Gastos', icon: '💰' },
  { id: 'insumos', label: 'Almacén', icon: '📦' },
  { id: 'equipos', label: 'Equipos', icon: '🚜' },
  { id: 'kml', label: 'Google Earth', icon: '🌍' },
  { id: 'audit', label: 'Auditoría', icon: '🔒' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('proyecto');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const u = await loginWithPin(pin);
    setLoading(false);
    if (u) {
      setUser(u);
    } else {
      setError('PIN incorrecto o usuario inactivo');
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <span className="text-5xl">🌽</span>
            <h1 className="text-2xl font-bold text-agro-800 mt-2">AgroControl</h1>
            <p className="text-gray-500 text-sm mt-1">Panel de Administración</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN de acceso</label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border rounded-lg focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
                placeholder="••••••"
                autoFocus
              />
            </div>
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={pin.length !== 6 || loading}
              className="w-full bg-agro-700 text-white py-3 rounded-lg font-semibold hover:bg-agro-800 disabled:bg-gray-300 transition-colors"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-agro-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌽</span>
          <h1 className="font-bold">AgroControl Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-agro-200">
            {user.nombre} <span className="bg-agro-600 px-2 py-0.5 rounded text-xs">{user.rol}</span>
          </span>
          <button onClick={() => setUser(null)} className="text-sm text-agro-300 hover:text-white">
            Salir
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-48 bg-white shadow-sm min-h-[calc(100vh-52px)] p-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 flex items-center gap-2 transition-colors ${
                activeTab === tab.id ? 'bg-agro-50 text-agro-800 font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 p-6">
          {activeTab === 'proyecto' && <ProyectoForm user={user} />}
          {activeTab === 'parcelas' && <ParcelaForm user={user} />}
          {activeTab === 'gastos' && <GastoForm user={user} />}
          {activeTab === 'insumos' && <InsumoForm user={user} />}
          {activeTab === 'equipos' && <EquipoForm user={user} />}
          {activeTab === 'kml' && <KMLImport user={user} />}
          {activeTab === 'audit' && <AuditLog user={user} />}
        </div>
      </div>
    </main>
  );
}
