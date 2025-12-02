'use client';

import React, { useState, useEffect } from 'react';
// UPDATE PENTING: Menggunakan Auth Helper agar session terbaca di Vercel
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ConfigPriceView() {
  // Inisialisasi client supabase khusus komponen Next.js
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

  // --- LOGIC CRUD ADDONS (BONUS) ---

  const handleAddAddon = async () => {
    if (!newAddonName || !newAddonCost) return alert("Nama dan Harga harus diisi!");
    
    // Cek session dulu untuk memastikan user terautentikasi
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("Sesi login kadaluarsa. Silakan refresh atau login ulang.");

    const { error } = await supabase.from('product_addons').insert({
      name: newAddonName,
      cost: Number(newAddonCost),
      is_active: true 
    });

    if (error) alert("Gagal: " + error.message);
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

  const handleStatusChange = (e: any) => {
     // Handle manual change for mobile select if needed, 
     // but we are using buttons now (see below)
  };

  if (loading && configs.length === 0) return <div className="p-10 text-center text-gray-500">Memuat data...</div>;

  const categories = ['GENERAL', 'DTF', 'MANUAL'];

  return (
    <div className="bg-slate-50 min-h-full pb-20 rounded-xl border border-slate-200 overflow-hidden relative font-sans">
      
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-lg font-semibold text-slate-800">Pengaturan Harga</h1>
            <p className="text-xs text-slate-500">Update dasar perhitungan HPP</p>
          </div>
          <button 
            onClick={handleSaveConfigs} 
            disabled={saving}
            className={`w-full md:w-auto px-5 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-all active:scale-95 ${saving ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {saving ? 'Menyimpan...' : 'Simpan Config Utama'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        
        {/* SECTION 1: CONFIG UTAMA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const categoryItems = configs.filter((item) => item.category === cat);
            if (categoryItems.length === 0) return null;
            return (
              <div key={cat} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-700 text-sm tracking-wide">{cat} CONFIG</h3> 
                </div>
                <div className="p-5 space-y-4 flex-1">
                  {categoryItems.map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm text-slate-600 font-medium">{item.display_name}</label>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase border border-slate-200">{item.unit}</span>
                      </div>
                      <input
                        type="text" inputMode="numeric"
                        value={item.value_amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                        onChange={(e) => handleConfigChange(e, item.id)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-medium text-base outline-none transition"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION 2: MANAGEMENT BONUS */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700 text-sm tracking-wide">DAFTAR BONUS & ADD-ONS</h3>
          </div>
          
          <div className="p-4 md:p-6">
            {/* Form Tambah Baru */}
            <div className="flex flex-col md:flex-row gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 items-end">
                <div className="flex-1 w-full">
                    <label className="text-xs font-medium text-slate-500 uppercase">Nama Item Baru</label>
                    <input type="text" placeholder="Contoh: Sticker" value={newAddonName} onChange={(e) => setNewAddonName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 text-sm" />
                </div>
                <div className="w-full md:w-1/3">
                    <label className="text-xs font-medium text-slate-500 uppercase">HPP (Rp)</label>
                    <input type="number" placeholder="0" value={newAddonCost} onChange={(e) => setNewAddonCost(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 text-sm" />
                </div>
                <button onClick={handleAddAddon} className="w-full md:w-auto bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition shadow-sm">
                    + Tambah
                </button>
            </div>

            {/* --- TABLE VIEW (Desktop) --- */}
            <div className="hidden md:block overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider w-32">Status</th>
                            <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider">Nama Item</th>
                            <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider">HPP (Rp)</th>
                            <th className="py-3 px-4 text-center font-medium text-xs uppercase tracking-wider w-32">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {addons.map((addon) => (
                            <tr key={addon.id} className="hover:bg-slate-50 transition">
                                {/* KOLOM STATUS (Teks Saja) */}
                                <td className="py-3 px-4 align-middle">
                                    {editingId === addon.id ? (
                                        <select 
                                            value={String(tempEditData.is_active)}
                                            onChange={(e) => setTempEditData({...tempEditData, is_active: e.target.value === 'true'})}
                                            className="w-full border border-blue-400 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none bg-white"
                                        >
                                            <option value="true">Aktif</option>
                                            <option value="false">Non-Aktif</option>
                                        </select>
                                    ) : (
                                        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${addon.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                            {addon.is_active ? 'Aktif' : 'Non-Aktif'}
                                        </span>
                                    )}
                                </td>
                                
                                {editingId === addon.id ? (
                                    <>
                                        <td className="py-3 px-4 align-middle">
                                            <input type="text" className="w-full border border-blue-400 rounded px-2 py-1 text-sm text-slate-700" value={tempEditData.name} onChange={(e) => setTempEditData({...tempEditData, name: e.target.value})} />
                                        </td>
                                        <td className="py-3 px-4 align-middle">
                                            <input type="number" className="w-full border border-blue-400 rounded px-2 py-1 text-sm text-slate-700" value={tempEditData.cost} onChange={(e) => setTempEditData({...tempEditData, cost: e.target.value})} />
                                        </td>
                                        <td className="py-3 px-4 align-middle flex justify-center gap-2">
                                            <button onClick={() => handleUpdateAddon(addon.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700">Simpan</button>
                                            <button onClick={cancelEditing} className="bg-slate-200 text-slate-600 px-3 py-1 rounded text-xs font-medium hover:bg-slate-300">Batal</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="py-3 px-4 text-slate-700 font-medium align-middle">{addon.name}</td>
                                        <td className="py-3 px-4 text-slate-600 font-mono align-middle">Rp {Number(addon.cost).toLocaleString('id-ID')}</td>
                                        
                                        <td className="py-3 px-4 align-middle flex justify-center gap-2">
                                            <button onClick={() => startEditing(addon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                            </button>
                                            <button onClick={() => handleDeleteAddon(addon.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Hapus">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- CARD LIST VIEW (Mobile) --- */}
            <div className="md:hidden space-y-3">
                {addons.map((addon) => (
                    <div key={addon.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col gap-3">
                        {editingId === addon.id ? (
                            // MODE EDIT (MOBILE) - DIPERBAIKI
                            <div className="space-y-3 bg-slate-50 p-3 rounded-md border border-slate-200">
                                <h4 className="font-semibold text-slate-700 text-xs mb-2 uppercase">Edit Item</h4>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Nama</label>
                                    <input type="text" className="w-full border border-blue-400 rounded px-2 py-2 text-sm text-slate-700" value={tempEditData.name} onChange={(e) => setTempEditData({...tempEditData, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Harga (Rp)</label>
                                    <input type="number" className="w-full border border-blue-400 rounded px-2 py-2 text-sm text-slate-700" value={tempEditData.cost} onChange={(e) => setTempEditData({...tempEditData, cost: e.target.value})} />
                                </div>
                                
                                {/* BUTTONS FOR STATUS (Mobile) */}
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Status</label>
                                    <div className="flex w-full border border-blue-400 rounded overflow-hidden">
                                        <button 
                                            onClick={() => setTempEditData({ ...tempEditData, is_active: true })}
                                            className={`flex-1 py-2 text-sm font-medium transition ${tempEditData.is_active ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Aktif
                                        </button>
                                        <div className="w-px bg-blue-400"></div>
                                        <button 
                                            onClick={() => setTempEditData({ ...tempEditData, is_active: false })}
                                            className={`flex-1 py-2 text-sm font-medium transition ${!tempEditData.is_active ? 'bg-red-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Non-Aktif
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => handleUpdateAddon(addon.id)} className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-medium">Simpan</button>
                                    <button onClick={cancelEditing} className="flex-1 bg-slate-200 text-slate-600 py-2 rounded text-sm font-medium">Batal</button>
                                </div>
                            </div>
                        ) : (
                            // MODE TAMPIL (MOBILE)
                            <>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-slate-800 text-base">{addon.name}</h4>
                                        <p className="text-slate-500 text-sm font-mono mt-0.5">Rp {Number(addon.cost).toLocaleString('id-ID')}</p>
                                    </div>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${addon.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                        {addon.is_active ? 'Aktif' : 'Non-Aktif'}
                                    </span>
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-slate-100 mt-1">
                                    <button onClick={() => startEditing(addon)} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-blue-600 bg-blue-50 rounded border border-blue-100 font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                        Edit
                                    </button>
                                    <button onClick={() => handleDeleteAddon(addon.id)} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-red-500 bg-red-50 rounded border border-red-100 font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                        Hapus
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}