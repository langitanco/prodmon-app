'use client';

import React from 'react';
import { 
  ClipboardList, 
  LayoutDashboard, 
  Settings, 
  Trash2, 
  LogOut, 
  X, 
  Calculator, 
  DollarSign,
  Info 
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { UserData } from '@/types'; 

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser: UserData;
  activeTab: 'dashboard' | 'orders' | 'settings' | 'trash' | 'kalkulator' | 'config_harga' | 'about'; 
  handleNav: (tab: any) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, currentUser, activeTab, handleNav }: SidebarProps) {
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  // --- DEBUGGING LOG (Cek Console Browser setelah save) ---
  console.log("SIDEBAR RENDER - Permissions:", currentUser.permissions);
  console.log("Check Dashboard View:", currentUser.permissions?.['dashboard']?.view);
  // -------------------------------------------------------

  // --- LOGIKA HAK AKSES (DILONGGARKAN) ---
  const canAccess = (menuId: string) => {
    // Gunakan Boolean() untuk menangkap 'true' (string) atau true (boolean)
    // dan Optional Chaining (?.) untuk keamanan
    const perm = currentUser.permissions?.[menuId];
    return Boolean(perm?.view); 
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); 
    router.push('/'); 
  };

  return (
    <>
      {/* Overlay Gelap saat Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white 
        transform transition-transform duration-300 ease-in-out 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        
        md:translate-x-0 md:sticky md:top-0 md:h-screen md:flex-shrink-0
        
        flex flex-col shadow-2xl md:shadow-none
      `}>
        
        {/* Header Sidebar */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-950 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Langitan<span className="text-blue-500">.co</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 font-bold tracking-wide ">
              SuperApp
            </p>
            <div className="inline-block bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded mt-1.5 font-mono border border-slate-700">
              V.6.0
            </div>
          </div>

          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white transition mt-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info Kecil */}
        <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-800 flex-shrink-0">
           <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
           <div className="text-xs text-blue-400 font-mono mt-0.5 tracking-wider uppercase">{currentUser.role}</div>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
          
          {canAccess('dashboard') && (
            <button 
              onClick={() => handleNav('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard className="w-5 h-5"/> Dashboard
            </button>
          )}
          
          {canAccess('orders') && (
            <button 
              onClick={() => handleNav('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <ClipboardList className="w-5 h-5"/> Daftar Pesanan
            </button>
          )}

          {canAccess('trash') && (
            <button 
                onClick={() => handleNav('trash')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'trash' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <Trash2 className="w-5 h-5"/> Sampah
            </button>
          )}

          {/* GROUP: APLIKASI LAIN */}
          {(canAccess('kalkulator') || canAccess('config_harga')) && (
            <div className="pt-4 mt-4 border-t border-slate-700">
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Aplikasi Lain</p>
              
              {canAccess('kalkulator') && (
                <button 
                  onClick={() => handleNav('kalkulator')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-left ${activeTab === 'kalkulator' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-green-400'}`}
                >
                  <Calculator className="w-5 h-5"/> Kalkulator HPP
                </button>
              )}

              {canAccess('config_harga') && (
                <button 
                  onClick={() => handleNav('config_harga')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-left ${activeTab === 'config_harga' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-yellow-400'}`}
                >
                  <DollarSign className="w-5 h-5"/> Pengaturan Harga
                </button>
              )}
            </div>
          )}
          
          {/* GROUP: SISTEM */}
          {(canAccess('settings') || canAccess('about')) && (
            <div className="pt-4 mt-4 border-t border-slate-700">
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sistem</p>

                {canAccess('settings') && (
                    <button 
                      onClick={() => handleNav('settings')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-left ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      <Settings className="w-5 h-5"/> User & Akses
                    </button>
                )}
                
                {canAccess('about') && (
                  <button 
                    onClick={() => handleNav('about')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-left ${activeTab === 'about' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <Info className="w-5 h-5"/> Tentang Aplikasi
                  </button>
                )}
            </div>
          )}

        </nav>

        {/* Tombol Logout - Fixed di bawah */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex-shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-xl transition font-bold">
            <LogOut className="w-5 h-5"/> Keluar
          </button>
        </div>

      </aside>
    </>
  );
}