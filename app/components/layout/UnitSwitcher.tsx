"use client";

import { useState } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useUnitAccess, ALL_UNITS } from "@/hooks/useUnitAccess";

interface UnitSwitcherProps {
  userId: string | undefined;
  currentUnitCode: string; // unit tempat aplikasi ini berjalan, misal 'sablon'
}

export default function UnitSwitcher({
  userId,
  currentUnitCode,
}: UnitSwitcherProps) {
  const { units, loading } = useUnitAccess(userId);
  const [open, setOpen] = useState(false);

  // Tidak tampilkan apapun kalau masih loading, atau user cuma punya
  // akses ke unit ini saja (bukan direksi lintas-unit)
  if (loading || units.length <= 1) return null;

  const currentUnit =
    ALL_UNITS.find((u) => u.code === currentUnitCode) ?? units[0];

  function handleSelect(unit: (typeof units)[number]) {
    setOpen(false);
    if (unit.code === currentUnitCode) return; // sudah di unit ini
    window.location.href = `https://${unit.domain}`;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition shadow-sm active:scale-95 text-sm font-bold"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <Building2 className="w-4 h-4" />
        <span className="hidden md:inline">{currentUnit.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/10 dark:bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div
            className="
            fixed md:absolute right-4 md:right-0 left-4 md:left-auto top-24 md:top-full md:mt-2
            md:w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700
            z-40 p-2 animate-in fade-in slide-in-from-top-2 duration-200
          "
          >
            <p className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Pindah Unit Usaha
            </p>
            {units.map((unit) => {
              const isActive = unit.code === currentUnitCode;
              return (
                <button
                  key={unit.code}
                  onClick={() => handleSelect(unit)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 text-sm font-semibold transition
                    ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {unit.label}
                  {isActive && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
