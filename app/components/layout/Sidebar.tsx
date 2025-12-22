// app/components/layout/Sidebar.tsx - VERSI OPTIMASI PERFORMA
'use client';

import React, { memo } from 'react';
import { 
  Home, ClipboardList, Settings, Calculator, Trash2, Info, X, DollarSign, LogOut,
  Archive // <--- IMPORT BARU
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
  
  // Helper cek permission
  const canAccess = (page: string) => currentUser.permissions?.pages?.[page as keyof typeof currentUser.permissions.pages];

  const menuGroups = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, visible: canAccess('dashboard') },
        { id: 'orders', label: 'Pesanan Aktif', icon: ClipboardList, visible: canAccess('orders') },
        // MENU BARU DISINI:
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
          className="fixed inset-0 z-40 bg-black/30 md:hidden transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-out will-change-transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        
        {/* HEADER */}
        <div className="h-28 flex items-center px-6 md:px-8 border-b border-slate-50">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-slate-50">
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
                  <span className="text-slate-900">Langitan</span>
                  <span className="text-blue-600">.co</span>
                </h1>
                <div className="flex flex-col mt-1">
                   <span className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">
                     SuperApp
                   </span>
                   <span className="text-[9px] text-slate-300 font-medium tracking-tight">
                     Version 8.0
                   </span>
                </div>
             </div>
          </div>
          
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden ml-auto text-slate-400 hover:text-slate-600 transition active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* MENU LIST */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
          
          {/* Profile Mobile */}
          <ProfileCardMobileMemo 
            currentUser={currentUser}
            onOpenProfile={onOpenProfile}
          />

          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3 px-3">{group.title}</h3>
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
// MEMOIZED COMPONENTS (SAMA SEPERTI SEBELUMNYA)
// ==========================================

const ProfileCardMobileMemo = memo(({ currentUser, onOpenProfile }: { currentUser: UserData, onOpenProfile: () => void }) => {
  return (
    <div className="md:hidden mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
       <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
         {currentUser.name.charAt(0)}
       </div>
       <div>
          <div className="text-sm font-bold text-slate-800">{currentUser.name}</div>
          <button 
            onClick={onOpenProfile} 
            className="text-[10px] text-blue-600 font-bold underline active:text-blue-800"
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
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
      }`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
      {item.label}
    </button>
  );
}, (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive && prevProps.item.id === nextProps.item.id;
});
MenuItemMemo.displayName = 'MenuItemMemo';

const ProfileCardDesktopMemo = memo(({ currentUser, onOpenProfile, onLogout }: { currentUser: UserData, onOpenProfile: () => void, onLogout: () => void }) => {
  return (
    <div className="p-4 border-t border-slate-100 hidden md:block">
       <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-sm overflow-hidden">
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
             <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
             <p className="text-[10px] text-slate-500 truncate capitalize">{currentUser.role}</p>
          </div>

          <div className="flex flex-col gap-1">
             <button 
               onClick={onOpenProfile} 
               title="Edit Profil" 
               className="text-slate-400 hover:text-blue-600 transition active:scale-90"
               style={{ WebkitTapHighlightColor: 'transparent' }}
             >
               <Settings className="w-4 h-4"/>
             </button>
             <button 
               onClick={onLogout} 
               title="Logout" 
               className="text-slate-400 hover:text-red-600 transition active:scale-90"
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