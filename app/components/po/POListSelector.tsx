"use client";

import { useEffect, useState } from "react";
import { getAllPOSettings, createPOSetting } from "@/lib/po/admin";
import { POSetting } from "@/types/po";
import { Plus, ShoppingBag, CalendarDays, X, Loader2 } from "lucide-react";

interface POListSelectorProps {
  onSelect: (poId: string) => void;
}

export default function POListSelector({ onSelect }: POListSelectorProps) {
  const [list, setList] = useState<POSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await getAllPOSettings();
    setList(data);
    setLoading(false);
  }

  function handleTitleChange(v: string) {
    setTitle(v);
    setSlug(
      v
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    );
  }

  async function handleCreate() {
    if (!title.trim() || !slug.trim()) {
      alert("Judul dan slug URL wajib diisi.");
      return;
    }
    setCreating(true);
    const result = await createPOSetting({
      title: title.trim(),
      url_slug: slug.trim(),
    });
    setCreating(false);
    if (!result.success || !result.id) {
      alert("Gagal membuat PO: " + result.error);
      return;
    }
    setShowCreate(false);
    setTitle("");
    setSlug("");
    onSelect(result.id);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-slate-400 dark:text-slate-500 justify-center">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-sm">Memuat daftar PO...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Pilih PO
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {list.length} campaign PO tersimpan
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Buat PO Baru
        </button>
      </div>

      {list.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl">
          <ShoppingBag size={32} strokeWidth={1.2} />
          <p className="text-sm font-semibold">Belum ada PO</p>
          <p className="text-xs">Klik "Buat PO Baru" untuk memulai</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((po) => (
            <button
              key={po.id}
              onClick={() => onSelect(po.id)}
              className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <ShoppingBag size={18} />
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-1 rounded-lg ${
                    po.is_active
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {po.is_active ? "AKTIF" : "TIDAK AKTIF"}
                </span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                {po.title}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <CalendarDays size={12} />
                {po.periode_mulai || "-"} — {po.periode_selesai || "-"}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Modal Buat PO Baru */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Buat PO Baru
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Judul PO
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Contoh: PO Batch Juli 2026"
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Slug URL
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="po-batch-juli-2026"
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dipakai di URL katalog publik: /po/{slug || "..."}
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {creating ? "Membuat..." : "Buat & Buka PO"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
