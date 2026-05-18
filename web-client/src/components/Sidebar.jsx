import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, Package, ShoppingCart, LogOut } from 'lucide-react';

export default function Sidebar() {
  const { logout, currentUser } = useAuth();

  const links = [
    { to: '/usuarios', icon: Users, label: 'Usuarios' },
    { to: '/productos', icon: Package, label: 'Productos' },
    { to: '/compras', icon: ShoppingCart, label: 'Compras' },
  ];

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col justify-between">
      <div>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-blue-400">TechStore 360</h1>
          <p className="text-sm text-slate-400 truncate mt-1">{currentUser?.email}</p>
        </div>
        <nav className="p-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`
              }
            >
              <link.icon size={20} />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
