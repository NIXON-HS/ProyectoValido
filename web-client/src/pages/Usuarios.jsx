import React, { useEffect, useState } from 'react';
import api from '../api';
import { Trash2, Plus } from 'lucide-react';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsuarios() {
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsuarios();
  }, []);

  async function handleDelete(id) {
    if (window.confirm('¿Seguro de eliminar este usuario?')) {
      await api.delete(`/usuarios/${id}`);
      fetchUsuarios();
    }
  }

  if (loading) return <div className="text-slate-400">Cargando usuarios...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={20} /> Nuevo
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 text-slate-400 text-sm">
            <tr>
              <th className="p-4 font-medium">ID (Firebase UID)</th>
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Rol</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-slate-700/25 transition-colors">
                <td className="p-4 text-sm text-slate-500 truncate max-w-[150px]">{u.id}</td>
                <td className="p-4">{u.nombre || '-'}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-medium uppercase tracking-wider">
                    {u.rol}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios.length === 0 && <div className="p-8 text-center text-slate-500">No hay usuarios registrados</div>}
      </div>
    </div>
  );
}
