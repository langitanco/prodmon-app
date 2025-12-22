// app/components/layout/Header.tsx - FIXED CLICK HANDLER & MOBILE TITLE
'use client';

import React, { useState } from 'react';
import { Menu, Bell, LogOut } from 'lucide-react'; 
import { UserData } from '@/types';

interface HeaderProps {
  currentUser: UserData;
  onToggleSidebar: () => void;
  onLogout: () => void;
  sidebarOpen: boolean;
  currentPage?: string;
  notifications?: Array<{
    id: string; 
    title: string; 
    message: string; 
    time: string; 
    isRead: boolean;
    orderId?: string;
  }>;
  onNotificationClick?: (notificationId: string, orderId: string) => void;
}

export default function Header({ 
  currentUser, 
  onToggleSidebar, 
  onLogout, 
  sidebarOpen, 
  currentPage = 'dashboard', 
  notifications = [],
  onNotificationClick 
}: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // --- LOGIKA JUDUL HALAMAN (MOBILE) ---
  const pageTitles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    orders: 'Daftar Pesanan',
    completed_orders: 'Arsip Selesai',
    trash: 'Sampah',
    settings: 'Pengaturan',
    kalkulator: 'Kalkulator HPP',
    config_harga: 'Konfigurasi Harga',
    about: 'Tentang Aplikasi',
    default: 'Langitan.co'
  };

  const currentTitle = pageTitles[currentPage] || pageTitles.default;

  // ✅ FIXED: Handle klik notifikasi
  const handleNotificationClick = (notif: any) => {
    console.log('Notifikasi diklik:', notif); 
    setShowNotif(false); 
    
    if (notif.orderId && onNotificationClick) {
      console.log('Memanggil callback dengan orderId:', notif.orderId); 
      onNotificationClick(notif.id, notif.orderId);
    } else {
      console.warn('orderId tidak tersedia atau callback tidak ada', {
        orderId: notif.orderId,
        hasCallback: !!onNotificationClick
      });
    }
  };

  return (
    <header className={`
      sticky top-0 h-20 px-4 md:px-10 flex items-center justify-between transition-all duration-300
      z-20 
      ${sidebarOpen 
        ? 'bg-gray-100/40 backdrop-blur-xl'
        : 'bg-gray-100'
      }
      md:bg-gray-100 md:backdrop-blur-none
    `}>
      
      {/* KIRI: Tombol Menu, Judul Mobile & Salam Desktop */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar} 
          className="p-2.5 bg-white rounded-2xl text-slate-600 md:hidden hover:bg-slate-50 border border-slate-100 shadow-sm active:scale-95 transition-transform"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* TAMPILAN DESKTOP: Hanya muncul Salam di Dashboard */}
        <div className="hidden md:block">
          {currentPage === 'dashboard' && (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Assalamu'alaikum</h2>
              <p className="text-xs text-slate-500 font-medium">Selamat datang kembali, {currentUser.name} 👋</p>
            </>
          )}
        </div>

        {/* TAMPILAN MOBILE: Judul Menu Aktif */}
        <div className="md:hidden">
           <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">
             {currentTitle}
           </h1>
        </div>
      </div>

      {/* KANAN: Notifikasi & Profil Mobile */}
      <div className="flex items-center gap-3">
        
        {/* BELL NOTIFIKASI */}
        <div className="relative">
           <button 
             onClick={() => setShowNotif(!showNotif)}
             className="p-2.5 md:p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-blue-600 transition relative shadow-sm active:scale-95"
             style={{ WebkitTapHighlightColor: 'transparent' }}
           >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
           </button>

           {showNotif && (
             <>
               <div 
                 className="fixed inset-0 z-30 bg-black/10" 
                 onClick={() => setShowNotif(false)}
               />
               
               <div className="
                 fixed md:absolute 
                 right-4 md:right-0 
                 top-24 md:top-full 
                 md:mt-2 
                 w-[calc(100vw-2rem)] md:w-80 
                 max-w-md
                 bg-white rounded-2xl shadow-2xl border border-slate-100 
                 z-40 
                 overflow-hidden
                 animate-in fade-in slide-in-from-top-2 md:slide-in-from-top-0 duration-200
               ">
                  <div className="px-4 py-3 border-b border-slate-100 font-bold text-sm text-slate-800 flex items-center justify-between sticky top-0 bg-white z-10">
                    <span>Notifikasi</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p>Tidak ada notifikasi</p>
                    </div>
                  ) : (
                    <div className="max-h-[60vh] md:max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <div className="flex items-start gap-2">
                            {!notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs text-slate-800 line-clamp-1">{notif.title}</p>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
                              {notif.orderId && (
                                <p className="text-[9px] text-blue-500 mt-0.5">Order: {notif.orderId}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
             </>
           )}
        </div>

        {/* PROFIL USER (MOBILE ONLY) */}
        <div className="relative md:hidden">
           <button 
             onClick={() => setShowProfile(!showProfile)}
             className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden active:scale-95 transition-transform"
             style={{ WebkitTapHighlightColor: 'transparent' }}
           >
              {currentUser.avatar_url ? (
                 <img src={currentUser.avatar_url} alt="User" className="w-full h-full object-cover" />
              ) : (
                 <div className="font-bold text-slate-700 bg-slate-100 w-full h-full flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                 </div>
              )}
           </button>

           {showProfile && (
             <>
               <div 
                 className="fixed inset-0 z-30 bg-black/10" 
                 onClick={() => setShowProfile(false)}
               />
               <div className="
                 fixed md:absolute 
                 right-4 md:right-0 
                 top-24 md:top-full 
                 md:mt-2 
                 w-56 
                 bg-white rounded-2xl shadow-2xl border border-slate-100 
                 z-40 
                 p-2 
                 animate-in fade-in slide-in-from-top-2 duration-200
               ">
                  <div className="px-4 py-3 border-b border-slate-50">
                     <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                     <p className="text-[10px] text-blue-600 font-bold uppercase">{currentUser.role}</p>
                  </div>
                  
                  <button 
                    onClick={() => { setShowProfile(false); onLogout(); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 rounded-xl flex items-center gap-2 font-bold transition mt-1"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
               </div>
             </>
           )}
        </div>
      </div>
    </header>
  );
}