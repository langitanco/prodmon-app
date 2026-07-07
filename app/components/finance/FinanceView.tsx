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
  Download,
} from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { OrderRow } from "./OrderRow";
import { OrderCard } from "./OrderCard";
import { PaymentModal } from "./PaymentModal";
import { formatRupiah, getPaymentFigures } from "./utils";
import { FinanceViewProps, OrderWithPayment, PaymentStatus } from "./types";
import { calculateTotalHarga } from "./pricing";

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

export default function FinanceView({
  orders,
  currentUser,
  onUpdatePayment,
}: FinanceViewProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "Semua">(
    "Semua",
  );
  const [editingOrder, setEditingOrder] = useState<OrderWithPayment | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const canEdit = currentUser.permissions?.keuangan?.edit ?? false;

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

      let matchDate = true;
      if ((dateFrom || dateTo) && o.tanggal_masuk) {
        const orderDate = new Date(o.tanggal_masuk);
        orderDate.setHours(0, 0, 0, 0);

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (orderDate < from) matchDate = false;
        }
        if (matchDate && dateTo) {
          const to = new Date(dateTo);
          to.setHours(0, 0, 0, 0);
          if (orderDate > to) matchDate = false;
        }
      } else if ((dateFrom || dateTo) && !o.tanggal_masuk) {
        // order tanpa tanggal_masuk tidak ikut ketika filter tanggal aktif
        matchDate = false;
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, search, filterStatus, dateFrom, dateTo]);

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

  async function handleExportExcel() {
    if (filtered.length === 0) {
      alert("Tidak ada data untuk diexport.");
      return;
    }
    setExporting(true);
    try {
      const XLSX = await import("xlsx");

      // ── Sheet 1: Rekap per kode produksi ──
      const rekapRows = filtered.map((order) => {
        const { totalHarga, dpMasuk, sisaTagihan } = getPaymentFigures(order);
        return {
          "Kode Produksi": order.kode_produksi,
          Tanggal: order.tanggal_masuk
            ? new Date(order.tanggal_masuk).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "-",
          Klien: order.nama_pemesan,
          "Jenis Produksi": order.jenis_produksi,
          Qty: order.jumlah,
          "Harga/Pcs": order.harga_per_pcs ?? 0,
          "Biaya Ukuran Besar": order.biaya_ukuran_besar ?? 0,
          "Biaya Lengan Panjang": order.biaya_lengan_panjang ?? 0,
          "Total Harga": totalHarga,
          "DP Masuk": dpMasuk,
          "Sisa Tagihan": sisaTagihan,
          Status: order.status_pembayaran ?? "Belum DP",
        };
      });

      // ── Sheet 2: Rincian per warna + lengan + ukuran ──
      const detailRows: Record<string, any>[] = [];
      filtered.forEach((order) => {
        const result = calculateTotalHarga(
          order.detail_ukuran,
          order.harga_per_pcs ?? 0,
          order.jumlah ?? 0,
          order.biaya_ukuran_besar ?? 0,
          order.biaya_lengan_panjang ?? 0,
        );

        if (result.isLegacy) {
          // Order lama tanpa detail_ukuran, tetap dicatat 1 baris ringkas
          detailRows.push({
            "Kode Produksi": order.kode_produksi,
            Klien: order.nama_pemesan,
            Warna: "-",
            Lengan: "-",
            Ukuran: "-",
            Qty: order.jumlah,
            "Harga/Pcs": order.harga_per_pcs ?? 0,
            Subtotal: result.totalHarga,
          });
          return;
        }

        result.entries.forEach((entry) => {
          entry.sizes.forEach((size) => {
            detailRows.push({
              "Kode Produksi": order.kode_produksi,
              Klien: order.nama_pemesan,
              Warna: entry.warna,
              Lengan: entry.lengan,
              Ukuran: size.ukuran,
              Qty: size.qty,
              "Harga/Pcs": size.hargaPerPcs,
              Subtotal: size.subtotal,
            });
          });
        });
      });

      const wb = XLSX.utils.book_new();

      const wsRekap = XLSX.utils.json_to_sheet(rekapRows);
      wsRekap["!cols"] = [
        { wch: 16 }, // Kode Produksi
        { wch: 12 }, // Tanggal
        { wch: 20 }, // Klien
        { wch: 16 }, // Jenis Produksi
        { wch: 8 }, // Qty
        { wch: 14 }, // Harga/Pcs
        { wch: 16 }, // Biaya Ukuran Besar
        { wch: 16 }, // Biaya Lengan Panjang
        { wch: 16 }, // Total Harga
        { wch: 14 }, // DP Masuk
        { wch: 14 }, // Sisa Tagihan
        { wch: 12 }, // Status
      ];
      XLSX.utils.book_append_sheet(wb, wsRekap, "Rekap Keuangan");

      const wsDetail = XLSX.utils.json_to_sheet(detailRows);
      wsDetail["!cols"] = [
        { wch: 16 }, // Kode Produksi
        { wch: 20 }, // Klien
        { wch: 12 }, // Warna
        { wch: 10 }, // Lengan
        { wch: 10 }, // Ukuran
        { wch: 8 }, // Qty
        { wch: 14 }, // Harga/Pcs
        { wch: 14 }, // Subtotal
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, "Rincian Ukuran");

      const tanggalFile = new Date().toISOString().slice(0, 10);
      const labelStatus = filterStatus === "Semua" ? "" : `-${filterStatus}`;
      const labelRange =
        dateFrom || dateTo
          ? `-${dateFrom || "awal"}_sd_${dateTo || "akhir"}`
          : "";
      XLSX.writeFile(
        wb,
        `Laporan-Keuangan${labelStatus}${labelRange}-${tanggalFile}.xlsx`,
      );
    } catch (err) {
      console.error(err);
      alert(
        "Gagal membuat file Excel. Pastikan package 'xlsx' sudah terinstall.",
      );
    } finally {
      setExporting(false);
    }
  }

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

      {/* ── Status filter pills, export button & search ── */}
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

        <div className="flex flex-wrap items-center gap-2">
          {/* ── Filter rentang tanggal ── */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition"
              aria-label="Tanggal mulai"
            />
            <span className="text-[11px] text-slate-400">s/d</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition"
              aria-label="Tanggal sampai"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-[11px] text-slate-400 hover:text-red-500 underline underline-offset-2 transition"
              >
                Reset
              </button>
            )}
          </div>

          <button
            onClick={handleExportExcel}
            disabled={exporting || filtered.length === 0}
            className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl transition-colors"
          >
            <Download size={13} className={exporting ? "animate-bounce" : ""} />
            {exporting ? "Membuat..." : "Laporan Excel"}
          </button>

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
