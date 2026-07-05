"use client";

import { useEffect, useState } from "react";
import {
  getAllResellers,
  createReseller,
  updateReseller,
  toggleResellerActive,
  deleteReseller,
  confirmReseller,
  getPOSettingAdmin,
} from "@/lib/po/admin";
import { POResellerFull } from "@/types/po";
import {
  ArrowLeft,
  Plus,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  Users,
  Phone,
  MapPin,
  Hash,
  Lock,
  Store,
  Clock,
  MessageCircleMore,
} from "lucide-react";
import { buildConfirmationMessage, buildWaLink } from "@/lib/po/wa-messages";

const EMPTY_FORM = { kode: "", pin_hash: "", nama: "", whatsapp: "", kota: "" };

// Wajibkan komponen menerima properti poId
interface POResellerListProps {
  poId: string;
}

export default function POResellerList({ poId }: POResellerListProps) {
  const [resellers, setResellers] = useState<POResellerFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<POResellerFull | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [tab, setTab] = useState<"aktif" | "pending">("aktif");
  const [urlSlug, setUrlSlug] = useState<string>("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    load();
    // Gunakan poId untuk mendapatkan pengaturan URL Slug khusus PO ini
    getPOSettingAdmin(poId).then((s) => {
      if (s?.url_slug) setUrlSlug(s.url_slug);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poId]);

  async function load() {
    setLoading(true);
    const data = await getAllResellers();
    setResellers(data);
    setLoading(false);
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(r: POResellerFull) {
    setEditTarget(r);
    setForm({
      kode: r.kode,
      pin_hash: "",
      nama: r.nama,
      whatsapp: r.whatsapp || "",
      kota: r.kota || "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.kode || !form.nama) {
      alert("Kode dan nama wajib diisi.");
      return;
    }
    if (!editTarget && !form.pin_hash) {
      alert("PIN wajib diisi untuk reseller baru.");
      return;
    }
    setSaving(true);

    if (editTarget) {
      const updates: any = {
        nama: form.nama,
        whatsapp: form.whatsapp,
        kota: form.kota,
      };
      if (form.pin_hash) updates.pin_hash = form.pin_hash;
      await updateReseller(editTarget.id, updates);
    } else {
      await createReseller({
        kode: form.kode.toUpperCase(),
        pin_hash: form.pin_hash,
        nama: form.nama,
        whatsapp: form.whatsapp || undefined,
        kota: form.kota || undefined,
      });
    }

    setSaving(false);
    setShowForm(false);
    load();
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleResellerActive(id, !current);
    setResellers((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r)),
    );
  }

  async function handleDelete(id: string, nama: string) {
    if (!confirm(`Hapus reseller "${nama}"?`)) return;
    await deleteReseller(id);
    setResellers((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleConfirm(r: POResellerFull) {
    setConfirmingId(r.id);

    const portalUrl = urlSlug
      ? `${window.location.origin}/po/reseller?slug=${urlSlug}`
      : window.location.origin;

    const message = buildConfirmationMessage(r, portalUrl);
    const waLink = buildWaLink(r.whatsapp || "", message);

    await confirmReseller(r.id);

    setResellers((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, status: "confirmed", is_active: true } : x,
      ),
    );
    setConfirmingId(null);
    window.open(waLink, "_blank");
  }

  const filteredResellers = resellers.filter((r) =>
    tab === "pending" ? r.status === "pending" : r.status !== "pending",
  );
  const pendingCount = resellers.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 text-slate-400 dark:text-slate-500">
        <Users size={16} className="animate-pulse" />
        <span className="text-sm">Memuat reseller...</span>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="w-full max-w-3xl mx-auto animate-in fade-in duration-200">
        <button
          onClick={() => setShowForm(false)}
          className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              {editTarget ? "Edit Reseller" : "Tambah Reseller Baru"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Lengkapi data informasi pendaftaran reseller.
            </p>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  <Hash size={11} /> Kode Reseller *
                </label>
                <input
                  type="text"
                  value={form.kode}
                  onChange={(e) => setForm({ ...form, kode: e.target.value })}
                  placeholder="BOS-01"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all uppercase"
                  disabled={!!editTarget}
                />
                {editTarget && (
                  <p className="text-[10px] text-orange-500 mt-1">
                    Kode tidak dapat diubah
                  </p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  <Lock size={11} /> PIN Login{" "}
                  {editTarget ? "(Kosongkan jika tidak ubah)" : "*"}
                </label>
                <input
                  type="text"
                  value={form.pin_hash}
                  onChange={(e) =>
                    setForm({ ...form, pin_hash: e.target.value })
                  }
                  placeholder="123456"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                <Store size={11} /> Nama Lengkap / Toko *
              </label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Toko Berkah Abadi"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                <Phone size={11} /> WhatsApp
              </label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="628123456789"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                <MapPin size={11} /> Kota / Alamat
              </label>
              <textarea
                value={form.kota}
                onChange={(e) => setForm({ ...form, kota: e.target.value })}
                placeholder="Bandung, Jawa Barat"
                rows={2}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setTab("aktif")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${tab === "aktif" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            Reseller Aktif
          </button>
          <button
            onClick={() => setTab("pending")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${tab === "pending" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            Pendaftar Baru
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
        {tab === "aktif" && (
          <button
            onClick={openCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus size={16} /> Tambah
          </button>
        )}
      </div>

      {filteredResellers.length === 0 ? (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-600">
            <Users size={32} strokeWidth={1.5} />
            <p className="text-sm font-medium">
              {tab === "pending"
                ? "Tidak ada pendaftar baru."
                : "Belum ada reseller."}
            </p>
            {tab === "aktif" && (
              <button
                onClick={openCreate}
                className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Tambah reseller pertama
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5 pl-6">Kode & Nama</th>
                <th className="px-4 py-3.5">Kontak</th>
                <th className="px-4 py-3.5">Kota</th>
                {tab === "pending" && (
                  <th className="px-4 py-3.5">Waktu Daftar</th>
                )}
                <th className="px-4 py-3.5 text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredResellers.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3.5 pl-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {r.nama}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded tracking-wide">
                          {r.kode}
                        </span>
                        {!r.is_active && r.status !== "pending" && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                            NONAKTIF
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {r.whatsapp ? (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Phone size={12} className="text-slate-400" />
                        <span className="font-medium">{r.whatsapp}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                    {r.kota || "-"}
                  </td>
                  {tab === "pending" && (
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {new Date(r.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 justify-end">
                      {r.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleConfirm(r)}
                            disabled={confirmingId === r.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            {confirmingId === r.id ? (
                              "Memproses..."
                            ) : (
                              <>
                                <MessageCircleMore size={13} /> Konfirmasi WA
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.nama)}
                            title="Tolak"
                            className="p-1.5 border border-red-200 dark:border-red-900/50 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggle(r.id, r.is_active)}
                            title={r.is_active ? "Nonaktifkan" : "Aktifkan"}
                            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            {r.is_active ? (
                              <UserX size={13} />
                            ) : (
                              <UserCheck size={13} />
                            )}
                          </button>
                          <button
                            onClick={() => openEdit(r)}
                            title="Edit"
                            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.nama)}
                            title="Hapus"
                            className="p-1.5 border border-red-200 dark:border-red-900/50 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
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
