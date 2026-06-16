"use client";

import { useEffect, useState } from "react";
import { getAllPOOrders, deletePOOrder } from "@/lib/po/admin";
import { formatRupiah } from "@/lib/po/pricing";
import { POOrder } from "@/types/po";
import {
  Search,
  RefreshCw,
  ArrowLeft,
  MessageCircle,
  Trash2,
  ChevronRight,
  Package,
} from "lucide-react";

export default function POOrderList() {
  const [orders, setOrders] = useState<POOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<POOrder | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | "PUBLIC" | "RESELLER">(
    "ALL",
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const data = await getAllPOOrders();
    setOrders(data);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }

  async function handleDelete(id: string, po_number: string) {
    if (
      !confirm(
        `Hapus pesanan ${po_number}? Tindakan ini tidak bisa dibatalkan.`,
      )
    )
      return;
    const result = await deletePOOrder(id);
    if (result.success) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (selected?.id === id) setSelected(null);
    } else {
      alert("Gagal menghapus: " + result.error);
    }
  }

  const filtered = orders.filter((o) => {
    const matchType = filterType === "ALL" || o.customer_type === filterType;
    const matchSearch =
      o.po_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  /* ── Loading ───────────────────────────────────────────────── */
  if (loading)
    return (
      <div className="flex items-center gap-3 py-8 text-slate-400 dark:text-slate-500">
        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">Memuat pesanan...</span>
      </div>
    );

  /* ── Detail View ───────────────────────────────────────────── */
  if (selected) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={15} /> Kembali ke daftar
        </button>

        <div className="space-y-4 md:space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                Kode PO
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {selected.po_number}
              </p>
            </div>
            <span
              className={`inline-flex w-max text-xs font-extrabold px-3 py-1.5 rounded-xl mt-1
              ${
                selected.customer_type === "RESELLER"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {selected.customer_type}
            </span>
          </div>

          {/* Info Card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 md:p-5 space-y-4 text-sm">
            {[
              { label: "Nama", value: selected.customer_name, bold: true },
              {
                label: "WhatsApp",
                value: (
                  <a
                    href={`https://wa.me/${selected.customer_wa}`}
                    target="_blank"
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {selected.customer_wa}
                  </a>
                ),
              },
              { label: "Metode Kirim", value: selected.delivery_method },
              selected.shipping_address && {
                label: "Alamat",
                value: selected.shipping_address,
              },
              selected.po_resellers && {
                label: "Reseller",
                value: `${selected.po_resellers.nama} (${selected.po_resellers.kode})`,
              },
              {
                label: "Tanggal",
                value: new Date(selected.created_at).toLocaleDateString(
                  "id-ID",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                ),
              },
            ]
              .filter(Boolean)
              .map((row: any, idx) => (
                <div
                  key={row.label}
                  className={`flex flex-col sm:flex-row sm:justify-between items-start gap-1 sm:gap-4 ${
                    idx !== 0
                      ? "pt-3 border-t border-slate-200 dark:border-slate-700/50"
                      : ""
                  }`}
                >
                  <span className="text-slate-500 dark:text-slate-400 flex-shrink-0 text-xs sm:text-sm font-semibold sm:font-normal">
                    {row.label}
                  </span>
                  <span
                    className={`sm:text-right ${
                      row.bold
                        ? "font-bold text-slate-900 dark:text-white"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden overflow-x-auto">
            <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Package size={12} /> Item Pesanan
              </p>
            </div>
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900/50">
                  <th className="text-left px-4 py-3 font-semibold">Produk</th>
                  <th className="text-center px-3 py-3 font-semibold">Warna</th>
                  <th className="text-center px-3 py-3 font-semibold">
                    Lengan
                  </th>
                  <th className="text-center px-3 py-3 font-semibold">
                    Ukuran
                  </th>
                  <th className="text-center px-3 py-3 font-semibold">Qty</th>
                  <th className="text-right px-4 py-3 font-semibold">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent">
                {selected.order_items.map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                      {item.product_name}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">
                      {item.warna}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">
                      {item.lengan}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">
                      {item.ukuran}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {item.qty}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center px-4 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total Keseluruhan
              </span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatRupiah(selected.total_amount)}
              </span>
            </div>
          </div>

          {selected.notes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl px-4 py-3.5 text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
              <span className="font-bold block mb-1">Catatan Pembeli:</span>
              {selected.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`https://wa.me/${selected.customer_wa}`}
              target="_blank"
              className="w-full sm:flex-1 flex items-center justify-center gap-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl transition-colors shadow-sm"
            >
              <MessageCircle size={16} /> Hubungi via WhatsApp
            </a>
            <button
              onClick={() => handleDelete(selected.id, selected.po_number)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 text-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 py-3 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={15} /> Hapus Pesanan
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── List View ─────────────────────────────────────────────── */
  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Filter & Search */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative w-full lg:flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            placeholder="Cari nama atau kode PO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-all"
          />
        </div>

        {/* Tab Filter & Refresh Button */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex w-full sm:w-auto bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5">
            {(["ALL", "PUBLIC", "RESELLER"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-all
                  ${
                    filterType === type
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
              >
                {type === "ALL" ? "Semua" : type}
              </button>
            ))}
          </div>

          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="w-full sm:w-auto flex justify-center items-center gap-2 text-sm px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
        {filtered.length} pesanan ditemukan
      </p>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl">
          <Package size={32} strokeWidth={1.2} />
          <p className="text-sm font-semibold">Belum ada pesanan</p>
          <p className="text-xs">Coba ubah filter atau kata kunci pencarian</p>
        </div>
      ) : (
        /* Order Table */
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden overflow-x-auto bg-white dark:bg-slate-900/20">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="text-left px-5 py-3.5">Kode PO</th>
                <th className="text-left px-5 py-3.5">Pelanggan</th>
                <th className="text-center px-5 py-3.5">Tipe</th>
                <th className="text-right px-5 py-3.5">Total</th>
                <th className="text-right px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer group transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                      {order.po_number}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {order.customer_name}
                    </p>
                    {order.po_resellers && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {order.po_resellers.kode}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg
                      ${
                        order.customer_type === "RESELLER"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {order.customer_type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-slate-800 dark:text-slate-200">
                    {formatRupiah(order.total_amount)}
                  </td>
                  <td className="px-5 py-4 text-right text-xs text-slate-500 dark:text-slate-400">
                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ChevronRight
                      size={18}
                      className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors ml-auto"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
