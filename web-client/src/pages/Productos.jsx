import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import { Trash2, Edit2, Plus, Search, Package, X, DollarSign, BarChart2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/* ── Stock Badge ── */
function StockBadge({ stock, isLight }) {
  const n = Number(stock);
  if (n <= 0)  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isLight ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>Sin stock</span>;
  if (n <= 10) return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isLight ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>Stock: {n}</span>;
  return          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>Stock: {n}</span>;
}

/* ── Product Card ── */
function ProductCard({ p, isLight, onEdit, onDelete }) {
  const surface = isLight
    ? 'bg-white border-slate-200/80 shadow-card'
    : 'bg-slate-900/70 border-slate-800 shadow-glass-dark';

  // deterministic color from product id/name
  const hue = (p.id || p.nombre || '').toString().split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const gradient = `hsl(${hue},60%,52%)`;
  const gradientEnd = `hsl(${(hue + 40) % 360},70%,40%)`;

  return (
    <div className={`product-card rounded-2xl border overflow-hidden ${surface}`}>
      {/* Image area */}
      <div
        className="h-40 flex items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${gradient}22 0%, ${gradientEnd}33 100%)` }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(circle at 30% 30%, ${gradient}, transparent 60%)` }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
          style={{ background: `linear-gradient(135deg, ${gradient}, ${gradientEnd})` }}>
          <Package size={28} strokeWidth={1.5} className="text-white" />
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`font-bold text-sm leading-snug line-clamp-2 flex-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {p.nombre}
          </h3>
          <span className={`shrink-0 text-base font-black ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
            ${Number(p.precio).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <p className={`text-xs leading-relaxed line-clamp-2 mb-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          {p.descripcion || 'Sin descripción'}
        </p>

        <div className="flex items-center justify-between">
          <StockBadge stock={p.stock} isLight={isLight} />
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(p)}
              title="Editar"
              className={`p-2 rounded-lg transition-colors text-sm
                ${isLight ? 'text-slate-400 hover:bg-blue-50 hover:text-blue-600' : 'text-slate-500 hover:bg-blue-500/10 hover:text-blue-400'}`}
            >
              <Edit2 size={14} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => onDelete(p.id)}
              title="Eliminar"
              className={`p-2 rounded-lg transition-colors
                ${isLight ? 'text-slate-400 hover:bg-red-50 hover:text-red-500' : 'text-slate-500 hover:bg-red-500/10 hover:text-red-400'}`}
            >
              <Trash2 size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modal ── */
function ProductModal({ isLight, show, form, setForm, onSubmit, onClose }) {
  if (!show) return null;
  const inp = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/20 focus:border-blue-400'
    : 'bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/20 focus:border-blue-500/40';

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl animate-scale-in
        ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
        <div className="h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500" />
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl
              ${isLight ? 'bg-violet-50 text-violet-600' : 'bg-violet-500/15 text-violet-400'}`}>
              <Package size={18} strokeWidth={1.8} />
            </div>
            <div>
              <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {form.id ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Completa los datos del producto</p>
            </div>
          </div>
          <button onClick={onClose} className={`rounded-lg p-2 transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}>
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>
        {/* Body */}
        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <label className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Nombre del producto</label>
            <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Laptop Pro 15" className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 ${inp}`} />
          </div>
          <div className="space-y-1.5">
            <label className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Descripción</label>
            <textarea required value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción del producto..." rows={3}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 resize-none ${inp}`} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <DollarSign size={13} /> Precio
              </label>
              <input required type="number" step="0.01" min="0" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })}
                placeholder="0.00" className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 ${inp}`} />
            </div>
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <BarChart2 size={13} /> Stock
              </label>
              <input required type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                placeholder="0" className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 ${inp}`} />
            </div>
          </div>
          {/* Footer */}
          <div className={`flex gap-3 pt-4 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
            <button type="button" onClick={onClose}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors
                ${isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
              <Package size={14} strokeWidth={2} />
              {form.id ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ── Main Page ── */
export default function Productos() {
  const { isLight } = useTheme();
  const [productos,    setProductos]   = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [showModal,    setShowModal]   = useState(false);
  const [form,         setForm]        = useState({ id: null, nombre: '', descripcion: '', precio: '', stock: '' });
  const [searchTerm,   setSearchTerm]  = useState('');
  const [minPrice,     setMinPrice]    = useState('');
  const [maxPrice,     setMaxPrice]    = useState('');

  async function fetchProductos() {
    try { const res = await api.get('/productos'); setProductos(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchProductos(); }, []);

  const filteredProductos = useMemo(() => {
    const q   = searchTerm.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);
    return productos.filter(p => {
      const nm = !q || p.nombre?.toLowerCase().includes(q);
      const pr = Number(p.precio);
      return nm && (min === null || pr >= min) && (max === null || pr <= max);
    });
  }, [productos, searchTerm, minPrice, maxPrice]);

  async function handleDelete(id) {
    if (globalThis.confirm('¿Eliminar este producto?')) {
      await api.delete(`/productos/${id}`);
      fetchProductos();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (form.id) { await api.put(`/productos/${form.id}`, form); }
      else         { await api.post('/productos', form); }
      setShowModal(false);
      setForm({ id: null, nombre: '', descripcion: '', precio: '', stock: '' });
      fetchProductos();
    } catch (error) {
      alert('Error al guardar: ' + (error.response?.data?.error || error.message));
    }
  }

  function handleEdit(p) { setForm({ id: p.id, nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, stock: p.stock }); setShowModal(true); }
  function handleNew()   { setForm({ id: null, nombre: '', descripcion: '', precio: '', stock: '' }); setShowModal(true); }

  const inp = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/20 focus:border-blue-300'
    : 'bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/20 focus:border-blue-500/40';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header card */}
      <div className={`overflow-hidden rounded-2xl border p-5
        ${isLight ? 'bg-white border-slate-200/80 shadow-card' : 'bg-slate-900/60 border-slate-800 shadow-glass-dark'}`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Package size={20} className={isLight ? 'text-violet-600' : 'text-violet-400'} strokeWidth={1.8} />
              <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Gestión de Productos</h2>
            </div>
            <p className={`mt-0.5 text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              {filteredProductos.length} producto(s) visible(s) de {productos.length}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:w-[58%]">
            <div className="relative flex-1">
              <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar producto..." className={`w-full rounded-xl border py-2.5 pl-8 pr-3 text-sm outline-none transition-all focus:ring-2 ${inp}`} />
            </div>
            <div className="relative">
              <DollarSign size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                placeholder="Mín $" className={`w-full sm:w-28 rounded-xl border py-2.5 pl-8 pr-3 text-sm outline-none transition-all focus:ring-2 ${inp}`} />
            </div>
            <div className="relative">
              <DollarSign size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                placeholder="Máx $" className={`w-full sm:w-28 rounded-xl border py-2.5 pl-8 pr-3 text-sm outline-none transition-all focus:ring-2 ${inp}`} />
            </div>
            <button onClick={handleNew} id="btn-nuevo-producto"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0">
              <Plus size={16} strokeWidth={2.5} /> Nuevo
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`rounded-2xl border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <div className="skeleton h-40" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProductos.map(p => (
            <ProductCard key={p.id} p={p} isLight={isLight} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
          {filteredProductos.length === 0 && (
            <div className={`col-span-full py-20 text-center ${isLight ? 'text-slate-300' : 'text-slate-700'}`}>
              <Package size={48} className="mx-auto mb-3 opacity-40" />
              <p className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No hay productos para ese filtro</p>
            </div>
          )}
        </div>
      )}

      <ProductModal isLight={isLight} show={showModal} form={form} setForm={setForm} onSubmit={handleSubmit} onClose={() => setShowModal(false)} />
    </div>
  );
}
