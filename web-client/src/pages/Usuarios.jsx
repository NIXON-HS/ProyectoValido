import React, { useEffect, useState } from 'react';
import api from '../api';
import { Trash2, Plus, Pencil, X, Save, User } from 'lucide-react';

const ROLES = ['admin', 'cliente'];

const emptyForm = { nombre: '', email: '', rol: 'cliente', password: '' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = crear, obj = editar
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => { fetchUsuarios(); }, []);

  function openCreate() {
    setEditingUser(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(u) {
    setEditingUser(u);
    setForm({ nombre: u.nombre || '', email: u.email, rol: u.rol, password: '' });
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.email.trim()) {
      setError('Nombre y correo son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingUser) {
        // EDITAR — solo actualizamos los campos (no el id)
        await api.post('/usuarios', {
          id: editingUser.id,
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
        });
      } else {
        // CREAR — necesitamos un ID único (usamos timestamp como stub)
        const newId = `manual-${Date.now()}`;
        await api.post('/usuarios', {
          id: newId,
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
        });
      }
      closeModal();
      fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el usuario.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm('¿Seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await api.delete(`/usuarios/${id}`);
        fetchUsuarios();
      } catch (err) {
        alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
      }
    }
  }

  const rolColor = (rol) =>
    rol === 'admin'
      ? 'bg-purple-500/10 text-purple-400'
      : 'bg-blue-500/10 text-blue-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
          <p className="text-slate-400 text-sm mt-1">{usuarios.length} usuario(s) registrado(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/25"
        >
          <Plus size={20} /> Nuevo Usuario
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Cargando usuarios...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-400 text-sm">
              <tr>
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Rol</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-slate-700/25 transition-colors">
                  <td className="p-4 text-xs text-slate-500 truncate max-w-[120px] font-mono">{u.id}</td>
                  <td className="p-4 text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                        <User size={14} />
                      </div>
                      {u.nombre || <span className="text-slate-500 italic">Sin nombre</span>}
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${rolColor(u.rol)}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-colors inline-flex"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors inline-flex"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && usuarios.length === 0 && (
          <div className="p-8 text-center text-slate-500">No hay usuarios registrados</div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-600 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="Alex Maguert"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  disabled={!!editingUser}
                  className="w-full bg-slate-900/60 border border-slate-600 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="usuario@techstore.com"
                />
                {editingUser && <p className="text-xs text-slate-500 mt-1">El email no se puede modificar.</p>}
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-1">Rol</label>
                <select
                  value={form.rol}
                  onChange={e => setForm({ ...form, rol: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-600 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 py-2.5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
