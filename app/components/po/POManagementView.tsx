"use client";

import { useEffect, useState } from "react";
import POOverview from "./POOverview";
import POOrderList from "./POOrderList";
import POProductList from "./POProductList";
import POResellerList from "./POResellerList";
import POSettings from "./POSettings";
import PORekapList from "./PORekapList";
import POShippingList from "./POShippingList";
import POPackingList from "./POPackingList"; // <-- IMPORT BARU (Pengemasan)
import { deletePOSetting, getPOSettingAdmin } from "@/lib/po/admin";
import { downloadPOArchive } from "@/lib/po/archive-export";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  PackageCheck, // <-- IKON BARU untuk tab Pengemasan
  Users,
  Settings2,
  ClipboardPaste,
  ArrowLeft,
  Truck,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  Archive,
} from "lucide-react";

type POTab =
  | "overview"
  | "orders"
  | "products"
  | "resellers"
  | "settings"
  | "rekap"
  | "shipping"
  | "packing";

const tabs: { id: POTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "Pesanan", icon: ShoppingBag },
  { id: "products", label: "Produk", icon: Package },
  { id: "resellers", label: "Reseller", icon: Users },
  { id: "packing", label: "Pengemasan", icon: PackageCheck }, // <-- MENU BARU
  { id: "shipping", label: "Pengiriman", icon: Truck },
  { id: "rekap", label: "Rekap", icon: ClipboardPaste },
  { id: "settings", label: "Pengaturan", icon: Settings2 },
];

interface POManagementViewProps {
  poId: string;
  onBack?: () => void;
}

export default function POManagementView({
  poId,
  onBack,
}: POManagementViewProps) {
  const [activeTab, setActiveTab] = useState<POTab>("overview");
  const [poTitle, setPoTitle] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState<string>("");
  const [hasArchived, setHasArchived] = useState(false);

  const ActiveIcon =
    tabs.find((t) => t.id === activeTab)?.icon ?? LayoutDashboard;

  useEffect(() => {
    // Judul PO dipakai sebagai kata kunci konfirmasi hapus, supaya admin
    // benar-benar sadar PO mana yang akan dihapus (bukan cuma klik OK).
    getPOSettingAdmin(poId).then((s) => setPoTitle(s?.title || ""));
  }, [poId]);

  function openDeleteModal() {
    setConfirmText("");
    setDeleteError(null);
    setShowDeleteModal(true);
  }

  async function handleArchive() {
    setArchiving(true);
    setArchiveProgress("Menyiapkan...");
    try {
      await downloadPOArchive(poId, poTitle, (msg) => setArchiveProgress(msg));
      setHasArchived(true);
    } catch (err) {
      console.error(err);
      alert(
        "Gagal membuat arsip. Pastikan package 'jszip' sudah terinstall (npm install jszip), lalu coba lagi.",
      );
    } finally {
      setArchiving(false);
      setArchiveProgress("");
    }
  }

  async function handleConfirmDelete() {
    if (confirmText.trim() !== poTitle) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deletePOSetting(poId);
    setDeleting(false);
    if (!result.success) {
      setDeleteError(result.error || "Gagal menghapus PO.");
      return;
    }
    setShowDeleteModal(false);
    onBack?.();
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 mb-4 pl-2.5 pr-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all group"
          >
            <ArrowLeft
              size={13}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Kembali ke daftar PO
          </button>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-sm shrink-0">
              <ActiveIcon size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-500 mb-1">
                Pre-Order System
              </p>
              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-none truncate">
                PO Management{" "}
                <span className="text-blue-600 font-mono text-base sm:text-xl ml-1">
                  #{poId.slice(0, 8)}
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1 sm:mt-1.5 font-medium truncate">
                Mengelola data terisolasi untuk ID Campaign: {poId}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-60 px-3 sm:px-3.5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              title="Unduh semua data & gambar PO ini sebagai arsip ZIP"
            >
              {archiving ? (
                <Loader2 size={14} className="animate-spin shrink-0" />
              ) : (
                <Archive size={14} className="shrink-0" />
              )}
              <span className="truncate">
                {archiving
                  ? archiveProgress || "Mengarsipkan..."
                  : "Arsipkan Data"}
              </span>
            </button>
            <button
              onClick={openDeleteModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 sm:px-3.5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              <Trash2 size={14} className="shrink-0" />
              Hapus PO
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 flex gap-1 overflow-x-auto no-scrollbar">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl
              whitespace-nowrap shrink-0 transition-all duration-200
              ${
                activeTab === id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              }
            `}
          >
            <Icon size={14} className="shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-6 min-h-[420px] overflow-x-auto">
        {activeTab === "overview" && <POOverview poId={poId} />}
        {activeTab === "orders" && <POOrderList poId={poId} />}
        {activeTab === "products" && <POProductList poId={poId} />}
        {activeTab === "resellers" && <POResellerList poId={poId} />}
        {activeTab === "packing" && <POPackingList poId={poId} />}
        {activeTab === "shipping" && <POShippingList poId={poId} />}
        {activeTab === "settings" && <POSettings poId={poId} />}
        {activeTab === "rekap" && <PORekapList poId={poId} />}
      </div>

      {/* ── Modal Konfirmasi Hapus PO ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 w-full max-w-md space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white">
                    Hapus PO Permanen
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Aksi ini tidak bisa dibatalkan
                  </p>
                </div>
              </div>
              {!deleting && (
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-1.5 leading-relaxed">
              <p>Menghapus PO ini akan menghapus permanen:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Semua pesanan (order) di PO ini</li>
                <li>Semua produk & katalog di PO ini</li>
                <li>Semua foto produk, logo toko, dan QRIS yang diupload</li>
                <li>Pengaturan PO ini sendiri</li>
              </ul>
              <p className="pt-1 font-semibold">
                Data reseller tidak ikut terhapus (dipakai bersama PO lain).
              </p>
            </div>

            <div
              className={`rounded-xl p-3.5 space-y-2.5 border ${
                hasArchived
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50"
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50"
              }`}
            >
              <p
                className={`text-xs font-semibold leading-relaxed ${
                  hasArchived
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-400"
                }`}
              >
                {hasArchived
                  ? "Arsip ZIP sudah diunduh. Aman untuk melanjutkan hapus."
                  : "Sebaiknya unduh dulu arsip lengkap (pesanan, produk, reseller, gambar) sebelum menghapus, supaya data masih tersimpan untuk laporan/rekap."}
              </p>
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-60 py-2.5 rounded-xl transition-colors"
              >
                {archiving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {archiveProgress || "Mengarsipkan..."}
                  </>
                ) : (
                  <>
                    <Archive size={15} />
                    {hasArchived
                      ? "Unduh Ulang Arsip"
                      : "Download Arsip Lengkap (ZIP)"}
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Ketik{" "}
                <span className="font-mono text-red-600 dark:text-red-400">
                  {poTitle || "(judul PO)"}
                </span>{" "}
                untuk konfirmasi
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={poTitle}
                disabled={deleting}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-red-500 disabled:opacity-60"
              />
            </div>

            {deleteError && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {deleteError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={
                  deleting || confirmText.trim() !== poTitle || !poTitle
                }
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {deleting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Hapus Permanen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
