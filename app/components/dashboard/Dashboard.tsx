import React from 'react';
import { formatDate, getDeadlineStatus, getStatusColor } from '@/lib/utils';
import { Order } from '@/types';
import { BarChart3, Calendar, Clock, FileText } from 'lucide-react';

interface DashboardProps {
  role: string;
  orders: Order[];
  onSelectOrder: (id: string) => void;
}

export default function Dashboard({ role, orders, onSelectOrder }: DashboardProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
   
  const ordersThisMonth = orders.filter((o) => {
    const orderDate = new Date(o.tanggal_masuk);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });

  const totalPcsThisMonth = ordersThisMonth.reduce((sum, o) => sum + o.jumlah, 0);

  const stats = {
    total: orders.length,
    pcsThisMonth: totalPcsThisMonth,
    process: orders.filter((o) => o.status === 'On Process' || o.status === 'Finishing').length,
    overdue: orders.filter((o) => getDeadlineStatus(o.deadline, o.status) === 'overdue').length,
    completed: orders.filter((o) => o.status === 'Selesai').length,
    totalPcs: orders.reduce((sum, o) => sum + o.jumlah, 0)
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 md:mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
        {[
          { label: 'Total Order', val: stats.total, bg: 'bg-white', text: 'text-slate-800', border: 'border-slate-200' },
          { label: 'PCS Bulan Ini', val: stats.pcsThisMonth, bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-100' },
          { label: 'Sedang Proses', val: stats.process, bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-100' },
          { label: 'Telat Deadline', val: stats.overdue, bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-100' },
          { label: 'Selesai', val: stats.completed, bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-100' },
          { label: 'Total PCS', val: stats.totalPcs, bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-100' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-2 md:p-5 rounded-xl shadow-sm border ${s.border}`}>
            <div className={`${s.text} opacity-70 text-[9px] md:text-xs font-bold uppercase whitespace-nowrap truncate`}>{s.label}</div>
            <div className={`text-xl md:text-3xl font-extrabold ${s.text} mt-0.5 md:mt-1`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-3 md:p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-md md:text-lg text-slate-800">Pesanan Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600 min-w-full md:min-w-[600px]">
            <thead className="bg-slate-50 text-[10px] md:text-xs uppercase font-bold text-slate-600">
              <tr>
                <th className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap">Kode</th>
                <th className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap">Pemesan</th>
                <th className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap">Status</th>
                <th className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap">Deadline</th>
                <th className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 5).map((o) => {
                const deadlineStatus = getDeadlineStatus(o.deadline, o.status);
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition text-[10px] md:text-sm">
                    <td className="px-2 py-2 md:px-6 md:py-4 font-mono font-medium text-slate-500 whitespace-nowrap">{o.kode_produksi}</td>
                    <td className="px-2 py-2 md:px-6 md:py-4 font-bold text-slate-800 whitespace-nowrap max-w-[100px] md:max-w-none truncate">{o.nama_pemesan}</td>
                    <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-extrabold uppercase tracking-wide border whitespace-nowrap ${getStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className={`px-2 py-2 md:px-6 md:py-4 font-medium whitespace-nowrap ${deadlineStatus === 'overdue' ? 'text-red-600 font-bold' : 'text-slate-700'}`}>{formatDate(o.deadline)}</td>
                    <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-right">
                      <button onClick={() => onSelectOrder(o.id)} className="text-blue-600 hover:text-blue-800 text-[9px] md:text-xs font-bold bg-blue-50 px-2 py-1 md:px-3 md:py-1.5 rounded border border-blue-100">Detail</button>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">Belum ada pesanan</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}