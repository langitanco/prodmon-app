// app/components/settings/SettingsPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  UserPlus,
  Package,
  Pencil,
  X,
  Eye,
  EyeOff,
  Check,
  Minus,
  Shield,
  Megaphone,
  Bell,
} from "lucide-react";
import {
  UserData,
  ProductionTypeData,
  UserPermissions,
  DEFAULT_PERMISSIONS,
  Announcement,
} from "@/types";
import { requestAndRegisterFCM } from "@/app/components/misc/FCMManager";
import { createBrowserClient } from "@supabase/ssr";

interface SettingsPageProps {
  users: UserData[];
  productionTypes: ProductionTypeData[];
  currentUser: UserData;
  onSaveUser: (u: any) => void;
  onDeleteUser: (id: string) => void;
  onSaveProductionType: (t: any) => void;
  onDeleteProductionType: (id: string) => void;
}

// ─── Definisi modul untuk tabel permission ───────────────────────────────────

type PermKey = keyof UserPermissions;

interface ModuleDef {
  key: PermKey;
  label: string;
  hasCreate: boolean;
  hasEdit: boolean;
  hasDelete: boolean;
  createLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
}

// Ganti seluruh array MODULES di SettingsPage.tsx dengan ini:

const MODULES: ModuleDef[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    hasCreate: false,
    hasEdit: false,
    hasDelete: false,
  },
  {
    key: "orders",
    label: "Pesanan",
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    createLabel: "Buat pesanan",
    editLabel: "Edit pesanan",
    deleteLabel: "Hapus pesanan",
  },
  {
    key: "produksi",
    label: "Produksi",
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    createLabel: "Upload approval",
    editLabel: "Update step & kendala",
    deleteLabel: "Hapus file bukti",
  },
  {
    key: "finishing",
    label: "Finishing & QC",
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    createLabel: "Reset QC",
    editLabel: "Cek QC, packing, kirim",
    deleteLabel: "Hapus file finishing",
  },
  {
    key: "salary",
    label: "Gaji & Upah",
    hasCreate: false,
    hasEdit: false,
    hasDelete: false,
  },
  {
    key: "keuangan",
    label: "Keuangan",
    hasCreate: false,
    hasEdit: true,
    hasDelete: false,
    editLabel: "Edit data pembayaran",
  },
  {
    key: "harga_pesanan",
    label: "Harga & Pembayaran (Order)",
    hasCreate: false,
    hasEdit: true,
    hasDelete: true,
    editLabel: "Isi harga, DP, status & upload bukti bayar",
    deleteLabel: "Hapus bukti pembayaran",
  },
  {
    key: "logs",
    label: "Log Aktivitas",
    hasCreate: false,
    hasEdit: false,
    hasDelete: false,
  },
  {
    key: "settings",
    label: "Pengaturan",
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    createLabel: "Tambah user/tipe",
    editLabel: "Edit user/tipe",
    deleteLabel: "Hapus user/tipe",
  },
  {
    key: "kalkulator",
    label: "Kalkulator",
    hasCreate: false,
    hasEdit: false,
    hasDelete: false,
  },
  {
    key: "config_harga",
    label: "Config Harga",
    hasCreate: false,
    hasEdit: true,
    hasDelete: false,
    editLabel: "Edit harga",
  },
  {
    key: "trash",
    label: "Sampah",
    hasCreate: false,
    hasEdit: false,
    hasDelete: true,
    deleteLabel: "Hapus permanen",
  },
  {
    key: "weekly_notes",
    label: "Catatan Rapat",
    hasCreate: false,
    hasEdit: false,
    hasDelete: false,
  },
  {
    key: "nota",
    label: "Generator Nota",
    hasCreate: false,
    hasEdit: false,
    hasDelete: false,
  },
  // ── TAMBAHAN ──
  {
    key: "po_management",
    label: "PO Management",
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    createLabel: "Tambah produk & reseller",
    editLabel: "Edit setting PO, produk, aktif/nonaktif",
    deleteLabel: "Hapus produk & reseller",
  },
];

// ─── Helper: ambil/set nilai permission ──────────────────────────────────────

function getPermVal(
  permissions: UserPermissions,
  key: PermKey,
  field: string,
): boolean {
  const mod = permissions[key] as any;
  return mod ? !!mod[field] : false;
}

function setPermVal(
  permissions: UserPermissions,
  key: PermKey,
  field: string,
  value: boolean,
): UserPermissions {
  return {
    ...permissions,
    [key]: { ...(permissions[key] as any), [field]: value },
  };
}

// ─── Komponen: Sel tabel ─────────────────────────────────────────────────────

