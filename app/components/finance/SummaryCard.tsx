import React from "react";

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export function SummaryCard({ label, value, icon, color }: SummaryCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-800 dark:text-white font-mono truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
