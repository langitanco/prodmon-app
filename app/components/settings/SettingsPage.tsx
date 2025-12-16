// app/components/settings/SettingsPage.tsx

import React, { useState } from 'react';
// UPDATE IMPORT: Tambahkan Eye dan EyeOff
import { Trash2, Save, UserPlus, Shield, Package, Pencil, X, CheckSquare, DollarSign, Eye, EyeOff } from 'lucide-react';
import { UserData, ProductionTypeData, UserPermissions, DEFAULT_PERMISSIONS } from '@/types';

interface SettingsPageProps {
  users: UserData[];
  productionTypes: ProductionTypeData[];
  onSaveUser: (u: any) => void;
  onDeleteUser: (id: string) => void;
  onSaveProductionType: (t: any) => void;
  onDeleteProductionType: (id: string) => void;
}

export default function SettingsPage({ users, productionTypes, onSaveUser, onDeleteUser, onSaveProductionType, onDeleteProductionType }: SettingsPageProps) {
  
  // --- STATE ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);

  // STATE BARU: Untuk toggle password (lihat/sembunyi)
  const [showPassword, setShowPassword] = useState(false);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  // --- LOGIC: USER MANAGEMENT ---

  // 1. EDIT USER (DENGAN SMART MERGE)
  const handleEditUser = (u: UserData) => {
    setFormData({ 
      id: u.id, 
      name: u.name, 
      username: u.username, 
      role: u.role, 
      password: u.password 
    });

    // Reset view password saat buka modal
    setShowPassword(false);

    // --- SMART MERGE LOGIC ---
    const userPerms = u.permissions || {};
    
    const mergedPermissions: UserPermissions = {
        pages: { ...DEFAULT_PERMISSIONS.pages, ...(userPerms.pages || {}) },
        orders: { ...DEFAULT_PERMISSIONS.orders, ...(userPerms.orders || {}) },
        prod_manual: { ...DEFAULT_PERMISSIONS.prod_manual, ...(userPerms.prod_manual || {}) },
        prod_dtf: { ...DEFAULT_PERMISSIONS.prod_dtf, ...(userPerms.prod_dtf || {}) },
        finishing: { ...DEFAULT_PERMISSIONS.finishing, ...(userPerms.finishing || {}) },
        price_config: { ...DEFAULT_PERMISSIONS.price_config, ...(userPerms.price_config || {}) },
    };

    setPermissions(mergedPermissions);
    setIsUserModalOpen(true);
  };

  // 2. CREATE NEW USER
  const handleCreateNewUser = () => {
    setFormData({ 
      id: '', 
      name: '', 
      username: '', 
      role: 'produksi', 
      password: '' 
    });
    // Reset view password
    setShowPassword(false);
    
    setPermissions(DEFAULT_PERMISSIONS); 
    setIsUserModalOpen(true);
  };

  // 3. HANDLE KLIK CHECKBOX
  const handlePermissionChange = (category: keyof UserPermissions, key: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // 4. SAVE
  const handleSubmitUser = () => {
    onSaveUser({
      ...formData,
      permissions: permissions 
    });
    setIsUserModalOpen(false);
  };


  // --- LOGIC: PRODUCTION TYPE ---
  const openTypeModal = (type?: ProductionTypeData) => {
    setEditingType(type || { name: '', value: '' });
    setIsTypeModalOpen(true);
  };

  const handleTypeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProductionType(editingType);
    setIsTypeModalOpen(false);
  };

  // --- UI HELPER: Component Checkbox Group ---
  const RenderPermissionSection = ({ title, category, labels, icon: Icon = Shield }: { title: string, category: keyof UserPermissions, labels: Record<string, string>, icon?: any }) => (
    <div className="mb-4 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 text-xs md:text-sm flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-blue-600"/> {title}
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
        {Object.entries(permissions[category] || {}).map(([key, val]) => (
          <div 
             key={key} 
             onClick={() => handlePermissionChange(category, key, !val)}
             className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition border border-transparent hover:border-slate-100 select-none"
          >
            <div 
               className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${val ? 'bg-blue-600 border-blue-600 scale-105 shadow-sm' : 'bg-white border-slate-300'}`}
            >
               {val && <CheckSquare className="w-3.5 h-3.5 text-white"/>}
            </div>
            <span className="text-[11px] md:text-xs text-slate-700 font-medium leading-tight">
              {labels[key] || key.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // --- CLASS UNTUK INPUT FIELD ---
  const inputClassName = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition shadow-sm";
  const labelClassName = "text-xs font-bold text-slate-700 uppercase tracking-wide";

  return (
    <div className="space-y-8 pb-24">
      
      {/* --- BAGIAN 1: JENIS PRODUKSI --- */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Package className="w-5 h-5 text-green-600"/> Jenis Produksi</h2>
              <p className="text-[10px] text-slate-500 hidden md:block">Master data varian produksi</p>
           </div>
           <button onClick={() => openTypeModal()} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition shadow-sm">
             + Tambah
           </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
           {productionTypes.map((pt) => (
             <div key={pt.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                <div>
                  <div className="font-bold text-slate-700 text-sm">{pt.name}</div>
                  <div className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 rounded w-fit">{pt.value}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openTypeModal(pt)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => onDeleteProductionType(pt.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                </div>
             </div>
           ))}
        </div>
      </div>

      <hr className="border-slate-200"/>

      {/* --- BAGIAN 2: DAFTAR USER --- */}
      <div className="space-y-4">
         <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600"/> Data Pengguna</h2>
              <p className="text-[10px] text-slate-500 hidden md:block">Kelola akses user aplikasi</p>
           </div>
           <button onClick={handleCreateNewUser} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm">
             + User Baru
           </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3 hidden md:table-cell">Role</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{u.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                    <div className="md:hidden text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded w-fit mt-1 uppercase font-bold">{u.role}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEditUser(u)} className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition mr-2">
                       <Pencil className="w-3.5 h-3.5"/> <span className="hidden sm:inline">Edit Akses</span>
                    </button>
                    <button onClick={() => onDeleteUser(u.id)} className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition">
                       <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* --- MODAL EDIT/ADD USER (FULL POPUP) --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
           {/* Container Modal Responsive */}
           <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
              
              {/* Header Modal */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{formData.id ? 'Edit User & Hak Akses' : 'Buat User Baru'}</h3>
                    <p className="text-[10px] text-slate-500">Atur matrix izin secara detail</p>
                  </div>
                  <button onClick={() => setIsUserModalOpen(false)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition">
                    <X className="w-4 h-4 text-slate-600"/>
                  </button>
              </div>

              {/* Body Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  
                  {/* Form Data Diri */}
                  <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 space-y-4">
                      <div className="text-sm font-bold text-blue-800 uppercase mb-2 flex items-center gap-2 border-b border-blue-200 pb-2">
                        <UserPlus className="w-4 h-4"/> Data Akun
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className={labelClassName}>Nama Lengkap</label>
                            <input 
                              className={inputClassName}
                              value={formData.name || ''} 
                              onChange={e=>setFormData({...formData, name: e.target.value})} 
                              placeholder="Contoh: Budi Santoso"
                            />
                         </div>
                         <div>
                            <label className={labelClassName}>Username</label>
                            <input 
                              className={inputClassName}
                              value={formData.username || ''} 
                              onChange={e=>setFormData({...formData, username: e.target.value})} 
                              placeholder="Contoh: budi.s"
                            />
                         </div>
                         
                         {/* --- BAGIAN PASSWORD (UPDATE: ADA TOMBOL MATA) --- */}
                         <div>
                            <label className={labelClassName}>Password</label>
                            <div className="relative">
                                <input 
                                  type={showPassword ? "text" : "password"} // Type dinamis
                                  className={`${inputClassName} pr-10`} // Tambah padding kanan supaya tidak tertutup icon
                                  value={formData.password || ''} 
                                  onChange={e=>setFormData({...formData, password: e.target.value})} 
                                  placeholder="Isi untuk mengubah password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition"
                                >
                                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                </button>
                            </div>
                         </div>
                         
                         <div>
                            <label className={labelClassName}>Role / Jabatan</label>
                            <select 
                                className={inputClassName} 
                                value={formData.role || 'produksi'} 
                                onChange={e => setFormData({...formData, role: e.target.value as any})}
                            >
                                <option value="supervisor">Supervisor</option>
                                <option value="admin">Admin</option>
                                <option value="produksi">Produksi</option>
                                <option value="qc">QC</option>
                                <option value="manager">Manager</option>
                            </select>
                         </div>
                      </div>
                  </div>

                  {/* Matrix Checkboxes */}
                  <div>
                      <div className="text-sm font-bold text-slate-800 uppercase mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                        <Shield className="w-4 h-4"/> Matrix Izin Akses
                      </div>
                      
                      <RenderPermissionSection 
                          title="1. Akses Menu / Halaman" 
                          category="pages" 
                          labels={{
                              dashboard: 'Dashboard',
                              orders: 'List Pesanan',
                              kalkulator: 'Kalkulator',
                              settings: 'Menu Settings',
                              trash: 'Menu Sampah',
                              config_harga: 'Config Harga',
                              about: 'About'
                          }} 
                      />

                      <RenderPermissionSection 
                          title="2. Kelola Pesanan (Global)" 
                          category="orders" 
                          labels={{
                              create: 'Buat Baru',
                              edit: 'Edit Info',
                              delete: 'Hapus (Sampah)',
                              restore: 'Restore',
                              permanent_delete: 'Hapus Permanen'
                          }} 
                      />

                      <RenderPermissionSection 
                          title="3. Produksi: MANUAL" 
                          category="prod_manual" 
                          labels={{
                              step_process: 'Update Step',
                              upload_approval: 'Upload Approval',
                              access_files: 'Lihat File',
                              delete_files: 'Hapus File'
                          }} 
                      />

                      <RenderPermissionSection 
                          title="4. Produksi: DTF" 
                          category="prod_dtf" 
                          labels={{
                              step_process: 'Update Step',
                              upload_approval: 'Upload Approval',
                              access_files: 'Lihat File',
                              delete_files: 'Hapus File'
                          }} 
                      />

                      <RenderPermissionSection 
                          title="5. Finishing & QC" 
                          category="finishing" 
                          labels={{
                              qc_check: 'Cek QC',
                              qc_reset: 'Reset QC',
                              packing_update: 'Update Packing',
                              shipping_update: 'Update Pengiriman',
                              delete_files: 'Hapus File Bukti'
                          }} 
                      />
                      
                      <RenderPermissionSection 
                          title="6. Konfigurasi Harga" 
                          category="price_config" 
                          icon={DollarSign}
                          labels={{
                              edit: 'Bisa Edit/Update Harga'
                          }} 
                      />
                  </div>

              </div>

              {/* Footer Modal */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                  <button onClick={() => setIsUserModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 text-sm hover:bg-slate-100 transition">Batal</button>
                  <button onClick={handleSubmitUser} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-200">Simpan Perubahan</button>
              </div>

           </div>
        </div>
      )}


      {/* --- MODAL EDIT TYPE (POPUP KECIL) --- */}
      {isTypeModalOpen && editingType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
           <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
              <h3 className="font-bold text-lg mb-4 text-slate-800">Edit Jenis Produksi</h3>
              <form onSubmit={handleTypeFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama</label>
                    <input autoFocus className="w-full border-2 border-slate-200 p-2 rounded-lg font-bold text-slate-800" value={editingType.name} onChange={e=>setEditingType({...editingType, name: e.target.value})} placeholder="Nama"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Value (Kode)</label>
                    <input className="w-full border-2 border-slate-200 p-2 rounded-lg font-mono text-sm" value={editingType.value} onChange={e=>setEditingType({...editingType, value: e.target.value})} placeholder="Value"/>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={()=>setIsTypeModalOpen(false)} className="flex-1 py-2 border-2 border-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Batal</button>
                    <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200">Simpan</button>
                  </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}