'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<any[]>([]);

  // 1. AMBIL DATA
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const { data } = await supabase
      .from('pricing_configs')
      .select('*')
      .order('id', { ascending: true }); 
    if (data) {
      setConfigs(data);
      setLoading(false);
    }
  };

  // 2. HELPER FORMATTING (LOGIKA UTAMA)
  
  // Fungsi menentukan apa yang harus ditampilkan di layar
  const getDisplayValue = (item: any) => {
    // Jika datanya 0 atau kosong, kembalikan string kosong
    if (!item.value_amount) return '';

    // Cek apakah unit mengandung kata 'rupiah' (case insensitive)
    const isRupiah = item.unit && item.unit.toLowerCase().includes('rupiah');

    if (isRupiah) {
      // Format: Rp 35.000
      return 'Rp ' + item.value_amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Jika bukan rupiah (misal: persen), tampilkan angka biasa
    return item.value_amount.toString();
  };

  // 3. HANDLE INPUT CHANGE
  const handleChange = (e: any, id: number) => {
    // Ambil hanya angka (hapus Rp, titik, huruf lain)
    const rawValue = e.target.value.replace(/\D/g, ''); 
    
    setConfigs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value_amount: Number(rawValue) } : item))
    );
  };

  // 4. SIMPAN
  const handleSave = async () => {
    setSaving(true);
    try {
      for (const item of configs) {
        await supabase
          .from('pricing_configs')
          .update({ value_amount: item.value_amount })
          .eq('id', item.id);
      }
      alert('✅ Harga berhasil diperbarui!');
    } catch (error) {
      alert('❌ Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      
      {/* --- HEADER STICKY --- */}
      <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Pengaturan Harga</h1>
            <p className="text-xs text-gray-500 hidden md:block">Update dasar perhitungan HPP</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`px-6 py-2.5 rounded-lg font-bold text-white shadow-lg transition-transform transform active:scale-95 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {saving ? 'Menyimpan...' : 'SIMPAN PERUBAHAN'}
          </button>
        </div>
      </div>

      {/* --- KONTEN GRID --- */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* LOOP KATEGORI */}
          {['DTF', 'MANUAL', 'GENERAL'].map((cat) => {
            const categoryItems = configs.filter((item) => item.category === cat);
            if (categoryItems.length === 0) return null;

            return (
              <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {/* Judul Kategori */}
                <div className="bg-slate-50 px-5 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-slate-700 tracking-wide">{cat} CONFIG</h3>
                </div>

                {/* List Input */}
                <div className="p-5 space-y-5 flex-1">
                  {categoryItems.map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-600">
                          {item.display_name}
                        </label>
                        {/* Tampilkan unit kecil di atas kanan label, bukan di dalam input */}
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                          {item.unit}
                        </span>
                      </div>
                      
                      <input
                        type="text"
                        inputMode="numeric"
                        value={getDisplayValue(item)}
                        onChange={(e) => handleChange(e, item.id)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 font-bold text-lg outline-none placeholder-gray-300"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}