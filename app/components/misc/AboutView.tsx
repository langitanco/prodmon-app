// app/components/misc/AboutView.tsx
'use client';

import React, { useState } from 'react';
import { Package, User, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react';
import { APP_INFO, CHANGELOG } from '@/lib/changelog';

export default function AboutView() {
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <div className="flex justify-center items-start min-h-full p-2 md:p-8">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 space-y-5 md:space-y-6">

        {/* Header Aplikasi */}
        <div className="text-center border-b border-slate-100 dark:border-slate-700 pb-5">
          <div className="bg-blue-600 dark:bg-blue-500 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/50 dark:shadow-blue-400/30">
            <Zap className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
            {APP_INFO.name}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
            {APP_INFO.purpose}
          </p>
        </div>

        {/* Detail Aplikasi */}
        <div className="space-y-3">
          <h3 className="text-base md:text-lg font-bold text-slate-700 dark:text-slate-200 border-b border-dashed border-slate-200 dark:border-slate-600 pb-2 flex items-center gap-2">
            <Package className="w-4 h-4 md:w-5 md:h-5 text-slate-400 dark:text-slate-500" />
            Detail Aplikasi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 md:gap-y-3 text-xs md:text-sm">
            <p className="text-slate-500 dark:text-slate-400 font-medium">Versi Saat Ini:</p>
            <p className="font-bold text-slate-800 dark:text-slate-100">{APP_INFO.version} (Latest)</p>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Platform:</p>
            <p className="font-bold text-slate-800 dark:text-slate-100">Next.js & Supabase</p>
          </div>
        </div>

        {/* Pengembang */}
        <div className="pt-3 space-y-3">
          <h3 className="text-base md:text-lg font-bold text-slate-700 dark:text-slate-200 border-b border-dashed border-slate-200 dark:border-slate-600 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 md:w-5 md:h-5 text-slate-400 dark:text-slate-500" />
            Pengembang
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 md:gap-y-3 text-xs md:text-sm">
            <p className="text-slate-500 dark:text-slate-400 font-medium">Dibuat Oleh:</p>
            <p className="font-bold text-slate-800 dark:text-slate-100">{APP_INFO.creator}</p>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Tanggal Peluncuran:</p>
            <p className="font-bold text-slate-800 dark:text-slate-100">{APP_INFO.creationDate}</p>
          </div>
        </div>

        {/* Changelog */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setShowChangelog(!showChangelog)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition group"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Riwayat Pembaruan (Changelog)
              </span>
            </div>
            {showChangelog
              ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
              : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            }
          </button>

          {showChangelog && (
            <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {CHANGELOG.map((log, index) => (
                <div
                  key={index}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-600"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-600 pb-2">
                    <span className={`font-extrabold text-sm ${index === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      Versi {log.version}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                      {log.date}
                    </span>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {log.changes.map((change, idx) => (
                      <li key={idx} className="text-xs md:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                        <span className="block w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}