'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Info } from 'lucide-react';

export default function CalculatorView() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>({});
  const [addons, setAddons] = useState<any[]>([]); 
  
  const [mode, setMode] = useState('DTF');
  const [finalPrice, setFinalPrice] = useState(0);
  const [laborDetails, setLaborDetails] = useState({ gesut: 0, packing: 0 });

  const [inputs, setInputs] = useState({
    qty: 0, width: 0, length: 0,
    colorsSmall: 0, colorsMedium: 0, colorsLarge: 0,
    kaosPrice: 0,
  });

  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);

  // 1. FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      const { data: configData } = await supabase.from('pricing_configs').select('key_name, value_amount');
      if (configData) {
        const configMap = configData.reduce((acc: any, item: any) => {
          acc[item.key_name] = Number(item.value_amount);
          return acc;
        }, {});
        setConfig(configMap);
      }
      const { data: addonData } = await supabase.from('product_addons').select('*').eq('is_active', true).order('name', { ascending: true });
      if (addonData) setAddons(addonData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleAddon = (id: number) => {
    setSelectedAddonIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // 3. KALKULASI UTAMA
  useEffect(() => {
    if (loading) return;
    const hasQty = inputs.qty > 0;
    const hasDtfDim = mode === 'DTF' && inputs.width > 0 && inputs.length > 0;
    const hasManualColor = mode === 'MANUAL' && (inputs.colorsSmall > 0 || inputs.colorsMedium > 0 || inputs.colorsLarge > 0);

    if (!hasQty || (mode === 'DTF' && !hasDtfDim) || (mode === 'MANUAL' && !hasManualColor)) {
        setFinalPrice(0); setLaborDetails({ gesut: 0, packing: 0 }); return;
    }

    let hppSablon = 0;
    const margin = (config.margin_percentage ?? 0) / 100; 
    const safeQty = inputs.qty > 0 ? inputs.qty : 1; 
    const costListrikLPG = config.cost_listrik_lpg ?? 0; 
    const costPenunjang = config.cost_bahan_penunjang ?? 0; 
    
    const totalBonusCost = selectedAddonIds.reduce((total, id) => {
        const item = addons.find(a => a.id === id);
        return total + (item ? Number(item.cost) : 0);
    }, 0);

    const hppOperasionalTotal = costListrikLPG + costPenunjang + totalBonusCost;
    let currentGesutCost = 0; let currentPackingCost = 0;

    if (mode === 'DTF') {
      const area = inputs.width * inputs.length;
      const dtfPricePerCm = config.dtf_price_per_cm ?? 0; 
      const pressCost = config.dtf_press_cost ?? 0; 
      const dtfTintaCostPerCm = config.dtf_tinta_cost ?? 0; 
      const dtfPrintFilmCostPerPcs = config.cost_print_film ?? 0; 
      
      hppSablon = (area * dtfPricePerCm) + (area * dtfTintaCostPerCm) + pressCost + dtfPrintFilmCostPerPcs;
      currentGesutCost = pressCost; 
    } else {
      // MANUAL Calculation
      const paySmall = inputs.colorsSmall * (config.gesut_manual_kecil ?? 0);
      const payMedium = inputs.colorsMedium * (config.gesut_manual_sedang ?? 0);
      const payLarge = inputs.colorsLarge * (config.gesut_manual_besar ?? 0);
      const totalGesutPay = paySmall + payMedium + payLarge;

      const totalColors = inputs.colorsSmall + inputs.colorsMedium + inputs.colorsLarge;
      const screenCost = config.manual_screen_cost ?? 0; 
      const totalSetupCost = screenCost * totalColors;
      const setupCostPerPcs = totalSetupCost / safeQty;
      
      const finishCost = config.manual_finishing ?? 0; 
      const plastisolCostPerPcs = config.cost_plastisol_ink ?? 0; 

      currentGesutCost = totalGesutPay; currentPackingCost = finishCost;
      hppSablon = setupCostPerPcs + totalGesutPay + finishCost + plastisolCostPerPcs;
    }

    setLaborDetails({ gesut: currentGesutCost, packing: currentPackingCost });
    const totalHPP = inputs.kaosPrice + hppSablon + hppOperasionalTotal;
    setFinalPrice(totalHPP + (totalHPP * margin));
  }, [inputs, mode, config, loading, selectedAddonIds, addons]);

  const formatRupiahDisplay = (num: number) => !num ? '' : 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const formatNumberDisplay = (num: number) => !num ? '' : num.toString();
  const handleInputChange = (e: any, field: string) => { const rawValue = e.target.value.replace(/\D/g, ''); setInputs((prev) => ({ ...prev, [field]: Number(rawValue) })); };
  const formatResult = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  if (loading) return (<div className="flex flex-col items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div></div>);

  const showResult = finalPrice > 0;
  const currentTotalBonus = selectedAddonIds.reduce((total, id) => { const item = addons.find(a => a.id === id); return total + (item ? Number(item.cost) : 0); }, 0);
  const totalManualColors = inputs.colorsSmall + inputs.colorsMedium + inputs.colorsLarge;

  return (
    <div className="h-full bg-slate-50 flex flex-col md:flex-row rounded-xl overflow-hidden border border-slate-200">
      
      {/* PANEL KIRI: INPUT */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-40 md:pb-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold text-slate-800">Kalkulator Produksi</h2>
             <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse font-bold">● Live</span>
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
            
            {mode === 'DTF' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Lebar Desain (cm)</label>
                    <input type="text" inputMode="numeric" value={formatNumberDisplay(inputs.width)} onChange={(e) => handleInputChange(e, 'width')} className="w-full text-xl font-bold text-gray-900 border-gray-300 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-300" placeholder="0" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Panjang Desain (cm)</label>
                    <input type="text" inputMode="numeric" value={formatNumberDisplay(inputs.length)} onChange={(e) => handleInputChange(e, 'length')} className="w-full text-xl font-bold text-gray-900 border-gray-300 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-300" placeholder="0" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-blue-500"/>
                        <span className="text-xs font-bold text-slate-700 uppercase">Detail Warna & Area</span>
                    </div>
                    
                    {/* Grid 3 Kolom */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 text-left truncate">KECIL (Logo/Label)</label>
                            <input type="text" inputMode="numeric" value={formatNumberDisplay(inputs.colorsSmall)} onChange={(e) => handleInputChange(e, 'colorsSmall')} className="w-full font-bold text-slate-900 border-slate-300 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 text-left truncate">SEDANG (A4)</label>
                            <input type="text" inputMode="numeric" value={formatNumberDisplay(inputs.colorsMedium)} onChange={(e) => handleInputChange(e, 'colorsMedium')} className="w-full font-bold text-slate-900 border-slate-300 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 text-left truncate">BESAR (A3/Blok)</label>
                            <input type="text" inputMode="numeric" value={formatNumberDisplay(inputs.colorsLarge)} onChange={(e) => handleInputChange(e, 'colorsLarge')} className="w-full font-bold text-slate-900 border-slate-300 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center" placeholder="0" />
                        </div>
                    </div>
                    <div className="h-2"></div>
                  </div>
              </div>
            )}

            <hr className="border-dashed border-gray-200" />

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Tambahan / Bonus (Checklist)</label>
                <div className="grid grid-cols-1 gap-2">
                    {addons.length === 0 ? <p className="text-sm text-gray-400 italic">Tidak ada opsi bonus aktif.</p> : addons.map((addon) => (
                        <label key={addon.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedAddonIds.includes(addon.id) ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" checked={selectedAddonIds.includes(addon.id)} onChange={() => toggleAddon(addon.id)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"/>
                                <span className={`font-medium text-sm ${selectedAddonIds.includes(addon.id) ? 'text-blue-900' : 'text-gray-700'}`}>{addon.name}</span>
                            </div>
                            <span className="text-xs font-mono text-gray-500 font-bold">+Rp {Number(addon.cost).toLocaleString('id-ID')}</span>
                        </label>
                    ))}
                </div>
            </div>

          </div>
        </div>
      </div>

      {/* PANEL KANAN: HASIL */}
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
                
                <div className="flex justify-between text-sm"><span className="text-slate-400">Listrik/LPG & Penunjang</span><span className="font-bold text-yellow-400">{formatResult((config.cost_listrik_lpg ?? 0) + (config.cost_bahan_penunjang ?? 0))} /pcs</span></div>
                {currentTotalBonus > 0 && (<div className="flex justify-between text-sm"><span className="text-slate-400">Total Bonus</span><span className="font-bold text-orange-400">+{formatResult(currentTotalBonus)} /pcs</span></div>)}

                {mode === 'MANUAL' ? (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Total Warna ({totalManualColors})</span>
                            {/* UPDATE: Menampilkan Total Uang Upah Gesut */}
                            <span className="font-bold text-white">{formatResult(laborDetails.gesut)} <span className="text-[10px] text-slate-500 font-normal">/pcs</span></span>
                        </div>
                        
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Beban Screen/kaos</span><span className="font-bold text-yellow-400">{formatResult(((config.manual_screen_cost ?? 0) * totalManualColors) / (inputs.qty || 1))}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Cost Tinta & SDM</span><span className="font-bold text-yellow-400">{formatResult((config.cost_plastisol_ink ?? 0) + laborDetails.gesut + laborDetails.packing)} /pcs</span></div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">HPP Tinta & Film</span><span className="font-bold text-yellow-400">{formatResult(((inputs.width * inputs.length) * (config.dtf_tinta_cost ?? 0)) + (config.cost_print_film ?? 0))}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Cost Cetak & Press</span><span className="font-bold text-yellow-400">{formatResult(((inputs.width * inputs.length) * (config.dtf_price_per_cm ?? 0)) + (config.dtf_press_cost ?? 0))} /pcs</span></div>
                    </>
                )}
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t border-slate-700/50"><p className="text-sm text-slate-500 italic">Silakan lengkapi input (Qty, Ukuran, atau Warna) untuk melihat estimasi harga.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}