function PermCell({
  active,
  disabled,
  tooltip,
  onChange,
}: {
  active: boolean;
  disabled?: boolean;
  tooltip?: string;
  onChange: () => void;
}) {
  if (disabled) {
    return (
      <td className="px-3 py-2.5 text-center">
        <Minus className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 mx-auto" />
      </td>
    );
  }
  return (
    <td className="px-3 py-2.5 text-center" title={tooltip}>
      <button
        onClick={onChange}
        className={`w-5 h-5 rounded border mx-auto flex items-center justify-center transition-all ${
          active
            ? "bg-blue-600 border-blue-600 shadow-sm"
            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-blue-400"
        }`}
      >
        {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>
    </td>
  );
}

// ─── Komponen: Tabel Permission ───────────────────────────────────────────────

function PermissionTable({
  permissions,
  onChange,
}: {
  permissions: UserPermissions;
  onChange: (updated: UserPermissions) => void;
}) {
  const toggle = (key: PermKey, field: string) => {
    const current = getPermVal(permissions, key, field);
    onChange(setPermVal(permissions, key, field, !current));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60">
            <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 w-[40%]">
              Modul / Fitur
            </th>
            <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
              Lihat
            </th>
            <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
              Buat
            </th>
            <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
              Edit
            </th>
            <th className="px-3 py-2.5 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
              Hapus
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {MODULES.map((mod) => (
            <tr
              key={mod.key}
              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
            >
              <td className="px-3 py-2.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {mod.label}
                </span>
              </td>
              <PermCell
                active={getPermVal(permissions, mod.key, "view")}
                tooltip="Akses halaman ini"
                onChange={() => toggle(mod.key, "view")}
              />
              <PermCell
                active={
                  mod.hasCreate
                    ? getPermVal(permissions, mod.key, "create")
                    : false
                }
                disabled={!mod.hasCreate}
                tooltip={mod.createLabel}
                onChange={() => mod.hasCreate && toggle(mod.key, "create")}
              />
              <PermCell
                active={
                  mod.hasEdit ? getPermVal(permissions, mod.key, "edit") : false
                }
                disabled={!mod.hasEdit}
                tooltip={mod.editLabel}
                onChange={() => mod.hasEdit && toggle(mod.key, "edit")}
              />
              <PermCell
                active={
                  mod.hasDelete
                    ? getPermVal(permissions, mod.key, "delete")
                    : false
                }
                disabled={!mod.hasDelete}
                tooltip={mod.deleteLabel}
                onChange={() => mod.hasDelete && toggle(mod.key, "delete")}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Komponen Utama: SettingsPage ────────────────────────────────────────────

export default function SettingsPage({
  users,
  productionTypes,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSaveProductionType,
  onDeleteProductionType,
}: SettingsPageProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const isManagement = ["admin", "manager", "supervisor"].includes(
    currentUser.role,
  );

  // ─── State: User ────────────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [permissions, setPermissions] =
    useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [showPassword, setShowPassword] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // ─── State: Production Type ─────────────────────────────────────────────────
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  // ─── State: Announcement ────────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annForm, setAnnForm] = useState({
    title: "",
    message: "",
    type: "info" as Announcement["type"],
    expires_at: "",
  });
  const [annLoading, setAnnLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  // ─── Fetch Announcements ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setAnnouncements(data);
    };
    fetchAnnouncements();
  }, []);

  // ─── User handlers ──────────────────────────────────────────────────────────

  const handleSelectUser = (u: UserData) => {
    setSelectedUser(u);
    setIsNewUser(false);
    setShowPassword(false);
    setFormData({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      password: "",
    });
    const merged: UserPermissions = {
      dashboard: { view: false, ...((u.permissions as any)?.dashboard || {}) },
      orders: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        ...((u.permissions as any)?.orders || {}),
      },
      produksi: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        ...((u.permissions as any)?.produksi || {}),
      },
      finishing: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        ...((u.permissions as any)?.finishing || {}),
      },
      salary: { view: false, ...((u.permissions as any)?.salary || {}) },
      logs: { view: false, ...((u.permissions as any)?.logs || {}) },
      settings: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        ...((u.permissions as any)?.settings || {}),
      },
      kalkulator: {
        view: false,
        ...((u.permissions as any)?.kalkulator || {}),
      },
      config_harga: {
        view: false,
        edit: false,
        ...((u.permissions as any)?.config_harga || {}),
      },
      trash: {
        view: false,
        delete: false,
        ...((u.permissions as any)?.trash || {}),
      },
      weekly_notes: {
        view: false,
        ...((u.permissions as any)?.weekly_notes || {}),
      },
      nota: { view: false, ...((u.permissions as any)?.nota || {}) },
      keuangan: {
        view: false,
        edit: false,
        ...((u.permissions as any)?.keuangan || {}),
      },
      po_management: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        ...((u.permissions as any)?.po_management || {}),
      }, // ← TAMBAHAN
      harga_pesanan: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        ...((u.permissions as any)?.harga_pesanan || {}),
      },
    };
    setPermissions(merged);
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setIsNewUser(true);
    setShowPassword(false);
    setFormData({
      id: "",
      name: "",
      username: "",
      role: "produksi",
      password: "",
    });
    setPermissions(DEFAULT_PERMISSIONS);
  };

  const handleSubmitUser = () => {
    onSaveUser({ ...formData, permissions });
    setSelectedUser(null);
    setIsNewUser(false);
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setIsNewUser(false);
  };

  // ─── Type handlers ──────────────────────────────────────────────────────────

  const openTypeModal = (type?: ProductionTypeData) => {
    setEditingType(type || { name: "", value: "" });
    setIsTypeModalOpen(true);
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProductionType(editingType);
    setIsTypeModalOpen(false);
  };

  // ─── Announcement handlers ──────────────────────────────────────────────────

  const refreshAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
  };

  const handlePostAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.message.trim()) return;
    setAnnLoading(true);

    // Konversi ke ISO agar Supabase tahu ini waktu lokal, bukan UTC
    const expiresAt = annForm.expires_at
      ? new Date(annForm.expires_at).toISOString()
      : null;

    await supabase.from("announcements").insert({
      title: annForm.title,
      message: annForm.message,
      type: annForm.type,
      is_active: true,
      created_by: currentUser.name,
      expires_at: expiresAt, // ← pakai yang sudah dikonversi
    });

    setAnnForm({ title: "", message: "", type: "info", expires_at: "" });
    await refreshAnnouncements();
    setAnnLoading(false);
  };

  const handleToggleAnnouncement = async (id: string, current: boolean) => {
    await supabase
      .from("announcements")
      .update({ is_active: !current })
      .eq("id", id);
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !current } : a)),
    );
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // ─── Backup handler ──────────────────────────────────────────────────────────
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/backup");

      // Tambah ini untuk debug
      console.log("Status:", res.status);
      const text = await res.text();
      console.log("Response:", text);

      if (!res.ok) throw new Error(`Gagal: ${res.status} - ${text}`);

      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  // ─── Shared styles ──────────────────────────────────────────────────────────

  const inputCls =
    "w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-slate-400 dark:placeholder-slate-500";
  const labelCls =
    "block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1";

  const showEditor = selectedUser !== null || isNewUser;

  const typeColors: Record<Announcement["type"], string> = {
    info: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/40",
    warning:
      "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/40",
    success:
      "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/40",
    update:
      "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/40",
  };

  const typeLabels: Record<Announcement["type"], string> = {
    info: "ℹ️ Info",
    warning: "⚠️ Peringatan",
    success: "✅ Sukses",
    update: "📣 Update",
  };

  return (
    <div className="space-y-8 pb-24">
      {/* ── BAGIAN 1: JENIS PRODUKSI ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-green-600 dark:text-green-500" />{" "}
              Jenis Produksi
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Master data varian produksi
            </p>
          </div>
          <button
            onClick={() => openTypeModal()}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition shadow-sm"
          >
            + Tambah
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {productionTypes.map((pt) => (
            <div
              key={pt.id}
              className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm"
            >
              <div>
                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                  {pt.name}
                </div>
                <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                  {pt.value}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openTypeModal(pt)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteProductionType(pt.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-slate-200 dark:border-slate-800" />

      {/* ── BAGIAN 2: DATA PENGGUNA ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-500" />{" "}
              Data Pengguna
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola akses user aplikasi
            </p>
          </div>
          <button
            onClick={handleNewUser}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm"
          >
            + User Baru
          </button>
        </div>

        <div
          className={`grid gap-4 ${showEditor ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1"}`}
        >
          {/* Daftar User */}
          <div
            className={`${showEditor ? "lg:col-span-2" : ""} bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm`}
          >
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Daftar User
              </p>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                return (
                  <li
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-600"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border shadow-sm ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {u.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            @{u.username}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 uppercase">
                            {u.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteUser(u.id);
                        if (selectedUser?.id === u.id) {
                          setSelectedUser(null);
                          setIsNewUser(false);
                        }
                      }}
                      className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Editor: Info + Permission Table */}
          {showEditor && (
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
                    <UserPlus className="w-3.5 h-3.5" />
                    {isNewUser ? "User Baru" : `Edit: ${selectedUser?.name}`}
                  </p>
                  <button
                    onClick={handleCancel}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nama Lengkap</label>
                    <input
                      className={inputCls}
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nama lengkap"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Username</label>
                    <input
                      className={inputCls}
                      value={formData.username || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="Username"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`${inputCls} pr-9`}
                        value={formData.password || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder={
                          isNewUser ? "Password" : "Kosongkan jika tidak diubah"
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      >
                        {showPassword ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Role</label>
                    <select
                      className={inputCls}
                      value={formData.role || "produksi"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as any,
                        })
                      }
                    >
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="produksi">Produksi</option>
                      <option value="qc">QC</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Hak Akses
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Klik sel untuk toggle. Hover untuk melihat keterangan.
                  </p>
                </div>
                <PermissionTable
                  permissions={permissions}
                  onChange={setPermissions}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitUser}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BAGIAN 4: BACKUP DATA — hanya admin ── */}
      {currentUser.role === "supervisor" && (
        <>
          <hr className="border-slate-200 dark:border-slate-800" />

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" /> Backup Data
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Download semua data aplikasi dalam format JSON. Hanya dapat
                diakses oleh admin.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Export semua data
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Mencakup semua tabel: pesanan, produksi, pengguna, dan
                  lainnya.
                </p>
              </div>
              <button
                onClick={handleBackup}
                disabled={backupLoading}
                className="shrink-0 flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-600 shadow-sm transition disabled:opacity-50"
              >
                {backupLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyiapkan...
                  </>
                ) : (
                  <>⬇ Download Backup</>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      <button
        onClick={async () => {
          console.log("🔔 Tombol diklik");
          console.log("Notification API:", "Notification" in window);
          console.log("Permission saat ini:", Notification.permission);

          const result = await requestAndRegisterFCM();
          console.log("Result:", result);

          alert(`Result: ${result}`);
        }}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition"
      >
        <Bell className="w-4 h-4" />
        Aktifkan Notifikasi Push
      </button>

      {/* ── BAGIAN 3: PENGUMUMAN — hanya management ── */}
      {isManagement && (
        <>
          <hr className="border-slate-200 dark:border-slate-800" />

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-orange-500" /> Pengumuman
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Kirim informasi atau update ke semua anggota
              </p>
            </div>

            {/* Form buat pengumuman */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Buat Pengumuman Baru
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Judul</label>
                    <input
                      className={inputCls}
                      placeholder="Judul pengumuman"
                      value={annForm.title}
                      onChange={(e) =>
                        setAnnForm({ ...annForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tipe</label>
                    <select
                      className={inputCls}
                      value={annForm.type}
                      onChange={(e) =>
                        setAnnForm({
                          ...annForm,
                          type: e.target.value as Announcement["type"],
                        })
                      }
                    >
                      <option value="info">ℹ️ Info</option>
                      <option value="warning">⚠️ Peringatan</option>
                      <option value="success">✅ Sukses</option>
                      <option value="update">📣 Update Aplikasi</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Pesan</label>
                  <textarea
                    className={`${inputCls} resize-none h-20`}
                    placeholder="Isi pengumuman..."
                    value={annForm.message}
                    onChange={(e) =>
                      setAnnForm({ ...annForm, message: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Berlaku Sampai (Opsional)</label>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={annForm.expires_at}
                    onChange={(e) =>
                      setAnnForm({ ...annForm, expires_at: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handlePostAnnouncement}
                    disabled={
                      !annForm.title.trim() ||
                      !annForm.message.trim() ||
                      annLoading
                    }
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 shadow-sm transition disabled:opacity-50"
                  >
                    {annLoading ? "Mengirim..." : "Kirim Pengumuman"}
                  </button>
                </div>
              </div>
            </div>

            {/* Daftar pengumuman */}
            {announcements.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5" /> Riwayat Pengumuman
                  </p>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {announcements.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColors[a.type]}`}
                          >
                            {typeLabels[a.type]}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              a.is_active
                                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/40"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {a.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                          {a.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {a.message}
                        </p>
                        {a.expires_at && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Expired:{" "}
                            {new Date(a.expires_at).toLocaleString("id-ID", {
                              timeZone: "Asia/Jakarta",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 pt-1">
                        <button
                          onClick={() =>
                            handleToggleAnnouncement(a.id, a.is_active)
                          }
                          className={`text-xs font-bold px-2 py-1 rounded-lg transition ${
                            a.is_active
                              ? "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          }`}
                        >
                          {a.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODAL EDIT TYPE ── */}
      {isTypeModalOpen && editingType && (
        <div className="fixed inset-0 bg-black/70 z-[99] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">
              {editingType.id ? "Edit" : "Tambah"} Jenis Produksi
            </h3>
            <form onSubmit={handleTypeSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Nama</label>
                <input
                  autoFocus
                  className={inputCls}
                  value={editingType.name}
                  onChange={(e) =>
                    setEditingType({ ...editingType, name: e.target.value })
                  }
                  placeholder="Nama"
                />
              </div>
              <div>
                <label className={labelCls}>Value (Kode)</label>
                <input
                  className={`${inputCls} font-mono`}
                  value={editingType.value}
                  onChange={(e) =>
                    setEditingType({ ...editingType, value: e.target.value })
                  }
                  placeholder="value"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-sm transition text-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
