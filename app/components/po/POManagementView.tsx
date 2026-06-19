"use client";

import { useState } from "react";
import POOverview from "./POOverview";
import POOrderList from "./POOrderList";
import POProductList from "./POProductList";
import POResellerList from "./POResellerList";
import POSettings from "./POSettings";
import PORekapList from "./PORekapList";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings2,
  ClipboardPaste,
} from "lucide-react";

type POTab =
  | "overview"
  | "orders"
  | "products"
  | "resellers"
  | "settings"
  | "rekap";

const tabs: { id: POTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "Pesanan", icon: ShoppingBag },
  { id: "products", label: "Produk", icon: Package },
  { id: "resellers", label: "Reseller", icon: Users },
  { id: "settings", label: "Pengaturan", icon: Settings2 },
  { id: "rekap", label: "Rekap", icon: ClipboardPaste },
];

export default function POManagementView() {
  const [activeTab, setActiveTab] = useState<POTab>("overview");

  const ActiveIcon =
    tabs.find((t) => t.id === activeTab)?.icon ?? LayoutDashboard;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-500 dark:text-blue-400 mb-1">
            Pre-Order System
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            PO Management
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Kelola produk, pesanan, dan reseller Langitan.co
          </p>
        </div>

        {/* Active tab pill — desktop hint */}
        <div className="hidden md:flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-2.5">
          <ActiveIcon size={15} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
            {tabs.find((t) => t.id === activeTab)?.label}
          </span>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 flex gap-1 overflow-x-auto no-scrollbar">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl
              whitespace-nowrap transition-all duration-200
              ${
                activeTab === id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              }
            `}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content Panel ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 min-h-[420px]">
        {activeTab === "overview" && <POOverview />}
        {activeTab === "orders" && <POOrderList />}
        {activeTab === "products" && <POProductList />}
        {activeTab === "resellers" && <POResellerList />}
        {activeTab === "settings" && <POSettings />}
        {activeTab === "rekap" && <PORekapList />}
      </div>
    </div>
  );
}
