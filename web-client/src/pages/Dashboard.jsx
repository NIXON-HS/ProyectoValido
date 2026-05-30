/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, NavLink } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Sidebar';
import Usuarios from './Usuarios';
import Productos from './Productos';
import Compras from './Compras';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Users, Package, ShoppingCart, SunMedium, MoonStar,
  TrendingUp, Activity, DollarSign, ChevronRight,
} from 'lucide-react';

function formatUserLabel(currentUser) {
  const candidate = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuario';
  return candidate
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function getRouteMeta(pathname) {
  const n = pathname.replace(/\/+$/, '') || '/';
  if (n === '/usuarios')  return { label: 'Usuarios',  icon: Users };
  if (n === '/productos') return { label: 'Productos', icon: Package };
  if (n === '/compras')   return { label: 'Compras',   icon: ShoppingCart };
  return { label: 'Inicio', icon: Activity };
}

/* ── Theme Switch ── */
function ThemeSwitch({ isLight, toggleTheme }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      id="theme-switch-btn"
      className={`dashboard-theme-switch fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border
        px-3.5 py-2.5 text-sm font-semibold shadow-xl backdrop-blur-md transition-all hover:scale-[1.04]
        ${isLight
          ? 'border-slate-200 bg-white/90 text-slate-700 shadow-slate-200/60'
          : 'border-slate-700/80 bg-slate-900/85 text-slate-100 shadow-black/40'
        }`}
      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {isLight
        ? <MoonStar size={16} strokeWidth={1.8} />
        : <SunMedium size={16} strokeWidth={1.8} />
      }
      <span className="hidden sm:block">{isLight ? 'Oscuro' : 'Claro'}</span>
    </button>
  );
}

