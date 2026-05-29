/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import { Trash2, Pencil, X, Save } from 'lucide-react';
import { UserPlusIcon, UserCircleIcon, EnvelopeIcon, ShieldCheckIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const ROLES = ['admin', 'cliente'];

const emptyForm = { nombre: '', email: '', rol: 'cliente', password: '' };

function getFilteredUsuarios(usuarios, roleFilter) {
  if (roleFilter === 'all') return usuarios;
  return usuarios.filter((usuario) => usuario.rol === roleFilter);
}

function getRoleBadgeClass(isLight, rol) {
  if (rol === 'admin') {
    return isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/10 text-sky-300';
  }

  return isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-700/60 text-slate-200';
}

function getInputClass(isLight) {
  return isLight
    ? 'bg-sky-50/70 border-sky-100 text-slate-900 placeholder:text-slate-500 focus:ring-sky-500/30'
    : 'bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50';
}

function UsersToolbar({ isLight, mutedClass, filteredCount, totalCount, roleFilter, setRoleFilter, onOpenCreate }) {
  const roleSelectClass = isLight
    ? 'bg-sky-50/70 border-sky-100 text-slate-900 focus:ring-sky-500/25'
    : 'bg-slate-900/70 border-slate-700 text-white focus:ring-sky-400/30';

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className={`text-2xl font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          <UserPlusIcon className={isLight ? 'h-6 w-6 text-sky-700' : 'h-6 w-6 text-sky-300'} />
          Gestión de Usuarios
        </h2>
        <p className={`text-sm mt-1 ${mutedClass}`}>{filteredCount} usuario(s) visible(s) de {totalCount} registrado(s)</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <FunnelIcon className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isLight ? 'text-sky-700' : 'text-slate-400'}`} />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className={`rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:ring-4 ${roleSelectClass}`}
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-5 py-2.5 text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/30"
        >
          <UserPlusIcon className="h-5 w-5" /> Nuevo Usuario
        </button>
      </div>
    </div>
  );
}

