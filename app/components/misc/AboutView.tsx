'use client';

import React, { useState } from 'react';
import { Package, User, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

const APP_INFO = {
  name: "LCO SuperApp",
  version: "V.5.5",
  purpose: "Aplikasi produksi Sablon, Langitan.co.",
  creator: "Tim Developer Langitan.co",
  creationDate: "Desember 2025",
};

// Data riwayat pembaruan (Anda bisa menambahkan/mengubahnya di sini)
const CHANGELOG: ChangelogEntry[] = [
  {
    version: "5.8",
    date: "2025-12-05",
    changes: [
      "Menambah tombol share pada laporan kendala, supaya bisa dibagikan",
    ],
  },
  {
    version: "5.5",
    date: "2025-12-03",
    changes: [
      "Dashboard dirombak total: Menampilkan grafik tren PCS dan komposisi jenis produksi.",
      "Logic status urgent/telat diperbaiki: Prioritas utama diberikan pada status 'Ada Kendala'.",
      "Kalkulator produksi: Loading spinner dan tampilan mobile diperbaiki agar lebih simetris.",
    ],
  },
  {
    version: "4.0",
    date: "2025-11-28",
    changes: [
      "Fitur Add-ons Harga ditambahkan di Pengaturan Harga.",
      "Input login diubah menggunakan Supabase Auth Cookies (lebih aman).",
      "UI Login diperbaiki agar lebih profesional.",
    ],
  },
  {
    version: "1.0",
    date: "2025-11-15",
    changes: [
      "Peluncuran awal sistem.",
      "Integrasi Supabase dan Kalkulasi HPP Dasar (DTF/Manual).",
    ],
  },
];


export default function AboutView() {
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <div className="flex justify-center items-start min-h-full p-2 md:p-8"> {/* Padding dikurangi di HP */}
      <div className="w-full max-w-2xl bg-white p-4 md:p-8 rounded-2xl shadow-lg border border-slate-200 space-y-5 md:space-y-6"> {/* Padding dan spacing dikurangi */}
        
        {/* HEADER APLIKASI */}
        <div className="text-center border-b border-slate-100 pb-5">
          <div className="bg-blue-600 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/50">
            <Zap className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          {/* FONT SIZE PERBAIKAN: text-2xl di HP */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">{APP_INFO.name}</h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">{APP_INFO.purpose}</p>
        </div>

        {/* INFO DASAR */}
        <div className="space-y-3">
          <h3 className="text-base md:text-lg font-bold text-slate-700 border-b border-dashed border-slate-200 pb-2 flex items-center gap-2">
            <Package className="w-4 h-4 md:w-5 md:h-5 text-slate-400" /> Detail Aplikasi
          </h3>
          {/* GRID PERBAIKAN: Stack di HP, 2 Kolom di Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 md:gap-y-3 text-xs md:text-sm">
            <p className="text-slate-500 font-medium">Versi Saat Ini:</p>
            <p className="font-bold text-slate-800">{APP_INFO.version} (Latest)</p>

            <p className="text-slate-500 font-medium">Platform:</p>
            <p className="font-bold text-slate-800">Next.js & Supabase</p>
          </div>
        </div>

        {/* INFO CREATOR */}
        <div className="pt-3 space-y-3">
          <h3 className="text-base md:text-lg font-bold text-slate-700 border-b border-dashed border-slate-200 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 md:w-5 md:h-5 text-slate-400" /> Pengembang
          </h3>
          {/* GRID PERBAIKAN: Stack di HP, 2 Kolom di Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 md:gap-y-3 text-xs md:text-sm">
            <p className="text-slate-500 font-medium">Dibuat Oleh:</p>
            <p className="font-bold text-slate-800">{APP_INFO.creator}</p>
            
            <p className="text-slate-500 font-medium">Tanggal Peluncuran:</p>
            <p className="font-bold text-slate-800">{APP_INFO.creationDate}</p>
          </div>
        </div>

        {/* CHANGELOG SECTION (Toggle) */}
        <div className="pt-3">
          <button 
            onClick={() => setShowChangelog(!showChangelog)}
            className="w-full text-left flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-sm"
          >
            <h3 className="text-sm md:text-base font-bold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" /> Riwayat Pembaruan ({CHANGELOG.length} Versi)
            </h3>
            <div className='p-1'> {/* Menambah wrapper untuk Chevron agar konsisten */}
                {showChangelog ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
            </div>
          </button>

          {showChangelog && (
            <div className="mt-4 space-y-4 animate-in fade-in duration-300"> {/* Spacing dikurangi */}
              {CHANGELOG.map((log, index) => (
                <div key={log.version} className={`p-3 md:p-4 rounded-xl border ${index === 0 ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-white border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    {/* FONT SIZE PERBAIKAN: text-base di HP */}
                    <span className={`font-extrabold text-base md:text-lg ${index === 0 ? 'text-blue-700' : 'text-slate-800'}`}>
                        v{log.version}
                    </span>
                    <span className={`text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full ${index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {log.date}
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-slate-700 ml-1"> {/* Font size dikurangi */}
                    {log.changes.map((change, i) => (
                      <li key={i} className={index === 0 ? 'text-blue-900' : 'text-slate-700'}>{change}</li>
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