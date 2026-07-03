"use client";

import { useEffect, useState } from "react";
import { getPOStats, getPOSettingAdmin } from "@/lib/po/admin";
import { formatRupiah } from "@/lib/po/pricing";
import { POSetting } from "@/types/po";
import {
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  ShoppingBag,
  Users,
  Globe,
  Banknote,
  Copy,
  ExternalLink,
  CalendarDays,
  Package,
  UserPlus,
  UserCog,
} from "lucide-react";

// 1. Tambahkan interface untuk props
interface POOverviewProps {
  poId: string;
}

// 2. Terima props poId di dalam komponen
export default function POOverview({ poId }: POOverviewProps) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalPublic: 0,
    totalReseller: 0,
    totalAmount: 0,
    totalProducts: 0,
  });
  const [setting, setSetting] = useState<POSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // 3. Teruskan poId ke dalam fungsi admin
      // Pastikan fungsi getPOStats di lib/po/admin.ts juga sudah diperbarui untuk menerima parameter (poId?: string)
      const [s, st] = await Promise.all([
        getPOSettingAdmin(poId),
        getPOStats(poId),
      ]);
      setSetting(s);
      setStats(st);
      setLoading(false);
    }
    load();
  }, [poId]); // Tambahkan poId sebagai dependency

  const currentSlug = setting?.url_slug || "katalog";
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const links = [
    {
      key: "katalog",
      label: "Katalog PO (Publik)",
      url: `${origin}/po/${currentSlug}`,
      href: `/po/${currentSlug}`,
      icon: Globe,
    },
    {
      key: "reseller",
      label: "Portal Reseller",
      url: `${origin}/po/reseller?slug=${currentSlug}`,
      href: `/po/reseller?slug=${currentSlug}`,
      icon: Users,
    },
    {
      key: "daftar-reseller",
      label: "Form Pendaftaran Reseller",
      url: `${origin}/po/${currentSlug}/daftar-reseller`,
      href: `/po/${currentSlug}/daftar-reseller`,
      icon: UserPlus,
    },
  ];

  const handleCopy = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error("Gagal menyalin link:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Action Links ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <div
              key={link.key}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {link.label}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Klik salin untuk membagikan
                  </p>
                </div>
              </div>

              <code className="block w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 truncate select-all">
                {link.url}
              </code>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleCopy(link.key, link.url)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-bold border px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap
                    ${
                      copiedKey === link.key
                        ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                >
                  <Copy size={13} />
                  {copiedKey === link.key ? "Tersalin!" : "Salin"}
                </button>
                <a
                  href={link.href}
                  target="_blank"
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ExternalLink size={13} />
                  Buka
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Status & Settings Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status PO */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              setting?.is_active
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {setting?.is_active ? (
              <CheckCircle2 size={24} />
            ) : (
              <XCircle size={24} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
              Status Pre-Order
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  setting?.is_active
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                }`}
              >
                {setting?.is_active ? "AKTIF" : "DITUTUP"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {setting?.is_active
                ? "Sistem sedang menerima pesanan dari publik maupun reseller."
                : "Pre-order sedang ditutup. Pelanggan tidak dapat membuat pesanan baru."}
            </p>
          </div>
        </div>

        {/* Info Periode */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CalendarDays size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3">
              Periode Pre-Order
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                  Mulai
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {setting?.periode_mulai
                    ? new Date(setting.periode_mulai).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                  Selesai
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {setting?.periode_selesai
                    ? new Date(setting.periode_selesai).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex flex-col items-center text-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Pesanan
            </p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.totalOrders}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex flex-col items-center text-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
            <Banknote size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Omset Sementara
            </p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              {formatRupiah(stats.totalAmount)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex flex-col items-center text-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Katalog Produk
            </p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.totalProducts}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex flex-col items-center text-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center">
            <UserCog size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pesanan Reseller
            </p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.totalReseller}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
