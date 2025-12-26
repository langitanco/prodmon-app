// app/components/settings/SettingsPage.tsx

import React, { useState } from 'react';
import { Trash2, UserPlus, Shield, Package, Pencil, X, CheckSquare, DollarSign, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  // --- LOGIC: USER MANAGEMENT ---
  const handleEditUser = (u: UserData) => {
    setFormData({ 
      id: u.id, 
      name: u.name, 
      username: u.username, 
      role: u.role, 
      password: u.password 
    });
    setShowPassword(false);

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

  const handleCreateNewUser = () => {
    setFormData({ id: '', name: '', username: '', role: 'produksi', password: '' });
    setShowPassword(false);
    setPermissions(DEFAULT_PERMISSIONS); 
    setIsUserModalOpen(true);
  };

  const handlePermissionChange = (category: keyof UserPermissions, key: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSubmitUser = () => {
    onSaveUser({ ...formData, permissions: permissions });
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

  // --- UI HELPER ---
  const RenderPermissionSection = ({ title, category, labels, icon: Icon = Shield }: { title: string, category: keyof UserPermissions, labels: Record<string, string>, icon?: any }) => (
    <div className="mb-4 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 text-xs md:text-sm flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"/> {title}
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white dark:bg-slate-900">
        {Object.keys(labels).map((key) => {
          // @ts-ignore
          const val = permissions[category] ? permissions[category][key] : false;

          return (
            <div 
               key={key} 
               onClick={() => handlePermissionChange(category, key, !val)}
               className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition border border-transparent hover:border-slate-100 dark:hover:border-slate-700 select-none"
            >
              <div 
                 className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${val ? 'bg-blue-600 border-blue-600 scale-105 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}
              >
                 {val && <CheckSquare className="w-3.5 h-3.5 text-white"/>}
              </div>
              <span className="text-[11px] md:text-xs text-slate-700 dark:text-slate-300 font-medium leading-tight">
                {labels[key]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const inputClassName = "w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 transition shadow-sm placeholder-slate-400 dark:placeholder-slate-500";
  const labelClassName = "text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wide";

  return (
    <div className="space-y-8 pb-24 transition-colors duration-300">
      
      {/* BAGIAN 1: JENIS PRODUKSI */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Package className="w-5 h-5 text-green-600 dark:text-green-500"/> Jenis Produksi</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:block">Master data varian produksi</p>
           </div>
           <button onClick={() => openTypeModal()} className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 dark:hover:bg-green-600 transition shadow-sm">
             + Tambah
           </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
           {productionTypes.map((pt) => (
             <div key={pt.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{pt.name}</div>
                  <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 rounded w-fit">{pt.value}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openTypeModal(pt)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => onDeleteProductionType(pt.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                </div>
             </div>
           ))}
        </div>
      </div>

      <hr className="border-slate-200 dark:border-slate-800"/>

      {/* BAGIAN 2: DAFTAR USER */}
      <div className="space-y-4">
         <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-500"/> Data Pengguna</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:block">Kelola akses user aplikasi</p>
           </div>
           <button onClick={handleCreateNewUser} className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition shadow-sm">
             + User Baru
           </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <li key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-sm">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="bg-slate-100 dark:bg-slate-800 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-sm md:text-base border border-slate-200 dark:border-slate-700 shadow-sm">
                            {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">{u.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-mono">@{u.username}</span>
                                <span className="text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 uppercase tracking-wide">
                                    {u.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 sm:gap-3 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                        <button 
                            onClick={() => handleEditUser(u)}
                            className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition text-xs font-bold flex items-center gap-2 shadow-sm"
                        >
                            <Pencil className="w-3.5 h-3.5"/> 
                            <span>Edit Akses</span>
                        </button>
                        
                        <button 
                            onClick={() => onDeleteUser(u.id)}
                            className="px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 hover:border-red-200 dark:hover:border-red-800 transition flex items-center justify-center shadow-sm"
                            title="Hapus User"
                        >
                            <Trash2 className="w-4 h-4"/>
                        </button>
                    </div>
                </li>
              ))}
            </ul>
        </div>
      </div>

      {/* MODAL USER (FULL POPUP) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[99] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border dark:border-slate-800">
              
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{formData.id ? 'Edit User & Hak Akses' : 'Buat User Baru'}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Atur matrix izin secara detail</p>
                  </div>
                  <button onClick={() => setIsUserModalOpen(false)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                    <X className="w-4 h-4 text-slate-600 dark:text-slate-400"/>
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                  {/* Form Data Diri */}
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                      <div className="text-sm font-bold text-blue-800 dark:text-blue-400 uppercase mb-2 flex items-center gap-2 border-b border-blue-200 dark:border-blue-900/30 pb-2">
                        <UserPlus className="w-4 h-4"/> Data Akun
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className={labelClassName}>Nama Lengkap</label>
                            <input className={inputClassName} value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Nama"/>
                         </div>
                         <div>
                            <label className={labelClassName}>Username</label>
                            <input className={inputClassName} value={formData.username || ''} onChange={e=>setFormData({...formData, username: e.target.value})} placeholder="User"/>
                         </div>
                         <div>
                            <label className={labelClassName}>Password</label>
                            <div className="relative">
                                <input 
                                  type={showPassword ? "text" : "password"}
                                  className={`${inputClassName} pr-10`} 
                                  value={formData.password || ''} 
                                  onChange={e=>setFormData({...formData, password: e.target.value})} 
                                  placeholder="Password"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                </button>
                            </div>
                         </div>
                         <div>
                            <label className={labelClassName}>Role / Jabatan</label>
                            <select className={inputClassName} value={formData.role || 'produksi'} onChange={e => setFormData({...formData, role: e.target.value as any})}>
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
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase mb-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <Shield className="w-4 h-4"/> Matrix Izin Akses
                      </div>
                      
                      <RenderPermissionSection 
                          title="1. Akses Menu / Halaman" 
                          category="pages" 
                          labels={{
                              dashboard: 'Dashboard',
                              orders: 'List Pesanan',
                              completed_orders: 'Menu Pesanan Selesai', // 🟢 BARU
                              activity_logs: 'Menu Log Aktivitas',     // 🟢 BARU
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

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                  <button onClick={() => setIsUserModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition">Batal</button>
                  <button onClick={handleSubmitUser} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition">Simpan Perubahan</button>
              </div>

           </div>
        </div>
      )}

      {/* MODAL EDIT TYPE */}
      {isTypeModalOpen && editingType && (
        <div className="fixed inset-0 bg-black/70 z-[99] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 border dark:border-slate-800">
              <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Edit Jenis Produksi</h3>
              <form onSubmit={handleTypeFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nama</label>
                    <input autoFocus className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 rounded-lg font-bold text-slate-800 dark:text-white bg-transparent outline-none focus:ring-2 focus:ring-green-500 transition" value={editingType.name} onChange={e=>setEditingType({...editingType, name: e.target.value})} placeholder="Nama"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Value (Kode)</label>
                    <input className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 rounded-lg font-mono text-sm text-slate-800 dark:text-slate-100 bg-transparent outline-none focus:ring-2 focus:ring-green-500 transition" value={editingType.value} onChange={e=>setEditingType({...editingType, value: e.target.value})} placeholder="Value"/>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={()=>setIsTypeModalOpen(false)} className="flex-1 py-2 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Batal</button>
                    <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none transition">Simpan</button>
                  </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}