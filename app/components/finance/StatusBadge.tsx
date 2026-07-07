import React from "react";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { PaymentStatus } from "./types";

const STATUS_CONFIG: Record<
  PaymentStatus,
  { cls: string; icon: React.ReactNode; label: string }
> = {
  "Belum DP": {
    cls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40",
    icon: <AlertCircle className="w-3 h-3" />,
    label: "Belum DP",
  },
  DP: {
    cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
    icon: <Clock className="w-3 h-3" />,
    label: "DP",
  },
  Lunas: {
    cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
    icon: <CheckCircle2 className="w-3 h-3" />,
    label: "Lunas",
  },
};

export function StatusBadge({ status }: { status?: PaymentStatus }) {
  const { cls, icon, label } = STATUS_CONFIG[status ?? "Belum DP"];

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}
