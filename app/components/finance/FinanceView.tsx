"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  DollarSign,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Calculator,
  ChevronDown,
  FileText,
  CreditCard,
  Banknote,
  ReceiptText,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { Order, UserData } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus = "Belum DP" | "DP" | "Lunas";

interface FinanceViewProps {
  orders: Order[];
  currentUser: UserData;
  onUpdatePayment: (
    orderId: string,
    data: {
      harga_per_pcs: number;
      total_harga: number;
      dp_masuk: number;
      status_pembayaran: PaymentStatus;
    },
  ) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRupiah = (value: number): string => {
  if (!value || value === 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const parseRupiah = (value: string): number => {
  return parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
};

const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: PaymentStatus }) {
  const s = status ?? "Belum DP";

  const config: Record<
    PaymentStatus,
    { cls: string; icon: React.ReactNode; label: string }
  > = {
    "Belum DP": {
      cls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40",
      icon: <AlertCircle className="w-3 h-3" />,
      label: "Belum DP",
    },
    DP: {
      cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
      icon: <Clock className="w-3 h-3" />,
      label: "DP",
    },
    Lunas: {
      cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: "Lunas",
    },
  };

  const { cls, icon, label } = config[s];

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}

// ─── Currency Input ───────────────────────────────────────────────────────────

function CurrencyInput({
  label,
  value,
  onChange,
  readOnly = false,
  required = false,
}: {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  const [raw, setRaw] = useState(value > 0 ? value.toString() : "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setRaw(digits);
    onChange?.(parseInt(digits, 10) || 0);
  };

  const display = readOnly
    ? formatRupiah(value)
    : raw
      ? `Rp ${parseInt(raw || "0", 10).toLocaleString("id-ID")}`
      : "";

  const baseCls =
    "w-full border rounded-xl px-3 py-2.5 text-sm font-mono transition outline-none focus:ring-2 focus:ring-blue-500";
  const editCls =
    "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400";
  const readonlyCls =
    "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed";

  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {readOnly ? (
        <div className={`${baseCls} ${readonlyCls}`}>{display || "Rp 0"}</div>
      ) : (
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          placeholder="Rp 0"
          className={`${baseCls} ${editCls}`}
        />
      )}
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentModal({
  order,
  canEdit,
  onClose,
  onSubmit,
}: {
  order: Order;
  canEdit: boolean;
  onClose: () => void;
  onSubmit: (data: {
    harga_per_pcs: number;
    total_harga: number;
    dp_masuk: number;
    status_pembayaran: PaymentStatus;
  }) => void;
}) {
  const [hargaPerPcs, setHargaPerPcs] = useState<number>(
    (order as any).harga_per_pcs ?? 0,
  );
  const [dpMasuk, setDpMasuk] = useState<number>((order as any).dp_masuk ?? 0);
  const [statusPembayaran, setStatusPembayaran] = useState<PaymentStatus>(
    (order as any).status_pembayaran ?? "Belum DP",
  );
  const [saving, setSaving] = useState(false);

  const totalHarga = hargaPerPcs * order.jumlah;
  const sisaTagihan = Math.max(0, totalHarga - dpMasuk);

  // Auto-select status
  const autoStatus = useMemo<PaymentStatus>(() => {
    if (totalHarga > 0 && dpMasuk >= totalHarga) return "Lunas";
    if (dpMasuk > 0) return "DP";
    return "Belum DP";
  }, [totalHarga, dpMasuk]);

  const handleDpChange = (v: number) => {
    setDpMasuk(v);
    setStatusPembayaran(
      totalHarga > 0 && v >= totalHarga ? "Lunas" : v > 0 ? "DP" : "Belum DP",
    );
  };

  const handleSubmit = async () => {
    if (!canEdit || hargaPerPcs <= 0) return;
    setSaving(true);
    await onSubmit({
      harga_per_pcs: hargaPerPcs,
      total_harga: totalHarga,
      dp_masuk: dpMasuk,
      status_pembayaran: statusPembayaran,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
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
              <StatusBadge status={(order as any).status_pembayaran} />
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3">
          <CurrencyInput
            label={`Harga per Pcs`}
            value={hargaPerPcs}
            onChange={setHargaPerPcs}
            required
          />
          <CurrencyInput
            label={`Total Harga (${order.jumlah} × Harga per Pcs)`}
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
              sisaTagihan === 0 && totalHarga > 0
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/40"
                : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/40"
            }`}
          >
            <div className="flex items-center gap-2">
              {sisaTagihan === 0 && totalHarga > 0 ? (
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
                sisaTagihan === 0 && totalHarga > 0
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

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
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

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-800 dark:text-white font-mono truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinanceView({
  orders,
  currentUser,
  onUpdatePayment,
}: FinanceViewProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "Semua">(
    "Semua",
  );
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const canEdit = currentUser.permissions?.keuangan?.edit ?? false;

  // ─── Filtered orders ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const s = o as any;
      const matchSearch =
        !search ||
        o.kode_produksi?.toLowerCase().includes(search.toLowerCase()) ||
        o.nama_pemesan?.toLowerCase().includes(search.toLowerCase()) ||
        o.jenis_produksi?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "Semua" ||
        (s.status_pembayaran ?? "Belum DP") === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, search, filterStatus]);

  // ─── Summary ──────────────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const totalOmset = orders.reduce(
      (acc, o) => acc + ((o as any).total_harga ?? 0),
      0,
    );
    const totalMasuk = orders.reduce(
      (acc, o) => acc + ((o as any).dp_masuk ?? 0),
      0,
    );
    const totalSisa = orders.reduce((acc, o) => {
      const t = (o as any).total_harga ?? 0;
      const d = (o as any).dp_masuk ?? 0;
      return acc + Math.max(0, t - d);
    }, 0);
    const countLunas = orders.filter(
      (o) => (o as any).status_pembayaran === "Lunas",
    ).length;
    const countBelumDp = orders.filter(
      (o) => ((o as any).status_pembayaran ?? "Belum DP") === "Belum DP",
    ).length;
    const countDp = orders.filter(
      (o) => (o as any).status_pembayaran === "DP",
    ).length;
    return {
      totalOmset,
      totalMasuk,
      totalSisa,
      countLunas,
      countBelumDp,
      countDp,
    };
  }, [orders]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 pb-24">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
            Keuangan
          </h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Monitoring pembayaran & buku besar
          </p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Omset"
          value={formatRupiah(summary.totalOmset)}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          color="bg-blue-50 dark:bg-blue-900/30"
        />
        <SummaryCard
          label="Dana Masuk"
          value={formatRupiah(summary.totalMasuk)}
          icon={<Banknote className="w-5 h-5 text-emerald-600" />}
          color="bg-emerald-50 dark:bg-emerald-900/30"
        />
        <SummaryCard
          label="Sisa Tagihan"
          value={formatRupiah(summary.totalSisa)}
          icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
          color="bg-amber-50 dark:bg-amber-900/30"
        />
        <SummaryCard
          label="Lunas / Aktif"
          value={`${summary.countLunas} / ${orders.length}`}
          icon={<CheckCircle2 className="w-5 h-5 text-violet-600" />}
          color="bg-violet-50 dark:bg-violet-900/30"
        />
      </div>

      {/* ── Status filter pills ── */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {(["Semua", "Belum DP", "DP", "Lunas"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
                filterStatus === s
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
              }`}
            >
              {s}
              {s !== "Semua" && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  (
                  {s === "Belum DP"
                    ? summary.countBelumDp
                    : s === "DP"
                      ? summary.countDp
                      : summary.countLunas}
                  )
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari invoice, klien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 pl-8 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-slate-400"
          />
        </div>
      </div>

      {/* ── Table: Desktop ── */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60">
                {[
                  "No. Invoice",
                  "Tgl Masuk",
                  "Klien",
                  "Detail",
                  "Qty",
                  "Total Harga",
                  "DP Masuk",
                  "Sisa",
                  "Status",
                  "Aksi",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm"
                  >
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Tidak ada data</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const o = order as any;
                  const totalHarga = o.total_harga ?? 0;
                  const dpMasuk = o.dp_masuk ?? 0;
                  const sisaTagihan = Math.max(0, totalHarga - dpMasuk);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                    >
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
                          <span className="text-slate-300 dark:text-slate-600">
                            –
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {dpMasuk > 0 ? (
                          formatRupiah(dpMasuk)
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            –
                          </span>
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
                        <StatusBadge status={o.status_pembayaran} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditingOrder(order)}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2.5 py-1.5 rounded-lg transition whitespace-nowrap"
                        >
                          <Calculator className="w-3 h-3" />
                          {canEdit ? "Edit" : "Detail"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Cards: Mobile ── */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Tidak ada data</p>
          </div>
        ) : (
          filtered.map((order) => {
            const o = order as any;
            const totalHarga = o.total_harga ?? 0;
            const dpMasuk = o.dp_masuk ?? 0;
            const sisaTagihan = Math.max(0, totalHarga - dpMasuk);

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4"
              >
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
                  <StatusBadge status={o.status_pembayaran} />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-400 uppercase">
                      Total
                    </p>
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
                  onClick={() => setEditingOrder(order)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 py-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40 transition"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  {canEdit ? "Edit Pembayaran" : "Lihat Detail"}
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ── Payment Modal ── */}
      {editingOrder && (
        <PaymentModal
          order={editingOrder}
          canEdit={canEdit}
          onClose={() => setEditingOrder(null)}
          onSubmit={async (data) => {
            await onUpdatePayment(editingOrder.id, data);
            setEditingOrder(null);
          }}
        />
      )}
    </div>
  );
}
