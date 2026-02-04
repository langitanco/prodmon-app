// app/components/apps/SalaryView.tsx
import React, { useState, useMemo } from 'react';
import { UserData, Order } from '@/types';
import { 
  Banknote, ChevronRight, Calculator, Printer 
} from 'lucide-react';

interface SalaryViewProps {
  users: UserData[];
  orders: Order[];
}

export default function SalaryView({ users, orders }: SalaryViewProps) {
  // State untuk filter bulan/tahun
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [ratePerItem, setRatePerItem] = useState<number>(0); 

  // Filter Order berdasarkan Status Selesai & Periode
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Kita asumsikan gaji dihitung berdasarkan tanggal selesai (shipping/created)
      const date = new Date(o.created_at || new Date());
      const isPeriodMatch = date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      
      // Filter hanya yang status Selesai agar valid untuk digaji
      const isCompleted = o.status === 'Selesai'; 
      
      return isPeriodMatch && isCompleted;
    });
  }, [orders, selectedMonth, selectedYear]);

  // Grouping Data per User (PJ & Helper)
  const userProductionStats = useMemo(() => {
    const stats: Record<string, { totalOrders: number; totalQty: number; orders: { data: Order, role: 'PJ' | 'Helper' }[] }> = {};

    filteredOrders.forEach(order => {
      // 1. Cek User PJ (assigned_to)
      if (order.assigned_to) {
        if (!stats[order.assigned_to]) {
          stats[order.assigned_to] = { totalOrders: 0, totalQty: 0, orders: [] };
        }
        stats[order.assigned_to].totalOrders += 1;
        stats[order.assigned_to].totalQty += (order.jumlah || 0);
        stats[order.assigned_to].orders.push({ data: order, role: 'PJ' });
      }

      // 2. Cek User Helper (helper_id)
      if (order.helper_id) {
        if (!stats[order.helper_id]) {
          stats[order.helper_id] = { totalOrders: 0, totalQty: 0, orders: [] };
        }
        stats[order.helper_id].totalOrders += 1;
        stats[order.helper_id].totalQty += (order.jumlah || 0);
        stats[order.helper_id].orders.push({ data: order, role: 'Helper' });
      }
    });

    return stats;
  }, [filteredOrders]);

  // User yang aktif/dipilih
  const activeUserStats = selectedUserId ? userProductionStats[selectedUserId] : null;
  const activeUserDetail = users.find(u => u.id === selectedUserId);

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
      
      {/* HEADER & FILTER */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Banknote className="w-6 h-6 text-green-600" /> Manajemen Gaji Produksi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rekap produksi user (PJ & Helper) berdasarkan pesanan status "Selesai".
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
           <select 
             value={selectedMonth} 
             onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
             className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 p-2 outline-none cursor-pointer"
           >
             {Array.from({length: 12}, (_, i) => (
               <option key={i} value={i}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
             ))}
           </select>
           <select 
             value={selectedYear} 
             onChange={(e) => setSelectedYear(parseInt(e.target.value))}
             className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 p-2 outline-none cursor-pointer border-l border-slate-300 dark:border-slate-600 pl-2"
           >
             {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
           </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        
        {/* LIST USER (KIRI) */}
        <div className={`w-full md:w-1/3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
           <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 text-sm">
             Daftar Personil
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {users.filter(u => userProductionStats[u.id]).length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-xs">
                   Tidak ada data produksi selesai pada periode ini.
                </div>
              ) : (
                users.map(user => {
                  const stat = userProductionStats[user.id];
                  if (!stat) return null; 

                  return (
                    <button 
                      key={user.id}
                      onClick={() => { setSelectedUserId(user.id); setRatePerItem(0); }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group
                        ${selectedUserId === user.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedUserId === user.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                           {user.name.charAt(0)}
                        </div>
                        <div>
                           <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{user.name}</div>
                           <div className="text-[10px] text-slate-500 dark:text-slate-400 flex gap-2">
                             <span>📦 {stat.totalOrders} Job</span>
                             <span>👕 {stat.totalQty} Pcs</span>
                           </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-300 group-hover:text-blue-500 ${selectedUserId === user.id ? 'text-blue-600' : ''}`}/>
                    </button>
                  )
                })
              )}
           </div>
        </div>

        {/* DETAIL PRODUKSI (KANAN) */}
        <div className={`w-full md:w-2/3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
           {selectedUserId && activeUserStats ? (
             <>
               <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
                  <div className="flex items-center gap-3">
                     <button onClick={() => setSelectedUserId(null)} className="md:hidden p-1 bg-white border rounded shadow-sm"><ChevronRight className="w-4 h-4 rotate-180"/></button>
                     <div>
                       <h3 className="font-bold text-lg text-slate-800 dark:text-white">{activeUserDetail?.name}</h3>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Rincian Produksi: {new Date(0, selectedMonth).toLocaleString('id-ID', { month: 'long' })} {selectedYear}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-xs text-slate-500 uppercase font-bold">Total Produksi</div>
                     <div className="text-xl font-black text-blue-600">{activeUserStats.totalQty.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">Pcs</span></div>
                  </div>
               </div>

               {/* CALCULATOR SEDERHANA */}
               <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800 grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
                  <div className="flex items-center gap-2">
                     <Calculator className="w-4 h-4 text-slate-400"/>
                     <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Simulasi Gaji:</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Rate / Pcs (Rp)"
                      className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setRatePerItem(Number(e.target.value))}
                    />
                    <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold rounded-lg text-sm border border-green-200 dark:border-green-800 min-w-[120px] text-right">
                       Rp {(activeUserStats.totalQty * ratePerItem).toLocaleString('id-ID')}
                    </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kode</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Peran</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Item / Pesanan</th>
                        <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeUserStats.orders.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                           <td className="p-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                             {new Date(item.data.created_at || '').toLocaleDateString('id-ID', { day:'2-digit', month:'short' })}
                           </td>
                           <td className="p-3 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                             {item.data.kode_produksi}
                           </td>
                           <td className="p-3">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                item.role === 'PJ' 
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                              }`}>
                                {item.role}
                              </span>
                           </td>
                           <td className="p-3 text-xs text-slate-800 dark:text-slate-200">
                             <div className="font-bold truncate max-w-[150px] md:max-w-[200px]">{item.data.nama_pemesan}</div>
                             <div className="text-[10px] text-slate-500">{item.data.jenis_produksi}</div>
                           </td>
                           <td className="p-3 text-xs font-bold text-slate-800 dark:text-slate-200 text-right">
                             {item.data.jumlah}
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 p-8 text-center">
                <Printer className="w-16 h-16 mb-4 opacity-20"/>
                <p className="text-sm font-bold">Pilih User di sebelah kiri</p>
                <p className="text-xs max-w-xs mx-auto mt-2">Klik nama user untuk melihat detail produksi (PJ & Helper) yang telah dikerjakan dan menghitung estimasi gaji.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}