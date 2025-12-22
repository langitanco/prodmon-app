// app/components/orders/CompletedOrders.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Order } from '@/types'; 
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Archive, CheckCircle2, Package, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils'; 

interface CompletedOrdersProps {
  orders: Order[];
}

export default function CompletedOrders({ orders }: CompletedOrdersProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const finishedOrders = useMemo(() => {
    let data = orders.filter(o => o.status === 'Selesai');
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(o => 
        o.nama_pemesan.toLowerCase().includes(lower) || 
        o.kode_produksi.toLowerCase().includes(lower)
      );
    }
    return data.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
  }, [orders, searchTerm]);

  const stats = useMemo(() => {
    return {
      totalOrder: finishedOrders.length,
      totalPcs: finishedOrders.reduce((acc, curr) => acc + curr.jumlah, 0),
    };
  }, [finishedOrders]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data: any[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthIdx = d.getMonth();
        const year = d.getFullYear();
        const count = finishedOrders.filter(o => {
            const date = new Date(o.deadline); 
            return date.getMonth() === monthIdx && date.getFullYear() === year;
        }).length;
        data.push({ name: months[monthIdx], selesai: count });
    }
    return data;
  }, [finishedOrders]);

  return (
    <div className="space-y-6 pb-10">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* JUDUL: HANYA MUNCUL DI DESKTOP (hidden md:block) */}
        <div className="hidden md:block">
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Archive className="w-6 h-6 text-green-600" /> Arsip Produksi Selesai
           </h2>
           <p className="text-slate-500 text-sm">Rekapitulasi pesanan yang telah rampung</p>
        </div>
        
        <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama / kode..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-64"
            />
        </div>
      </div>

      {/* STATS & GRAFIK SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white p-3 md:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                  <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">Total Order</p>
                  <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 mt-1">{stats.totalOrder}</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold bg-green-100 text-green-700 mt-2">
                    <CheckCircle2 className="w-3 h-3" /> All Time
                  </span>
              </div>
              <div className="absolute -right-2 -bottom-2 md:static md:p-3 md:bg-green-50 md:rounded-full md:text-green-600 opacity-20 md:opacity-100 transform scale-150 md:scale-100">
                  <CheckCircle2 className="w-10 h-10 md:w-6 md:h-6" />
              </div>
          </div>

          <div className="bg-white p-3 md:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                  <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pakaian</p>
                  <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 mt-1">{stats.totalPcs.toLocaleString('id-ID')}</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold bg-blue-100 text-blue-700 mt-2">
                    <Package className="w-3 h-3" /> Pcs
                  </span>
              </div>
              <div className="absolute -right-2 -bottom-2 md:static md:p-3 md:bg-blue-50 md:rounded-full md:text-blue-600 opacity-20 md:opacity-100 transform scale-150 md:scale-100">
                  <Package className="w-10 h-10 md:w-6 md:h-6" />
              </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-xs text-slate-500 font-bold mb-2">Tren 6 Bulan Terakhir</p>
             <div className="h-[80px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', fontSize: '10px'}}
                            itemStyle={{color: '#059669', fontWeight: 'bold'}}
                        />
                        <Area type="monotone" dataKey="selesai" stroke="#10b981" fillOpacity={1} fill="url(#colorSelesai)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase font-bold tracking-wider">
                <th className="px-6 py-4">No. Order</th>
                <th className="px-6 py-4">Pemesan</th>
                <th className="px-6 py-4">Jenis Produksi</th>
                <th className="px-6 py-4 text-center">Jml (Pcs)</th>
                <th className="px-6 py-4">Tgl. Selesai (Est)</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {finishedOrders.length > 0 ? (
                finishedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-slate-500">#{order.kode_produksi}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{order.nama_pemesan}</td>
                    <td className="px-6 py-4"><span className="inline-block px-2 py-1 rounded border border-slate-200 text-[10px] font-bold text-slate-600 bg-slate-100 uppercase">{order.jenis_produksi}</span></td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{order.jumlah}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(order.deadline)}</td>
                    <td className="px-6 py-4 text-center"><span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Selesai <CheckCircle2 className="w-3 h-3" /></span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-8 h-8 opacity-20" />
                        <p>Belum ada data pesanan selesai yang ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>Menampilkan {finishedOrders.length} data</span>
        </div>
      </div>
    </div>
  );
}