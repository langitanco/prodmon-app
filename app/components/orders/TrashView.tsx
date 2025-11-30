import React from 'react';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Order } from '@/types';
import { RefreshCw, Trash2 } from 'lucide-react';

interface TrashViewProps {
  orders: Order[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export default function TrashView({ orders, onRestore, onPermanentDelete }: TrashViewProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Sampah</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">{orders.length} pesanan terhapus</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
          <Trash2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-400 font-medium">Sampah kosong</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-300 p-4 md:p-5 relative overflow-hidden opacity-75">
              <div className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-bl-lg">DIHAPUS</div>
              
              <div className="flex justify-between items-start mb-2 md:mb-4 mt-1">
                <span className="text-[10px] md:text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md">#{order.kode_produksi}</span>
                <span className={`text-[9px] md:text-[10px] font-extrabold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border uppercase tracking-wide whitespace-nowrap ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
              <h3 className="font-bold text-sm md:text-lg text-slate-800 line-clamp-1 mb-0.5 leading-tight">{order.nama_pemesan}</h3>
              <div className="text-[10px] md:text-xs text-slate-500 mb-2 md:mb-4 font-medium">
                Dihapus: {order.deleted_at ? formatDate(order.deleted_at) : '-'}
              </div>
              
              <div className="mt-2 flex gap-2">
                <button 
                  onClick={() => onRestore(order.id)}
                  className="flex-1 bg-green-600 text-white px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-green-700 transition border border-green-700 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5"/> Pulihkan
                </button>
                <button 
                  onClick={() => onPermanentDelete(order.id)}
                  className="flex-1 bg-red-600 text-white px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-red-700 transition border border-red-700 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5"/> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}