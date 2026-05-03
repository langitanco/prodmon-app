// app/components/orders/detail/OrderDetailHeader.tsx

import React from 'react';
import { formatDate, getStatusColor, openWA, getDeadlineStatus } from '@/lib/utils';
import { Order, UserData } from '@/types';
import { ChevronRight, MessageCircle, Pencil, Phone, Printer, Trash2, User, Users } from 'lucide-react';

interface OrderDetailHeaderProps {
  order: Order;
  currentUser: UserData;
  isPrintingLabel: boolean;
  canEditOrderInfo: boolean;
  canDeleteOrder: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onPrintLabel: () => void;
}

// Ganti dengan domain produksi Anda
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://langitanco-superapp.vercel.app';

export default function OrderDetailHeader({
  order, currentUser, isPrintingLabel,
  canEditOrderInfo, canDeleteOrder,
  onBack, onEdit, onDelete, onPrintLabel,
}: OrderDetailHeaderProps) {
  const isManagement = ['admin', 'manager', 'supervisor'].includes(currentUser.role);
  const isLate = getDeadlineStatus(order.deadline, order.status) === 'overdue';

  // ─── Kirim konfirmasi pesanan via WhatsApp ────────────────────────────────

  const handleKirimKonfirmasi = () => {
    const trackingUrl = `${APP_URL}/tracking?kode=${encodeURIComponent(order.kode_produksi)}`;
    const pesan = [
      `Assalamu'alaikum, *${order.nama_pemesan}* 👋`,
      ``,
      `Pesanan Anda telah kami terima dan sedang kami proses.`,
      ``,
      `📦 *Detail Pesanan*`,
      `Kode  : *${order.kode_produksi}*`,
      `Item  : ${order.jumlah} pcs (${order.jenis_produksi})`,
      `Estimasi selesai: *${formatDate(order.deadline)}*`,
      ``,
      `🔍 *Pantau progres produksi Anda di:*`,
      trackingUrl,
      ``,
      `Terima kasih telah mempercayai Langitan.co 🙏`,
    ].join('\n');

    const nomorWA = order.no_hp?.replace(/\D/g, '');
    if (!nomorWA) {
      alert('Nomor HP pelanggan belum diisi.');
      return;
    }

    // Pastikan nomor diawali kode negara (62 untuk Indonesia)
    const nomorFormatted = nomorWA.startsWith('0')
      ? `62${nomorWA.slice(1)}`
      : nomorWA;

    window.open(
      `https://wa.me/${nomorFormatted}?text=${encodeURIComponent(pesan)}`,
      '_blank'
    );
  };

  return (
    <>
      {/* Tombol aksi atas */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="text-xs md:text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 font-bold p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 rotate-180" /> Kembali
        </button>
        <div className="flex flex-wrap gap-2">
          {/* Tombol kirim konfirmasi WA — hanya management */}
          {isManagement && 
          <button
            onClick={onPrintLabel}
            disabled={isPrintingLabel}
            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
          >
            <Printer className="w-3 h-3" />
            {isPrintingLabel ? 'Memproses...' : 'Label Kirim'}
          </button>
          }
          {canEditOrderInfo && (
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm transition"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
          {canDeleteOrder && (
            <button
              onClick={() => onDelete(order.id)}
              className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-red-700 shadow-sm transition"
            >
              <Trash2 className="w-3 h-3" /> Hapus
            </button>
          )}
        </div>
      </div>

      {/* Info pesanan */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mb-1">
            {order.nama_pemesan}
          </h1>
          <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium flex flex-wrap gap-2 md:gap-3 items-center">
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-600 dark:text-slate-300">
              #{order.kode_produksi}
            </span>
            <span>{order.jumlah} Pcs</span>
            <span className={isLate ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
              {formatDate(order.deadline)}
            </span>
            <button
              onClick={handleKirimKonfirmasi}
              className="bg-green-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5"
            >
              <MessageCircle className="w-3 h-3" /> Konfirmasi WA
            </button>
          </div>

          {isManagement && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900/40 w-fit">
                <User className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">PJ: {order.assigned_user?.name || '-'}</span>
              </div>
              {order.helper_user && (
                <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-lg border border-orange-100 dark:border-orange-900/40 w-fit">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">Helper: {order.helper_user.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 items-end w-full md:w-auto">
          <div className={`px-4 py-2 rounded-xl font-black text-xs md:text-sm border uppercase tracking-wider text-center w-full md:w-auto shadow-sm ${getStatusColor(order.status)}`}>
            {order.status}
          </div>
          {isLate && (
            <div className="px-4 py-2 rounded-xl font-black text-xs md:text-sm border border-red-200 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-100 dark:border-red-800 uppercase tracking-wider text-center w-full md:w-auto">
              TELAT DEADLINE
            </div>
          )}
        </div>
      </div>
    </>
  );
}