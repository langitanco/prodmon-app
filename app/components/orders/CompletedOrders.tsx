'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Order } from '@/types'; 
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Archive, CheckCircle2, Package, Search, ChevronLeft, ChevronRight, ChevronDown, Check, Calendar } from 'lucide-react'; // Tambah Calendar icon
import { formatDate } from '@/lib/utils'; 

interface CompletedOrdersProps {
  orders: Order[];
}

// Helper nama bulan untuk dropdown
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function CompletedOrders({ orders }: CompletedOrdersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // STATE FILTER BULAN (BARU)
  const [selectedMonth, setSelectedMonth] = useState('all');

  // STATE PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 
  
  // STATE CUSTOM DROPDOWN
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const finishedOrders = useMemo(() => {
    let data = orders.filter(o => o.status === 'Selesai');
    
    // 1. Filter Pencarian
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(o => 
        o.nama_pemesan.toLowerCase().includes(lower) || 
        o.kode_produksi.toLowerCase().includes(lower)
      );
    }

    // 2. Filter Bulan (BARU)
    if (selectedMonth !== 'all') {
      const monthIndex = parseInt(selectedMonth);
      data = data.filter(o => {
        const date = new Date(o.deadline); // Menggunakan deadline sebagai acuan tanggal
        return date.getMonth() === monthIndex;
      });
    }

    return data.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
  }, [orders, searchTerm, selectedMonth]);

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const stats = useMemo(() => {
    return {
      totalOrder: finishedOrders.length,
      totalPcs: finishedOrders.reduce((acc, curr) => acc + curr.jumlah, 0),
    };
  }, [finishedOrders]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data: any[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthIdx = d.getMonth();
        const year = d.getFullYear();
        
        // Note: Chart ini akan mengikuti data hasil filter. 
        // Jadi jika bulan dipilih 'Januari', grafik bulan lain akan 0 (kecuali logic mau dibuat terpisah).
        // Disini saya biarkan mengikuti 'finishedOrders' agar konsisten dengan tabel.
        const count = finishedOrders.filter(o => {
            const date = new Date(o.deadline); 
            return date.getMonth() === monthIdx && date.getFullYear() === year;
        }).length;
        data.push({ name: months[monthIdx], selesai: count });
    }
    return data;
  }, [finishedOrders]);

  // PAGINATION LOGIC
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = finishedOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(finishedOrders.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="hidden md:block">
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Archive className="w-6 h-6 text-green-600" /> Arsip Produksi Selesai
           </h2>
           <p className="text-slate-500 text-sm">Rekapitulasi pesanan yang telah rampung</p>
        </div>
        
        {/* CONTAINER FILTER & SEARCH */}
        <div className="flex flex-row gap-2 w-full md:w-auto">
            
            {/* DROPDOWN FILTER BULAN (BARU) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                 <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none cursor-pointer h-full"
              >
                <option value="all">Semua Bulan</option>
                {MONTH_NAMES.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                 <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari nama / kode..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                />
            </div>
        </div>
      </div>

      {/* STATS & GRAFIK SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white p-3 md:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                  <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">Total Order</p>
                  <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 mt-1">{stats.totalOrder}</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold bg-green-100 text-green-700 mt-2">
                    <CheckCircle2 className="w-3 h-3" /> {selectedMonth !== 'all' ? MONTH_NAMES[parseInt(selectedMonth)] : 'All Time'}
                  </span>
              </div>
              <div className="absolute -right-2 -bottom-2 md:static md:p-3 md:bg-green-50 md:rounded-full md:text-green-600 opacity-20 md:opacity-100 transform scale-150 md:scale-100">
                  <CheckCircle2 className="w-10 h-10 md:w-6 md:h-6" />
              </div>
          </div>

          <div className="bg-white p-3 md:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                  <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pakaian</p>
                  <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 mt-1">{stats.totalPcs.toLocaleString('id-ID')}</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold bg-blue-100 text-blue-700 mt-2">
                    <Package className="w-3 h-3" /> Pcs
                  </span>
              </div>
              <div className="absolute -right-2 -bottom-2 md:static md:p-3 md:bg-blue-50 md:rounded-full md:text-blue-600 opacity-20 md:opacity-100 transform scale-150 md:scale-100">
                  <Package className="w-10 h-10 md:w-6 md:h-6" />
              </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-xs text-slate-500 font-bold mb-2">Tren {selectedMonth !== 'all' ? MONTH_NAMES[parseInt(selectedMonth)] : '6 Bulan Terakhir'}</p>
             <div className="h-[80px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', fontSize: '10px'}}
                            itemStyle={{color: '#059669', fontWeight: 'bold'}}
                        />
                        <Area type="monotone" dataKey="selesai" stroke="#10b981" fillOpacity={1} fill="url(#colorSelesai)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
      </div>

      {/* TABEL DATA - INTERNAL SCROLL & STICKY HEADER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* WRAPPER TABEL */}
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] min-h-[300px]"> 
          <table className="w-full text-left border-collapse whitespace-nowrap relative">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-wider">
                <th className="px-4 py-3 md:px-6 md:py-4 bg-slate-50">No. Order</th>
                <th className="px-4 py-3 md:px-6 md:py-4 bg-slate-50">Pemesan</th>
                <th className="px-4 py-3 md:px-6 md:py-4 bg-slate-50">Jenis Produksi</th>
                <th className="px-4 py-3 md:px-6 md:py-4 bg-slate-50 text-center">Jml (Pcs)</th>
                <th className="px-4 py-3 md:px-6 md:py-4 bg-slate-50">Tgl. Selesai (Est)</th>
                <th className="px-4 py-3 md:px-6 md:py-4 bg-slate-50 text-center">Status</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
              {currentItems.length > 0 ? (
                currentItems.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-slate-500">
                        #{order.kode_produksi}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 font-semibold text-slate-700">
                        {order.nama_pemesan}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4">
                        <span className="inline-block px-2 py-1 rounded border border-slate-200 text-[9px] md:text-[10px] font-bold text-slate-600 bg-slate-100 uppercase">
                            {order.jenis_produksi}
                        </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-center font-bold text-slate-700">
                        {order.jumlah}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500">
                        {formatDate(order.deadline)}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 md:px-3 rounded-full text-[10px] md:text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                             Selesai <CheckCircle2 className="w-3 h-3" />
                        </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-8 h-8 opacity-20" />
                        <p>
                          {selectedMonth !== 'all' 
                            ? `Tidak ada pesanan selesai di bulan ${MONTH_NAMES[parseInt(selectedMonth)]}.` 
                            : 'Belum ada data pesanan selesai yang ditemukan.'}
                        </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER TABEL */}
        <div className="bg-slate-50 px-4 py-3 md:px-6 md:py-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3 z-20 relative">
            
            {/* KIRI */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
               <div className="flex items-center gap-2 relative" ref={dropdownRef}>
                  <span className="text-[10px] md:text-xs text-slate-500 font-bold">Tampil:</span>
                  
                  {/* CUSTOM DROPDOWN */}
                  <div className="relative">
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 text-[10px] md:text-xs rounded-lg px-3 py-1.5 hover:bg-slate-50 transition min-w-[90px] justify-between"
                    >
                        <span>{itemsPerPage} Baris</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            {[10, 20, 50].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        setItemsPerPage(num);
                                        setCurrentPage(1);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-[10px] md:text-xs hover:bg-slate-50 flex items-center justify-between ${itemsPerPage === num ? 'font-bold text-blue-600 bg-blue-50' : 'text-slate-600'}`}
                                >
                                    {num}
                                    {itemsPerPage === num && <Check className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
               </div>
               
               <p className="text-[10px] md:text-xs text-slate-500">
                  Hal <span className="font-bold">{currentPage}</span> dari <span className="font-bold">{totalPages}</span>
               </p>
            </div>

            {/* KANAN */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
                <button
                   onClick={handlePrevPage}
                   disabled={currentPage === 1}
                   className="p-1.5 md:p-2 rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                   <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-[10px] md:text-xs font-bold text-slate-500 px-2">
                   {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, finishedOrders.length)} dari {finishedOrders.length}
                </div>
                <button
                   onClick={handleNextPage}
                   disabled={currentPage === totalPages || totalPages === 0}
                   className="p-1.5 md:p-2 rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                   <ChevronRight className="w-4 h-4" />
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}