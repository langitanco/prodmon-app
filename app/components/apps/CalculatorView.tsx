'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 

export default function CalculatorView() {
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

  useEffect(() => {
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

    const channel = supabase
      .channel('realtime-pricing')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pricing_configs' },
        (payload) => {
          const newData = payload.new as any;
          setConfig((prevConfig: any) => ({
            ...prevConfig,
            [newData.key_name]: Number(newData.value_amount)
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const hasQty = inputs.qty > 0;
    const hasDtfDim = mode === 'DTF' && inputs.width > 0 && inputs.length > 0;
    const hasManualColor = mode === 'MANUAL' && inputs.colors > 0;

    if (!hasQty || (mode === 'DTF' && !hasDtfDim) || (mode === 'MANUAL' && !hasManualColor)) {
        setFinalPrice(0);
        return;
    }

    let hppSablon = 0;
    
    const margin = (config.margin_percentage ?? 0) / 100; 
    const safeQty = inputs.qty > 0 ? inputs.qty : 1; 
    
    const costListrikLPG = config.cost_listrik_lpg ?? 0; 
    const costPenunjang = config.cost_bahan_penunjang ?? 0; 
    const costBonus = config.cost_bonus_stiker ?? 0; 
    
    const hppOperasionalTambahan = costListrikLPG + costPenunjang + costBonus;

    if (mode === 'DTF') {
      const area = inputs.width * inputs.length;
      
      const dtfPricePerCm = config.dtf_price_per_cm ?? 0; 
      const pressCost = config.dtf_press_cost ?? 0; 
      const dtfTintaCostPerCm = config.dtf_tinta_cost ?? 0; 
      const dtfPrintFilmCostPerPcs = config.cost_print_film ?? 0; 
      
      hppSablon = (area * dtfPricePerCm) + (area * dtfTintaCostPerCm) + pressCost + dtfPrintFilmCostPerPcs;
      
    } else {
      const screenCost = config.manual_screen_cost ?? 0; 
      const laborCost = config.manual_labor_cost ?? 0; 
      const finishCost = config.manual_finishing ?? 0; 
      const plastisolCostPerPcs = config.cost_plastisol_ink ?? 0; // ✅ DIPERBAIKI
      
      const totalSetupCost = screenCost * inputs.colors;
      const setupCostPerPcs = totalSetupCost / safeQty;
      
      hppSablon = setupCostPerPcs + laborCost + finishCost + plastisolCostPerPcs;
    }

    const totalHPP = inputs.kaosPrice + hppSablon + hppOperasionalTambahan;
    
    const sellingPrice = totalHPP + (totalHPP * margin);
    setFinalPrice(sellingPrice);
  }, [inputs, mode, config, loading]);

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

  if (loading) return <div className="flex h-full items-center justify-center text-gray-500 font-bold animate-pulse p-10">Menghubungkan ke Server...</div>;

  const showResult = finalPrice > 0;

  return (
    <div className="h-full bg-slate-50 flex flex-col md:flex-row rounded-xl overflow-hidden border border-slate-200">
      
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
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Lebar Desain (cm)</label><input type="text" inputMode="numeric" value={formatNumberDisplay(inputs.width)} onChange={(e) => handleInputChange(e, 'width')} className="w-full text-xl font-bold text-gray-900 border-gray-300 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-300" placeholder="0" /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Panjang Desain (cm)</label><input type="text" inputMode="numeric" value={formatNumberDisplay(inputs.length)} onChange={(e) => handleInputChange(e, 'length')} className="w-full text-xl font-bold text-gray-900 border-gray-300 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-300" placeholder="0" /></div>
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

      <div className={`md:w-1/3 p-6 md:p-10 flex flex-col justify-center border-t-4 md:border-t-0 md:border-l border-slate-700 transition-colors duration-300 ${showResult ? 'bg-slate-900 border-blue-500' : 'bg-slate-800 border-slate-600'}`}>
        <div className="max-w-sm mx-auto w-full">
          <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-widest">Rekomendasi Harga Jual</p>
          
          <div className={`text-4xl md:text-5xl font-extrabold mb-2 tracking-tight truncate transition-all duration-300 ${showResult ? 'text-white' : 'text-slate-600'}`}>
            {showResult ? formatResult(finalPrice) : 'Rp -'}
            <span className={`text-lg font-normal ml-1 ${showResult ? 'text-slate-400' : 'text-slate-700'}`}>/pcs</span>
          </div>

          {showResult ? (
            <div className="mt-6 space-y-3 border-t border-slate-700 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Total Omset</span><span className="font-bold text-white">{formatResult(finalPrice * inputs.qty)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Estimasi Margin</span><span className="font-bold text-green-400">+{config.margin_percentage ?? 0}%</span></div>
                
                <hr className="border-slate-700/50" />
                <div className="flex justify-between text-sm"><span className="text-slate-400">Listrik/LPG/Penunjang/Bonus</span><span className="font-bold text-yellow-400">{formatResult((config.cost_listrik_lpg ?? 0) + (config.cost_bahan_penunjang ?? 0) + (config.cost_bonus_stiker ?? 0))} /pcs</span></div>

                {mode === 'MANUAL' ? (
                    <>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Beban Screen/kaos</span><span className="font-bold text-yellow-400">{formatResult(((config.manual_screen_cost ?? 0) * inputs.colors) / (inputs.qty || 1))}</span></div>
                        
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Cost Tinta Plastisol</span><span className="font-bold text-yellow-400">{formatResult(config.cost_plastisol_ink ?? 0)} /pcs</span></div>
                        
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Cost Jasa Gesut & Finishing</span><span className="font-bold text-yellow-400">{formatResult((config.manual_labor_cost ?? 0) + (config.manual_finishing ?? 0))} /pcs</span></div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">HPP Tinta DTF/kaos</span><span className="font-bold text-yellow-400">{formatResult((inputs.width * inputs.length) * (config.dtf_tinta_cost ?? 0))}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Cost Print Film/kaos</span><span className="font-bold text-yellow-400">{formatResult(config.cost_print_film ?? 0)} /pcs</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Cost Cetak Dasar & Press</span><span className="font-bold text-yellow-400">{formatResult(((inputs.width * inputs.length) * (config.dtf_price_per_cm ?? 0)) + (config.dtf_press_cost ?? 0))} /pcs</span></div>
                    </>
                )}
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
                <p className="text-sm text-slate-500 italic">Silakan lengkapi input (Qty, Ukuran, atau Warna) untuk melihat estimasi harga.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}