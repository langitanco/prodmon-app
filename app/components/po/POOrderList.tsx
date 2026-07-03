"use client";

import POOrderPrintSlip from "./POOrderPrintSlip";
import { useRef, useEffect, useState } from "react";
import POOrderEditForm from "./POOrderEditForm";

import {
  getAllPOOrders,
  deletePOOrder,
  updatePaymentStatus,
  getAllPOProducts,
  getPOSettingAdmin,
} from "@/lib/po/admin";
import { formatRupiah } from "@/lib/po/pricing";
import { POOrder, PaymentStatus, POProduct, POSetting } from "@/types/po";
import {
  buildWaLink,
  buildOrderConfirmationMessage,
} from "@/lib/po/wa-messages";
import {
  Search,
  RefreshCw,
  ArrowLeft,
  MessageCircle,
  Trash2,
  ChevronRight,
  Package,
  Download,
  CheckCircle2,
  CircleDollarSign,
  XCircle,
  Pencil,
  ChevronDown,
  Printer,
} from "lucide-react";

/* ── Konfigurasi tampilan status pembayaran ─────────────────── */
const PAYMENT_CONFIG: Record<
  PaymentStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
    iconClass: string;
  }
> = {
  BELUM_BAYAR: {
    label: "Belum Bayar",
    icon: XCircle,
    className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    iconClass: "text-red-600 dark:text-red-400",
  },
  DP: {
    label: "DP",
    icon: CircleDollarSign,
    className:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  LUNAS: {
    label: "Lunas",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
};

const PAYMENT_OPTIONS: PaymentStatus[] = ["BELUM_BAYAR", "DP", "LUNAS"];

/* ── Dropdown badge untuk ubah status pembayaran ────────────── */
function PaymentStatusBadge({
  order,
  onChange,
}: {
  order: POOrder;
  onChange: (id: string, status: PaymentStatus, paidAmount?: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showDpInput, setShowDpInput] = useState(false);
  const [dpValue, setDpValue] = useState(order.paid_amount?.toString() || "");

  const config =
    PAYMENT_CONFIG[order.payment_status] ?? PAYMENT_CONFIG.BELUM_BAYAR;
  const Icon = config.icon;

  function handleSelect(status: PaymentStatus) {
    if (status === "DP") {
      setShowDpInput(true);
      setOpen(false);
      return;
    }
    onChange(order.id, status);
    setOpen(false);
  }

  function handleConfirmDp() {
    const amount = parseFloat(dpValue) || 0;
    onChange(order.id, "DP", amount);
    setShowDpInput(false);
  }

  if (showDpInput) {
    return (
      <div
        className="flex items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="number"
          autoFocus
          placeholder="Nominal DP"
          value={dpValue}
          onChange={(e) => setDpValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirmDp()}
          className="w-24 text-xs px-2 py-1 border border-amber-300 dark:border-amber-700 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
        <button
          onClick={handleConfirmDp}
          className="text-[10px] font-bold px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md"
        >
          OK
        </button>
        <button
          onClick={() => setShowDpInput(false)}
          className="text-[10px] font-bold px-2 py-1 text-slate-400 hover:text-slate-600"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${config.className} hover:opacity-80 transition-opacity`}
      >
        <Icon size={11} />
        {config.label}
        {order.payment_status === "DP" && order.paid_amount > 0 && (
          <span className="opacity-75">
            · {formatRupiah(order.paid_amount)}
          </span>
        )}
        <ChevronDown size={11} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1.5 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
            {PAYMENT_OPTIONS.map((status) => {
              const c = PAYMENT_CONFIG[status];
              const I = c.icon;
              return (
                <button
                  key={status}
                  onClick={() => handleSelect(status)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <I size={13} className={c.iconClass} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

interface POOrderListProps {
  poId: string;
}

export default function POOrderList({ poId }: POOrderListProps) {
  const [orders, setOrders] = useState<POOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<POOrder | null>(null);
  const [editing, setEditing] = useState(false);
  const [products, setProducts] = useState<POProduct[]>([]);
  const [setting, setSetting] = useState<POSetting | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "PUBLIC" | "RESELLER">(
    "ALL",
  );
  const [filterPayment, setFilterPayment] = useState<"ALL" | PaymentStatus>(
    "ALL",
  );
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPdf(order: POOrder) {
    setDownloadingPdf(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const node = printRef.current;
      if (!node) return;

      const canvas = await html2canvas(node, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // ── Atur margin di sini (mm) ──
      const MARGIN_MM = 10;

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidthMM = pageWidth - MARGIN_MM * 2;
      const contentHeightMM = pageHeight - MARGIN_MM * 2;

      // Berapa piksel canvas asli setara 1mm konten, lalu berapa piksel muat 1 halaman
      const pxPerMm = canvas.width / contentWidthMM;
      const pageHeightPx = Math.floor(contentHeightMM * pxPerMm);

      const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

      for (let i = 0; i < totalPages; i++) {
        const sourceY = i * pageHeightPx;
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - sourceY);

        // Potong canvas asli jadi satu halaman penuh (bukan cuma digeser)
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext("2d");
        if (!ctx) continue;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx,
        );

        const sliceImgData = pageCanvas.toDataURL("image/jpeg", 0.75);
        const sliceHeightMM = sliceHeightPx / pxPerMm;

        if (i > 0) pdf.addPage();
        pdf.addImage(
          sliceImgData,
          "JPEG",
          MARGIN_MM,
          MARGIN_MM,
          contentWidthMM,
          sliceHeightMM,
          undefined,
          "FAST",
        );
      }

      pdf.save(`Struk-${order.po_number}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poId]);

  async function load(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const [ords, prods, st] = await Promise.all([
      getAllPOOrders(poId),
      getAllPOProducts(poId),
      getPOSettingAdmin(poId),
    ]);

    setOrders(ords || []);
    setProducts(prods || []);
    setSetting(st);

    if (isRefresh) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  }

  async function openEditMode() {
    if (products.length === 0 || !setting) {
      setLoadingMeta(true);
      const [prods, set] = await Promise.all([
        getAllPOProducts(poId), // ← tambahkan poId
        getPOSettingAdmin(poId), // ← tambahkan poId
      ]);
      setProducts(prods);
      setSetting(set);
      setLoadingMeta(false);
    }
    setEditing(true);
  }

  function handleOrderSaved(updated: POOrder) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelected(updated);
    setEditing(false);
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

  async function handlePaymentChange(
    id: string,
    status: PaymentStatus,
    paidAmount?: number,
  ) {
    const target = orders.find((o) => o.id === id);
    const resolvedAmount =
      paidAmount !== undefined
        ? paidAmount
        : status === "LUNAS"
          ? (target?.total_amount ?? 0)
          : status === "BELUM_BAYAR"
            ? 0
            : (target?.paid_amount ?? 0);

    // Optimistic update di UI dulu
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, payment_status: status, paid_amount: resolvedAmount }
          : o,
      ),
    );
    if (selected?.id === id) {
      setSelected((prev) =>
        prev
          ? { ...prev, payment_status: status, paid_amount: resolvedAmount }
          : prev,
      );
    }

    const result = await updatePaymentStatus(id, status, resolvedAmount);
    if (!result.success) {
      alert("Gagal update status pembayaran: " + result.error);
      load(true); // rollback dengan reload data asli dari server
    }
  }

  const filtered = orders.filter((o) => {
    const matchType = filterType === "ALL" || o.customer_type === filterType;
    const matchPayment =
      filterPayment === "ALL" || o.payment_status === filterPayment;
    const matchSearch =
      o.po_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchPayment && matchSearch;
  });

  /* ── Export Excel (sesuai data yang sedang ter-filter) ──────── */
  async function handleExportExcel() {
    if (filtered.length === 0) {
      alert("Tidak ada data untuk diexport.");
      return;
    }
    setExporting(true);
    try {
      const XLSX = await import("xlsx");

      const paymentLabel = (status: PaymentStatus) =>
        PAYMENT_CONFIG[status]?.label ?? status;

      // ── Sheet 1: Rekap per item (1 baris = 1 item produk) ──
      const itemRows: Record<string, any>[] = [];
      filtered.forEach((order) => {
        order.order_items.forEach((item) => {
          itemRows.push({
            "Kode PO": order.po_number,
            Tipe: order.customer_type,
            Reseller: order.po_resellers
              ? `${order.po_resellers.nama} (${order.po_resellers.kode})`
              : "-",
            Pelanggan: order.customer_name,
            WhatsApp: order.customer_wa,
            "Status Bayar": paymentLabel(order.payment_status),
            "Jumlah Dibayar": order.paid_amount || 0,
            "Metode Kirim": order.delivery_method,
            Alamat: order.shipping_address || "-",
            Produk: item.product_name,
            Warna: item.warna,
            Lengan: item.lengan,
            Ukuran: item.ukuran,
            Qty: item.qty,
            "Harga Satuan": item.harga_satuan,
            Subtotal: item.subtotal,
            Catatan: order.notes || "-",
            Tanggal: new Date(order.created_at).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        });
      });

      // ── Sheet 2: Rekap per pesanan (1 baris = 1 PO) ──
      const orderRows = filtered.map((order) => ({
        "Kode PO": order.po_number,
        Tipe: order.customer_type,
        Reseller: order.po_resellers
          ? `${order.po_resellers.nama} (${order.po_resellers.kode})`
          : "-",
        Pelanggan: order.customer_name,
        WhatsApp: order.customer_wa,
        "Status Bayar": paymentLabel(order.payment_status),
        "Jumlah Dibayar": order.paid_amount || 0,
        "Sisa Tagihan": Math.max(
          0,
          order.total_amount - (order.paid_amount || 0),
        ),
        "Metode Kirim": order.delivery_method,
        Alamat: order.shipping_address || "-",
        "Jumlah Item": order.order_items.reduce((s, i) => s + i.qty, 0),
        "Total (Rp)": order.total_amount,
        Catatan: order.notes || "-",
        Tanggal: new Date(order.created_at).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      const wb = XLSX.utils.book_new();

      const wsOrders = XLSX.utils.json_to_sheet(orderRows);
      wsOrders["!cols"] = [
        { wch: 14 }, // Kode PO
        { wch: 10 }, // Tipe
        { wch: 22 }, // Reseller
        { wch: 20 }, // Pelanggan
        { wch: 16 }, // WhatsApp
        { wch: 13 }, // Status Bayar
        { wch: 14 }, // Jumlah Dibayar
        { wch: 14 }, // Sisa Tagihan
        { wch: 12 }, // Metode Kirim
        { wch: 28 }, // Alamat
        { wch: 12 }, // Jumlah Item
        { wch: 14 }, // Total
        { wch: 24 }, // Catatan
        { wch: 18 }, // Tanggal
      ];
      XLSX.utils.book_append_sheet(wb, wsOrders, "Rekap Pesanan");

      const wsItems = XLSX.utils.json_to_sheet(itemRows);
      wsItems["!cols"] = [
        { wch: 14 }, // Kode PO
        { wch: 10 }, // Tipe
        { wch: 22 }, // Reseller
        { wch: 20 }, // Pelanggan
        { wch: 16 }, // WhatsApp
        { wch: 13 }, // Status Bayar
        { wch: 14 }, // Jumlah Dibayar
        { wch: 12 }, // Metode Kirim
        { wch: 28 }, // Alamat
        { wch: 22 }, // Produk
        { wch: 12 }, // Warna
        { wch: 10 }, // Lengan
        { wch: 10 }, // Ukuran
        { wch: 8 }, // Qty
        { wch: 14 }, // Harga Satuan
        { wch: 14 }, // Subtotal
        { wch: 24 }, // Catatan
        { wch: 18 }, // Tanggal
      ];
      XLSX.utils.book_append_sheet(wb, wsItems, "Detail Item");

      const tanggalFile = new Date().toISOString().slice(0, 10);
      const labelFilter =
        filterType === "ALL"
          ? "Semua"
          : filterType === "PUBLIC"
            ? "Public"
            : "Reseller";
      const labelPayment =
        filterPayment === "ALL" ? "" : `-${paymentLabel(filterPayment)}`;

      XLSX.writeFile(
        wb,
        `Rekap-PO-${labelFilter}${labelPayment}-${tanggalFile}.xlsx`,
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

  async function handleExportExcelAll() {
    if (orders.length === 0) {
      alert("Tidak ada data untuk diexport.");
      return;
    }
    setExporting(true);
    try {
      const XLSX = await import("xlsx");

      const paymentLabel = (status: PaymentStatus) =>
        PAYMENT_CONFIG[status]?.label ?? status;

      const itemRows: Record<string, any>[] = [];
      orders.forEach((order) => {
        // ← pakai orders, bukan filtered
        order.order_items.forEach((item) => {
          itemRows.push({
            "Kode PO": order.po_number,
            Tipe: order.customer_type,
            Reseller: order.po_resellers
              ? `${order.po_resellers.nama} (${order.po_resellers.kode})`
              : "-",
            Pelanggan: order.customer_name,
            WhatsApp: order.customer_wa,
            "Status Bayar": paymentLabel(order.payment_status),
            "Jumlah Dibayar": order.paid_amount || 0,
            "Metode Kirim": order.delivery_method,
            Alamat: order.shipping_address || "-",
            Produk: item.product_name,
            Warna: item.warna,
            Lengan: item.lengan,
            Ukuran: item.ukuran,
            Qty: item.qty,
            "Harga Satuan": item.harga_satuan,
            Subtotal: item.subtotal,
            Catatan: order.notes || "-",
            Tanggal: new Date(order.created_at).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        });
      });

      const orderRows = orders.map((order) => ({
        // ← pakai orders juga
        "Kode PO": order.po_number,
        Tipe: order.customer_type,
        Reseller: order.po_resellers
          ? `${order.po_resellers.nama} (${order.po_resellers.kode})`
          : "-",
        Pelanggan: order.customer_name,
        WhatsApp: order.customer_wa,
        "Status Bayar": paymentLabel(order.payment_status),
        "Jumlah Dibayar": order.paid_amount || 0,
        "Sisa Tagihan": Math.max(
          0,
          order.total_amount - (order.paid_amount || 0),
        ),
        "Metode Kirim": order.delivery_method,
        Alamat: order.shipping_address || "-",
        "Jumlah Item": order.order_items.reduce((s, i) => s + i.qty, 0),
        "Total (Rp)": order.total_amount,
        Catatan: order.notes || "-",
        Tanggal: new Date(order.created_at).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      const wb = XLSX.utils.book_new();
      const wsOrders = XLSX.utils.json_to_sheet(orderRows);
      XLSX.utils.book_append_sheet(wb, wsOrders, "Rekap Pesanan");
      const wsItems = XLSX.utils.json_to_sheet(itemRows);
      XLSX.utils.book_append_sheet(wb, wsItems, "Detail Item");

      const tanggalFile = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Rekap-PO-SEMUA-${tanggalFile}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat file Excel.");
    } finally {
      setExporting(false);
    }
  }

  /* ── Loading ───────────────────────────────────────────────── */
  if (loading)
    return (
      <div className="flex items-center gap-3 py-8 text-slate-400 dark:text-slate-500">
        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">Memuat pesanan...</span>
      </div>
    );

  /* ── Edit View ─────────────────────────────────────────────── */
  if (editing && selected && setting) {
    return (
      <POOrderEditForm
        order={selected}
        products={products}
        setting={setting}
        onCancel={() => setEditing(false)}
        onSaved={handleOrderSaved}
      />
    );
  }

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
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex w-max text-xs font-extrabold px-3 py-1.5 rounded-xl
                ${
                  selected.customer_type === "RESELLER"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {selected.customer_type}
              </span>
              <PaymentStatusBadge
                order={selected}
                onChange={handlePaymentChange}
              />
            </div>
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
              selected.payment_status === "DP" && {
                label: "Sisa Tagihan",
                value: formatRupiah(
                  Math.max(
                    0,
                    selected.total_amount - (selected.paid_amount || 0),
                  ),
                ),
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
            <button
              onClick={openEditMode}
              disabled={loadingMeta}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 text-sm border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 py-3 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
            >
              {loadingMeta ? (
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <Pencil size={15} />
              )}
              Edit Pesanan
            </button>

            {/* ── Tombol baru ── */}
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <Printer size={15} /> Print
            </button>
            <button
              onClick={() => handleDownloadPdf(selected)}
              disabled={downloadingPdf}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors disabled:opacity-50"
            >
              <Download
                size={15}
                className={downloadingPdf ? "animate-bounce" : ""}
              />
              {downloadingPdf ? "Membuat..." : "Download PDF"}
            </button>
            {/* ── akhir tombol baru ── */}

            <a
              href={buildWaLink(
                selected.customer_wa,
                buildOrderConfirmationMessage(selected),
              )}
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
        {/* Area cetak — tersembunyi di layar, muncul saat print/PDF */}
        <div className="print-only" ref={printRef}>
          <POOrderPrintSlip
            order={selected}
            storeName="Langitan.co"
            storeAddress="Mandungan, Widang, Tuban, Jawa Timur"
            // logoUrl="/logo.png"
          />
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

        {/* Refresh & Export */}
        <div className="flex flex-row gap-2 sm:gap-3">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex-1 sm:w-auto flex justify-center items-center gap-2 text-sm px-3 sm:px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting || filtered.length === 0}
            className="flex-1 sm:w-auto flex justify-center items-center gap-2 text-sm px-3 sm:px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold transition-colors"
          >
            <Download size={14} className={exporting ? "animate-bounce" : ""} />
            {exporting ? "Membuat..." : "Excel"}
          </button>
        </div>
      </div>

      {/* Tab Filter Tipe & Pembayaran */}
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

        <div className="flex w-full sm:w-auto bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5">
          {(["ALL", "BELUM_BAYAR", "DP", "LUNAS"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterPayment(status)}
              className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-all
                ${
                  filterPayment === status
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
            >
              {status === "ALL" ? "Semua Bayar" : PAYMENT_CONFIG[status].label}
            </button>
          ))}
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
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="text-left px-5 py-3.5">Kode PO</th>
                <th className="text-left px-5 py-3.5">Pelanggan</th>
                <th className="text-center px-5 py-3.5">Tipe</th>
                <th className="text-center px-5 py-3.5">Pembayaran</th>
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
                  <td className="px-5 py-4 text-center">
                    <PaymentStatusBadge
                      order={order}
                      onChange={handlePaymentChange}
                    />
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
