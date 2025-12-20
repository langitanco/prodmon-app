// app/components/layout/Header.tsx
'use client';

import React, { useState } from 'react';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { UserData } from '@/types';

interface HeaderProps {
  currentUser: UserData;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export default function Header({ currentUser, onToggleSidebar, onLogout }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 h-16 px-4 flex items-center justify-between shadow-sm">
      
      {/* BAGIAN KIRI: Tombol Sidebar & Logo */}
      <div className="flex items-center gap-3">
        {/* Tombol Hamburger: Hanya muncul di HP (md:hidden) */}
        <button 
          onClick={onToggleSidebar} 
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Judul Aplikasi */}
        <div className="flex flex-col">
            <h1 className="font-bold text-lg md:text-xl text-slate-800 tracking-tight">
              LCO Production
            </h1>
            <span className="text-[10px] text-slate-500 font-medium md:hidden">
              {currentUser.role.toUpperCase()}
            </span>
        </div>
      </div>

      {/* BAGIAN KANAN: Profil User & Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 md:gap-3 hover:bg-slate-50 p-1.5 md:p-2 rounded-xl transition border border-transparent hover:border-slate-100"
        >
          {/* Info User (Nama & Role) - Hidden di HP sangat kecil */}
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-slate-700 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              {currentUser.role}
            </div>
          </div>

          {/* Avatar Lingkaran */}
          <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu (Logout) */}
        {isDropdownOpen && (
          <>
            {/* Layar transparan untuk menutup dropdown saat klik luar */}
            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
            
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-50 md:hidden">
                <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
              </div>
              
              <button 
                onClick={onLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium transition"
              >
                <LogOut className="w-4 h-4" />
                Keluar (Logout)
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}