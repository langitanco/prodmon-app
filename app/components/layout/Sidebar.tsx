// app/components/layout/Sidebar.tsx
'use client';

import React from 'react';
import { 
  Home, 
  ClipboardList, 
  Settings, 
  Calculator, 
  Trash2, 
  Info, 
  X, 
  DollarSign 
} from 'lucide-react';
import { UserData } from '@/types';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser: UserData;
  activeTab: string;
  handleNav: (tab: any) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, currentUser, activeTab, handleNav }: SidebarProps) {
  
  // Helper untuk mengecek izin akses menu
  const canAccess = (page: string) => currentUser.permissions?.pages?.[page as keyof typeof currentUser.permissions.pages];

  // Daftar Menu Utama (Bagian Atas)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, visible: canAccess('dashboard') },
    { id: 'orders', label: 'Pesanan', icon: ClipboardList, visible: canAccess('orders') },
    { id: 'kalkulator', label: 'Kalkulator', icon: Calculator, visible: canAccess('kalkulator') },
    { id: 'config_harga', label: 'Config Harga', icon: DollarSign, visible: canAccess('config_harga') },
    { id: 'trash', label: 'Sampah', icon: Trash2, visible: canAccess('trash') },
    { id: 'about', label: 'Tentang App', icon: Info, visible: true }, // Selalu muncul
  ];

  return (
    <>
      {/* OVERLAY GELAP (Hanya Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        
        {/* HEADER SIDEBAR (Logo & Tombol Close) */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600">
            {/* Ikon Logo Sederhana */}
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <span className="font-bold text-lg tracking-tight text-slate-800">LCO App</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BAGIAN TENGAH: Menu Navigasi */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          
          {/* --- BAGIAN PROFIL USER (Hanya Muncul di Mobile) --- */}
          {/* Class 'md:hidden' membuatnya hilang saat layar lebar */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 md:hidden">
            <div className="text-sm font-bold text-slate-800">{currentUser.name}</div>
            <div className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-0.5">{currentUser.role}</div>
          </div>
          
          {/* Render Menu Items */}
          {menuItems.map((item) => (
             item.visible && (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
             )
          ))}
        </div>

        {/* BAGIAN BAWAH (FOOTER): Tombol Pengaturan */}
        <div className="p-4 border-t border-slate-100">
          {canAccess('settings') ? (
            <button
              onClick={() => handleNav('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Settings className="w-5 h-5" />
              Pengaturan
            </button>
          ) : (
            // Jika user tidak punya akses pengaturan, tampilkan copyright saja
            <div className="text-center text-[10px] text-slate-300 font-medium py-2">
              v1.0.0 Production
            </div>
          )}
        </div>

      </aside>
    </>
  );
}