function UsersTable({ isLight, loading, mutedClass, tableHeaderClass, rowHoverClass, filteredUsuarios, onOpenEdit, onDelete }) {
  const shellClass = isLight ? 'bg-gradient-to-br from-sky-50 via-white to-cyan-50 border-sky-100' : 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700';

  return (
    <div className={`rounded-3xl border overflow-hidden shadow-sm ${shellClass}`}>
      {loading ? (
        <div className={`p-8 text-center ${mutedClass}`}>Cargando usuarios...</div>
      ) : (
        <table className="w-full text-left">
          <thead className={`text-sm ${tableHeaderClass}`}>
            <tr>
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Rol</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className={isLight ? 'divide-y divide-slate-200' : 'divide-y divide-slate-700/50'}>
            {filteredUsuarios.map((user) => (
              <tr key={user.id} className={`${rowHoverClass} transition-colors`}>
                <td className={`p-4 text-xs truncate max-w-[120px] font-mono ${mutedClass}`}>{user.id}</td>
                <td className={isLight ? 'p-4 text-slate-900' : 'p-4 text-white'}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-sky-500">
                      <UserCircleIcon className="h-4 w-4" />
                    </div>
                    {user.nombre || <span className="italic text-slate-500">Sin nombre</span>}
                  </div>
                </td>
                <td className={`p-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getRoleBadgeClass(isLight, user.rol)}`}>
                    {user.rol}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => onOpenEdit(user)}
                    className="text-sky-500 hover:bg-sky-500/10 p-2 rounded-lg transition-colors inline-flex"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
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
    </div>
  );
}

function UsersModal({ isLight, mutedClass, modalOpen, editingUser, error, onClose, onSave, saving, form, setForm, inputClass }) {
  if (!modalOpen) return null;
  if (typeof document === 'undefined') return null;
  const portalTarget = document.body;

  const roleSelectClass = isLight
    ? 'bg-white border-slate-200 text-slate-900 focus:ring-sky-500/25'
    : 'bg-slate-900/70 border-slate-700 text-white focus:ring-sky-400/30';
  const modalButtonNeutralClass = isLight
    ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
    : 'border-slate-700 text-slate-300 hover:bg-slate-800';

  const modalContent = (
    <div className="fixed inset-0 z-[200]">
      <button
        type="button"
        aria-label="Cerrar formulario"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-[81] h-full overflow-y-auto p-6">
        <div
          className={`mx-auto my-6 overflow-hidden rounded-[24px] border shadow-[0_36px_120px_rgba(2,6,23,0.45)] ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`}
          style={{ width: 'min(760px, 92vw)' }}
        >
          <div className={`h-2 ${isLight ? 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500' : 'bg-gradient-to-r from-sky-500 via-blue-400 to-indigo-400'}`} />
          <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 pt-6 pb-5">
            <div>
              <p className={`text-xs uppercase tracking-[0.28em] ${mutedClass}`}>Formulario</p>
              <h3 className={`mt-2 flex items-center gap-2 text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <ShieldCheckIcon className={isLight ? 'h-6 w-6 text-sky-700' : 'h-6 w-6 text-sky-300'} />
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>Completa los datos y guarda el registro con una vista más cómoda.</p>
            </div>
            <button onClick={onClose} className={`rounded-full border p-2 transition-colors ${isLight ? 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900' : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <label htmlFor="usuario-nombre" className={`text-sm block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Nombre completo</label>
              <input
                id="usuario-nombre"
                type="text"
                value={form.nombre}
                onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                className={`w-full rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${inputClass}`}
                placeholder="Alex Maguert"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="usuario-email" className={`text-sm flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <EnvelopeIcon className="h-4 w-4" />
                Correo electrónico
              </label>
              <input
                id="usuario-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                disabled={!!editingUser}
                className={`w-full rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${inputClass}`}
                placeholder="usuario@techstore.com"
              />
              {editingUser && <p className={`text-xs mt-1 ${mutedClass}`}>El email no se puede modificar.</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="usuario-rol" className={`text-sm block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Rol</label>
              <select
                id="usuario-rol"
                value={form.rol}
                onChange={(event) => setForm({ ...form, rol: event.target.value })}
                className={`w-full rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${roleSelectClass}`}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={`flex gap-3 border-t px-6 py-5 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
            <button
              onClick={onClose}
              className={`flex-1 rounded-full border px-4 py-3 font-semibold transition-colors ${modalButtonNeutralClass}`}
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalTarget);
}

export default function Usuarios() {
  const { isLight } = useTheme();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = crear, obj = editar
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

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

  const filteredUsuarios = useMemo(() => getFilteredUsuarios(usuarios, roleFilter), [usuarios, roleFilter]);

  const shellClass = isLight ? 'text-slate-900' : 'text-slate-100';
  const mutedClass = isLight ? 'text-slate-600' : 'text-slate-400';
  const tableHeaderClass = isLight ? 'bg-sky-100/70 text-sky-900' : 'bg-slate-900/50 text-slate-400';
  const rowHoverClass = isLight ? 'hover:bg-sky-50/80' : 'hover:bg-slate-700/25';
  const inputClass = getInputClass(isLight);

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
    if (globalThis.confirm('¿Seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await api.delete(`/usuarios/${id}`);
        fetchUsuarios();
      } catch (err) {
        alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
      }
    }
  }

  return (
    <div className={`space-y-6 ${shellClass}`}>
      <UsersToolbar
        isLight={isLight}
        mutedClass={mutedClass}
        filteredCount={filteredUsuarios.length}
        totalCount={usuarios.length}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        onOpenCreate={openCreate}
      />

      <UsersModal
        isLight={isLight}
        mutedClass={mutedClass}
        modalOpen={modalOpen}
        editingUser={editingUser}
        error={error}
        onClose={closeModal}
        onSave={handleSave}
        saving={saving}
        form={form}
        setForm={setForm}
        inputClass={inputClass}
      />

      <UsersTable
        isLight={isLight}
        loading={loading}
        mutedClass={mutedClass}
        tableHeaderClass={tableHeaderClass}
        rowHoverClass={rowHoverClass}
        filteredUsuarios={filteredUsuarios}
        onOpenEdit={openEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
