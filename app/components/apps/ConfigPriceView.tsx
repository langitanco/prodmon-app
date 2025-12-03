'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Save, Plus, Trash2, Edit2, X, Check, Package } from 'lucide-react';

export default function ConfigPriceView() {
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data State
  const [configs, setConfigs] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  
  // State Input Baru
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonCost, setNewAddonCost] = useState('');

  // State Editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempEditData, setTempEditData] = useState({ name: '', cost: '', is_active: true });

  // 1. FETCH DATA
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: configData } = await supabase.from('pricing_configs').select('*').order('id', { ascending: true });
    const { data: addonData } = await supabase.from('product_addons').select('*').order('id', { ascending: true });

    if (configData) setConfigs(configData);
    if (addonData) setAddons(addonData);
    setLoading(false);
  };

  // --- LOGIC CONFIG UTAMA ---
  const handleConfigChange = (e: any, id: number) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setConfigs((prev) => prev.map((item) => (item.id === id ? { ...item, value_amount: Number(rawValue) } : item)));
  };

  const handleSaveConfigs = async () => {
    setSaving(true);
    try {
      for (const item of configs) {
        if (typeof item.value_amount === 'number') {
          await supabase.from('pricing_configs').update({ value_amount: item.value_amount }).eq('id', item.id);
        }
      }
      alert('✅ Konfigurasi berhasil disimpan!');
    } catch (error) {
      alert('❌ Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  // --- LOGIC CRUD ADDONS ---
  const handleAddAddon = async () => {
    if (!newAddonName || !newAddonCost) return alert("Nama dan Harga harus diisi!");
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        alert("Sesi login berakhir. Silakan refresh halaman.");
        return;
    }

    const { error } = await supabase.from('product_addons').insert({
      name: newAddonName,
      cost: Number(newAddonCost),
      is_active: true 
    });

    if (error) alert("Gagal simpan: " + error.message);
    else {
      setNewAddonName('');
      setNewAddonCost('');
      fetchData();
    }
  };

  const startEditing = (addon: any) => {
    setEditingId(addon.id);
    setTempEditData({ 
        name: addon.name, 
        cost: addon.cost,
        is_active: addon.is_active 
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setTempEditData({ name: '', cost: '', is_active: true });
  };

  const handleUpdateAddon = async (id: number) => {
    const { error } = await supabase.from('product_addons').update({
      name: tempEditData.name,
      cost: Number(tempEditData.cost),
      is_active: Boolean(tempEditData.is_active) 
    }).eq('id', id);

    if (error) alert("Gagal update: " + error.message);
    else {
      setEditingId(null);
      fetchData(); 
    }
  };

  const handleDeleteAddon = async (id: number) => {
    if (confirm("Hapus item ini secara permanen?")) {
      const { error } = await supabase.from('product_addons').delete().eq('id', id);
      if (error) alert("Gagal hapus: " + error.message);
      else fetchData();
    }
  };

  // KOMPONEN SWITCH (TOGGLE)
  const StatusSwitch = ({ isActive, onToggle }: { isActive: boolean, onToggle: () => void }) => (
    <div 
        onClick={onToggle}
        className={`w-12 h-6 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition-colors duration-300 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
    >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </div>
  );

  // --- LOADING STATE (UPDATED: Sama persis dengan Page.tsx) ---
  if (loading && configs.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Memuat Pengaturan...</p>
    </div>
  );

  const categories = ['GENERAL', 'DTF', 'MANUAL'];

  return (
    <div className="space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan Harga</h1>
          <p className="text-slate-600 text-sm">Kelola HPP dasar dan harga add-ons produksi.</p>
        </div>
        <button 
            onClick={handleSaveConfigs} 
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-70"
        >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      {/* SECTION 1: CONFIG UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const categoryItems = configs.filter((item) => item.category === cat);
            if (categoryItems.length === 0) return null;
            return (
              <div key={cat} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">{cat}</h3> 
                <div className="space-y-5 flex-1">
                  {categoryItems.map((item) => {
                    const isPercentage = item.unit === '%';
                    return (
                      <div key={item.id}>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-sm text-slate-600 font-medium">{item.display_name}</label>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{item.unit}</span>
                        </div>
                        <div className="relative">
                          {!isPercentage && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">Rp</span>
                          )}
                          <input
                              type="text" inputMode="numeric"
                              value={item.value_amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                              onChange={(e) => handleConfigChange(e, item.id)}
                              className={`block w-full py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold text-lg outline-none transition placeholder-slate-400 ${isPercentage ? 'pl-4 pr-8' : 'pl-9 pr-3'}`}
                          />
                          {isPercentage && (
                             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">%</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* SECTION 2: ADD-ONS (HYBRID VIEW) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h3 className="font-bold text-slate-800 text-lg">Daftar Bonus & Add-ons</h3>
            
            {/* Form Input */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center w-full md:w-auto">
                <input 
                    type="text" 
                    placeholder="Nama Item (mis: Sticker)" 
                    value={newAddonName} 
                    onChange={(e) => setNewAddonName(e.target.value)} 
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm w-full md:w-48 placeholder-slate-400" 
                />
                <input 
                    type="number" 
                    placeholder="Harga (Rp)" 
                    value={newAddonCost} 
                    onChange={(e) => setNewAddonCost(e.target.value)} 
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm w-full md:w-32 placeholder-slate-400" 
                />
                <button 
                    onClick={handleAddAddon} 
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Tambah
                </button>
            </div>
          </div>
          
          {/* --- TAMPILAN DESKTOP (TABEL) --- */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                        <th className="py-4 px-6 font-semibold w-32">Status</th>
                        <th className="py-4 px-6 font-semibold">Nama Item</th>
                        <th className="py-4 px-6 font-semibold">HPP (Rp)</th>
                        <th className="py-4 px-6 text-center font-semibold w-32">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {addons.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400">Belum ada data add-ons.</td>
                        </tr>
                    ) : (
                        addons.map((addon) => (
                        <tr key={addon.id} className="hover:bg-slate-50 transition group">
                            {/* STATUS COLUMN */}
                            <td className="py-3 px-6">
                                {editingId === addon.id ? (
                                    // MODE EDIT: Tampilkan Switch
                                    <StatusSwitch 
                                        isActive={tempEditData.is_active} 
                                        onToggle={() => setTempEditData({...tempEditData, is_active: !tempEditData.is_active})}
                                    />
                                ) : (
                                    // MODE VIEW: Tampilkan Badge
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${addon.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {addon.is_active ? 'AKTIF' : 'OFF'}
                                    </span>
                                )}
                            </td>
                            
                            {/* EDIT MODE (DESKTOP) */}
                            {editingId === addon.id ? (
                                <>
                                    <td className="py-3 px-6">
                                        <input type="text" className="w-full border border-blue-300 rounded px-3 py-1.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={tempEditData.name} onChange={(e) => setTempEditData({...tempEditData, name: e.target.value})} />
                                    </td>
                                    <td className="py-3 px-6">
                                        <input type="number" className="w-full border border-blue-300 rounded px-3 py-1.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={tempEditData.cost} onChange={(e) => setTempEditData({...tempEditData, cost: e.target.value})} />
                                    </td>
                                    <td className="py-3 px-6 flex justify-center gap-2">
                                        <button onClick={() => handleUpdateAddon(addon.id)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check className="w-4 h-4"/></button>
                                        <button onClick={cancelEditing} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-4 h-4"/></button>
                                    </td>
                                </>
                            ) : (
                                // VIEW MODE (DESKTOP)
                                <>
                                    <td className="py-3 px-6 font-medium text-slate-800">{addon.name}</td>
                                    <td className="py-3 px-6 font-mono text-slate-700">Rp {Number(addon.cost).toLocaleString('id-ID')}</td>
                                    <td className="py-3 px-6 flex justify-center gap-2">
                                        <button onClick={() => startEditing(addon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteAddon(addon.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Hapus"><Trash2 className="w-4 h-4"/></button>
                                    </td>
                                </>
                            )}
                        </tr>
                    )))}
                </tbody>
            </table>
          </div>

          {/* --- TAMPILAN MOBILE (CARD LIST) --- */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100">
             {addons.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-sm">Belum ada data add-ons.</div>
             )}
             
             {addons.map((addon) => (
               <div key={addon.id} className="p-4 flex flex-col gap-3">
                  {editingId === addon.id ? (
                      // EDIT MODE (MOBILE)
                      <div className="bg-slate-50 p-4 rounded-lg border border-blue-200 shadow-sm space-y-4">
                          <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                              <span className="text-xs font-bold text-slate-500 uppercase">Status Item</span>
                              {/* SWITCH TOGGLE DI MOBILE */}
                              <div className="flex items-center gap-2">
                                  <span className={`text-xs font-medium ${tempEditData.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                                      {tempEditData.is_active ? 'Aktif' : 'Non-Aktif'}
                                  </span>
                                  <StatusSwitch 
                                      isActive={tempEditData.is_active} 
                                      onToggle={() => setTempEditData({...tempEditData, is_active: !tempEditData.is_active})}
                                  />
                              </div>
                          </div>
                          
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Nama Item</label>
                            <input 
                                type="text" 
                                className="w-full border border-blue-300 rounded px-3 py-2 text-sm text-slate-900 bg-white font-medium" 
                                value={tempEditData.name} 
                                onChange={(e) => setTempEditData({...tempEditData, name: e.target.value})} 
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Harga (Rp)</label>
                            <input 
                                type="number" 
                                className="w-full border border-blue-300 rounded px-3 py-2 text-sm text-slate-900 bg-white font-medium" 
                                value={tempEditData.cost} 
                                onChange={(e) => setTempEditData({...tempEditData, cost: e.target.value})} 
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                              <button onClick={() => handleUpdateAddon(addon.id)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700">Simpan</button>
                              <button onClick={cancelEditing} className="flex-1 bg-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-300">Batal</button>
                          </div>
                      </div>
                  ) : (
                      // VIEW MODE (MOBILE)
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${addon.is_active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                  {addon.is_active ? <Package className="w-5 h-5" /> : <X className="w-5 h-5" />}
                              </div>
                              <div>
                                  <h4 className={`font-bold text-sm ${addon.is_active ? 'text-slate-800' : 'text-slate-400'}`}>{addon.name}</h4>
                                  <p className="text-xs text-slate-500 font-mono mt-0.5">Rp {Number(addon.cost).toLocaleString('id-ID')}</p>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                              <button 
                                onClick={() => startEditing(addon)} 
                                className="p-2 text-blue-600 bg-white border border-slate-100 shadow-sm hover:bg-blue-50 rounded-full transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteAddon(addon.id)} 
                                className="p-2 text-red-500 bg-white border border-slate-100 shadow-sm hover:bg-red-50 rounded-full transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                  )}
               </div>
             ))}
          </div>

      </div>
    </div>
  );
}