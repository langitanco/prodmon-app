// app/components/layout/Header.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { UserData } from '@/types';

interface HeaderProps {
  currentUser: UserData;
  activeTab: string;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void; // ✅ Prop baru untuk fungsi logout
}

export default function Header({ currentUser, activeTab, setSidebarOpen, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Menutup menu jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Sisi Kiri: Branding Minimalis */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="md:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6"/>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-lg tracking-[0.15em] font-bold text-slate-800 lowercase">
              Langitan.<span className="font-light text-slate-800">co</span>
            </span>
            <div className="hidden md:block w-[1px] h-4 bg-slate-200 mx-2"></div>
            <span className="hidden md:block text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              {activeTab.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Sisi Kanan: User Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 pl-3 py-1 pr-1 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-700">{currentUser.name}</span>
              <span className="text-[9px] font-medium text-blue-500 uppercase tracking-tighter">{currentUser.role}</span>
            </div>
            
            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border-2 border-white shadow-sm">
              <UserIcon className="w-5 h-5" />
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* DROPDOWN MENU */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 py-2 z-50 animate-in fade-in zoom-in duration-150">
              <div className="px-4 py-2 border-b border-slate-50 mb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Akun</p>
                <p className="text-xs font-medium text-slate-600 truncate">{currentUser.username}</p>
              </div>
              
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}