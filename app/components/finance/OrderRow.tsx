import React from "react";
import { Calculator } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatRupiah, formatDateShort, getPaymentFigures } from "./utils";
import { OrderWithPayment } from "./types";

interface OrderRowProps {
  order: OrderWithPayment;
  canEdit: boolean;
  onEdit: (order: OrderWithPayment) => void;
}

export function OrderRow({ order, canEdit, onEdit }: OrderRowProps) {
  const { totalHarga, dpMasuk, sisaTagihan } = getPaymentFigures(order);

  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
          {order.kode_produksi}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {formatDateShort(order.tanggal_masuk)}
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
          {order.nama_pemesan}
        </p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[100px] truncate">
        {order.jenis_produksi}
      </td>
      <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">
        {order.jumlah} pcs
      </td>
      <td className="px-4 py-3 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
        {totalHarga > 0 ? (
          formatRupiah(totalHarga)
        ) : (
          <span className="text-slate-300 dark:text-slate-600">–</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
        {dpMasuk > 0 ? (
          formatRupiah(dpMasuk)
        ) : (
          <span className="text-slate-300 dark:text-slate-600">–</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
        {sisaTagihan > 0 ? (
          formatRupiah(sisaTagihan)
        ) : (
          <span className="text-emerald-500 dark:text-emerald-400">
            ✓ Lunas
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={order.status_pembayaran} />
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onEdit(order)}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2.5 py-1.5 rounded-lg transition whitespace-nowrap"
        >
          <Calculator className="w-3 h-3" />
          {canEdit ? "Edit" : "Detail"}
        </button>
      </td>
    </tr>
  );
}
