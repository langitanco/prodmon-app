'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/app/components/layout/Sidebar'; // Import Sidebar
import { UserData } from '@/types';
import { Menu } from 'lucide-react';

export default function CalculatorPage() {
  const router = useRouter();
  
  // 1. STATE MANAGEMENT
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>({});
  const [mode, setMode] = useState('DTF');
  const [finalPrice, setFinalPrice] = useState(0);

  // State untuk Sidebar & User
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Input User
  const [inputs, setInputs] = useState({
    qty: 1, width: 28, length: 40, colors: 1, kaosPrice: 35000,
  });

  // 2. CHECK USER & FETCH CONFIG
  useEffect(() => {
    // Cek User Login dari LocalStorage (agar sidebar tampil benar)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
    } else {
        router.push('/'); // Jika belum login, tendang ke login
        return;
    }

    const fetchConfig = async () => {
      const { data, error } = await supabase.from('pricing_configs').select('key_name, value_amount');
      if (data) {
        const configMap = data.reduce((acc: any, item: any) => {
          acc[item.key_name] = Number(item.value_amount);
          return acc;
        }, {});
        setConfig(configMap);
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // 3. LOGIKA KALKULASI (Tetap Sama)
  useEffect(() => {
    if (loading) return;
    let price = 0;
    const area = inputs.width * inputs.length; 

    if (mode === 'DTF') {
      const pricePerCm = config['dtf_price_per_cm'] || 50; 
      price = (area * pricePerCm) + Number(inputs.kaosPrice);
    } else if (mode === 'MANUAL') {
      const screenCost = config['manual_screen_cost'] || 25000;
      const inkCost = config['manual_ink_cost'] || 1500;
      const jasaCost = config['manual_jasa_cost'] || 5000;
      price = (screenCost / inputs.qty) + (inkCost * inputs.colors) + jasaCost + Number(inputs.kaosPrice);
    }
    
    // Margin Profit
    const profitMargin = config['general_profit_margin'] || 20; 
    price = price + (price * (profitMargin / 100));
    setFinalPrice(Math.ceil(price / 1000) * 1000); 
  }, [inputs, mode, config, loading]);

  // Handle Navigasi Sidebar
  const handleNav = (tab: string) => {
      // Jika user klik menu dashboard/pesanan, kita pindahkan halamannya ke root
      if (['dashboard', 'orders', 'trash', 'settings'].includes(tab)) {
          router.push('/');
      }
      // Jika klik kalkulator, diam saja (sudah disini)
  };

  const handleLogout = () => {
      localStorage.removeItem('currentUser');
      router.push('/');
  };

  if (!currentUser) return null; // Loading state

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row">
      {/* SIDEBAR TERINTEGRASI */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentUser={currentUser} 
        activeTab="kalkulator"  // <-- Ini kuncinya agar menyala biru
        handleNav={handleNav} 
        handleLogout={handleLogout} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white px-4 py-3 shadow-md flex items-center justify-between sticky top-0 z-50">
            <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Menu className="w-6 h-6"/>
            </button>
            <span className="font-bold text-slate-800">Kalkulator HPP</span>
            <div className="w-8"></div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                Simulasi Harga Pokok
            </h1>

            {/* --- KONTEN KALKULATOR ASLI ANDA --- */}
            {/* Tab Mode */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                {['DTF', 'MANUAL'].map((m) => (
                <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {m}
                </button>
                ))}
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Qty (Pcs)</label>
                        <input type="number" className="w-full border p-2 rounded-lg font-bold text-slate-800 mt-1" value={inputs.qty} onChange={(e)=>setInputs({...inputs, qty: Number(e.target.value)})}/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Harga Kaos Polos</label>
                        <input type="number" className="w-full border p-2 rounded-lg font-bold text-slate-800 mt-1" value={inputs.kaosPrice} onChange={(e)=>setInputs({...inputs, kaosPrice: Number(e.target.value)})}/>
                    </div>
                </div>

                {mode === 'DTF' ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Lebar (cm)</label>
                            <input type="number" className="w-full border p-2 rounded-lg font-bold text-slate-800 mt-1" value={inputs.width} onChange={(e)=>setInputs({...inputs, width: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Panjang (cm)</label>
                            <input type="number" className="w-full border p-2 rounded-lg font-bold text-slate-800 mt-1" value={inputs.length} onChange={(e)=>setInputs({...inputs, length: Number(e.target.value)})}/>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Jumlah Warna</label>
                        <input type="number" className="w-full border p-2 rounded-lg font-bold text-slate-800 mt-1" value={inputs.colors} onChange={(e)=>setInputs({...inputs, colors: Number(e.target.value)})}/>
                    </div>
                )}
            </div>

            {/* Result */}
            <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
                <div className="text-center">
                    <p className="text-sm text-slate-500 font-medium mb-1">Estimasi Harga Jual Per Pcs</p>
                    <div className="text-4xl font-extrabold text-blue-600">
                        Rp {finalPrice.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">*Sudah termasuk profit margin settingan sistem</p>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}