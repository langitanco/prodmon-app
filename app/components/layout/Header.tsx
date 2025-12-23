// app/components/layout/Header.tsx
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

  const handleNotificationClick = (notif: any) => {
    setShowNotif(false); 
    if (notif.orderId && onNotificationClick) {
      onNotificationClick(notif.id, notif.orderId);
    }
  };

  return (
    // HEADER CONTAINER: Tambahkan dark:bg-slate-900 dan dark:border-slate-800
    <header className={`
      sticky top-0 h-20 px-4 md:px-10 flex items-center justify-between transition-all duration-300
      z-20 border-b border-transparent dark:border-transparent
      ${sidebarOpen 
        ? 'bg-gray-100/40 backdrop-blur-xl dark:bg-slate-900/80' // Dark mode backdrop
        : 'bg-gray-100 dark:bg-slate-950' // Dark mode solid
      }
      md:bg-gray-100 md:dark:bg-slate-950 md:backdrop-blur-none
    `}>
      
      {/* KIRI */}
      <div className="flex items-center gap-4">
        {/* TOMBOL MENU MOBILE: bg-white -> dark:bg-slate-800, text-slate-600 -> dark:text-slate-200 */}
        <button 
          onClick={onToggleSidebar} 
          className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-200 md:hidden hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-transform"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden md:block">
          {currentPage === 'dashboard' && (
            <>
              {/* TEKS: text-slate-800 -> dark:text-white */}
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Assalamu'alaikum</h2>
              {/* TEKS: text-slate-500 -> dark:text-slate-400 */}
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selamat datang kembali, {currentUser.name} 👋</p>
            </>
          )}
        </div>

        <div className="md:hidden">
           {/* JUDUL MOBILE: text-slate-800 -> dark:text-white */}
           <h1 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">
             {currentTitle}
           </h1>
        </div>
      </div>

      {/* KANAN */}
      <div className="flex items-center gap-3">
        
        {/* BELL NOTIFIKASI */}
        <div className="relative">
           {/* TOMBOL BELL: bg-white -> dark:bg-slate-800, text -> dark:text-slate-200 */}
           <button 
             onClick={() => setShowNotif(!showNotif)}
             className="p-2.5 md:p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition relative shadow-sm active:scale-95"
             style={{ WebkitTapHighlightColor: 'transparent' }}
           >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
              )}
           </button>

           {showNotif && (
             <>
               <div className="fixed inset-0 z-30 bg-black/10 dark:bg-black/50" onClick={() => setShowNotif(false)} />
               
               {/* DROPDOWN NOTIF: bg-white -> dark:bg-slate-800, border-slate-100 -> dark:border-slate-700 */}
               <div className="
                 fixed md:absolute right-4 md:right-0 top-24 md:top-full md:mt-2 
                 w-[calc(100vw-2rem)] md:w-80 max-w-md
                 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700
                 z-40 overflow-hidden
                 animate-in fade-in slide-in-from-top-2 md:slide-in-from-top-0 duration-200
               ">
                  {/* HEADER DROPDOWN */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <span>Notifikasi</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p>Tidak ada notifikasi</p>
                    </div>
                  ) : (
                    <div className="max-h-[60vh] md:max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          // ITEM NOTIF: hover:bg-slate-50 -> dark:hover:bg-slate-700
                          // unread bg-blue-50 -> dark:bg-blue-900/20
                          className={`px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 transition cursor-pointer ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <div className="flex items-start gap-2">
                            {!notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">{notif.title}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{notif.time}</p>
                              {notif.orderId && (
                                <p className="text-[9px] text-blue-500 dark:text-blue-400 mt-0.5">Order: {notif.orderId}</p>
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
           {/* TOMBOL PROFIL */}
           <button 
             onClick={() => setShowProfile(!showProfile)}
             className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm overflow-hidden active:scale-95 transition-transform"
             style={{ WebkitTapHighlightColor: 'transparent' }}
           >
              {currentUser.avatar_url ? (
                 <img src={currentUser.avatar_url} alt="User" className="w-full h-full object-cover" />
              ) : (
                 <div className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 w-full h-full flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                 </div>
              )}
           </button>

           {showProfile && (
             <>
               <div className="fixed inset-0 z-30 bg-black/10 dark:bg-black/50" onClick={() => setShowProfile(false)} />
               {/* DROPDOWN PROFIL */}
               <div className="
                 fixed md:absolute right-4 md:right-0 top-24 md:top-full md:mt-2 
                 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700
                 z-40 p-2 animate-in fade-in slide-in-from-top-2 duration-200
               ">
                  <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-700">
                     <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{currentUser.name}</p>
                     <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">{currentUser.role}</p>
                  </div>
                  
                  <button 
                    onClick={() => { setShowProfile(false); onLogout(); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 rounded-xl flex items-center gap-2 font-bold transition mt-1"
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