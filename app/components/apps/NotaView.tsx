// app/components/apps/NotaView.tsx
'use client';

import React, { useState, useRef } from 'react';
import { toJpeg } from 'html-to-image'; // UPDATE: Menggunakan toJpeg untuk kompresi ukuran file
import jsPDF from 'jspdf';
import { Download, Plus, Trash2, Receipt } from 'lucide-react';

export default function NotaView() {
  const notaRef = useRef<HTMLDivElement>(null);
  
  // State Management
  const [kategori, setKategori] = useState('CSTM');
  const [noUrut, setNoUrut] = useState('');
  const [pelanggan, setPelanggan] = useState({ nama: '', telepon: '', alamat: '' });
  const [items, setItems] = useState([{ id: 1, nama: '', harga: 0, qty: 1 }]);
  const [dpAmount, setDpAmount] = useState<number>(0);
  const [isLunas, setIsLunas] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-generate Nomor Nota dengan Tahun (YYMMDD)
  const today = new Date();
  const yy = today.getFullYear().toString().slice(-2);
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`; 
  const formattedNoUrut = noUrut ? String(noUrut).padStart(4, '0') : '0000';
  const nomorNota = `${kategori}-${dateStr}-${formattedNoUrut}`;
  
  const tanggalCetak = today.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Kalkulasi
  const grandTotal = items.reduce((total, item) => total + (item.harga * item.qty), 0);
  const sisaPembayaran = grandTotal - dpAmount;

  // Format Rupiah untuk tampilan teks Nota (dengan Rp)
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // Fungsi Helper untuk Auto-Format Rupiah di Input Form
  const formatRupiahInput = (value: string) => {
    const numberString = value.replace(/[^,\d]/g, '').toString();
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? '.' : '';
      rupiah += separator + ribuan.join('.');
    }
    return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
  };

  const parseRupiahInput = (value: string) => {
    const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), nama: '', harga: 0, qty: 1 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleChangeItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDownloadPDF = async () => {
    if (!notaRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 150)); 
      
      // UPDATE: Rendering gambar menggunakan JPEG dengan pixelRatio 2 dan Quality 85% untuk meringankan ukuran file (< 1MB)
      const dataUrl = await toJpeg(notaRef.current, { 
          pixelRatio: 3, 
          quality: 1,
          cacheBust: true,
          backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [107.5, 165]
      });

      // UPDATE: Tambahkan ke PDF sebagai JPEG
      pdf.addImage(dataUrl, 'JPEG', 0, 0, 107.5, 165);
      
      // UPDATE: Format nama file (Tidak merubah spasi pada nama menjadi underscore)
      const fileName = pelanggan.nama ? `Nota ${nomorNota} ${pelanggan.nama}.pdf` : `Nota_${nomorNota}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Gagal membuat PDF:', error);
      alert('Terjadi kesalahan saat mengekspor PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      
      {/* ============================== */}
      {/* PANEL KIRI: FORM INPUT         */}
      {/* ============================== */}
      <div className="w-full lg:w-1/2 flex flex-col border-r border-slate-200 dark:border-slate-800 h-full max-h-[calc(100vh-100px)]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#1b5e4a] dark:text-emerald-500" />
            <h2 className="font-bold text-slate-800 dark:text-white">Form Generator Nota</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
            {/* Seksi Penomoran */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Penomoran Nota</h3>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                    <select 
                        className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-[#1b5e4a]"
                        value={kategori}
                        onChange={(e) => setKategori(e.target.value)}
                    >
                        <option value="CSTM">Custom (CSTM)</option>
                        <option value="DTF">Print (DTF)</option>
                        <option value="SBLN">Sablon (SBLN)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">No Urut Hari Ini</label>
                    <input 
                        type="number" 
                        className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-[#1b5e4a]"
                        value={noUrut}
                        onChange={(e) => setNoUrut(e.target.value)}
                        placeholder="Contoh: 12"
                    />
                </div>
                </div>
            </div>

            {/* Seksi Pelanggan */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Data Pelanggan</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Pemesan</label>
                    <input type="text" className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-900" value={pelanggan.nama} onChange={(e) => setPelanggan({...pelanggan, nama: e.target.value})} placeholder="Nama Lengkap"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">No. WhatsApp / Telepon</label>
                    <input type="text" className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-900" value={pelanggan.telepon} onChange={(e) => setPelanggan({...pelanggan, telepon: e.target.value})} placeholder="08..."/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat (Opsional)</label>
                    <textarea className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-900 resize-none h-16" value={pelanggan.alamat} onChange={(e) => setPelanggan({...pelanggan, alamat: e.target.value})} placeholder="Detail alamat pengiriman..."/>
                </div>
            </div>

            {/* Seksi Barang */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Detail Pesanan</h3>
                    <button onClick={handleAddItem} className="flex items-center gap-1 text-[10px] font-bold bg-[#1b5e4a] text-white px-2 py-1 rounded hover:bg-[#144939] transition">
                        <Plus className="w-3 h-3"/> Tambah Baris
                    </button>
                </div>
                
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-start bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                            <div className="flex-1 space-y-2">
                                <input type="text" className="w-full text-xs border border-slate-300 dark:border-slate-600 rounded p-1.5 bg-transparent" placeholder="Nama Barang" value={item.nama} onChange={(e) => handleChangeItem(item.id, 'nama', e.target.value)} />
                                <div className="flex gap-2">
                                    <input type="number" className="w-1/4 text-xs border border-slate-300 dark:border-slate-600 rounded p-1.5 bg-transparent" placeholder="Qty" value={item.qty || ''} onChange={(e) => handleChangeItem(item.id, 'qty', parseInt(e.target.value) || 0)} />
                                    <input 
                                        type="text" 
                                        className="w-3/4 text-xs border border-slate-300 dark:border-slate-600 rounded p-1.5 bg-transparent font-medium text-gray-800 dark:text-gray-100" 
                                        placeholder="Harga Satuan (Rp)" 
                                        value={item.harga === 0 ? '' : formatRupiahInput(item.harga.toString())} 
                                        onChange={(e) => handleChangeItem(item.id, 'harga', parseRupiahInput(e.target.value))} 
                                    />
                                </div>
                            </div>
                            <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded mt-1">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Seksi Pembayaran (DP) */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Pembayaran</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sudah Bayar / DP (Rp)</label>
                    <input 
                        type="text" 
                        className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-[#1b5e4a] font-medium"
                        value={dpAmount === 0 ? '' : formatRupiahInput(dpAmount.toString())}
                        onChange={(e) => setDpAmount(parseRupiahInput(e.target.value))}
                        placeholder="Kosongkan jika belum bayar"
                    />
                </div>
            </div>

        </div>

        {/* Action Bottom */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
            <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    className="w-4 h-4 text-[#1b5e4a] rounded border-gray-300"
                    checked={isLunas}
                    onChange={(e) => setIsLunas(e.target.checked)}
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Tandai Lunas</span>
            </label>
            <button 
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-[#1b5e4a] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#144939] transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
                {isGenerating ? 'Memproses...' : <><Download className="w-4 h-4" /> Export PDF</>}
            </button>
        </div>
      </div>

      {/* ============================== */}
      {/* PANEL KANAN: LIVE PREVIEW      */}
      {/* ============================== */}
      <div className="w-full lg:w-1/2 bg-slate-200 dark:bg-slate-950 p-4 md:p-8 flex justify-center items-start overflow-y-auto min-h-[500px]">
        {/* Container Kustom 107.5mm x 165mm */}
        <div 
          ref={notaRef}
          className="bg-white shadow-xl relative text-black"
          style={{ 
            width: '107.5mm', 
            height: '165mm',
            boxSizing: 'border-box'
          }}
        >
          {/* HEADER GAMBAR */}
          <div className="w-full h-[21.5mm] overflow-hidden mb-5">
             <img 
                 src="/header-nota.png" 
                 alt="Header Langitan" 
                 className="w-full h-full object-cover" 
                 crossOrigin="anonymous"
                 onError={(e) => {
                     (e.target as HTMLImageElement).src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
                 }}
             />
          </div>

          {/* Area Konten */}
          <div style={{ padding: '0 6mm' }}>
            
            {/* 1. Info Pelanggan & No Nota (Bersebelahan & Sesuai Desain Baru) */}
            <div className="flex justify-between items-start mb-4 mt-2">
               
               {/* Kiri: Kepada & Detail Pelanggan (Tanpa Label, Font Disesuaikan) */}
               <div className="w-[50%] flex flex-col">
                   <span className="text-[9px] text-gray-800 mb-0.5">Kepada :</span>
                   <span className="text-[11.5px] font-bold text-gray-900 leading-tight">
                       {pelanggan.nama || '...........................................'}
                   </span>
                   {pelanggan.telepon && (
                       <span className="text-[9px] text-gray-800 mt-0.5 leading-tight">
                           {pelanggan.telepon}
                       </span>
                   )}
                   {pelanggan.alamat && (
                       <span className="text-[9px] italic text-gray-800 mt-0.5 leading-tight">
                           {pelanggan.alamat}
                       </span>
                   )}
               </div>
               
               {/* Kanan: No Nota & Tanggal (Tabel Kanan Lebar Ditambah agar tidak wrap) */}
               <div className="w-[50%] flex justify-end mt-0.5">
                   <table className="w-auto text-[9px] border-collapse">
                      <tbody>
                          <tr>
                              <td className="text-gray-800 align-top pr-2">No Nota</td>
                              <td className="text-gray-800 align-top pr-1">:</td>
                              <td className="font-medium text-gray-900 align-top whitespace-nowrap">{nomorNota}</td>
                          </tr>
                          <tr>
                              <td className="text-gray-800 align-top pr-2">Tanggal</td>
                              <td className="text-gray-800 align-top pr-1">:</td>
                              <td className="font-medium text-gray-900 align-top whitespace-nowrap">{tanggalCetak}</td>
                          </tr>
                      </tbody>
                   </table>
               </div>
            </div>

            {/* 2 & 3. Tabel Barang & Kalkulasi */}
            <div className="min-h-[45mm]">
              <table className="w-full mb-0 border-collapse">
                <thead>
                    <tr className="bg-[#1b5e4a] text-white text-[9px]">
                        <th className="py-1 px-1 text-left border border-[#1b5e4a]">Nama Barang / Deskripsi</th>
                        <th className="py-1 px-1 text-center border border-[#1b5e4a] w-8">Qty</th>
                        <th className="py-1 px-1 text-right border border-[#1b5e4a] w-16">Harga</th>
                        <th className="py-1 px-1 text-right border border-[#1b5e4a] w-20">Subtotal</th>
                    </tr>
                </thead>
                <tbody className="text-[9px]">
                    {items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-300">
                            <td className="py-1 px-1 border-x border-gray-300 text-gray-800">{item.nama || '-'}</td>
                            <td className="py-1 px-1 border-x border-gray-300 text-center text-gray-800">{item.qty}</td>
                            <td className="py-1 px-1 border-x border-gray-300 text-right text-gray-800">{formatRupiah(item.harga)}</td>
                            <td className="py-1 px-1 border-x border-gray-300 text-right text-gray-800">{formatRupiah(item.harga * item.qty)}</td>
                        </tr>
                    ))}
                </tbody>
              </table>

              {/* Area Kalkulasi (Grand Total & DP) - Langsung menempel pas di bawah tabel */}
              <div className="flex justify-end mt-1">
                  <table className="w-[60%] text-[9px] border-collapse">
                      <tbody>
                          <tr className="bg-gray-100 font-bold border-y-2 border-[#1b5e4a]">
                              <td className="py-1.5 px-2 text-right text-[#1b5e4a]">GRAND TOTAL:</td>
                              <td className="py-1.5 px-2 text-right text-[#1b5e4a] w-20">{formatRupiah(grandTotal)}</td>
                          </tr>
                          {dpAmount > 0 && (
                              <tr className="border-b border-gray-300">
                                  <td className="py-1 px-2 text-right text-gray-600">DP / Bayar:</td>
                                  <td className="py-1 px-2 text-right text-gray-800">{formatRupiah(dpAmount)}</td>
                              </tr>
                          )}
                          {dpAmount > 0 && (
                              <tr className="border-b border-gray-300 font-bold bg-red-50">
                                  <td className="py-1 px-2 text-right text-red-600">SISA:</td>
                                  <td className="py-1 px-2 text-right text-red-600">{formatRupiah(sisaPembayaran)}</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
            </div>

          </div>

          {/* 4. Footer & Signature - Selalu mengunci di bawah (Absolute Position) */}
          <div className="absolute bottom-[6mm] left-[6mm] right-[6mm] flex justify-between items-end">
            <div className="w-[55%]">
                <p className="text-[9px] font-bold text-gray-800 mb-1">Syarat & Ketentuan:</p>
                <p className="text-[8px] italic text-gray-600 leading-tight">Barang yang sudah dibeli tidak bisa dikembalikan kecuali sebelumnya terdapat perjanjian.</p>
            </div>
            
            {/* Area Hormat Kami */}
            <div className="w-[40%] text-center relative z-10">
                <p className="text-[9px] text-gray-800">Hormat Kami,</p>
                
                {/* Area celah kosong (Tanda Tangan) / Stempel Lunas ditaruh di sini */}
                <div className="h-12 relative flex items-center justify-center">
                    {isLunas && (
                        <div className="transform -rotate-12 opacity-50 pointer-events-none">
                            <div className="border-[2px] border-red-600 text-red-600 rounded p-1 bg-white/70 backdrop-blur-sm">
                                <span className="text-xl font-black tracking-widest block text-center">LUNAS</span>
                            </div>
                        </div>
                    )}
                </div>
                
                <p className="text-[9px] font-bold text-gray-800 border-t border-gray-400 pt-1">Admin Langitan.co</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}