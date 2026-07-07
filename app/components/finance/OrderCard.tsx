import React from "react";
import { Calculator, ArrowUpRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatRupiah, getPaymentFigures } from "./utils";
import { OrderWithPayment } from "./types";

interface OrderCardProps {
  order: OrderWithPayment;
  canEdit: boolean;
  onEdit: (order: OrderWithPayment) => void;
}

export function OrderCard({ order, canEdit, onEdit }: OrderCardProps) {
  const { totalHarga, dpMasuk, sisaTagihan } = getPaymentFigures(order);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
            {order.kode_produksi}
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
            {order.nama_pemesan}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {order.jenis_produksi} · {order.jumlah} pcs
          </p>
        </div>
        <StatusBadge status={order.status_pembayaran} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <p className="text-[10px] text-slate-400 uppercase">Total</p>
          <p className="text-[11px] font-bold font-mono text-slate-700 dark:text-slate-200 mt-0.5">
            {totalHarga > 0 ? formatRupiah(totalHarga) : "–"}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
          <p className="text-[10px] text-emerald-500 uppercase">DP</p>
          <p className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {dpMasuk > 0 ? formatRupiah(dpMasuk) : "–"}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
          <p className="text-[10px] text-amber-500 uppercase">Sisa</p>
          <p className="text-[11px] font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
            {sisaTagihan > 0 ? formatRupiah(sisaTagihan) : "✓"}
          </p>
        </div>
      </div>

      <button
        onClick={() => onEdit(order)}
        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40 transition"
      >
        <Calculator className="w-3.5 h-3.5" />
        {canEdit ? "Edit Pembayaran" : "Lihat Detail"}
        <ArrowUpRight className="w-3 h-3" />
      </button>
    </div>
  );
}
