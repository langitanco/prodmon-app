'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/app/components/layout/Sidebar';
import { UserData } from '@/types';
import { Menu, Save } from 'lucide-react';

export default function PricingSettings() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Cek User (Security: Hanya Supervisor yang boleh akses)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.role !== 'supervisor') {
            alert('Akses Ditolak. Hanya Supervisor.');
            router.push('/');
            return;
        }
        setCurrentUser(user);
    } else {
        router.push('/');
        return;
    }

    // 2. Fetch Data
    const fetchData = async () => {
      const { data } = await supabase.from('pricing_configs').select('*').order('id');
      if (data) setConfig(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    for (const item of config) {
      await supabase.from('pricing_configs').update({ value_amount: item.value_amount }).eq('id', item.id);
    }
    alert('Pengaturan harga berhasil disimpan!');
  };

  const handleNav = (tab: string) => {
    if (['dashboard', 'orders', 'trash', 'settings'].includes(tab)) router.push('/');
    if (tab === 'kalkulator') router.push('/kalkulator');
  };
  
  const handleLogout = () => { localStorage.removeItem('currentUser'); router.push('/'); };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentUser={currentUser} 
        activeTab="config_harga" // <-- Tab ini akan menyala kuning/biru di sidebar
        handleNav={handleNav} 
        handleLogout={handleLogout} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
         <header className="md:hidden bg-white px-4 py-3 shadow-md flex items-center justify-between sticky top-0 z-50">
            <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg"><Menu className="w-6 h-6"/></button>
            <span className="font-bold text-slate-800">Config Harga</span>
            <div className="w-8"></div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-slate-800 text-white p-6 rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">Pengaturan Harga Dasar</h1>
                        <p className="text-slate-400 text-sm">Ubah variabel perhitungan HPP sistem</p>
                    </div>
                    <button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition">
                        <Save className="w-4 h-4"/> Simpan Perubahan
                    </button>
                </div>

                <div className="bg-white p-6 rounded-b-2xl shadow-sm border border-slate-200 space-y-8">
                    {/* Render Form Dinamis */}
                    {['DTF', 'MANUAL', 'GENERAL'].map((category) => (
                        <div key={category}>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Kategori: {category}</h3>
                            <div className="grid gap-4">
                                {config.filter(c => c.category === category).map((item, idx) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <label className="font-medium text-slate-700 w-1/2">{item.description}</label>
                                        <div className="flex items-center gap-2 w-full sm:w-1/2">
                                            <span className="text-slate-400 font-bold text-sm">Rp</span>
                                            <input 
                                                type="number" 
                                                className="w-full border-2 border-slate-200 rounded-lg p-2 font-bold text-slate-800 focus:border-blue-500 outline-none"
                                                value={item.value_amount}
                                                onChange={(e) => {
                                                    const newConfig = [...config];
                                                    const target = newConfig.find(c => c.id === item.id);
                                                    if(target) target.value_amount = Number(e.target.value);
                                                    setConfig(newConfig);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}