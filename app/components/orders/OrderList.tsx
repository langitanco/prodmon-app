import React, { useState } from 'react';
import { formatDate, getDeadlineStatus, getStatusColor, MONTHS } from '@/lib/utils';
import { Order, ProductionTypeData, UserData } from '@/types';
import { AlertTriangle, BarChart3, Calendar, ClipboardList, Clock, FileText, Trash2 } from 'lucide-react';

interface OrderListProps {
  role: string;
  orders: Order[];
  productionTypes: ProductionTypeData[];
  onSelectOrder: (id: string) => void;
  onNewOrder: () => void;
  onDeleteOrder: (id: string) => void;
  currentUser: UserData; // <-- Tambahan Prop
}

export default function OrderList({ role, orders, productionTypes, onSelectOrder, onNewOrder, onDeleteOrder, currentUser }: OrderListProps) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Cek Izin Hapus Pesanan (Global)
  const canDeleteOrder = role === 'supervisor' || currentUser?.permissions?.orders?.delete === true;

  const filteredOrders = orders.filter((o) => {
    let statusMatch = true;
    if (statusFilter === 'process') statusMatch = o.status === 'On Process' || o.status === 'Finishing';
    else if (statusFilter === 'overdue') statusMatch = getDeadlineStatus(o.deadline, o.status) === 'overdue';
    else if (statusFilter === 'completed') statusMatch = o.status === 'Selesai';

    let monthMatch = true;
    if (monthFilter !== 'all') {
      const orderDate = new Date(o.tanggal_masuk);
      const orderMonth = orderDate.getMonth(); 
      monthMatch = orderMonth.toString() === monthFilter;
    }

    let typeMatch = true;
    if (typeFilter !== 'all') {
      typeMatch = o.jenis_produksi === typeFilter;
    }

    return statusMatch && monthMatch && typeMatch;
  });

  return (
    <div className="space-y-4 md:space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Daftar Pesanan</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1 font-medium">Kelola {filteredOrders.length} pesanan masuk</p>
        </div>

        <div className="flex flex-row w-full md:w-auto items-center gap-2 md:gap-3 overflow-x-auto pb-1">
          <select 
            className="bg-white border border-slate-300 text-slate-700 text-[10px] md:text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">Semua Bulan</option>
            {MONTHS.map((m, i) => (
              <option key={i} value={i.toString()}>{m}</option>
            ))}
          </select>

          <select 
            className="bg-white border border-slate-300 text-slate-700 text-[10px] md:text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Semua Jenis</option>
            {productionTypes.map((pt) => (
              <option key={pt.id} value={pt.value}>{pt.name}</option>
            ))}
          </select>

          {(role === 'admin' || role === 'supervisor') && (
            <button onClick={onNewOrder} className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-[10px] md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-sm active:scale-95 whitespace-nowrap ml-auto md:ml-0">
              <ClipboardList className="w-3 h-3 md:w-4 md:h-4"/> Tambah
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: null, label: 'Semua' },
          { id: 'process', label: 'Proses' },
          { id: 'overdue', label: 'Telat' },
          { id: 'completed', label: 'Selesai' }
        ].map((f) => (
          <button 
            key={f.id || 'all'}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[10px] md:text-sm font-bold whitespace-nowrap transition border ${statusFilter === f.id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
          {filteredOrders.map((order) => {
             const deadlineStatus = getDeadlineStatus(order.deadline, order.status);
             const hasUnresolvedKendala = order.kendala && order.kendala.some(k => !k.isResolved);
             return (
              <div key={order.id} onClick={() => onSelectOrder(order.id)} className={`bg-white rounded-2xl shadow-sm border p-3 md:p-5 cursor-pointer hover:shadow-md transition relative overflow-hidden active:scale-[0.98] ${deadlineStatus === 'overdue' ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'}`}>
                {deadlineStatus === 'overdue' && <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] md:text-[10px] px-2 py-0.5 font-bold rounded-bl-lg z-10">TELAT</div>}
                {hasUnresolvedKendala && <div className="absolute top-0 left-0 bg-orange-500 text-white text-[8px] md:text-[10px] px-2 py-0.5 font-bold rounded-br-lg z-10 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>KENDALA</div>}
                
                <div className="flex justify-between items-start mb-1 md:mb-4 mt-1">
                  <span className="text-[10px] md:text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md">#{order.kode_produksi}</span>
                  <span className={`text-[9px] md:text-[10px] font-extrabold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border uppercase tracking-wide whitespace-nowrap ${getStatusColor(order.status)}`}>{order.status}</span>
                </div>
                <h3 className="font-bold text-sm md:text-lg text-slate-800 line-clamp-1 mb-0.5 md:mb-1 leading-tight">{order.nama_pemesan}</h3>
                <div className="text-[10px] md:text-xs text-slate-500 mb-2 md:mb-4 font-medium flex items-center gap-1">
                   <Calendar className="w-3 h-3"/> {formatDate(order.tanggal_masuk)}
                </div>
                
                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 md:grid-cols-1 gap-1 md:gap-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between text-[10px] md:text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium hidden md:flex"><FileText className="w-4 h-4"/> Jumlah</span>
                    <span className="text-slate-500 text-[8px] md:hidden uppercase font-bold">Jml</span>
                    <span className="font-bold text-slate-800">{order.jumlah} Pcs</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between text-[10px] md:text-sm border-l md:border-l-0 border-slate-100 pl-2 md:pl-0">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium hidden md:flex"><BarChart3 className="w-4 h-4"/> Tipe</span>
                    <span className="text-slate-500 text-[8px] md:hidden uppercase font-bold">Tipe</span>
                    <span className="font-bold text-slate-800 uppercase bg-slate-50 md:px-2 rounded">{order.jenis_produksi}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between text-[10px] md:text-sm border-l md:border-l-0 border-slate-100 pl-2 md:pl-0">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium hidden md:flex"><Clock className="w-4 h-4"/> Deadline</span>
                    <span className="text-slate-500 text-[8px] md:hidden uppercase font-bold">Deadline</span>
                    <span className={`font-bold ${deadlineStatus === 'overdue' ? 'text-red-600' : 'text-slate-800'}`}>{formatDate(order.deadline)}</span>
                  </div>
                </div>

                {/* --- LOGIKA BARU: TOMBOL HAPUS DI LUAR --- */}
                {canDeleteOrder && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); // Agar tidak masuk ke detail
                      onDeleteOrder(order.id); 
                    }}
                    className="mt-3 w-full bg-red-50 text-red-600 px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-red-100 transition border border-red-200 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5"/> Hapus Pesanan
                  </button>
                )}
                {/* ----------------------------------------- */}

              </div>
             );
          })}
          {filteredOrders.length === 0 && <div className="col-span-full text-center text-slate-400 py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs">Tidak ada pesanan sesuai filter</div>}
      </div>
    </div>
  );
}