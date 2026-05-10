import React, { useState } from 'react';
import { SizeEntry } from '@/app/components/orders/SizeInputForm';
import { ChevronDown, ChevronUp, Ruler } from 'lucide-react';

interface DetailUkuranProps {
  data?: SizeEntry[] | null;
}

const UKURAN_STANDAR = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export default function DetailUkuran({ data }: DetailUkuranProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!data || data.length === 0) return null;

  const grandTotal = data.reduce(
    (total, entry) =>
      total + Object.values(entry.ukuran).reduce((a: number, b) => a + (b ?? 0), 0),
    0
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 border dark:border-slate-800 shadow-sm overflow-hidden">

      {/* Header — klik untuk buka/tutup */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 md:px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
      >
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="font-bold text-slate-800 dark:text-white text-sm">Detail Ukuran</span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/40">
            {grandTotal} pcs
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {data.length} varian
          </span>
        </div>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />
        }
      </button>

      {/* Konten collapsible */}
      {isOpen && (
        <div className="px-4 md:px-6 pb-4 border-t border-slate-100 dark:border-slate-800 space-y-2 pt-3">
          {data.map((entry, i) => {
            const subtotal = Object.values(entry.ukuran).reduce((a: number, b) => a + (b ?? 0), 0);
            const standar = UKURAN_STANDAR.filter(uk => entry.ukuran[uk] != null);
            const custom = Object.entries(entry.ukuran).filter(([key]) => !UKURAN_STANDAR.includes(key));

            return (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                {/* Label varian */}
                <div className="flex items-center gap-1.5 min-w-[140px]">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">#{i + 1}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                    {entry.warna}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 capitalize">
                    · {entry.lengan}
                  </span>
                </div>

                {/* Kotak ukuran — compact */}
                <div className="flex flex-wrap gap-1 flex-1">
                  {standar.map(uk => (
                    <div
                      key={uk}
                      className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-1"
                    >
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase leading-none">
                        {uk}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-white leading-none">
                        {entry.ukuran[uk]}
                      </span>
                    </div>
                  ))}
                  {custom.map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40 rounded-lg px-2 py-1"
                    >
                      <span className="text-[10px] text-orange-400 uppercase leading-none">{key}</span>
                      <span className="text-xs font-bold text-orange-700 dark:text-orange-300 leading-none">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Subtotal */}
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                  {subtotal} pcs
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}