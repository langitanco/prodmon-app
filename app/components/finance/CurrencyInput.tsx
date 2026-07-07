import React, { useState } from "react";
import { formatRupiah } from "./utils";

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  required?: boolean;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  readOnly = false,
  required = false,
}: CurrencyInputProps) {
  const [raw, setRaw] = useState(value > 0 ? value.toString() : "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setRaw(digits);
    onChange?.(parseInt(digits, 10) || 0);
  };

  const display = readOnly
    ? formatRupiah(value)
    : raw
      ? `Rp ${parseInt(raw || "0", 10).toLocaleString("id-ID")}`
      : "";

  const baseCls =
    "w-full border rounded-xl px-3 py-2.5 text-sm font-mono transition outline-none focus:ring-2 focus:ring-blue-500";
  const editCls =
    "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400";
  const readonlyCls =
    "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed";

  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {readOnly ? (
        <div className={`${baseCls} ${readonlyCls}`}>{display || "Rp 0"}</div>
      ) : (
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          placeholder="Rp 0"
          className={`${baseCls} ${editCls}`}
        />
      )}
    </div>
  );
}
