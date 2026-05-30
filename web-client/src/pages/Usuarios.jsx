/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import { Trash2, Pencil, X, Save, Search, Users, ShieldCheck, User as UserIcon, Filter } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ROLES = ['admin', 'cliente'];
const emptyForm = { nombre: '', email: '', rol: 'cliente', password: '' };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FULL_NAME_REGEX = /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*)+$/;

function validateUserForm(form) {
  const nombre = form.nombre.trim();
  const email  = form.email.trim();
  if (!nombre || !email) return 'Nombre y correo son obligatorios.';
  if (!FULL_NAME_REGEX.test(nombre)) return 'El nombre debe iniciar con mayúscula, sin números y con palabras separadas por espacio.';
  if (!EMAIL_REGEX.test(email))      return 'Debes ingresar un correo electrónico válido.';
  return '';
}

/* ── Role Badge ── */
function RoleBadge({ rol, isLight }) {
  if (rol === 'admin') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide
        ${isLight ? 'bg-blue-50 text-blue-700 border border-blue-200/80' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
        <ShieldCheck size={11} strokeWidth={2.2} /> Admin
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide
      ${isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
      <UserIcon size={11} strokeWidth={2.2} /> Cliente
    </span>
  );
}

/* ── Skeleton ── */
function SkeletonRows({ isLight }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className={isLight ? 'border-b border-slate-100' : 'border-b border-slate-800'}>
      {[140, 180, 200, 80, 80].map((w, j) => (
        <td key={j} className="p-4">
          <div className="skeleton h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  ));
}

/* ── Toolbar ── */
function UsersToolbar({ isLight, filteredCount, totalCount, roleFilter, setRoleFilter, search, setSearch, onOpenCreate }) {
  const inp = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/20 focus:border-blue-300'
    : 'bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/20 focus:border-blue-500/40';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Users size={20} className={isLight ? 'text-blue-600' : 'text-blue-400'} strokeWidth={1.8} />
          <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Gestión de Usuarios</h2>
        </div>
        <p className={`mt-0.5 text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          {filteredCount} de {totalCount} usuarios
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Search */}
        <div className="relative">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar usuario..."
            className={`rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:ring-2 w-full sm:w-48 ${inp}`}
          />
        </div>
        {/* Role filter */}
        <div className="relative">
          <Filter size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className={`rounded-xl border py-2.5 pl-8 pr-4 text-sm outline-none transition-all focus:ring-2 ${inp}`}
          >
            <option value="all">Todos</option>
            <option value="admin">Admin</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
        {/* Add */}
        <button
          onClick={onOpenCreate}
          id="btn-nuevo-usuario"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-0"
        >
          <UserIcon size={15} strokeWidth={2.2} /> Nuevo Usuario
        </button>
      </div>
    </div>
  );
}

/* ── Table ── */
function UsersTable({ isLight, loading, filteredUsuarios, onOpenEdit, onDelete }) {
  const surface = isLight
    ? 'bg-white border-slate-200/80 shadow-card'
    : 'bg-slate-900/60 border-slate-800 shadow-glass-dark';
  const headerBg = isLight ? 'bg-slate-50 text-slate-500' : 'bg-slate-900/80 text-slate-500';
  const rowHover = isLight ? 'hover:bg-blue-50/50' : 'hover:bg-slate-800/50';
  const divider  = isLight ? 'divide-slate-100' : 'divide-slate-800/80';

  return (
    <div className={`overflow-hidden rounded-2xl border ${surface}`}>
      <div className="dashboard-table-shell">
        <table className="w-full text-left">
          <thead className={`text-xs font-semibold uppercase tracking-wider ${headerBg}`}>
            <tr>
              <th className="px-5 py-3.5">ID</th>
              <th className="px-5 py-3.5">Nombre</th>
              <th className="px-5 py-3.5">Email</th>
              <th className="px-5 py-3.5">Rol</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${divider}`}>
            {loading
              ? <SkeletonRows isLight={isLight} />
              : filteredUsuarios.map(user => (
                <tr key={user.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-5 py-4 text-xs font-mono max-w-[110px] truncate ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {user.id}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold
                        ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
                        {(user.nombre || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <span className={`font-medium text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {user.nombre || <span className="italic text-slate-400">Sin nombre</span>}
                      </span>
                    </div>
                  </td>
                  <td className={`px-5 py-4 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{user.email}</td>
                  <td className="px-5 py-4"><RoleBadge rol={user.rol} isLight={isLight} /></td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpenEdit(user)}
                        title="Editar"
                        className={`p-2 rounded-lg transition-colors
                          ${isLight ? 'text-slate-400 hover:bg-blue-50 hover:text-blue-600' : 'text-slate-500 hover:bg-blue-500/10 hover:text-blue-400'}`}
                      >
                        <Pencil size={15} strokeWidth={1.8} />
                      </button>
                      <button
                        onClick={() => onDelete(user.id)}
                        title="Eliminar"
                        className={`p-2 rounded-lg transition-colors
                          ${isLight ? 'text-slate-400 hover:bg-red-50 hover:text-red-500' : 'text-slate-500 hover:bg-red-500/10 hover:text-red-400'}`}
                      >
                        <Trash2 size={15} strokeWidth={1.8} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!loading && filteredUsuarios.length === 0 && (
          <div className={`py-16 text-center ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Sin resultados para ese filtro</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Modal ── */
function UsersModal({ isLight, modalOpen, editingUser, error, onClose, onSave, saving, form, setForm }) {
  if (!modalOpen) return null;

  const inp = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/20 focus:border-blue-400'
    : 'bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/20 focus:border-blue-500/40';

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl animate-scale-in
          ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}
      >
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl
              ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/15 text-blue-400'}`}>
              {editingUser ? <Pencil size={18} strokeWidth={1.8} /> : <UserIcon size={18} strokeWidth={1.8} />}
            </div>
            <div>
              <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Completa los datos del formulario
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className={`rounded-lg p-2 transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}>
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <label className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Nombre completo</label>
            <input
              id="usuario-nombre"
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="María García"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 ${inp}`}
            />
          </div>
          <div className="space-y-1.5">
            <label className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Correo electrónico</label>
            <input
              id="usuario-email"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              disabled={!!editingUser}
              placeholder="usuario@techstore.com"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${inp}`}
            />
            {editingUser && <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>El email no se puede modificar.</p>}
          </div>
          <div className="space-y-1.5">
            <label className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Rol</label>
            <select
              id="usuario-rol"
              value={form.rol}
              onChange={e => setForm({ ...form, rol: e.target.value })}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 ${inp}`}
            >
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex gap-3 border-t px-6 py-4 ${isLight ? 'border-slate-100 bg-slate-50' : 'border-slate-800 bg-slate-900/50'}`}>
          <button
            onClick={onClose}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors
              ${isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            id="btn-guardar-usuario"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
          >
            <Save size={15} strokeWidth={2} />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

/* ── Main Page ── */
export default function Usuarios() {
  const { isLight } = useTheme();
  const [usuarios,   setUsuarios]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editingUser,setEditingUser]= useState(null);
  const [form,       setForm]       = useState(emptyForm);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search,     setSearch]     = useState('');

  async function fetchUsuarios() {
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchUsuarios(); }, []);

  const filteredUsuarios = useMemo(() => {
    const q = search.trim().toLowerCase();
    return usuarios
      .filter(u => roleFilter === 'all' || u.rol === roleFilter)
      .filter(u => !q || u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [usuarios, roleFilter, search]);

  function openCreate() { setEditingUser(null); setForm(emptyForm); setError(''); setModalOpen(true); }
  function openEdit(u)  { setEditingUser(u); setForm({ nombre: u.nombre||'', email: u.email, rol: u.rol, password: '' }); setError(''); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditingUser(null); setForm(emptyForm); setError(''); }

  async function handleSave() {
    const err = validateUserForm(form);
    if (err) { setError(err); return; }
    setSaving(true); setError('');
    try {
      const payload = { nombre: form.nombre.trim(), email: form.email.trim(), rol: form.rol };
      if (editingUser) {
        await api.post('/usuarios', { id: editingUser.id, ...payload });
      } else {
        await api.post('/usuarios', { id: `manual-${Date.now()}`, ...payload });
      }
      closeModal(); fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el usuario.');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (globalThis.confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) {
      try { await api.delete(`/usuarios/${id}`); fetchUsuarios(); }
      catch (err) { alert('Error al eliminar: ' + (err.response?.data?.error || err.message)); }
    }
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <UsersToolbar
        isLight={isLight}
        filteredCount={filteredUsuarios.length}
        totalCount={usuarios.length}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        search={search}
        setSearch={setSearch}
        onOpenCreate={openCreate}
      />
      <UsersTable
        isLight={isLight}
        loading={loading}
        filteredUsuarios={filteredUsuarios}
        onOpenEdit={openEdit}
        onDelete={handleDelete}
      />
      <UsersModal
        isLight={isLight}
        modalOpen={modalOpen}
        editingUser={editingUser}
        error={error}
        onClose={closeModal}
        onSave={handleSave}
        saving={saving}
        form={form}
        setForm={setForm}
      />
    </div>
  );
}
