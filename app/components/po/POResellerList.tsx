"use client";

import { useEffect, useState } from "react";
import {
  getAllResellers,
  createReseller,
  updateReseller,
  toggleResellerActive,
  deleteReseller,
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
} from "lucide-react";

const EMPTY_FORM = { kode: "", pin_hash: "", nama: "", whatsapp: "", kota: "" };

export default function POResellerList() {
  const [resellers, setResellers] = useState<POResellerFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<POResellerFull | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

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

  /* ── Loading ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 text-slate-400 dark:text-slate-500">
        <Users size={16} className="animate-pulse" />
        <span className="text-sm">Memuat reseller...</span>
      </div>
    );
  }

  /* ── Form (Create / Edit) ─────────────────────────────────────── */
  if (showForm) {
    return (
      <div className="w-full max-w-3xl mx-auto animate-in fade-in duration-200">
        {/* Back */}
        <button
          onClick={() => setShowForm(false)}
          className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-5 transition-colors"
        >
          <ArrowLeft size={14} />
          Kembali
        </button>

        <div className="mb-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-500 dark:text-blue-400 mb-1">
            {editTarget ? "Edit Reseller" : "Reseller Baru"}
          </p>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {editTarget ? editTarget.nama : "Tambah Reseller"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {/* Kode */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              <Hash size={11} />
              Kode Reseller
              <span className="text-blue-500">*</span>
            </label>
            <input
              type="text"
              value={form.kode}
              onChange={(e) => setForm({ ...form, kode: e.target.value })}
              placeholder="RES-001"
              disabled={!!editTarget}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase text-slate-900 dark:text-white placeholder:text-slate-400 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            {editTarget && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                Kode tidak bisa diubah setelah dibuat.
              </p>
            )}
          </div>

          {/* PIN */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              <Lock size={11} />
              PIN
              {!editTarget && <span className="text-blue-500">*</span>}
              {editTarget && (
                <span className="font-normal normal-case text-slate-400 dark:text-slate-500 tracking-normal">
                  — kosongkan jika tak diubah
                </span>
              )}
            </label>
            <input
              type="password"
              value={form.pin_hash}
              onChange={(e) => setForm({ ...form, pin_hash: e.target.value })}
              placeholder={editTarget ? "Isi untuk ubah PIN" : "PIN baru"}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Nama (Full width on Desktop) */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              <Store size={11} />
              Nama Toko / Reseller
              <span className="text-blue-500">*</span>
            </label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Nama toko atau reseller"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              <Phone size={11} />
              WhatsApp
            </label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="628123456789"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Kota */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              <MapPin size={11} />
              Kota
            </label>
            <input
              type="text"
              value={form.kota}
              onChange={(e) => setForm({ ...form, kota: e.target.value })}
              placeholder="Surabaya"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse md:flex-row gap-2 pt-6">
          <button
            onClick={() => setShowForm(false)}
            className="w-full md:w-auto px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-colors"
          >
            {saving
              ? "Menyimpan..."
              : editTarget
                ? "Simpan Perubahan"
                : "Tambah Reseller"}
          </button>
        </div>
      </div>
    );
  }

  /* ── List ─────────────────────────────────────────────────────── */
  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {resellers.length} reseller terdaftar
          </span>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={14} />
          Tambah Reseller
        </button>
      </div>

      {/* Empty state */}
      {resellers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-600">
          <Users size={32} strokeWidth={1.5} />
          <p className="text-sm font-medium">Belum ada reseller.</p>
          <button
            onClick={openCreate}
            className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Tambah reseller pertama
          </button>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Kode
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Reseller
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 hidden md:table-cell">
                  Kota
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {resellers.map((r) => (
                <tr
                  key={r.id}
                  className={`border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-opacity ${
                    !r.is_active ? "opacity-50" : ""
                  }`}
                >
                  {/* Kode */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg">
                      {r.kode}
                    </span>
                  </td>

                  {/* Nama + WA */}
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {r.nama}
                    </p>
                    {r.whatsapp && (
                      <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        <Phone size={10} />
                        {r.whatsapp}
                      </p>
                    )}
                  </td>

                  {/* Kota */}
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    {r.kota ? (
                      <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <MapPin size={11} />
                        {r.kota}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">
                        —
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                        r.is_active
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500"
                      }`}
                    >
                      {r.is_active ? (
                        <UserCheck size={11} />
                      ) : (
                        <UserX size={11} />
                      )}
                      {r.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 justify-end">
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
