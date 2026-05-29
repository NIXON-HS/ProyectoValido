import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { CubeIcon, MagnifyingGlassIcon, CurrencyDollarIcon, ArchiveBoxIcon, XMarkIcon, Squares2X2Icon, TagIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

export default function Productos() {
  const { isLight } = useTheme();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: null, nombre: '', descripcion: '', precio: '', stock: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  async function fetchProductos() {
    try {
      const res = await api.get('/productos');
      setProductos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProductos();
  }, []);

  const filteredProductos = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);

    return productos.filter((producto) => {
      const nameMatch = !query || producto.nombre?.toLowerCase().includes(query);
      const price = Number(producto.precio);
      const minMatch = min === null || Number.isNaN(min) || price >= min;
      const maxMatch = max === null || Number.isNaN(max) || price <= max;
      return nameMatch && minMatch && maxMatch;
    });
  }, [productos, searchTerm, minPrice, maxPrice]);

  const shellClass = isLight ? 'text-slate-900' : 'text-slate-100';
  const surfaceClass = isLight ? 'bg-gradient-to-b from-white to-sky-50/60 border-sky-100' : 'bg-slate-800 border-slate-700';
  const softCardClass = isLight ? 'bg-gradient-to-br from-sky-50 via-white to-cyan-50 border-sky-100' : 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700';
  const mutedClass = isLight ? 'text-slate-600' : 'text-slate-400';
  const inputClass = isLight
    ? 'bg-sky-50/70 border-sky-100 text-slate-900 placeholder:text-slate-500 focus:ring-sky-500/30'
    : 'bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50';
  const actionButtonClass = 'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-5 py-2.5 text-white shadow-lg shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/25';

  async function handleDelete(id) {
    if (globalThis.confirm('¿Eliminar producto?')) {
      await api.delete(`/productos/${id}`);
      fetchProductos();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (form.id) {
        await api.put(`/productos/${form.id}`, form);
      } else {
        await api.post('/productos', form);
      }
      setShowModal(false);
      setForm({ id: null, nombre: '', descripcion: '', precio: '', stock: '' });
      fetchProductos();
    } catch (error) {
      alert('Error al guardar el producto: ' + (error.response?.data?.error || error.message));
    }
  }

  function handleEdit(producto) {
    setForm({
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock
    });
    setShowModal(true);
  }

  function handleNew() {
    setForm({ id: null, nombre: '', descripcion: '', precio: '', stock: '' });
    setShowModal(true);
  }

  if (loading) return <div className="text-slate-400">Cargando productos...</div>;

  return (
    <div className={`space-y-6 ${shellClass}`}>
      <div className={`overflow-hidden rounded-[28px] border p-5 shadow-sm ${softCardClass}`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.28em] ${mutedClass}`}>Catálogo</p>
            <h2 className={`mt-2 flex items-center gap-2 text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Squares2X2Icon className={isLight ? 'h-6 w-6 text-sky-700' : 'h-6 w-6 text-sky-300'} />
              Gestión de Productos
            </h2>
            <p className={`mt-1 text-sm ${mutedClass}`}>Busca, filtra y administra los productos desde una vista más limpia.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:w-[62%]">
            <div className="relative">
              <MagnifyingGlassIcon className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isLight ? 'text-sky-700' : 'text-slate-400'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar producto por nombre"
                className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:ring-4 ${inputClass}`}
              />
            </div>
            <div className="relative">
              <CurrencyDollarIcon className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isLight ? 'text-sky-700' : 'text-slate-400'}`} />
              <input
                type="number"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Precio mínimo"
                className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:ring-4 ${inputClass}`}
              />
            </div>
            <div className="relative">
              <TagIcon className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isLight ? 'text-sky-700' : 'text-slate-400'}`} />
              <input
                type="number"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Precio máximo"
                className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:ring-4 ${inputClass}`}
              />
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end">
          <button onClick={handleNew} className={actionButtonClass}>
            <Plus size={20} /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProductos.map(p => (
          <div key={p.id} className={`rounded-[24px] border overflow-hidden transition-all group shadow-sm ${surfaceClass}`}>
            <div className={`h-40 flex items-center justify-center ${isLight ? 'bg-gradient-to-br from-slate-50 to-white' : 'bg-slate-900/50'}`}>
              <CubeIcon className={isLight ? 'h-14 w-14 text-sky-400' : 'h-14 w-14 text-slate-600'} />
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg truncate pr-2">{p.nombre}</h3>
                <span className={isLight ? 'text-sky-700 font-bold' : 'text-sky-300 font-bold'}>${p.precio}</span>
              </div>
              <p className={`text-sm line-clamp-2 mb-4 ${mutedClass}`}>{p.descripcion}</p>
              <div className="flex justify-between items-center mt-4">
                <span className={`text-xs px-2 py-1 rounded ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-700 text-slate-300'}`}>Stock: {p.stock}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(p)} className="text-slate-400 hover:text-blue-400 transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredProductos.length === 0 && <div className={`col-span-full text-center py-12 ${mutedClass}`}>No hay productos para ese filtro.</div>}
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 z-[200]">
          <button
            type="button"
            aria-label="Cerrar formulario"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-[81] h-full overflow-y-auto p-6">
            <div
              className={`mx-auto my-6 overflow-hidden rounded-[28px] border shadow-[0_30px_110px_rgba(15,23,42,0.42)] ${softCardClass}`}
              style={{ width: 'min(760px, 92vw)' }}
            >
              <div className={`h-2 ${isLight ? 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500' : 'bg-gradient-to-r from-sky-500 via-blue-400 to-indigo-400'}`} />
              <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 pt-6 pb-5">
                <div>
                  <p className={`text-xs uppercase tracking-[0.28em] ${mutedClass}`}>Formulario</p>
                  <h3 className={`mt-2 flex items-center gap-2 text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <ArchiveBoxIcon className={isLight ? 'h-6 w-6 text-sky-700' : 'h-6 w-6 text-sky-300'} />
                    {form.id ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>Un panel más claro para crear o ajustar el catálogo.</p>
                </div>
                <button onClick={() => setShowModal(false)} className={`rounded-full border p-2 transition-colors ${isLight ? 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900' : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
                <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del producto" className={`w-full rounded-2xl px-4 py-3 outline-none focus:ring-2 ${inputClass}`} />
                <textarea required value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción" className={`w-full rounded-2xl px-4 py-3 outline-none focus:ring-2 h-28 ${inputClass}`} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input required type="number" step="0.01" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="Precio" className={`w-full rounded-2xl px-4 py-3 outline-none focus:ring-2 ${inputClass}`} />
                  <input required type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="Stock" className={`w-full rounded-2xl px-4 py-3 outline-none focus:ring-2 ${inputClass}`} />
                </div>
                <div className={`flex gap-3 border-t pt-5 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
                  <button type="button" onClick={() => setShowModal(false)} className={`flex-1 rounded-full border px-4 py-3 font-semibold transition-colors ${isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}>Cancelar</button>
                  <button type="submit" className="flex-1 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-3 font-semibold text-white transition-all hover:-translate-y-0.5">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
