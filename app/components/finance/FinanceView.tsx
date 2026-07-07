"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
  FileText,
  Banknote,
  Settings2,
  Table2,
} from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { OrderRow } from "./OrderRow";
import { OrderCard } from "./OrderCard";
import { PaymentModal } from "./PaymentModal";
import { PriceSettingsTab } from "./PriceSettingsTab";
import { useHargaConfig } from "./useHargaConfig";
import { formatRupiah, getPaymentFigures } from "./utils";
import { FinanceViewProps, OrderWithPayment, PaymentStatus } from "./types";

const TABLE_HEADERS = [
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
];

const STATUS_FILTERS = ["Semua", "Belum DP", "DP", "Lunas"] as const;

type PageTab = "data" | "pengaturan";

export default function FinanceView({
  orders,
  currentUser,
  onUpdatePayment,
}: FinanceViewProps) {
  const [tab, setTab] = useState<PageTab>("data");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "Semua">(
    "Semua",
  );
  const [editingOrder, setEditingOrder] = useState<OrderWithPayment | null>(
    null,
  );

  const canEdit = currentUser.permissions?.keuangan?.edit ?? false;

  const { config, saveConfig } = useHargaConfig();

  const filtered = useMemo(() => {
    return (orders as OrderWithPayment[]).filter((o) => {
      const matchSearch =
        !search ||
        o.kode_produksi?.toLowerCase().includes(search.toLowerCase()) ||
        o.nama_pemesan?.toLowerCase().includes(search.toLowerCase()) ||
        o.jenis_produksi?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "Semua" ||
        (o.status_pembayaran ?? "Belum DP") === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, search, filterStatus]);

  const summary = useMemo(() => {
    let totalOmset = 0;
    let totalMasuk = 0;
    let totalSisa = 0;
    let countLunas = 0;
    let countBelumDp = 0;
    let countDp = 0;

    for (const o of orders as OrderWithPayment[]) {
      const { totalHarga, dpMasuk, sisaTagihan } = getPaymentFigures(o);
      totalOmset += totalHarga;
      totalMasuk += dpMasuk;
      totalSisa += sisaTagihan;

      const status = o.status_pembayaran ?? "Belum DP";
      if (status === "Lunas") countLunas++;
      else if (status === "DP") countDp++;
      else countBelumDp++;
    }

    return {
      totalOmset,
      totalMasuk,
      totalSisa,
      countLunas,
      countBelumDp,
      countDp,
    };
  }, [orders]);

  const filterCount = (status: (typeof STATUS_FILTERS)[number]) => {
    if (status === "Belum DP") return summary.countBelumDp;
    if (status === "DP") return summary.countDp;
    if (status === "Lunas") return summary.countLunas;
    return null;
  };

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

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setTab("data")}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 border-b-2 transition ${
            tab === "data"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Table2 className="w-3.5 h-3.5" />
          Data Pembayaran
        </button>
        <button
          onClick={() => setTab("pengaturan")}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 border-b-2 transition ${
            tab === "pengaturan"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Pengaturan Harga
        </button>
      </div>

      {tab === "pengaturan" ? (
        <PriceSettingsTab
          config={config}
          canEdit={canEdit}
          onSave={(next) => saveConfig(next, currentUser.name)}
        />
      ) : (
        <>
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

          {/* ── Status filter pills & search ── */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => {
                const count = filterCount(s);
                return (
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
                    {count !== null && (
                      <span className="ml-1.5 text-[10px] opacity-70">
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
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
                    {TABLE_HEADERS.map((h) => (
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
                        colSpan={TABLE_HEADERS.length}
                        className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm"
                      >
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Tidak ada data</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        canEdit={canEdit}
                        onEdit={setEditingOrder}
                      />
                    ))
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
              filtered.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  canEdit={canEdit}
                  onEdit={setEditingOrder}
                />
              ))
            )}
          </div>

          {/* ── Payment Modal ── */}
          {editingOrder && (
            <PaymentModal
              order={editingOrder}
              canEdit={canEdit}
              config={config}
              onClose={() => setEditingOrder(null)}
              onSubmit={async (data) => {
                await onUpdatePayment(editingOrder.id, data);
                setEditingOrder(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
