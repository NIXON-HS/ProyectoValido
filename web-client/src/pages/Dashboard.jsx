/* eslint-disable react/prop-types */
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Usuarios from './Usuarios';
import Productos from './Productos';
import Compras from './Compras';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Home, MoonStar, SunMedium, UserCircle2 } from 'lucide-react';

function formatUserLabel(currentUser) {
  const candidate = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuario';
  return candidate
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getRouteMeta(pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/usuarios') return { label: 'Usuarios', path: 'Inicio / Usuarios' };
  if (normalized === '/productos') return { label: 'Productos', path: 'Inicio / Productos' };
  if (normalized === '/compras') return { label: 'Compras', path: 'Inicio / Compras' };
  return { label: 'Inicio', path: 'Inicio' };
}

function ThemeSwitch({ isLight, toggleTheme }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`dashboard-theme-switch fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-md transition-all hover:scale-[1.02] ${isLight ? 'border-sky-300 bg-white/90 text-sky-900 shadow-sky-200/70' : 'border-slate-700 bg-slate-900/85 text-slate-100'}`}
      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {isLight ? <MoonStar size={18} /> : <SunMedium size={18} />}
      <span>{isLight ? 'Modo claro' : 'Modo oscuro'}</span>
    </button>
  );
}

function HomeContent({ isLight }) {
  return (
    <div>
      <h2 className={`text-3xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Bienvenido al Panel de Control</h2>
      <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>Selecciona una opción del menú lateral para comenzar.</p>
    </div>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isLight, toggleTheme } = useTheme();
  const userLabel = formatUserLabel(currentUser);
  const routeMeta = getRouteMeta(location.pathname);

  return (
    <div className={`dashboard-shell flex h-screen flex-col lg:flex-row transition-colors duration-300 ${isLight ? 'bg-[radial-gradient(circle_at_top,_#bfdbfe_0%,_#e0efff_34%,_#f3f8ff_100%)] text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <Sidebar />
      <div className="dashboard-content flex-1 overflow-auto">
        <div className={`dashboard-topbar sticky top-0 z-20 border-b backdrop-blur-xl ${isLight ? 'border-sky-200 bg-sky-50/90' : 'border-slate-800 bg-slate-950/80'}`}>
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
            <div className="min-w-0">
              <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] ${isLight ? 'text-sky-700' : 'text-slate-400'}`}>
                <Home size={14} />
                <span>{routeMeta.path}</span>
              </div>
              <h2 className={`mt-2 text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{routeMeta.label}</h2>
            </div>
            <div className={`hidden shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 sm:flex ${isLight ? 'border-sky-200 bg-white/90 shadow-sm shadow-sky-200/40' : 'border-slate-700 bg-slate-900/60'}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/10 text-sky-300'}`}>
                <UserCircle2 size={22} />
              </div>
              <div className="text-right">
                <div className={`text-xs uppercase tracking-[0.24em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Usuario</div>
                <div className={`mt-1 font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{userLabel}</div>
              </div>
            </div>
          </div>
        </div>
        <main className="dashboard-page px-4 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-10">
          <Routes>
            <Route path="/" element={<HomeContent isLight={isLight} />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/compras" element={<Compras />} />
          </Routes>
        </main>
      </div>
      <ThemeSwitch isLight={isLight} toggleTheme={toggleTheme} />
    </div>
  );
}
