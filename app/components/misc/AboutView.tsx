// app/components/misc/AboutView.tsx

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
  version: "V.7.0",  // UPDATED KE V.8.0
  purpose: "Aplikasi produksi Sablon, Langitan.co.",
  creator: "Tim Developer Langitan.co",
  creationDate: "Desember 2025",
};

// --- DATA RIWAYAT UPDATE ---
const CHANGELOG: ChangelogEntry[] = [
  {
    version: "8.0",
    date: "2025-12-21",
    changes: [
      "Tampilan baru serta logika baru.",
      "Pesanan akan muncul di user yang dipilih.",
    ],
  },
  {
    version: "7.0",
    date: "2025-12-18",
    changes: [
      "Smart Push Notifications (Firebase Integration): Sistem kini mendukung notifikasi realtime ke HP/Laptop tanpa perlu membuka website.",
      "Role-Based Notification Logic: Notifikasi dikirim secara pintar hanya ke role yang relevan (contoh: Revisi ke Produksi, Kendala ke Admin/Manager, dll).",
      "Automated Morning Guard (Cron Job): Sistem otomatis mengecek pesanan telat setiap jam 09:00 pagi dan mengirim peringatan ke tim terkait.",
      "FCM Token Management: Penambahan sistem penyimpanan token perangkat yang aman di database Supabase untuk memastikan pengiriman notifikasi tepat sasaran.",
      "Stability Fixes: Perbaikan pada inisialisasi Firebase Messaging untuk mencegah tabrakan proses (Race Condition) di sisi client.",
    ],
  },
  {
    version: "6.9",
    date: "2025-12-17",
    changes: [
      "HD Share Ticket (Fitur Unggulan): Fitur berbagi laporan kini menghasilkan gambar 'Tiket' resolusi tinggi (HD) yang rapi dan profesional, bukan sekadar screenshot.",
      "Smart Action Dashboard: Bagian 'Perlu Tindakan Segera' kini lebih cerdas. Satu pesanan bisa muncul 2x jika memiliki masalah berbeda (misal: Telat & Kendala), sehingga tidak ada isu yang terlewat.",
      "Redesain Order Detail: Tampilan QC & Packing kini menggunakan layout Split View (Kiri-Kanan) yang simetris dan modern.",
      "Logika Status 'Telat' (Frontend Override): Perbaikan permanen logika status. Status 'Telat' kini murni indikator waktu visual dan tidak lagi mengacaukan status alur produksi di database.",
      "UI/UX Polish: Perbaikan konsistensi tombol, badge status (Pill Shape), dan kartu daftar pesanan yang kini tingginya seragam (simetris).",
    ],
  },
  {
    version: "6.5",
    date: "2025-12-16",
    changes: [
      "Matrix Hak Akses V2 (Granular): Sistem izin super detail. Kini Admin bisa mengatur siapa yang boleh Edit Harga, Hapus File Bukti, atau akses jenis produksi tertentu.",
      "Mobile-First Settings UI: Tampilan 'Pengaturan User' dikembalikan ke mode Modal (Pop-up) agar nyaman diedit menggunakan Handphone.",
      "Smart Auto-Status: Perbaikan logika 'Telat'. Status kini otomatis dihitung ulang secara realtime saat tanggal deadline diedit.",
      "Data Safeguard: Penambahan fitur 'Smart Merge' untuk mencegah error pada data user lama saat ada update fitur baru.",
    ],
  },
  {
    version: "6.1",
    date: "2025-12-12",
    changes: [
      "Revamp Kalkulator Sablon Manual: Kini mendukung perhitungan multi-area (Kecil, Sedang, Besar) dalam satu order untuk akurasi biaya gesut.",
      "Core System Upgrade: Migrasi total ke `@supabase/ssr` untuk stabilitas penuh di Next.js 16 (Turbopack).",
      "Fix Logika Status Kendala: Status pesanan kini otomatis kembali normal (Selesai/On Process) setelah semua kendala diselesaikan.",
      "Smart Sorting: Tampilan pengaturan harga kini otomatis urut (Kecil -> Sedang -> Besar) agar lebih mudah dibaca.",
    ],
  },
  {
    version: "6.0",
    date: "2025-12-07",
    changes: [
      "Matrix Hak Akses (CRUD): Upgrade besar sistem keamanan. Kini akses user bisa diatur sangat spesifik (View, Create, Edit, Delete).",
      "Database Security (RLS): Penerapan Row Level Security tingkat lanjut.",
      "Manajemen User Lanjutan: Tampilan pengaturan user diperbarui dengan tabel matriks checklist.",
      "Fix Bug Sidebar Blank: Perbaikan logika rendering menu sidebar.",
    ],
  },
  {
    version: "5.9",
    date: "2025-12-06",
    changes: [
      "Granular Access Control: Sistem hak akses baru berbasis checklist menu, tidak lagi kaku berdasarkan role.",
      "Dynamic Sidebar: Menu sidebar otomatis menyesuaikan dengan izin user.",
      "UI Improvement: Perbaikan kontras warna teks input agar lebih mudah dibaca.",
      "Logika HPP Manual: Perhitungan upah gesut kini proporsional berdasarkan jumlah warna.",
      "Privasi Data: Nominal upah SDM di kalkulator disembunyikan.",
    ],
  },
  {
    version: "5.8",
    date: "2025-12-05",
    changes: [
      "Menambah tombol share pada laporan kendala, supaya bisa dibagikan.",
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
    <div className="flex justify-center items-start min-h-full p-2 md:p-8"> 
      <div className="w-full max-w-2xl bg-white p-4 md:p-8 rounded-2xl shadow-lg border border-slate-200 space-y-5 md:space-y-6"> 
        
        {/* HEADER APLIKASI */}
        <div className="text-center border-b border-slate-100 pb-5">
          <div className="bg-blue-600 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/50">
            <Zap className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">{APP_INFO.name}</h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">{APP_INFO.purpose}</p>
        </div>

        {/* INFO DASAR */}
        <div className="space-y-3">
          <h3 className="text-base md:text-lg font-bold text-slate-700 border-b border-dashed border-slate-200 pb-2 flex items-center gap-2">
            <Package className="w-4 h-4 md:w-5 md:h-5 text-slate-400" /> Detail Aplikasi
          </h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 md:gap-y-3 text-xs md:text-sm">
            <p className="text-slate-500 font-medium">Dibuat Oleh:</p>
            <p className="font-bold text-slate-800">{APP_INFO.creator}</p>
            
            <p className="text-slate-500 font-medium">Tanggal Peluncuran:</p>
            <p className="font-bold text-slate-800">{APP_INFO.creationDate}</p>
          </div>
        </div>

        {/* CHANGELOG SECTION (Toggle) */}
        <div className="pt-3 border-t border-slate-100">
          <button 
            onClick={() => setShowChangelog(!showChangelog)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition group"
          >
            <div className="flex items-center gap-2">
               <Clock className="w-4 h-4 text-blue-500" />
               <span className="text-sm font-bold text-slate-700">Riwayat Pembaruan (Changelog)</span>
            </div>
            {showChangelog ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            )}
          </button>

          {/* LIST CHANGELOG */}
          {showChangelog && (
             <div className="mt-4 space-y-4">
                {CHANGELOG.map((log, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                     <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                        <span className={`font-extrabold text-sm ${index === 0 ? 'text-blue-600' : 'text-slate-700'}`}>
                           Versi {log.version}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                           {log.date}
                        </span>
                     </div>
                     <ul className="space-y-1.5 pl-1">
                        {log.changes.map((change, idx) => (
                           <li key={idx} className="text-xs md:text-sm text-slate-600 flex items-start gap-2">
                             <span className="block w-1 h-1 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
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