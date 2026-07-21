"use client";

import { useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getAllPOOrders,
  getPOSettingAdmin,
  updateItemShortage,
} from "@/lib/po/admin";
import { POOrder, POOrderItem, POSetting } from "@/types/po";
import POOrderPrintSlip from "./POOrderPrintSlip";
import {
  Search,
  Printer,
  CheckSquare,
  Users,
  Globe,
  Loader2,
  PackageX,
  PackageCheck,
  RotateCcw,
  ClipboardList,
  X,
} from "lucide-react";

/* ── Modal detail packing: kemas item satu-satu, tandai stok kurang ── */
function PackingDetailModal({
  order,
  onClose,
  onOrderUpdated,
}: {
  order: POOrder;
  onClose: () => void;
  onOrderUpdated: (updated: POOrder) => void;
}) {
  const [items, setItems] = useState<POOrderItem[]>([...order.order_items]);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  // Klik "Stok Tidak Ada" -> defaultnya dianggap kurang SEMUA (= qty item).
  // Admin cukup klik Simpan kalau memang kurang semua, atau ubah angkanya
  // dulu kalau cuma kurang sebagian.
  function startShortage(index: number) {
    setEditingIndex(index);
    setEditValue(items[index].qty);
  }

  function startEditExisting(index: number) {
    setEditingIndex(index);
    setEditValue(items[index].shortage_qty || 0);
  }

  async function confirmShortage(index: number) {
    const qty = items[index].qty;
    const clamped = Math.max(0, Math.min(editValue, qty));
    setSavingIndex(index);
    const result = await updateItemShortage(order.id, index, clamped);
    setSavingIndex(null);
    if (!result.success) {
      alert("Gagal menyimpan status stok: " + result.error);
      return;
    }
    const updatedItems = items.map((it, i) =>
      i === index ? { ...it, shortage_qty: clamped } : it,
    );
    setItems(updatedItems);
    setEditingIndex(null);
    onOrderUpdated({ ...order, order_items: updatedItems });
  }

  async function resetShortage(index: number) {
    setSavingIndex(index);
    const result = await updateItemShortage(order.id, index, 0);
    setSavingIndex(null);
    if (!result.success) {
      alert("Gagal reset status stok: " + result.error);
      return;
    }
    const updatedItems = items.map((it, i) =>
      i === index ? { ...it, shortage_qty: 0 } : it,
    );
    setItems(updatedItems);
    setEditingIndex(null);
    onOrderUpdated({ ...order, order_items: updatedItems });
  }

  const totalKurang = items.reduce((s, it) => s + (it.shortage_qty || 0), 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center justify-between z-10">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Kemas Pesanan
            </p>
            <h3 className="font-mono font-extrabold text-slate-900 dark:text-white truncate">
              {order.po_number}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {order.customer_name}
              {totalKurang > 0 && (
                <span className="ml-2 text-red-600 dark:text-red-400 font-bold">
                  · {totalKurang} pcs kurang
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-2.5">
          {items.map((item, i) => {
            const isEditing = editingIndex === i;
            const isSaving = savingIndex === i;
            const hasShortage = (item.shortage_qty || 0) > 0;
            return (
              <div
                key={i}
                className={`border rounded-xl p-3.5 transition-colors ${
                  hasShortage
                    ? "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                  {item.product_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {item.ukuran} · {item.lengan} · {item.warna} · Qty {item.qty}
                </p>

                {isEditing ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={item.qty}
                      value={editValue}
                      onChange={(e) => setEditValue(Number(e.target.value))}
                      autoFocus
                      className="w-20 text-sm text-center bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 rounded-lg px-2 py-1.5"
                    />
                    <span className="text-xs text-slate-400">
                      / {item.qty} pcs kurang
                    </span>
                    <button
                      onClick={() => confirmShortage(i)}
                      disabled={isSaving}
                      className="text-xs font-bold px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg"
                    >
                      {isSaving ? "..." : "Simpan"}
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="text-xs font-bold px-3 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      Batal
                    </button>
                  </div>
                ) : hasShortage ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                      <PackageX size={12} /> Kurang {item.shortage_qty} pcs
                    </span>
                    <button
                      onClick={() => startEditExisting(i)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Ubah
                    </button>
                    <button
                      onClick={() => resetShortage(i)}
                      disabled={isSaving}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 disabled:opacity-50"
                    >
                      <RotateCcw size={11} /> Stok Lengkap
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startShortage(i)}
                    className="text-xs font-bold px-3 py-1.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Stok Tidak Ada
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface POPackingListProps {
  poId: string;
}

export default function POPackingList({ poId }: POPackingListProps) {
  const [orders, setOrders] = useState<POOrder[]>([]);
  const [setting, setSetting] = useState<POSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PUBLIC" | "RESELLER">(
    "ALL",
  );

  // State untuk menyimpan ID pesanan yang dicentang
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // State loading saat menyiapkan dokumen cetak
  const [printing, setPrinting] = useState(false);
  // Pesanan yang sedang dibuka detail packing-nya (modal)
  const [detailOrder, setDetailOrder] = useState<POOrder | null>(null);

  // Update satu order di state lokal setelah status stok item berubah,
  // supaya badge di tabel & modal langsung sinkron tanpa perlu refetch.
  function handleOrderUpdated(updated: POOrder) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setDetailOrder(updated);
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [ords, st] = await Promise.all([
        getAllPOOrders(poId),
        getPOSettingAdmin(poId),
      ]);
      setOrders(ords || []);
      setSetting(st);
      setLoading(false);
    }
    loadData();
  }, [poId]);

  // Filter Data — sengaja cuma satu filter: Tipe Customer
  const filtered = orders.filter((o) => {
    const matchType = filterType === "ALL" || o.customer_type === filterType;
    const matchSearch =
      o.po_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Handle Checkbox
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set()); // Uncheck all
    } else {
      setSelectedIds(new Set(filtered.map((o) => o.id))); // Check all visible
    }
  };

  const handlePrintMassal = () => {
    if (selectedIds.size === 0) {
      alert("Pilih minimal satu pesanan untuk dicetak.");
      return;
    }

    const ordersToPrint = orders.filter((o) => selectedIds.has(o.id));
    if (ordersToPrint.length === 0) return;

    setPrinting(true);

    // Render tiap invoice jadi HTML statis (pakai komponen asli
    // POOrderPrintSlip — sama persis dengan yang dipakai di tombol
    // "Download PDF" pada detail pesanan).
    const pagesHtml = ordersToPrint
      .map((order) =>
        renderToStaticMarkup(
          <div className="po-print-page">
            <POOrderPrintSlip
              order={order}
              storeName="Langitan.co"
              storeAddress="Mandungan, Widang, Tuban, Jawa Timur"
              logoUrl={setting?.logo_image_url || undefined}
            />
          </div>,
        ),
      )
      .join("");

    // Dokumen HTML BERDIRI SENDIRI, terpisah total dari halaman utama —
    // sama seperti mekanisme cetak resi di tab Pengiriman, supaya tidak
    // pernah "kosong" gara-gara CSS/layout halaman utama berubah.
    const printDocument = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Cetak Invoice</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; }
      .po-print-page {
        page-break-after: always;
        break-after: page;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .po-print-page:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      @page {
        size: 210mm 297mm portrait;
        margin: 0;
      }
    </style>
  </head>
  <body>${pagesHtml}</body>
</html>`;

    // Buat iframe tersembunyi khusus untuk cetak.
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const cleanup = () => {
      setPrinting(false);
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 500);
    };

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      setPrinting(false);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      alert("Gagal menyiapkan dokumen cetak. Coba lagi.");
      return;
    }

    iframeDoc.open();
    iframeDoc.write(printDocument);
    iframeDoc.close();

    let hasPrinted = false;
    const triggerPrint = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };

    iframe.onload = triggerPrint;
    setTimeout(triggerPrint, 400);

    if (iframe.contentWindow) {
      iframe.contentWindow.onafterprint = cleanup;
    }
    setTimeout(cleanup, 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 text-slate-400">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">Memuat data pengemasan...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* ── HEADER & FILTER ── */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative w-full lg:flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Cari nama atau kode PO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        {/* Filter Tipe (Public/Reseller) — satu-satunya filter di tab ini */}
        <div className="flex bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 overflow-x-auto no-scrollbar">
          {(["ALL", "PUBLIC", "RESELLER"] as const).map((tipe) => (
            <button
              key={tipe}
              onClick={() => setFilterType(tipe)}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                filterType === tipe
                  ? "bg-white dark:bg-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tipe === "ALL" ? "Semua Tipe" : tipe}
            </button>
          ))}
        </div>

        {/* Tombol Cetak */}
        <button
          onClick={handlePrintMassal}
          disabled={selectedIds.size === 0 || printing}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm transition-colors min-w-[210px]"
        >
          {printing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Menyiapkan dokumen...
            </>
          ) : (
            <>
              <Printer size={16} />
              Cetak Invoice ({selectedIds.size})
            </>
          )}
        </button>
      </div>

      {/* ── TABEL DATA PENGEMASAN ── */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden overflow-x-auto bg-white dark:bg-slate-900/20">
        <table className="w-full text-sm min-w-[850px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500">
              <th className="px-5 py-3.5 text-left w-12">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-blue-500"
                >
                  <CheckSquare
                    size={18}
                    className={
                      selectedIds.size === filtered.length &&
                      filtered.length > 0
                        ? "text-blue-600"
                        : ""
                    }
                  />
                </button>
              </th>
              <th className="text-left px-5 py-3.5 font-bold uppercase">
                Kode PO
              </th>
              <th className="text-left px-5 py-3.5 font-bold uppercase">
                Pelanggan
              </th>
              <th className="text-left px-5 py-3.5 font-bold uppercase">
                Tipe
              </th>
              <th className="text-left px-5 py-3.5 font-bold uppercase">
                Jumlah Item
              </th>
              <th className="text-left px-5 py-3.5 font-bold uppercase">
                Status Stok
              </th>
              <th className="text-right px-5 py-3.5 font-bold uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  Tidak ada data yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const isSelected = selectedIds.has(order.id);
                const totalQty = order.order_items.reduce(
                  (sum, item) => sum + item.qty,
                  0,
                );
                return (
                  <tr
                    key={order.id}
                    onClick={() => toggleSelect(order.id)}
                    className={`border-b border-slate-100 dark:border-slate-800/60 last:border-0 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50/50 dark:bg-blue-900/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 pointer-events-none"
                      />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {order.po_number}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{order.customer_name}</p>
                      <p className="text-xs text-slate-500">
                        {order.customer_wa}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          order.customer_type === "RESELLER"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {order.customer_type === "RESELLER" ? (
                          <Users size={12} />
                        ) : (
                          <Globe size={12} />
                        )}
                        {order.customer_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                      {totalQty} pcs · {order.order_items.length} item
                    </td>
                    <td className="px-5 py-4">
                      {(() => {
                        const totalKurang = order.order_items.reduce(
                          (s, it) => s + (it.shortage_qty || 0),
                          0,
                        );
                        if (totalKurang === 0) {
                          return (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              <PackageCheck size={12} /> Lengkap
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            <PackageX size={12} /> Kurang {totalKurang}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailOrder(order);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <ClipboardList size={13} /> Kemas
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {detailOrder && (
        <PackingDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}

      {/* Area cetak invoice TIDAK dirender di sini. Saat tombol "Cetak
          Invoice" diklik, dokumen dibuat langsung di dalam iframe
          tersembunyi yang berdiri sendiri (lihat handlePrintMassal). */}
    </div>
  );
}
