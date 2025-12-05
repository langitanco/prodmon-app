import React, { useState } from 'react';
import { Pencil, Trash2, Users, Package, X, ShieldCheck } from 'lucide-react';
import { UserData, ProductionTypeData } from '@/types';

// --- DAFTAR MENU YANG TERSEDIA ---
const AVAILABLE_MENUS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orders', label: 'Daftar Pesanan' },
  { id: 'trash', label: 'Sampah (Hapus Order)' },
  { id: 'kalkulator', label: 'Kalkulator HPP' },
  { id: 'config_harga', label: 'Pengaturan Harga' },
  { id: 'settings', label: 'User & Akses' },
  { id: 'about', label: 'Tentang Aplikasi' },
];

interface SettingsPageProps {
  users: UserData[];
  productionTypes: ProductionTypeData[];
  onSaveUser: (user: any) => void;
  onDeleteUser: (id: string) => void;
  onSaveProductionType: (type: any) => void;
  onDeleteProductionType: (id: string) => void;
}

export default function SettingsPage({ users, productionTypes, onSaveUser, onDeleteUser, onSaveProductionType, onDeleteProductionType }: SettingsPageProps) {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  const openUserModal = (user?: UserData) => {
    const menus = user?.allowed_menus || [];
    setEditingUser(user || { 
      username: '', 
      password: '', 
      name: '', 
      role: 'produksi',
      allowed_menus: [] 
    });
    setIsUserModalOpen(true);
  };

  const openTypeModal = (type?: ProductionTypeData) => {
    setEditingType(type || { name: '', value: '' });
    setIsTypeModalOpen(true);
  };

  const toggleMenu = (menuId: string) => {
    const currentMenus = editingUser.allowed_menus || [];
    if (currentMenus.includes(menuId)) {
      setEditingUser({
        ...editingUser,
        allowed_menus: currentMenus.filter((id: string) => id !== menuId)
      });
    } else {
      setEditingUser({
        ...editingUser,
        allowed_menus: [...currentMenus, menuId]
      });
    }
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUser(editingUser);
    setIsUserModalOpen(false);
  };

  const handleTypeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProductionType(editingType);
    setIsTypeModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* User Management */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Pengaturan Pengguna</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola akses dan akun aplikasi</p>
           </div>
           <button onClick={() => openUserModal()} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm transition">
             <Users className="w-4 h-4"/> Tambah User
           </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] md:text-sm text-left text-slate-600 min-w-[500px]">
              <thead className="bg-slate-50 text-[10px] md:text-xs uppercase font-bold text-slate-600">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4">Nama</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Username</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Role (Label)</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-center">Hak Akses</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-slate-600">{u.username}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[9px] md:text-[10px] font-extrabold uppercase border border-slate-200">{u.role}</span></td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold">
                           {u.allowed_menus ? u.allowed_menus.length : 0} Menu
                        </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-right space-x-2">
                      <button onClick={() => openUserModal(u)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"><Pencil className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                      <button onClick={() => onDeleteUser(u.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">Tidak ada user</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Production Type Management */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Jenis Produksi</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola jenis produksi</p>
           </div>
           <button onClick={() => openTypeModal()} className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-sm transition">
             <Package className="w-4 h-4"/> Tambah Jenis
           </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] md:text-sm text-left text-slate-600 min-w-[500px]">
              <thead className="bg-slate-50 text-[10px] md:text-xs uppercase font-bold text-slate-600">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4">Nama Jenis</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Value/Kode</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productionTypes.map((pt) => (
                  <tr key={pt.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-800">{pt.name}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-slate-600">{pt.value}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-right space-x-2">
                      <button onClick={() => openTypeModal(pt)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"><Pencil className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                      <button onClick={() => onDeleteProductionType(pt.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                    </td>
                  </tr>
                ))}
                {productionTypes.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-slate-400">Tidak ada jenis produksi</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Modal - FONT WEIGHT SUDAH DIPERBAIKI (font-medium, bukan font-bold) */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
               <h3 className="font-bold text-lg text-slate-800">{editingUser.id ? 'Edit User & Akses' : 'Tambah User'}</h3>
               <button onClick={() => setIsUserModalOpen(false)} className="p-1.5 bg-slate-200 rounded-full hover:bg-slate-300 transition"><X className="w-4 h-4 text-slate-600"/></button>
            </div>
            <form onSubmit={handleUserFormSubmit} className="p-4 space-y-4">
               
               {/* Informasi Dasar */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                     <input 
                        required 
                        className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-900 bg-white placeholder-slate-400" 
                        value={editingUser.name} 
                        onChange={e=>setEditingUser({...editingUser, name: e.target.value})} 
                        placeholder="Nama Lengkap"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Username</label>
                     <input 
                        required 
                        className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-900 bg-white placeholder-slate-400" 
                        value={editingUser.username} 
                        onChange={e=>setEditingUser({...editingUser, username: e.target.value})} 
                        placeholder="Username"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Password</label>
                     <input 
                        required 
                        className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-900 bg-white placeholder-slate-400" 
                        value={editingUser.password} 
                        onChange={e=>setEditingUser({...editingUser, password: e.target.value})} 
                        placeholder="Password"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role (Label Jabatan)</label>
                     <select 
                        className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-900 bg-white" 
                        value={editingUser.role} 
                        onChange={e=>setEditingUser({...editingUser, role: e.target.value})}
                     >
                       <option value="supervisor">Supervisor</option>
                       <option value="admin">Admin</option>
                       <option value="produksi">Produksi</option>
                       <option value="qc">QC</option>
                       <option value="manager">Manager</option>
                     </select>
                   </div>
               </div>

               {/* PENGATURAN HAK AKSES */}
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-slate-800 text-sm">Hak Akses Menu</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {AVAILABLE_MENUS.map((menu) => (
                        <label key={menu.id} className="flex items-center gap-3 p-2 border border-slate-200 rounded-lg bg-white hover:border-blue-300 cursor-pointer transition">
                            <input 
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                                checked={editingUser.allowed_menus ? editingUser.allowed_menus.includes(menu.id) : false}
                                onChange={() => toggleMenu(menu.id)}
                            />
                            <span className="text-xs font-medium text-slate-700 select-none">{menu.label}</span>
                        </label>
                      ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 italic font-medium">*Centang menu yang boleh diakses oleh user ini.</p>
               </div>

               <div className="pt-2 flex gap-2">
                 <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2 border-2 border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-700 transition text-sm">Batal</button>
                 <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition shadow-lg text-sm">Simpan</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Type Modal - FONT WEIGHT SUDAH DIPERBAIKI */}
      {isTypeModalOpen && editingType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-lg text-slate-800">{editingType.id ? 'Edit Jenis' : 'Tambah Jenis'}</h3>
               <button onClick={() => setIsTypeModalOpen(false)} className="p-1.5 bg-slate-200 rounded-full hover:bg-slate-300 transition"><X className="w-4 h-4 text-slate-600"/></button>
            </div>
            <form onSubmit={handleTypeFormSubmit} className="p-4 space-y-3">
               <div>
                 <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1">Nama Jenis</label>
                 <input 
                    required 
                    className="w-full border-2 border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 bg-white text-sm" 
                    placeholder="contoh: DTF" 
                    value={editingType.name} 
                    onChange={e=>setEditingType({...editingType, name: e.target.value})} 
                 />
               </div>
               <div>
                 <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1">Value/Kode</label>
                 <input 
                    required 
                    className="w-full border-2 border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 bg-white font-mono text-sm" 
                    placeholder="contoh: dtf" 
                    value={editingType.value} 
                    onChange={e=>setEditingType({...editingType, value: e.target.value.toLowerCase().replace(/\s/g, '')})} 
                 />
               </div>
               <div className="pt-3 flex gap-2">
                 <button type="button" onClick={() => setIsTypeModalOpen(false)} className="flex-1 py-2 border-2 border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-700 transition text-sm">Batal</button>
                 <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition shadow-lg text-sm">Simpan</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}