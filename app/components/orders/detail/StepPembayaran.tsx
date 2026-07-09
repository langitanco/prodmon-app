// app/components/orders/detail/StepPembayaran.tsx
//
// ── TAMBAHAN ── Section baru di Order Detail. Menggantikan alur lama di
// mana admin harus buka menu Finance terpisah untuk isi harga & status
// pembayaran. Sekarang jadi satu section di sini, dengan permission sendiri
// (`harga_pesanan`) supaya tidak otomatis terbuka untuk semua orang yang
// boleh edit order.
//
// Reuse PaymentForm dari modul finance (bukan duplikasi logic kalkulasi).

import React, { useState } from "react";
import { Order, UserData, BuktiPembayaran } from "@/types";
import { CreditCard, Trash2, Eye, Upload, ChevronDown } from "lucide-react";
import { PaymentForm } from "../../finance/PaymentForm";
import { PaymentData } from "../../finance/types";

interface StepPembayaranProps {
  order: Order;
  currentUser: UserData;
  canEditHarga: boolean;
  canDeleteBukti: boolean;
  onSubmitPayment: (data: PaymentData) => Promise<void> | void;
  // signature onTriggerUpload sudah diperluas di useUpload.ts dengan param `label` opsional
  onTriggerUpload: (
    type: string,
    stepId?: string,
    kendalaId?: string,
    label?: string,
  ) => void;
  onDeleteBukti: (attachmentId: string) => void;
}

export default function StepPembayaran({
  order,
  currentUser,
  canEditHarga,
  canDeleteBukti,
  onSubmitPayment,
  onTriggerUpload,
  onDeleteBukti,
}: StepPembayaranProps) {
  const [uploadLabel, setUploadLabel] = useState<"DP" | "Lunas">("DP");
  const bukti: BuktiPembayaran[] = order.bukti_pembayaran || [];

  // Kalau tidak punya izin sama sekali untuk lihat harga, section ini
  // disembunyikan total dari Order Detail (bukan cuma dibikin read-only),
  // supaya admin/role lain yang tidak berwenang tidak tahu ada data harga.
  if (!canEditHarga && bukti.length === 0 && !order.harga_per_pcs) return null;

  return (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="bg-slate-100 dark:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-lg">
          Harga & Pembayaran
        </h3>
      </div>

      <PaymentForm
        order={order}
        canEdit={canEditHarga}
        onSubmit={onSubmitPayment}
        hideSummary
      />

      {/* ── Bukti Pembayaran ── */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">
            Bukti Pembayaran
          </span>
          {canEditHarga && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={uploadLabel}
                  onChange={(e) =>
                    setUploadLabel(e.target.value as "DP" | "Lunas")
                  }
                  className="text-[11px] font-bold border border-slate-200 dark:border-slate-700 rounded-lg pl-2 pr-6 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none appearance-none"
                >
                  <option value="DP">Untuk: DP</option>
                  <option value="Lunas">Untuk: Pelunasan</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={() =>
                  onTriggerUpload(
                    "bukti_pembayaran",
                    undefined,
                    undefined,
                    uploadLabel,
                  )
                }
                className="flex items-center gap-1 text-[11px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 transition"
              >
                <Upload className="w-3 h-3" /> Upload
              </button>
            </div>
          )}
        </div>

        {bukti.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 dark:text-slate-600 italic">
              Belum ada bukti pembayaran diupload
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bukti.map((b) => (
              <div
                key={b.id}
                className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <img
                  src={b.url}
                  alt={`Bukti ${b.label}`}
                  className="w-full h-24 object-cover"
                />
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition font-bold text-xs"
                >
                  <Eye className="w-4 h-4 mr-1" /> Lihat
                </a>
                <span
                  className={`absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                    b.label === "Lunas"
                      ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {b.label}
                </span>
                {canDeleteBukti && (
                  <button
                    onClick={() => onDeleteBukti(b.id)}
                    className="absolute top-1.5 right-1.5 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                {b.timestamp && (
                  <p className="text-[9px] text-slate-400 px-1.5 py-1 truncate">
                    {new Date(b.timestamp).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
