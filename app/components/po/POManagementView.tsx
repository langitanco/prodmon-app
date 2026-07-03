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
  ArrowLeft,
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

interface POManagementViewProps {
  poId: string;
  onBack?: () => void;
}

export default function POManagementView({
  poId,
  onBack,
}: POManagementViewProps) {
  const [activeTab, setActiveTab] = useState<POTab>("overview");

  const ActiveIcon =
    tabs.find((t) => t.id === activeTab)?.icon ?? LayoutDashboard;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
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
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-sm shrink-0">
            <ActiveIcon size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-500 mb-1">
              Pre-Order System
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none truncate">
              PO Management{" "}
              <span className="text-blue-600 font-mono text-xl ml-1">
                #{poId.slice(0, 8)}
              </span>
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium truncate">
              Mengelola data terisolasi untuk ID Campaign: {poId}
            </p>
          </div>
        </div>
      </div>

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

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 min-h-[420px]">
        {/* Catatan: Bagian di bawah ini akan tetap ada garis merah (error TypeScript) 
            sampai kita menambahkan props 'poId' ke dalam file sub-komponennya masing-masing */}
        {activeTab === "overview" && <POOverview poId={poId} />}
        {activeTab === "orders" && <POOrderList poId={poId} />}
        {activeTab === "products" && <POProductList poId={poId} />}
        {activeTab === "resellers" && <POResellerList poId={poId} />}
        {activeTab === "settings" && <POSettings poId={poId} />}
        {activeTab === "rekap" && <PORekapList poId={poId} />}
      </div>
    </div>
  );
}
