import React, { useEffect, useState } from 'react';
import api from '../api';
import { FileText, CheckCircle2, Clock, Package } from 'lucide-react';

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-slate-400">Cargando compras...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Historial de Compras</h2>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 text-slate-400 text-sm">
            <tr>
              <th className="p-4 font-medium">ID Transacción</th>
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Producto</th>
              <th className="p-4 font-medium">Fecha</th>
              <th className="p-4 font-medium text-right">Total</th>
              <th className="p-4 font-medium text-center">Factura SOAP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {compras.map(c => (
              <tr key={c.id} className="hover:bg-slate-700/25 transition-colors">
                <td className="p-4 text-sm text-slate-500 font-mono">#{c.id}</td>
                <td className="p-4">
                  <div className="font-medium text-slate-200">{c.usuarios?.nombre || 'Usuario Desconocido'}</div>
                  <div className="text-xs text-slate-500">{c.usuarios?.email}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-blue-400" />
                    {c.productos?.nombre} x{c.cantidad}
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-400">
                  {new Date(c.fecha).toLocaleString()}
                </td>
                <td className="p-4 text-right font-bold text-emerald-400">
                  ${c.total}
                </td>
                <td className="p-4">
                  <div className="flex justify-center">
                    {c.estado_factura === 'VALIDADA' ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
                        <CheckCircle2 size={14} /> VALIDADA
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-medium border border-amber-500/20">
                        <Clock size={14} /> PENDIENTE
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {compras.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center gap-3 text-slate-500">
            <FileText size={48} className="text-slate-700" />
            <p>No se han registrado compras en el sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
}