/* ── Stat Card ── */
function StatCard({ icon: Icon, label, value, sub, color, isLight, delay }) {
  const colors = {
    blue:  { bg: isLight ? 'bg-blue-50 border-blue-200/60'   : 'bg-blue-500/10 border-blue-500/20',  icon: isLight ? 'bg-blue-100 text-blue-600'  : 'bg-blue-500/15 text-blue-400',  val: isLight ? 'text-blue-700'  : 'text-blue-400'  },
    violet:{ bg: isLight ? 'bg-violet-50 border-violet-200/60': 'bg-violet-500/10 border-violet-500/20', icon: isLight ? 'bg-violet-100 text-violet-600': 'bg-violet-500/15 text-violet-400', val: isLight ? 'text-violet-700': 'text-violet-400' },
    emerald:{bg: isLight ? 'bg-emerald-50 border-emerald-200/60':'bg-emerald-500/10 border-emerald-500/20',icon: isLight ? 'bg-emerald-100 text-emerald-600':'bg-emerald-500/15 text-emerald-400',val: isLight ? 'text-emerald-700':'text-emerald-400'},
  };
  const c = colors[color] || colors.blue;
  return (
    <div
      className={`stat-card animate-slide-up rounded-2xl border p-5 transition-all hover:shadow-card-hover ${c.bg}`}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.icon}`}>
          <Icon size={20} strokeWidth={1.8} />
        </div>
        <TrendingUp size={14} className={isLight ? 'text-slate-300' : 'text-slate-700'} />
      </div>
      <p className={`mt-4 text-2xl font-black ${c.val}`}>{value}</p>
      <p className={`mt-1 text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{label}</p>
      {sub && <p className={`mt-0.5 text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{sub}</p>}
    </div>
  );
}

/* ── Quick Link ── */
function QuickLink({ to, icon: Icon, label, desc, isLight }) {
  return (
    <NavLink
      to={to}
      className={`group flex items-center gap-3 rounded-xl border p-4 transition-all hover:-translate-y-0.5
        ${isLight
          ? 'border-slate-200/80 bg-white hover:border-blue-200 hover:shadow-card'
          : 'border-slate-800 bg-slate-900/60 hover:border-blue-500/20 hover:shadow-glass-dark'
        }`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg
        ${isLight ? 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600' : 'bg-slate-800 text-slate-400 group-hover:bg-blue-500/15 group-hover:text-blue-400'}
        transition-colors`}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{label}</p>
        <p className={`text-xs truncate ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
      </div>
      <ChevronRight size={16} className={`shrink-0 transition-transform group-hover:translate-x-1 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
    </NavLink>
  );
}

/* ── Home Content ── */
function HomeContent({ isLight, userLabel }) {
  const [stats, setStats]     = useState({ usuarios: null, productos: null, compras: null });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usRes, prRes, coRes] = await Promise.allSettled([
          api.get('/usuarios'),
          api.get('/productos'),
          api.get('/compras'),
        ]);
        setStats({
          usuarios:  usRes.status === 'fulfilled' ? usRes.value.data.length  : '—',
          productos: prRes.status === 'fulfilled' ? prRes.value.data.length  : '—',
          compras:   coRes.status === 'fulfilled' ? coRes.value.data.length  : '—',
        });
      } catch (e) {
        console.error('Error cargando stats', e);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Welcome */}
      <div>
        <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isLight ? 'text-blue-500' : 'text-blue-400'}`}>
          Panel de Control
        </p>
        <h2 className={`mt-2 text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Hola, {userLabel} 👋
        </h2>
        <p className={`mt-2 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Bienvenido de vuelta. Aquí tienes un resumen del sistema.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users} label="Usuarios registrados" color="blue" isLight={isLight} delay="0.05s"
          value={loadingStats ? <span className="skeleton inline-block h-8 w-12 rounded" /> : stats.usuarios}
        />
        <StatCard
          icon={Package} label="Productos en catálogo" color="violet" isLight={isLight} delay="0.12s"
          value={loadingStats ? <span className="skeleton inline-block h-8 w-12 rounded" /> : stats.productos}
        />
        <StatCard
          icon={DollarSign} label="Compras realizadas" color="emerald" isLight={isLight} delay="0.19s"
          value={loadingStats ? <span className="skeleton inline-block h-8 w-12 rounded" /> : stats.compras}
        />
      </div>

      {/* Quick nav */}
      <div>
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-3 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
          Acceso rápido
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickLink to="/usuarios"  icon={Users}        label="Usuarios"  desc="Ver y gestionar usuarios"   isLight={isLight} />
          <QuickLink to="/productos" icon={Package}      label="Productos" desc="Administrar el catálogo"     isLight={isLight} />
          <QuickLink to="/compras"   icon={ShoppingCart} label="Compras"   desc="Historial de transacciones"  isLight={isLight} />
        </div>
      </div>
    </div>
  );
}

/* ── User Chip ── */
function UserChip({ label, email, isLight }) {
  const initials = label.split(' ').slice(0,2).map(w => w[0]?.toUpperCase() ?? '').join('');
  return (
    <div className={`hidden shrink-0 items-center gap-3 rounded-2xl border px-4 py-2.5 sm:flex
      ${isLight ? 'border-slate-200/80 bg-white shadow-sm' : 'border-slate-800 bg-slate-900/60'}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-md shadow-blue-500/25">
        {initials || '?'}
      </div>
      <div className="text-right">
        <p className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{label}</p>
        <p className={`text-[11px] truncate max-w-[140px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{email}</p>
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isLight, toggleTheme } = useTheme();
  const userLabel = formatUserLabel(currentUser);
  const routeMeta = getRouteMeta(location.pathname);
  const RouteIcon = routeMeta.icon;

  const shellBg = isLight
    ? 'bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_#dbeafe_0%,_#f0f4ff_60%,_#f8faff_100%)]'
    : 'bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_#0f1f4a_0%,_#080f28_60%,_#06091a_100%)]';

  return (
    <div className={`dashboard-shell flex h-screen flex-col lg:flex-row transition-colors duration-300 ${shellBg} ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      <Sidebar />

      <div className="dashboard-content flex-1 overflow-auto">
        {/* Topbar */}
        <div className={`dashboard-topbar sticky top-0 z-20 border-b backdrop-blur-xl
          ${isLight ? 'border-slate-200/60 bg-white/80' : 'border-slate-800/70 bg-slate-950/80'}`}>
          <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-4">
            <div className="min-w-0">
              {/* Breadcrumb */}
              <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]
                ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>Inicio</span>
                {location.pathname !== '/' && (
                  <>
                    <ChevronRight size={11} />
                    <span className={isLight ? 'text-blue-600' : 'text-blue-400'}>{routeMeta.label}</span>
                  </>
                )}
              </div>
              <h2 className={`mt-1 flex items-center gap-2 text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <RouteIcon size={22} strokeWidth={2} className={isLight ? 'text-blue-500' : 'text-blue-400'} />
                {routeMeta.label}
              </h2>
            </div>
            <UserChip label={userLabel} email={currentUser?.email} isLight={isLight} />
          </div>
        </div>

        {/* Page content */}
        <main className="dashboard-page px-4 pb-8 pt-6 sm:px-8 sm:pt-8">
          <Routes>
            <Route path="/"          element={<HomeContent isLight={isLight} userLabel={userLabel} />} />
            <Route path="/usuarios"  element={<Usuarios />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/compras"   element={<Compras />} />
          </Routes>
        </main>
      </div>

      <ThemeSwitch isLight={isLight} toggleTheme={toggleTheme} />
    </div>
  );
}
