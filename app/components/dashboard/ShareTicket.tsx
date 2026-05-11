import { AlertCircle } from 'lucide-react';
import { ActionItem } from '@/hooks/useDashboard';
import { formatDate } from '@/lib/utils';

interface ShareTicketProps {
  item: ActionItem;
}

// CATATAN: Komponen ini sengaja dipaksa LIGHT MODE agar hasil gambar yang di-share
// tetap bersih/putih seperti kertas, terlepas dari mode gelap yang aktif.
export function ShareTicket({ item }: ShareTicketProps) {
  const { order, type, detail } = item;

  let themeColor = 'bg-slate-800';
  let borderColor = 'border-slate-200';
  let alertBg = 'bg-slate-50';
  let alertText = 'text-slate-700';
  let label = 'INFO';

  switch (type) {
    case 'KENDALA':
      themeColor = 'bg-purple-600';
      borderColor = 'border-purple-200';
      alertBg = 'bg-purple-50';
      alertText = 'text-purple-800';
      label = 'KENDALA PRODUKSI';
      break;
    case 'REVISI':
      themeColor = 'bg-rose-600';
      borderColor = 'border-rose-200';
      alertBg = 'bg-rose-50';
      alertText = 'text-rose-800';
      label = 'REVISI QC';
      break;
    case 'TELAT':
      themeColor = 'bg-red-600';
      borderColor = 'border-red-200';
      alertBg = 'bg-red-50';
      alertText = 'text-red-800';
      label = 'TELAT DEADLINE';
      break;
    case 'URGENT':
      themeColor = 'bg-orange-500';
      borderColor = 'border-orange-200';
      alertBg = 'bg-orange-50';
      alertText = 'text-orange-800';
      label = 'MENDESAK (URGENT)';
      break;
  }

  return (
    <div className="w-[600px] bg-white text-slate-800 p-8 rounded-3xl border border-slate-200 shadow-xl font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className={`px-3 py-1 rounded text-white text-xs font-bold tracking-widest uppercase ${themeColor}`}>
              {label}
            </span>
            <span className="text-slate-400 font-mono text-sm">#{order.kode_produksi}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-2">{order.nama_pemesan}</h1>
          <p className="text-slate-500 text-sm mt-1">Dibuat: {formatDate(order.tanggal_masuk)}</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-slate-700">LCO Production</h2>
          <p className="text-xs text-slate-400">Production Control Card</p>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Jumlah</span>
          <span className="text-xl font-bold text-slate-800">{order.jumlah} Pcs</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Tipe</span>
          <span className="text-xl font-bold text-slate-800 uppercase">{order.jenis_produksi}</span>
        </div>
        <div className={`p-4 rounded-xl border ${type === 'TELAT' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
          <span className={`text-xs uppercase font-bold block mb-1 ${type === 'TELAT' ? 'text-red-500' : 'text-slate-500'}`}>
            Deadline
          </span>
          <span className={`text-xl font-bold ${type === 'TELAT' ? 'text-red-700' : 'text-slate-800'}`}>
            {formatDate(order.deadline)}
          </span>
        </div>
      </div>

      {/* Alert Message */}
      <div className={`p-5 rounded-2xl border-2 border-dashed ${borderColor} ${alertBg}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${themeColor} text-white`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`font-bold text-sm uppercase mb-1 ${alertText}`}>
              Catatan {type === 'KENDALA' ? 'Produksi' : 'Sistem'}:
            </h3>
            <p className={`text-lg font-bold leading-relaxed ${alertText}`}>{detail}</p>
            <p className="text-xs text-slate-800 mt-2">
              Laporan dibuat pada: {new Date().toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}