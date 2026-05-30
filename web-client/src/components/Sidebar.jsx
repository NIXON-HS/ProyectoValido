import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Users, Package, ShoppingCart, LogOut, Zap, Home } from 'lucide-react';

const links = [
  { to: '/',          icon: Home,          label: 'Inicio',    desc: 'Panel de control' },
  { to: '/usuarios',  icon: Users,         label: 'Usuarios',  desc: 'Gestión de cuentas' },
  { to: '/productos', icon: Package,       label: 'Productos', desc: 'Catálogo del sistema' },
  { to: '/compras',   icon: ShoppingCart,  label: 'Compras',   desc: 'Historial de ventas' },
];

function UserAvatar({ label, isLight }) {
  const initials = label
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold tracking-wide
      ${isLight
        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30'
        : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-900/40'
      }`}
    >
      {initials || '?'}
    </div>
  );
}

export default function Sidebar() {
  const { logout, currentUser } = useAuth();
  const { isLight } = useTheme();

  const displayName = currentUser?.displayName
    || currentUser?.email?.split('@')[0]
    || 'Usuario';

  const bg = isLight
    ? 'bg-white border-slate-200/80 shadow-[4px_0_24px_rgba(15,23,42,0.06)]'
    : 'bg-slate-950 border-slate-800 shadow-[4px_0_24px_rgba(0,0,0,0.4)]';

  return (
    <div className={`sidebar-shell w-full flex flex-col justify-between border-r lg:w-64 ${bg}`}>
      {/* ── Brand ── */}
      <div>
        <div className={`flex items-center gap-3 px-5 py-5 border-b ${isLight ? 'border-slate-200/80' : 'border-slate-800'}`}>
          <div className="brand-mark flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
            <Zap size={17} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className={`text-base font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              TechStore 360
            </h1>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] mt-0.5 ${isLight ? 'text-blue-500' : 'text-blue-400'}`}>
              Admin Panel
            </p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="grid grid-cols-3 gap-1.5 p-3 sm:flex sm:flex-col sm:gap-1 sm:p-4">
          <p className={`hidden sm:block text-[10px] font-semibold uppercase tracking-[0.18em] px-3 mb-2 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
            Navegación
          </p>
          {links.map(({ to, icon: Icon, label, desc }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `sidebar-nav-link flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-xs font-medium
                transition-all sm:justify-start sm:px-3.5 sm:py-2.5 sm:text-sm
                ${isActive
                  ? isLight
                    ? 'active bg-blue-50 text-blue-700 border border-blue-200/80 shadow-sm'
                    : 'active bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                    ${isActive
                      ? isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/15 text-blue-400'
                      : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
                    }`}>
                    <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  <span className="hidden sm:block font-semibold">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Footer: User + Logout ── */}
      <div className={`p-3 sm:p-4 border-t space-y-2 ${isLight ? 'border-slate-200/80' : 'border-slate-800'}`}>
        <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5
          ${isLight ? 'bg-slate-50 border border-slate-200/80' : 'bg-slate-900 border border-slate-800'}`}>
          <UserAvatar label={displayName} isLight={isLight} />
          <div className="min-w-0 hidden sm:block">
            <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {displayName}
            </p>
            <p className={`text-[11px] truncate ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              {currentUser?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium
            transition-all sm:justify-start
            ${isLight
              ? 'text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent'
              : 'text-rose-400 hover:bg-rose-500/10 border border-transparent'
            }`}
        >
          <LogOut size={16} strokeWidth={1.8} />
          <span className="hidden sm:block">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
