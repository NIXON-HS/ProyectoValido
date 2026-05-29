import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Users, Package, ShoppingCart, LogOut, Store, Sparkles } from 'lucide-react';

function getLinkClass(isLight, isActive) {
  if (isActive) {
    return isLight
      ? 'dashboard-nav-link bg-sky-100 text-sky-800 border border-sky-300 shadow-sm shadow-sky-200/70'
      : 'bg-sky-500/10 text-sky-300 border border-sky-500/20';
  }

  return isLight
    ? 'dashboard-nav-link text-slate-700 border border-transparent hover:bg-sky-50 hover:border-sky-200 hover:text-slate-900'
    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100';
}

export default function Sidebar() {
  const { logout } = useAuth();
  const { isLight } = useTheme();

  const links = [
    { to: '/usuarios', icon: Users, label: 'Usuarios' },
    { to: '/productos', icon: Package, label: 'Productos' },
    { to: '/compras', icon: ShoppingCart, label: 'Compras' },
  ];

  return (
    <div className={`sidebar-shell w-full flex flex-col justify-between border-r lg:w-64 ${isLight ? 'bg-gradient-to-b from-sky-100 via-sky-50 to-white border-sky-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'}`}>
      <div>
        <div className={`p-4 sm:p-6 border-b ${isLight ? 'border-sky-200' : 'border-slate-700'}`}>
          <div className="flex items-center gap-3">
            <div className={`brand-mark flex h-10 w-10 items-center justify-center rounded-xl border ${isLight ? 'border-sky-300 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-300/60' : 'border-slate-700 bg-slate-800 text-sky-300'}`}>
              <Store size={18} />
            </div>
            <div>
              <h1 className={`text-xl font-bold leading-tight ${isLight ? 'text-sky-800' : 'text-sky-400'}`}>TechStore 360</h1>
              <p className={`mt-0.5 text-[11px] uppercase tracking-[0.22em] flex items-center gap-1 ${isLight ? 'text-sky-600' : 'text-slate-400'}`}>
                <Sparkles size={12} />
                Admin panel
              </p>
            </div>
          </div>
        </div>
        <nav className="grid grid-cols-3 gap-2 p-3 sm:flex sm:flex-col sm:space-y-2 sm:gap-0 sm:p-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs transition-all sm:justify-start sm:gap-3 sm:px-4 sm:py-3 sm:text-base ${getLinkClass(isLight, isActive)}`}
            >
              <link.icon size={20} />
              <span className="font-medium leading-tight text-center sm:text-left">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className={`p-3 sm:p-4 border-t ${isLight ? 'border-sky-100' : 'border-slate-700'}`}>
        <button
          onClick={() => logout()}
          className={`flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 font-medium transition-all sm:justify-start ${isLight ? 'text-rose-600 hover:bg-rose-50' : 'text-rose-400 hover:bg-rose-500/10'}`}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
