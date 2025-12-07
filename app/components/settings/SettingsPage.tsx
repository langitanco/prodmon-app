import React, { useState } from 'react';
import { Pencil, Trash2, Users, Package, X, ShieldCheck, CheckSquare, Square, FileX } from 'lucide-react';
import { UserData, ProductionTypeData } from '@/types';

// Definisi Struktur Menu & Kapabilitasnya
const MENU_CAPABILITIES = [
  { id: 'dashboard', label: 'Dashboard', actions: ['view'] },
  
  // UPDATE: Menambahkan 'delete_files' di sini
  { id: 'orders', label: 'Daftar Pesanan', actions: ['view', 'create', 'edit', 'delete', 'delete_files'] },
  
  { id: 'trash', label: 'Sampah', actions: ['view', 'restore', 'delete_permanent'] },
  { id: 'kalkulator', label: 'Kalkulator HPP', actions: ['view'] },
  { id: 'config_harga', label: 'Pengaturan Harga', actions: ['view', 'edit'] },
  { id: 'settings', label: 'User & Akses', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'about', label: 'Tentang Aplikasi', actions: ['view'] },
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
    // Pastikan permissions ada, jika user lama null, kasih object kosong
    const defaultPerms = user?.permissions || {};
    
    setEditingUser(user || { 
      username: '', 
      password: '', 
      name: '', 
      role: 'produksi',
      permissions: defaultPerms 
    });
    setIsUserModalOpen(true);
  };

  const openTypeModal = (type?: ProductionTypeData) => {
    setEditingType(type || { name: '', value: '' });
    setIsTypeModalOpen(true);
  };

  // --- LOGIC MATRIX PERMISSION ---
  const togglePermission = (menuId: string, action: string) => {
    const currentPerms = { ...editingUser.permissions };
    
    // Buat object menu jika belum ada
    if (!currentPerms[menuId]) {
      currentPerms[menuId] = { view: false };
    }

    const newVal = !currentPerms[menuId][action];
    
    // Update value
    currentPerms[menuId] = {
      ...currentPerms[menuId],
      [action]: newVal
    };

    // LOGIC DEPENDENCY (Otomatisasi)
    // 1. Jika 'view' dimatikan -> Matikan semua sub-akses
    if (action === 'view' && newVal === false) {
       // UPDATE: Reset juga delete_files
       currentPerms[menuId] = { 
         view: false, 
         create: false, 
         edit: false, 
         delete: false, 
         delete_files: false,
         restore: false,
         delete_permanent: false
       }; 
    }
    // 2. Jika salah satu sub-akses dinyalakan -> Otomatis nyalakan 'view'
    if (action !== 'view' && newVal === true) {
       currentPerms[menuId].view = true;
    }

    setEditingUser({ ...editingUser, permissions: currentPerms });
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
              <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola akses CRUD (Create, Read, Update, Delete)</p>
           </div>
           <button onClick={() => openUserModal()} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm transition">
             <Users className="w-4 h-4"/> Tambah User
           </button>
        </div>

        {/* Tabel User List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] md:text-sm text-left text-slate-600 min-w-[500px]">
              <thead className="bg-slate-50 text-[10px] md:text-xs uppercase font-bold text-slate-600">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4">Nama</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Username</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Role</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-center">Custom Akses</th>
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
                           {u.permissions ? Object.keys(u.permissions).filter(k => u.permissions![k].view).length : 0} Menu Aktif
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
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Modal - MATRIX PERMISSIONS UI */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] flex flex-col">
            
            {/* Header Modal */}
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center flex-shrink-0">
               <h3 className="font-bold text-lg text-slate-800">{editingUser.id ? 'Edit Hak Akses User' : 'Tambah User'}</h3>
               <button onClick={() => setIsUserModalOpen(false)} className="p-1.5 bg-slate-200 rounded-full hover:bg-slate-300 transition"><X className="w-4 h-4 text-slate-600"/></button>
            </div>
            
            {/* Body Modal (Scrollable) */}
            <div className="p-4 overflow-y-auto flex-1">
               <form id="userForm" onSubmit={handleUserFormSubmit} className="space-y-6">
                  
                   {/* Info User */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                         <input required className="w-full border border-slate-300 p-2 rounded-lg text-sm font-medium text-slate-900 bg-white placeholder-slate-400" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name: e.target.value})} placeholder="Nama Lengkap"/>
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Username</label>
                         <input required className="w-full border border-slate-300 p-2 rounded-lg text-sm font-medium text-slate-900 bg-white placeholder-slate-400" value={editingUser.username} onChange={e=>setEditingUser({...editingUser, username: e.target.value})} placeholder="Username"/>
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Password</label>
                         <input required className="w-full border border-slate-300 p-2 rounded-lg text-sm font-medium text-slate-900 bg-white placeholder-slate-400" value={editingUser.password} onChange={e=>setEditingUser({...editingUser, password: e.target.value})} placeholder="Password"/>
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role (Label Jabatan)</label>
                         <select className="w-full border border-slate-300 p-2 rounded-lg text-sm font-medium text-slate-900 bg-white" value={editingUser.role} onChange={e=>setEditingUser({...editingUser, role: e.target.value})}>
                           <option value="supervisor">Supervisor</option>
                           <option value="admin">Admin</option>
                           <option value="produksi">Produksi</option>
                           <option value="qc">QC</option>
                           <option value="manager">Manager</option>
                         </select>
                       </div>
                   </div>

                   {/* MATRIX HAK AKSES TABLE */}
                   <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-600"/>
                          <h4 className="font-bold text-slate-800 text-sm">Matrix Hak Akses</h4>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                           <thead className="text-[10px] uppercase bg-white text-slate-500 font-bold border-b border-slate-200">
                             <tr>
                               <th className="px-4 py-3 min-w-[120px]">Nama Menu</th>
                               <th className="px-4 py-3 text-center">Lihat</th>
                               <th className="px-4 py-3 text-center">Tambah</th>
                               <th className="px-4 py-3 text-center">Edit</th>
                               <th className="px-4 py-3 text-center">Hapus Data</th>
                               
                               {/* KOLOM BARU UNTUK HAPUS FILE */}
                               <th className="px-4 py-3 text-center bg-red-50 text-red-600">Hapus File</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-200">
                             {MENU_CAPABILITIES.map((menu) => (
                               <tr key={menu.id} className="hover:bg-slate-100 transition">
                                 <td className="px-4 py-3 font-bold text-slate-700">{menu.label}</td>
                                 
                                 {/* Column 1: VIEW (Lihat) */}
                                 <td className="px-4 py-3 text-center">
                                    <button 
                                      type="button"
                                      onClick={() => togglePermission(menu.id, 'view')}
                                      className={`p-1.5 rounded transition ${editingUser.permissions?.[menu.id]?.view ? 'bg-blue-100 text-blue-600' : 'text-slate-300 hover:bg-slate-200'}`}
                                    >
                                      {editingUser.permissions?.[menu.id]?.view ? <CheckSquare className="w-5 h-5"/> : <Square className="w-5 h-5"/>}
                                    </button>
                                 </td>

                                 {/* Column 2: CREATE (Tambah) */}
                                 <td className="px-4 py-3 text-center">
                                   {menu.actions.includes('create') && (
                                     <button 
                                       type="button"
                                       onClick={() => togglePermission(menu.id, 'create')}
                                       disabled={!editingUser.permissions?.[menu.id]?.view}
                                       className={`p-1.5 rounded transition ${editingUser.permissions?.[menu.id]?.create ? 'bg-green-100 text-green-600' : 'text-slate-300'} ${!editingUser.permissions?.[menu.id]?.view ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                                     >
                                       {editingUser.permissions?.[menu.id]?.create ? <CheckSquare className="w-5 h-5"/> : <Square className="w-5 h-5"/>}
                                     </button>
                                   )}
                                 </td>

                                 {/* Column 3: EDIT (Ubah) */}
                                 <td className="px-4 py-3 text-center">
                                   {menu.actions.includes('edit') && (
                                      <button 
                                        type="button"
                                        onClick={() => togglePermission(menu.id, 'edit')}
                                        disabled={!editingUser.permissions?.[menu.id]?.view}
                                        className={`p-1.5 rounded transition ${editingUser.permissions?.[menu.id]?.edit ? 'bg-yellow-100 text-yellow-600' : 'text-slate-300'} ${!editingUser.permissions?.[menu.id]?.view ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                                      >
                                        {editingUser.permissions?.[menu.id]?.edit ? <CheckSquare className="w-5 h-5"/> : <Square className="w-5 h-5"/>}
                                      </button>
                                   )}
                                 </td>

                                 {/* Column 4: DELETE (Hapus Data Pesanan) */}
                                 <td className="px-4 py-3 text-center">
                                   {menu.actions.includes('delete') && (
                                      <button 
                                        type="button"
                                        onClick={() => togglePermission(menu.id, 'delete')}
                                        disabled={!editingUser.permissions?.[menu.id]?.view}
                                        className={`p-1.5 rounded transition ${editingUser.permissions?.[menu.id]?.delete ? 'bg-red-100 text-red-600' : 'text-slate-300'} ${!editingUser.permissions?.[menu.id]?.view ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                                      >
                                        {editingUser.permissions?.[menu.id]?.delete ? <CheckSquare className="w-5 h-5"/> : <Square className="w-5 h-5"/>}
                                      </button>
                                   )}
                                 </td>

                                 {/* Column 5: DELETE FILES (Hapus Bukti Upload) */}
                                 <td className="px-4 py-3 text-center bg-slate-50">
                                   {menu.actions.includes('delete_files') ? (
                                      <button 
                                        type="button"
                                        onClick={() => togglePermission(menu.id, 'delete_files')}
                                        disabled={!editingUser.permissions?.[menu.id]?.view}
                                        className={`p-1.5 rounded transition ${editingUser.permissions?.[menu.id]?.delete_files ? 'bg-purple-100 text-purple-600' : 'text-slate-300'} ${!editingUser.permissions?.[menu.id]?.view ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                                        title="Izin Hapus Bukti Upload"
                                      >
                                        {editingUser.permissions?.[menu.id]?.delete_files ? <FileX className="w-5 h-5"/> : <Square className="w-5 h-5"/>}
                                      </button>
                                   ) : (
                                       <span className="text-slate-300">-</span>
                                   )}
                                 </td>

                               </tr>
                             ))}
                           </tbody>
                        </table>
                      </div>
                   </div>

               </form>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t bg-slate-50 flex gap-2 flex-shrink-0">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl hover:bg-slate-100 font-bold text-slate-700 transition text-sm">Batal</button>
                <button type="submit" form="userForm" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition shadow-lg text-sm">Simpan Perubahan</button>
            </div>

          </div>
        </div>
      )}

      {/* Type Modal */}
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
                 <input required className="w-full border-2 border-slate-200 p-2 rounded-lg font-medium text-slate-900 bg-white text-sm" placeholder="contoh: DTF" value={editingType.name} onChange={e=>setEditingType({...editingType, name: e.target.value})} />
               </div>
               <div>
                 <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1">Value/Kode</label>
                 <input required className="w-full border-2 border-slate-200 p-2 rounded-lg font-medium text-slate-900 bg-white font-mono text-sm" placeholder="contoh: dtf" value={editingType.value} onChange={e=>setEditingType({...editingType, value: e.target.value.toLowerCase().replace(/\s/g, '')})} />
               </div>
               <div className="pt-3 flex gap-2">
                 <button type="button" onClick={() => setIsTypeModalOpen(false)} className="flex-1 py-2 border-2 border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 transition text-sm">Batal</button>
                 <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition shadow-lg text-sm">Simpan</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}