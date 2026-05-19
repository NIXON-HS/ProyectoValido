import React, { useEffect, useState } from 'react';
import api from '../api';
import { Trash2, Edit2, Plus } from 'lucide-react';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: null, nombre: '', descripcion: '', precio: '', stock: '' });

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

  async function handleDelete(id) {
    if (window.confirm('¿Eliminar producto?')) {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Productos</h2>
        <button onClick={handleNew} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productos.map(p => (
          <div key={p.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:border-blue-500/50 transition-colors group">
            <div className="h-40 bg-slate-900/50 flex items-center justify-center">
              <span className="text-slate-600 text-5xl">📦</span>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg truncate pr-2">{p.nombre}</h3>
                <span className="text-emerald-400 font-bold">${p.precio}</span>
              </div>
              <p className="text-sm text-slate-400 line-clamp-2 mb-4">{p.descripcion}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">Stock: {p.stock}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(p)} className="text-slate-400 hover:text-blue-400 transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {productos.length === 0 && <div className="col-span-full text-center text-slate-500 py-12">No hay productos registrados.</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{form.id ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Nombre del producto" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              <textarea required value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Descripción" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24" />
              <div className="flex gap-4">
                <input required type="number" step="0.01" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} placeholder="Precio" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                <input required type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="Stock" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">Cancelar</button>
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
