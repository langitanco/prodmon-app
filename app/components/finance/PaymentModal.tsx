import React, { useMemo, useState } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ReceiptText,
  Info,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { CurrencyInput } from "./CurrencyInput";
import { formatRupiah } from "./utils";
import { calculateTotalHarga } from "./pricing";
import { OrderWithPayment, PaymentData, PaymentStatus } from "./types";

interface PaymentModalProps {
  order: OrderWithPayment;
  canEdit: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentData) => void;
}

function deriveStatus(totalHarga: number, dpMasuk: number): PaymentStatus {
  if (totalHarga > 0 && dpMasuk >= totalHarga) return "Lunas";
  if (dpMasuk > 0) return "DP";
  return "Belum DP";
}

export function PaymentModal({
  order,
  canEdit,
  onClose,
  onSubmit,
}: PaymentModalProps) {
  const [hargaPerPcs, setHargaPerPcs] = useState<number>(
    order.harga_per_pcs ?? 0,
  );
  const [biayaUkuranBesar, setBiayaUkuranBesar] = useState<number>(
    order.biaya_ukuran_besar ?? 0,
  );
  const [biayaLenganPanjang, setBiayaLenganPanjang] = useState<number>(
    order.biaya_lengan_panjang ?? 0,
  );
  const [dpMasuk, setDpMasuk] = useState<number>(order.dp_masuk ?? 0);
  const [statusPembayaran, setStatusPembayaran] = useState<PaymentStatus>(
    order.status_pembayaran ?? "Belum DP",
  );
  const [saving, setSaving] = useState(false);

  const pricing = useMemo(
    () =>
      calculateTotalHarga(
        order.detail_ukuran,
        hargaPerPcs,
        order.jumlah,
        biayaUkuranBesar,
        biayaLenganPanjang,
      ),
    [
      order.detail_ukuran,
      order.jumlah,
      hargaPerPcs,
      biayaUkuranBesar,
      biayaLenganPanjang,
    ],
  );

  const totalHarga = pricing.totalHarga;
  const sisaTagihan = Math.max(0, totalHarga - dpMasuk);
  const isLunas = sisaTagihan === 0 && totalHarga > 0;
  const pcsMismatch = !pricing.isLegacy && pricing.totalPcs !== order.jumlah;
  const hasSizeDetail = !pricing.isLegacy && pricing.entries.length > 0;
  const hasLenganPanjang =
    hasSizeDetail && pricing.entries.some((e) => e.lengan === "panjang");
  const hasUkuranBesar =
    hasSizeDetail &&
    pricing.entries.some((e) =>
      e.sizes.some((s) => ["XXL", "XXXL"].includes(s.ukuran.toUpperCase())),
    );

  const autoStatus = useMemo(
    () => deriveStatus(totalHarga, dpMasuk),
    [totalHarga, dpMasuk],
  );

  const handleDpChange = (v: number) => {
    setDpMasuk(v);
    setStatusPembayaran(deriveStatus(totalHarga, v));
  };

  const handleSubmit = async () => {
    if (!canEdit || hargaPerPcs <= 0) return;
    setSaving(true);
    await onSubmit({
      harga_per_pcs: hargaPerPcs,
      total_harga: totalHarga,
      dp_masuk: dpMasuk,
      status_pembayaran: statusPembayaran,
      biaya_ukuran_besar: biayaUkuranBesar,
      biaya_lengan_panjang: biayaLenganPanjang,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
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

        <div className="overflow-y-auto">
          {/* Order Summary */}
          <div className="mx-5 mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Qty
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {order.jumlah} pcs
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Jenis
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                  {order.jenis_produksi}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Status
                </p>
                <StatusBadge status={order.status_pembayaran} />
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-5 py-4 space-y-3">
            <CurrencyInput
              label="Harga Dasar / Pcs (ukuran standar, lengan pendek)"
              value={hargaPerPcs}
              onChange={setHargaPerPcs}
              required
            />

            {/* Biaya tambahan — hanya tampil kalau order ini punya rincian ukuran */}
            {hasSizeDetail && (
              <div className="grid grid-cols-2 gap-3">
                <CurrencyInput
                  label="Tambahan / Pcs mulai XXL (per step)"
                  value={biayaUkuranBesar}
                  onChange={setBiayaUkuranBesar}
                />
                <CurrencyInput
                  label="Tambahan / Pcs Lengan Panjang"
                  value={biayaLenganPanjang}
                  onChange={setBiayaLenganPanjang}
                />
              </div>
            )}
            {hasSizeDetail && (
              <p className="text-[10px] text-slate-400 -mt-2">
                Sesuaikan nilai tambahan ini sesuai jenis produksi (mis. kaos vs
                hoodie/sweater bisa beda). Nilai ini tersimpan khusus untuk
                order ini saja.
                {hasUkuranBesar || hasLenganPanjang
                  ? ""
                  : " Order ini tidak ada varian XXL+/lengan panjang, jadi tidak berpengaruh."}
              </p>
            )}

            {/* Rincian per varian (warna + lengan + ukuran) */}
            {hasSizeDetail && (
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Rincian Harga per Varian
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pricing.entries.map((entry) => (
                    <div key={entry.entryId} className="px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {entry.warna} ·{" "}
                          {entry.lengan === "panjang"
                            ? "Lengan Panjang"
                            : "Lengan Pendek"}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                          {formatRupiah(entry.subtotal)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {entry.sizes.map((s) => (
                          <span
                            key={s.ukuran}
                            className="text-[10px] text-slate-400 dark:text-slate-500 font-mono"
                          >
                            {s.ukuran}×{s.qty} @ {formatRupiah(s.hargaPerPcs)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pcsMismatch && (
              <div className="flex items-start gap-2 rounded-xl p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  Jumlah pcs dari rincian ukuran ({pricing.totalPcs}) berbeda
                  dengan qty order ({order.jumlah}). Total harga tetap dihitung
                  dari rincian ukuran.
                </p>
              </div>
            )}

            <CurrencyInput
              label={`Total Harga${pricing.isLegacy ? ` (${order.jumlah} × Harga Dasar)` : " (dari rincian ukuran)"}`}
              value={totalHarga}
              readOnly
            />
            <CurrencyInput
              label="DP / Nominal Masuk"
              value={dpMasuk}
              onChange={handleDpChange}
            />

            {/* Sisa Tagihan visual */}
            <div
              className={`rounded-xl p-3 border flex items-center justify-between ${
                isLunas
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/40"
                  : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/40"
              }`}
            >
              <div className="flex items-center gap-2">
                {isLunas ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Sisa Tagihan
                </span>
              </div>
              <span
                className={`text-sm font-bold font-mono ${
                  isLunas
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {formatRupiah(sisaTagihan)}
              </span>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Status Pembayaran
              </label>
              <div className="relative">
                <select
                  value={statusPembayaran}
                  onChange={(e) =>
                    setStatusPembayaran(e.target.value as PaymentStatus)
                  }
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                >
                  <option value="Belum DP">🔴 Belum DP</option>
                  <option value="DP">🟡 DP</option>
                  <option value="Lunas">🟢 Lunas</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {statusPembayaran !== autoStatus && (
                <p className="text-[10px] text-blue-500 mt-1">
                  💡 Rekomendasi otomatis: <strong>{autoStatus}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Batal
          </button>
          {canEdit && (
            <button
              onClick={handleSubmit}
              disabled={saving || hargaPerPcs <= 0}
              className="flex-1 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Menyimpan...
                </>
              ) : (
                <>
                  <ReceiptText className="w-3.5 h-3.5" /> Simpan & Sinkronkan
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
