import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { ShoppingCart, Search, CheckCircle2, Clock, Package, Calendar, FileText } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/* ── Status Badge ── */
function StatusBadge({ estado, isLight }) {
  if (estado === 'VALIDADA') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold
        ${isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
        <CheckCircle2 size={12} strokeWidth={2.2} /> VALIDADA
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold
      ${isLight ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${isLight ? 'bg-amber-500' : 'bg-amber-400'}`} />
      </span>
      PENDIENTE
    </span>
  );
}

/* ── Skeleton ── */
function SkeletonRows({ isLight }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className={isLight ? 'border-b border-slate-100' : 'border-b border-slate-800'}>
      {[80, 160, 140, 120, 80, 120].map((w, j) => (
        <td key={j} className="px-5 py-4">
          <div className="skeleton h-4 rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  ));
}

export default function Compras() {
  const { isLight } = useTheme();
  const [compras,    setCompras]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');

  async function fetchCompras() {
    try { const res = await api.get('/compras'); setCompras(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchCompras(); }, []);

  const filteredCompras = useMemo(() => {
    const q    = searchTerm.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to   = dateTo   ? new Date(`${dateTo}T23:59:59.999`) : null;
    return compras.filter(c => {
      const txt = !q || (c.usuarios?.nombre || '').toLowerCase().includes(q)
                     || (c.usuarios?.email  || '').toLowerCase().includes(q)
                     || (c.productos?.nombre|| '').toLowerCase().includes(q);
      const d   = c.fecha ? new Date(c.fecha) : null;
      return txt && (!from || !d || d >= from) && (!to || !d || d <= to);
    });
  }, [compras, searchTerm, dateFrom, dateTo]);

  // Totals
  const totalAmount  = filteredCompras.reduce((s, c) => s + Number(c.total || 0), 0);
  const validated    = filteredCompras.filter(c => c.estado_factura === 'VALIDADA').length;

  const surface  = isLight ? 'bg-white border-slate-200/80 shadow-card'       : 'bg-slate-900/60 border-slate-800 shadow-glass-dark';
  const header   = isLight ? 'bg-slate-50 text-slate-500'                     : 'bg-slate-900/80 text-slate-500';
  const rowHover = isLight ? 'hover:bg-blue-50/40'                            : 'hover:bg-slate-800/50';
  const divider  = isLight ? 'divide-slate-100'                               : 'divide-slate-800/80';
  const inp      = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/20 focus:border-blue-300'
    : 'bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/20 focus:border-blue-500/40';

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header card */}
      <div className={`overflow-hidden rounded-2xl border p-5 ${surface}`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          {/* Title + quick stats */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart size={20} className={isLight ? 'text-emerald-600' : 'text-emerald-400'} strokeWidth={1.8} />
              <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Historial de Compras</h2>
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className={`flex items-center gap-2 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <FileText size={14} />
                <span><strong className={isLight ? 'text-slate-900' : 'text-white'}>{filteredCompras.length}</strong> transacciones</span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <CheckCircle2 size={14} className={isLight ? 'text-emerald-600' : 'text-emerald-400'} />
                <span><strong className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>{validated}</strong> validadas</span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ${totalAmount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </span>
                <span>total</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:w-[62%]">
            <div className="relative flex-1">
              <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente o producto..."
                className={`w-full rounded-xl border py-2.5 pl-8 pr-3 text-sm outline-none transition-all focus:ring-2 ${inp}`} />
            </div>
            <div className="relative">
              <Calendar size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className={`w-full rounded-xl border py-2.5 pl-8 pr-3 text-sm outline-none transition-all focus:ring-2 ${inp}`} />
            </div>
            <div className="relative">
              <Calendar size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className={`w-full rounded-xl border py-2.5 pl-8 pr-3 text-sm outline-none transition-all focus:ring-2 ${inp}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`overflow-hidden rounded-2xl border ${surface}`}>
        <div className="dashboard-table-shell">
          <table className="w-full text-left">
            <thead className={`text-xs font-semibold uppercase tracking-wider ${header}`}>
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Producto</th>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-center">Factura</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {loading
                ? <SkeletonRows isLight={isLight} />
                : filteredCompras.map(c => (
                  <tr key={c.id} className={`transition-colors ${rowHover}`}>
                    <td className={`px-5 py-4 text-xs font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>#{c.id}</td>
                    <td className="px-5 py-4">
                      <p className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {c.usuarios?.nombre || 'Desconocido'}
                      </p>
                      <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{c.usuarios?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                          ${isLight ? 'bg-blue-50 text-blue-500' : 'bg-blue-500/10 text-blue-400'}`}>
                          <Package size={13} strokeWidth={1.8} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            {c.productos?.nombre}
                          </p>
                          <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>×{c.cantidad}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-5 py-4 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {c.fecha ? new Date(c.fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className={`px-5 py-4 text-right text-sm font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      ${Number(c.total).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge estado={c.estado_factura} isLight={isLight} />
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          {!loading && filteredCompras.length === 0 && (
            <div className={`py-20 text-center ${isLight ? 'text-slate-300' : 'text-slate-700'}`}>
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-40" />
              <p className={`text-sm font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No hay compras para ese filtro</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
