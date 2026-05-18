import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Usuarios from './Usuarios';
import Productos from './Productos';
import Compras from './Compras';

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <Routes>
          <Route path="/" element={
            <div>
              <h2 className="text-3xl font-bold mb-4">Bienvenido al Panel de Control</h2>
              <p className="text-slate-400">Selecciona una opción del menú lateral para comenzar.</p>
            </div>
          } />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/compras" element={<Compras />} />
        </Routes>
      </div>
    </div>
  );
}
