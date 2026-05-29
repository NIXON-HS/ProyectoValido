import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { FileText, CheckCircle2, Clock, Package } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Compras() {
  const { isLight } = useTheme();
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  async function fetchCompras() {
    try {
      const res = await api.get('/compras');
      setCompras(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCompras();
  }, []);

  const filteredCompras = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const fromValue = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toValue = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return compras.filter((compra) => {
      const buyerName = compra.usuarios?.nombre || '';
      const buyerEmail = compra.usuarios?.email || '';
      const productName = compra.productos?.nombre || '';
      const textMatch =
        !query ||
        buyerName.toLowerCase().includes(query) ||
        buyerEmail.toLowerCase().includes(query) ||
        productName.toLowerCase().includes(query);

      const purchaseDate = compra.fecha ? new Date(compra.fecha) : null;
      const fromMatch = !fromValue || !purchaseDate || purchaseDate >= fromValue;
      const toMatch = !toValue || !purchaseDate || purchaseDate <= toValue;

      return textMatch && fromMatch && toMatch;
    });
  }, [compras, searchTerm, dateFrom, dateTo]);

  const shellClass = isLight ? 'text-slate-900' : 'text-slate-100';
  const surfaceClass = isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700';
  const softCardClass = isLight ? 'bg-gradient-to-br from-white to-slate-50 border-slate-200' : 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700';
  const mutedClass = isLight ? 'text-slate-500' : 'text-slate-400';
  const inputClass = isLight
    ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-sky-500/30'
    : 'bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50';

  if (loading) return <div className={mutedClass}>Cargando compras...</div>;

  return (
    <div className={`space-y-6 ${shellClass}`}>
      <div className={`overflow-hidden rounded-[28px] border p-5 shadow-sm ${softCardClass}`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.28em] ${mutedClass}`}>Historial</p>
            <h2 className={`mt-2 text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Compras</h2>
            <p className={`mt-1 text-sm ${mutedClass}`}>{filteredCompras.length} compra(s) visible(s) de {compras.length} registradas</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:w-[68%]">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por cliente o producto"
              className={`rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 ${inputClass}`}
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className={`rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 ${inputClass}`}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className={`rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 ${inputClass}`}
            />
          </div>
        </div>
      </div>

      <div className={`rounded-3xl border overflow-hidden shadow-sm ${surfaceClass}`}>
        <div className="dashboard-table-shell">
          <table className="w-full text-left">
            <thead className={`text-sm ${isLight ? 'bg-slate-50 text-slate-500' : 'bg-slate-900/50 text-slate-400'}`}>
              <tr>
                <th className="p-4 font-medium">ID Transacción</th>
                <th className="p-4 font-medium">Cliente</th>
                <th className="p-4 font-medium">Producto</th>
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium text-right">Total</th>
                <th className="p-4 font-medium text-center">Factura SOAP</th>
              </tr>
            </thead>
            <tbody className={isLight ? 'divide-y divide-slate-200' : 'divide-y divide-slate-700/50'}>
              {filteredCompras.map(c => (
                <tr key={c.id} className={isLight ? 'hover:bg-slate-50/80 transition-colors' : 'hover:bg-slate-700/25 transition-colors'}>
                  <td className={`p-4 text-sm font-mono ${mutedClass}`}>#{c.id}</td>
                  <td className="p-4">
                    <div className={`font-medium ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{c.usuarios?.nombre || 'Usuario Desconocido'}</div>
                    <div className={`text-xs ${mutedClass}`}>{c.usuarios?.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Package size={16} className={isLight ? 'text-sky-500' : 'text-sky-300'} />
                      {c.productos?.nombre} x{c.cantidad}
                    </div>
                  </td>
                  <td className={`p-4 text-sm ${mutedClass}`}>
                    {new Date(c.fecha).toLocaleString()}
                  </td>
                  <td className={`p-4 text-right font-bold ${isLight ? 'text-sky-700' : 'text-emerald-400'}`}>
                    ${c.total}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      {c.estado_factura === 'VALIDADA' ? (
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          <CheckCircle2 size={14} /> VALIDADA
                        </span>
                      ) : (
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          <Clock size={14} /> PENDIENTE
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCompras.length === 0 && (
          <div className={`p-12 text-center flex flex-col items-center gap-3 ${mutedClass}`}>
            <FileText size={48} className={isLight ? 'text-slate-300' : 'text-slate-700'} />
            <p>No se han registrado compras en el sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
}
