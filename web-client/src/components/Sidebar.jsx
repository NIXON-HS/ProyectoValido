import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Users, Package, ShoppingCart, LogOut } from 'lucide-react';

function getLinkClass(isLight, isActive) {
  if (isActive) {
    return isLight
      ? 'bg-sky-50 text-sky-700 border border-sky-200'
      : 'bg-sky-500/10 text-sky-300 border border-sky-500/20';
  }

  return isLight
    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
    <div className={`w-64 flex flex-col justify-between border-r ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'}`}>
      <div>
        <div className={`p-6 border-b ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <h1 className={`text-xl font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>TechStore 360</h1>
        </div>
        <nav className="p-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${getLinkClass(isLight, isActive)}`}
            >
              <link.icon size={20} />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className={`p-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
        <button
          onClick={() => logout()}
          className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all font-medium ${isLight ? 'text-rose-600 hover:bg-rose-50' : 'text-rose-400 hover:bg-rose-500/10'}`}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
