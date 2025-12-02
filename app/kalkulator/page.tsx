'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function CalculatorPage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>({});
  const [mode, setMode] = useState('DTF');
  const [finalPrice, setFinalPrice] = useState(0);

  const [inputs, setInputs] = useState({
    qty: 0, 
    width: 0,
    length: 0,
    colors: 0,
    kaosPrice: 0,
  });

  // --- 1. FETCH DATA AWAL & SUBSCRIBE REALTIME ---
  useEffect(() => {
    // Fungsi ambil data awal
    const fetchConfig = async () => {
      const { data } = await supabase.from('pricing_configs').select('key_name, value_amount');
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

    // --- BAGIAN AJAIB (REALTIME) ---
    // Kita pasang "Antena" untuk mendengarkan perubahan di tabel pricing_configs
    const channel = supabase
      .channel('realtime-pricing')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pricing_configs' },
        (payload) => {
          // Saat ada data berubah, payload.new membawa data baru tersebut
          const newData = payload.new as any;
          console.log('Harga berubah!', newData);

          // Update state config secara instan
          setConfig((prevConfig: any) => ({
            ...prevConfig,
            [newData.key_name]: Number(newData.value_amount)
          }));
        }
      )
      .subscribe();

    // Matikan antena saat halaman ditutup agar hemat memori
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- 2. LOGIKA HITUNG (Sama seperti sebelumnya) ---
  useEffect(() => {
    if (loading) return;
    let hppSablon = 0;
    const margin = (config.margin_percentage || 40) / 100;
    const safeQty = inputs.qty > 0 ? inputs.qty : 1; 

    if (mode === 'DTF') {
      const area = inputs.width * inputs.length;
      const dtfPrice = config.dtf_price_per_cm || 35;
      const pressCost = config.dtf_press_cost || 1500;
      hppSablon = (area * dtfPrice) + pressCost;
    } else {
      const screenCost = config.manual_screen_cost || 40000;
      const laborCost = config.manual_labor_cost || 3000;
      const finishCost = config.manual_finishing || 1000;
      const totalSetupCost = screenCost * inputs.colors;
      const setupCostPerPcs = totalSetupCost / safeQty;
      hppSablon = setupCostPerPcs + laborCost + finishCost;
    }

    const totalHPP = inputs.kaosPrice + hppSablon;
    const sellingPrice = totalHPP + (totalHPP * margin);
    setFinalPrice(sellingPrice);
  }, [inputs, mode, config, loading]);

  // --- FORMATTER HELPERS ---
  const formatRupiahDisplay = (num: number) => {
    if (!num) return ''; 
    return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const formatNumberDisplay = (num: number) => {
    if (!num) return ''; 
    return num.toString();
  };

  const handleInputChange = (e: any, field: string) => {
    const rawValue = e.target.value.replace(/\D/g, ''); 
    setInputs((prev) => ({ ...prev, [field]: Number(rawValue) }));
  };

  const formatResult = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500 font-bold animate-pulse">Menghubungkan ke Server...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* --- KOLOM KIRI: INPUT --- */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-40 md:pb-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold text-slate-800">Kalkulator Produksi</h2>
             <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">● Live Update</span>
          </div>
          
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex mb-6">
            <button onClick={() => setMode('DTF')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${mode === 'DTF' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Sablon DTF</button>
            <button onClick={() => setMode('MANUAL')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${mode === 'MANUAL' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Sablon Manual</button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jumlah Order (Pcs)</label>
              <input type="text" inputMode="numeric" value={formatNumberDisplay(inputs.qty)} onChange={(e) => handleInputChange(e, 'qty')} className="w-full text-xl font-bold text-gray-900 border-gray-300 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-300" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Harga Kaos Polos</label>
              <input type="text" inputMode="numeric" value={formatRupiahDisplay(inputs.kaosPrice)} onChange={(e) => handleInputChange(e, 'kaosPrice')} className="w-full text-xl font-bold text-gray-900 border-gray-300 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-300" placeholder="Rp 0" />
            </div>
            <hr className="border-dashed border-gray-200 my-4" />
            {mode === 'DTF' ? (
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Lebar (cm)</label><input type="text" inputMode="numeric" value={formatNumberDisplay(inputs.width)} onChange={(e) => handleInputChange(e, 'width')} className="w-full text-xl font-bold text-gray-900 border-gray-300 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-300" placeholder="0" /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Panjang (cm)</label><input type="text" inputMode="numeric" value={formatNumberDisplay(inputs.length)} onChange={(e) => handleInputChange(e, 'length')} className="w-full text-xl font-bold text-gray-900 border-gray-300 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-300" placeholder="0" /></div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jumlah Warna</label>
                <input type="text" inputMode="numeric" value={formatNumberDisplay(inputs.colors)} onChange={(e) => handleInputChange(e, 'colors')} className="w-full text-xl font-bold text-gray-900 border-gray-300 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-300" placeholder="0" />
                <p className="text-xs text-orange-500 mt-2 bg-orange-50 p-2 rounded">⚠️ Biaya afdruk dibagi rata ke {inputs.qty || 1} pcs baju.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- KOLOM KANAN: HASIL --- */}
      <div className="fixed bottom-0 left-0 right-0 md:relative md:w-1/3 bg-slate-900 text-white p-6 md:p-10 rounded-t-3xl md:rounded-none shadow-2xl z-30 flex flex-col justify-center border-t-4 border-blue-500 md:border-t-0">
        <div className="max-w-sm mx-auto w-full">
          <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-widest">Rekomendasi Harga Jual</p>
          <div className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight truncate transition-all duration-300">
            {formatResult(finalPrice)}
            <span className="text-lg text-slate-400 font-normal ml-1">/pcs</span>
          </div>
          <div className="mt-6 space-y-3 border-t border-slate-700 pt-6">
            <div className="flex justify-between text-sm"><span className="text-slate-400">Total Omset</span><span className="font-bold text-white">{formatResult(finalPrice * inputs.qty)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Estimasi Margin</span><span className="font-bold text-green-400">+{config.margin_percentage}%</span></div>
            {mode === 'MANUAL' && (<div className="flex justify-between text-sm"><span className="text-slate-400">Beban Screen/kaos</span><span className="font-bold text-yellow-400">{formatResult((config.manual_screen_cost * inputs.colors) / (inputs.qty || 1))}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}