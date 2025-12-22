// app/components/layout/Sidebar.tsx - FIX LOGO WRAPPER
'use client';

import React, { memo } from 'react';
import { 
  Home, ClipboardList, Settings, Calculator, Trash2, Info, X, DollarSign, LogOut,
  Archive 
} from 'lucide-react';
import { UserData } from '@/types';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser: UserData;
  activeTab: string;
  handleNav: (tab: any) => void;
  onLogout: () => void;
  onOpenProfile: () => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, currentUser, activeTab, handleNav, onLogout, onOpenProfile }: SidebarProps) {
  
  const canAccess = (page: string) => currentUser.permissions?.pages?.[page as keyof typeof currentUser.permissions.pages];

  const menuGroups = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, visible: canAccess('dashboard') },
        { id: 'orders', label: 'Pesanan Aktif', icon: ClipboardList, visible: canAccess('orders') },
        { id: 'completed_orders', label: 'Pesanan Selesai', icon: Archive, visible: canAccess('orders') }, 
      ]
    },
    {
      title: 'ALAT PRODUKSI',
      items: [
        { id: 'kalkulator', label: 'Kalkulator', icon: Calculator, visible: canAccess('kalkulator') },
        { id: 'config_harga', label: 'Config Harga', icon: DollarSign, visible: canAccess('config_harga') },
      ]
    },
    {
      title: 'LAINNYA',
      items: [
        { id: 'settings', label: 'Pengaturan Admin', icon: Settings, visible: canAccess('settings') },
        { id: 'trash', label: 'Sampah', icon: Trash2, visible: canAccess('trash') },
        { id: 'about', label: 'Tentang App', icon: Info, visible: true },
      ]
    }
  ];

  return (
    <>
      {/* OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 md:hidden transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 
        bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800
        flex flex-col transition-transform duration-300 ease-out will-change-transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        
        {/* HEADER */}
        <div className="h-28 flex items-center px-6 md:px-8 border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-3">
             
             {/* ✅ FIX: HAPUS CLASS BACKGROUND (bg-slate-50 dark:bg-slate-800) AGAR TRANSPARAN */}
             <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/favicon.ico" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "https://ui-avatars.com/api/?name=L&background=0066FF&color=fff";
                  }}
                />
             </div>

             <div className="flex flex-col">
                <h1 className="font-extrabold text-xl tracking-tighter leading-none">
                  <span className="text-slate-900 dark:text-white">Langitan</span>
                  <span className="text-blue-600 dark:text-blue-500">.co</span>
                </h1>
                <div className="flex flex-col mt-1">
                   <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase">
                     SuperApp
                   </span>
                   <span className="text-[9px] text-slate-300 dark:text-slate-600 font-medium tracking-tight">
                     Version 9.0
                   </span>
                </div>
             </div>
          </div>
          
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* MENU LIST */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 custom-scrollbar">
          
          {/* Profile Mobile */}
          <ProfileCardMobileMemo 
            currentUser={currentUser}
            onOpenProfile={onOpenProfile}
          />

          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  item.visible && (
                    <MenuItemMemo
                      key={item.id}
                      item={item}
                      isActive={activeTab === item.id}
                      onClick={() => handleNav(item.id)}
                    />
                  )
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* PROFILE BAWAH (Desktop) */}
        <ProfileCardDesktopMemo
          currentUser={currentUser}
          onOpenProfile={onOpenProfile}
          onLogout={onLogout}
        />

      </aside>
    </>
  );
}

// ==========================================
// MEMOIZED COMPONENTS (DARK MODE SUPPORT)
// ==========================================

const ProfileCardMobileMemo = memo(({ currentUser, onOpenProfile }: { currentUser: UserData, onOpenProfile: () => void }) => {
  return (
    <div className="md:hidden mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
       <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
         {currentUser.name.charAt(0)}
       </div>
       <div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{currentUser.name}</div>
          <button 
            onClick={onOpenProfile} 
            className="text-[10px] text-blue-600 dark:text-blue-400 font-bold underline active:text-blue-800"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Edit Profil
          </button>
       </div>
    </div>
  );
});
ProfileCardMobileMemo.displayName = 'ProfileCardMobileMemo';

const MenuItemMemo = memo(({ item, isActive, onClick }: { item: any, isActive: boolean, onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 will-change-transform active:scale-95 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-700'
      }`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
      {item.label}
    </button>
  );
}, (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive && prevProps.item.id === nextProps.item.id;
});
MenuItemMemo.displayName = 'MenuItemMemo';

const ProfileCardDesktopMemo = memo(({ currentUser, onOpenProfile, onLogout }: { currentUser: UserData, onOpenProfile: () => void, onLogout: () => void }) => {
  return (
    <div className="p-4 border-t border-slate-100 dark:border-slate-800 hidden md:block">
       <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shadow-sm overflow-hidden">
             {currentUser.avatar_url ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
             ) : currentUser.name.charAt(0)}
          </div>
          
          <div className="flex-1 min-w-0">
             <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser.name}</p>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize">{currentUser.role}</p>
          </div>

          <div className="flex flex-col gap-1">
             <button 
               onClick={onOpenProfile} 
               title="Edit Profil" 
               className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition active:scale-90"
               style={{ WebkitTapHighlightColor: 'transparent' }}
             >
               <Settings className="w-4 h-4"/>
             </button>
             <button 
               onClick={onLogout} 
               title="Logout" 
               className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition active:scale-90"
               style={{ WebkitTapHighlightColor: 'transparent' }}
             >
               <LogOut className="w-4 h-4"/>
             </button>
          </div>
       </div>
    </div>
  );
});
ProfileCardDesktopMemo.displayName = 'ProfileCardDesktopMemo';