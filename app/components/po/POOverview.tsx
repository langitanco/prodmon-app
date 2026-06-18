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
} from "lucide-react";

export default function POOverview() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalPublic: 0,
    totalReseller: 0,
    totalAmount: 0,
    totalProducts: 0,
  });
  const [setting, setSetting] = useState<POSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const [s, st] = await Promise.all([getPOSettingAdmin(), getPOStats()]);
      setSetting(s);
      setStats(st);
      setLoading(false);
    }
    load();
  }, []);

  const currentSlug = setting?.url_slug || "katalog";
  const poUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/po/${currentSlug}`
      : `/po/${currentSlug}`;

  function handleCopy() {
    navigator.clipboard.writeText(poUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading)
    return (
      <div className="flex items-center gap-3 py-8 text-slate-400 dark:text-slate-500">
        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">Memuat data...</span>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ── Status Banner ─────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border px-5 py-4 flex items-center justify-between gap-4
          ${
            setting?.is_active
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
          }`}
      >
        <div className="flex items-center gap-3">
          {setting?.is_active ? (
            <CheckCircle2
              size={20}
              className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
            />
          ) : (
            <XCircle
              size={20}
              className="text-rose-500 dark:text-rose-400 flex-shrink-0"
            />
          )}
          <div>
            <p
              className={`text-sm font-extrabold ${setting?.is_active ? "text-emerald-800 dark:text-emerald-300" : "text-rose-700 dark:text-rose-400"}`}
            >
              PO {setting?.is_active ? "AKTIF" : "NONAKTIF"}
            </p>
            <p
              className={`text-xs mt-0.5 ${setting?.is_active ? "text-emerald-600 dark:text-emerald-500" : "text-rose-500 dark:text-rose-500"}`}
            >
              {setting?.is_active
                ? "Form pemesanan terbuka untuk publik"
                : "Form pemesanan sedang ditutup"}
            </p>
          </div>
        </div>

        {setting?.periode_mulai && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <CalendarDays size={14} />
            <span>
              {setting.periode_mulai} — {setting.periode_selesai || "Selesai"}
            </span>
          </div>
        )}
      </div>

      {/* ── Stats Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: "Total Pesanan",
            value: stats.totalOrders,
            icon: ShoppingBag,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "Total Produk",
            value: stats.totalProducts || 0,
            icon: Package,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-50 dark:bg-indigo-900/20",
          },
          {
            label: "Publik",
            value: stats.totalPublic,
            icon: Globe,
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-50 dark:bg-violet-900/20",
          },
          {
            label: "Reseller",
            value: stats.totalReseller,
            icon: Users,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20",
          },
          {
            label: "Total Revenue",
            value: formatRupiah(stats.totalAmount),
            icon: Banknote,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col"
          >
            <div
              className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-3`}
            >
              <s.icon size={15} className={s.color} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              {s.label}
            </p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white leading-none mt-auto">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Public Link ───────────────────────────────────────────── */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3 font-extrabold uppercase tracking-widest flex items-center gap-2">
          <LinkIcon size={11} /> Link Katalog Publik
        </p>
        <div className="flex gap-2 items-center flex-wrap md:flex-nowrap">
          <code className="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 w-full md:flex-1 font-mono text-slate-600 dark:text-slate-300 truncate">
            {poUrl}
          </code>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleCopy}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-bold border px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap
                ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
            >
              <Copy size={13} />
              {copied ? "Tersalin!" : "Salin"}
            </button>
            <a
              href={`/po/${currentSlug}`}
              target="_blank"
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ExternalLink size={13} /> Buka
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
