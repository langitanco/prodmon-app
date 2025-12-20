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
  notifications?: Array<{id: string; title: string; message: string; time: string; isRead: boolean}>; // ← PROP INI YANG KURANG
}

export default function Header({ currentUser, onToggleSidebar, onLogout, sidebarOpen, currentPage = 'dashboard', notifications = [] }: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

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
      
      {/* KIRI: Tombol Menu & Teks Salam */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar} 
          className="p-2.5 bg-white rounded-2xl text-slate-600 md:hidden hover:bg-slate-50 border border-slate-100 shadow-sm"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden md:block">
          {currentPage === 'dashboard' && (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Assalamu'alaikum</h2>
              <p className="text-xs text-slate-500 font-medium">Selamat datang kembali, {currentUser.name} 👋</p>
            </>
          )}
        </div>
      </div>

      {/* KANAN: Notifikasi & Profil Mobile */}
      <div className="flex items-center gap-3">
        {/* BELL NOTIFIKASI */}
        <div className="relative">
           <button 
             onClick={() => setShowNotif(!showNotif)}
             className="p-2.5 md:p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-blue-600 transition relative shadow-sm"
           >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
           </button>

           {showNotif && (
             <>
               <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)}/>
               <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 font-bold text-sm text-slate-800 flex items-center justify-between">
                    <span>Notifikasi</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">Tidak ada notifikasi</div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                        >
                          <p className="font-semibold text-xs text-slate-800">{notif.title}</p>
                          <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
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
             className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden"
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
               <div className="fixed inset-0 z-10" onClick={() => setShowProfile(false)}/>
               <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 p-2 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 border-b border-slate-50">
                     <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                     <p className="text-[10px] text-blue-600 font-bold uppercase">{currentUser.role}</p>
                  </div>
                  
                  <button 
                    onClick={() => { setShowProfile(false); onLogout(); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 font-bold transition mt-1"
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