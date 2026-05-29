import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { Trash2, Edit2, Plus } from 'lucide-react';
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
  const surfaceClass = isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700';
  const mutedClass = isLight ? 'text-slate-500' : 'text-slate-400';
  const inputClass = isLight
    ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-sky-500/30'
    : 'bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50';

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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <h2 className="text-2xl font-bold">Gestión de Productos</h2>
        <div className="grid gap-3 sm:grid-cols-3 xl:w-[62%]">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar producto por nombre"
            className={`rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 ${inputClass}`}
          />
          <input
            type="number"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Precio mínimo"
            className={`rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 ${inputClass}`}
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Precio máximo"
            className={`rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 ${inputClass}`}
          />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button onClick={handleNew} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProductos.map(p => (
          <div key={p.id} className={`rounded-2xl border overflow-hidden transition-colors group ${surfaceClass}`}>
            <div className={`h-40 flex items-center justify-center ${isLight ? 'bg-slate-50' : 'bg-slate-900/50'}`}>
              <span className={isLight ? 'text-slate-400 text-5xl' : 'text-slate-600 text-5xl'}>📦</span>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg truncate pr-2">{p.nombre}</h3>
                <span className={isLight ? 'text-sky-700 font-bold' : 'text-emerald-400 font-bold'}>${p.precio}</span>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-2xl border w-full max-w-md shadow-2xl ${surfaceClass}`}>
            <h3 className={`text-xl font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>{form.id ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del producto" className={`w-full rounded-lg px-4 py-2 outline-none focus:ring-2 ${inputClass}`} />
              <textarea required value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción" className={`w-full rounded-lg px-4 py-2 outline-none focus:ring-2 h-24 ${inputClass}`} />
              <div className="flex gap-4">
                <input required type="number" step="0.01" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="Precio" className={`w-full rounded-lg px-4 py-2 outline-none focus:ring-2 ${inputClass}`} />
                <input required type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="Stock" className={`w-full rounded-lg px-4 py-2 outline-none focus:ring-2 ${inputClass}`} />
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button type="button" onClick={() => setShowModal(false)} className={`px-4 py-2 rounded-lg transition-colors ${isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-700'}`}>Cancelar</button>
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
