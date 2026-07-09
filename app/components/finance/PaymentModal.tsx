// app/components/finance/PaymentModal.tsx
//
// ── UBAH (refactor) ──
// Logic form & kalkulasi sudah dipindah ke PaymentForm.tsx. File ini sekarang
// cuma menyediakan "bingkai" modal (overlay, header kode_produksi/nama, tombol
// X) di sekitar <PaymentForm />. Fungsinya di aplikasi TIDAK berubah — tetap
// dipanggil dari FinanceView sebagai mode KOREKSI data yang sudah diisi admin
// dari Order Detail.

import React from "react";
import { X, CreditCard } from "lucide-react";
import { PaymentForm } from "./PaymentForm";
import { OrderWithPayment, PaymentData } from "./types";

interface PaymentModalProps {
  order: OrderWithPayment;
  canEdit: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentData) => void;
}

export function PaymentModal({
  order,
  canEdit,
  onClose,
  onSubmit,
}: PaymentModalProps) {
  const handleSubmit = async (data: PaymentData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                {order.kode_produksi}
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                {order.nama_pemesan}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <PaymentForm
            order={order}
            canEdit={canEdit}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
