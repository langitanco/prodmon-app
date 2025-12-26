// app/components/apps/ActivityLogView.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Activity, AlertTriangle, FileText, CheckCircle, Clock, Search, Filter, 
  ChevronLeft, ChevronRight, ChevronDown, Check, Package
} from 'lucide-react';

export default function ActivityLogView() {
  // --- STATE DATA ---
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE FILTER & SEARCH ---
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchLogs();
  }, []);

  // Reset halaman ke 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory]);

  // Tutup dropdown pagination jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    // Ambil 1000 log terakhir
    const { data, error } = await supabase
      .from('order_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000); 

    if (data) setLogs(data);
    setLoading(false);
  };

  // --- LOGIKA FILTER & PAGINATION ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchCat = filterCategory === 'ALL' || log.category === filterCategory;
      const matchSearch = 
        log.kode_produksi?.toLowerCase().includes(search.toLowerCase()) ||
        log.event_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.description?.toLowerCase().includes(search.toLowerCase()) ||
        log.oleh?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [logs, filterCategory, search]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // --- STATISTIK ---
  const stats = useMemo(() => {
    return {
      total: logs.length,
      kendala: logs.filter(l => l.category === 'KENDALA').length,
      revisi: logs.filter(l => l.category === 'REVISI').length,
      files: logs.filter(l => l.category === 'FILE').length,
    };
  }, [logs]);

  // Warna Badge Kategori
  const getBadgeColor = (cat: string) => {
    switch (cat) {
      case 'STATUS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'FILE': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'KENDALA': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'QC': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'REVISI': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
    }
  };

  return (
    <div className="space-y-6 pb-10 transition-colors duration-300 animate-fade-in">
      
      {/* HEADER & CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* JUDUL */}
        <div className="hidden md:block">
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Activity className="w-6 h-6 text-blue-600 dark:text-blue-500" /> Log Aktivitas & R&D
           </h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm">Rekam jejak seluruh aktivitas produksi</p>
        </div>
        
        {/* CONTROL BAR (FILTER & SEARCH) */}
        <div className="grid grid-cols-2 gap-3 md:flex md:flex-row w-full md:w-auto h-10">
            
            {/* FILTER KATEGORI */}
            <div className="relative h-full w-full">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                 <Filter className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-full w-full pl-9 pr-8 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-slate-200 appearance-none cursor-pointer"
              >
                <option value="ALL">Filter</option>
                <option value="STATUS">Status</option>
                <option value="FILE">File</option>
                <option value="KENDALA">Kendala</option>
                <option value="QC">QC</option>
                <option value="REVISI">Revisi</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                 <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative h-full w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Pencarian" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-full w-full pl-9 pr-4 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                />
            </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          
          {/* Card 1: Total Aktivitas */}
          <div className="bg-white dark:bg-slate-900 p-3 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden min-h-[100px]">
              <div className="absolute -right-2 -bottom-2 md:static md:p-3 md:bg-blue-50 dark:md:bg-blue-900/20 md:rounded-lg md:text-blue-600 dark:md:text-blue-500 opacity-20 md:opacity-100 transform scale-150 md:scale-100 order-last md:order-first">
                  <Activity className="w-10 h-10 md:w-6 md:h-6" />
              </div>
              <div className="relative z-10">
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Log</p>
                  <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.total}</h3>
              </div>
          </div>

          {/* Card 2: Kendala */}
          <div className="bg-white dark:bg-slate-900 p-3 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden min-h-[100px]">
              <div className="absolute -right-2 -bottom-2 md:static md:p-3 md:bg-red-50 dark:md:bg-red-900/20 md:rounded-lg md:text-red-600 dark:md:text-red-500 opacity-20 md:opacity-100 transform scale-150 md:scale-100 order-last md:order-first">
                  <AlertTriangle className="w-10 h-10 md:w-6 md:h-6" />
              </div>
              <div className="relative z-10">
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Kendala</p>
                  <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.kendala}</h3>
              </div>
          </div>

          {/* Card 3: Revisi */}
          <div className="bg-white dark:bg-slate-900 p-3 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden min-h-[100px]">
              <div className="absolute -right-2 -bottom-2 md:static md:p-3 md:bg-yellow-50 dark:md:bg-yellow-900/20 md:rounded-lg md:text-yellow-600 dark:md:text-yellow-500 opacity-20 md:opacity-100 transform scale-150 md:scale-100 order-last md:order-first">
                  <FileText className="w-10 h-10 md:w-6 md:h-6" />
              </div>
              <div className="relative z-10">
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Revisi</p>
                  <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.revisi}</h3>
              </div>
          </div>

          {/* Card 4: File Upload */}
          <div className="bg-white dark:bg-slate-900 p-3 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden min-h-[100px]">
              <div className="absolute -right-2 -bottom-2 md:static md:p-3 md:bg-purple-50 dark:md:bg-purple-900/20 md:rounded-lg md:text-purple-600 dark:md:text-purple-500 opacity-20 md:opacity-100 transform scale-150 md:scale-100 order-last md:order-first">
                  <CheckCircle className="w-10 h-10 md:w-6 md:h-6" />
              </div>
              <div className="relative z-10">
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">File Upload</p>
                  <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.files}</h3>
              </div>
          </div>

      </div>

      {/* TABEL DATA */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] min-h-[300px] custom-scrollbar relative"> 
          <table className="w-full text-left border-collapse whitespace-nowrap">
            {/* STICKY HEADER */}
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                <th className="px-4 py-3 md:px-6 md:py-4 bg-inherit">Waktu</th>
                <th className="px-4 py-3 md:px-6 md:py-4 bg-inherit">Order ID</th>
                <th className="px-4 py-3 md:px-6 md:py-4 bg-inherit">Kategori</th>
                <th className="px-4 py-3 md:px-6 md:py-4 bg-inherit">Kejadian</th>
                <th className="px-4 py-3 md:px-6 md:py-4 bg-inherit">Keterangan</th>
                <th className="px-4 py-3 md:px-6 md:py-4 bg-inherit">Oleh</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs md:text-sm">
              {loading ? (
                 // 🟢 FIX LOADING STATE CENTER: Menggunakan teknik sticky yang sama dengan empty state
                 <tr>
                    <td colSpan={6} className="p-0 border-none">
                      <div className="sticky left-0 w-[calc(100vw-2rem)] md:w-full min-h-[300px] flex flex-col items-center justify-center gap-3 px-4">
                          <Activity className="w-10 h-10 animate-pulse text-blue-500 dark:text-blue-400" />
                          <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data log...</p>
                      </div>
                    </td>
                 </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="opacity-70" />
                        {new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 font-semibold text-slate-700 dark:text-slate-200">
                        {log.kode_produksi || '-'}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4">
                        <span className={`inline-block px-2 py-1 rounded border text-[9px] md:text-[10px] font-bold uppercase ${getBadgeColor(log.category)}`}>
                            {log.category}
                        </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-slate-800 dark:text-slate-100">
                        {log.event_name}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={log.description}>
                        {log.description}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                             {log.oleh?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{log.oleh}</span>
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                // 🟢 EMPTY STATE: SELALU DI TENGAH VISUAL HP
                <tr>
                  <td colSpan={6} className="p-0 border-none">
                    <div className="sticky left-0 w-[calc(100vw-2rem)] md:w-full min-h-[300px] flex flex-col items-center justify-center gap-3 px-4">
                        <Package className="w-12 h-12 opacity-20 text-slate-600 dark:text-slate-400" />
                        <div className="text-center">
                            <p className="text-slate-600 dark:text-slate-400 font-medium">Tidak ada data log yang ditemukan.</p>
                            {filterCategory !== 'ALL' && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Coba ubah filter kategori atau pencarian.</p>
                            )}
                        </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER PAGINATION */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 md:px-6 md:py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-3 z-20 relative">
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
               <div className="flex items-center gap-2 relative" ref={dropdownRef}>
                  <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold">Tampil:</span>
                  <div className="relative">
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] md:text-xs rounded-lg px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition min-w-[90px] justify-between h-8"
                    >
                        <span>{itemsPerPage} Baris</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            {[10, 25, 50, 100].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        setItemsPerPage(num);
                                        setCurrentPage(1);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-[10px] md:text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between ${itemsPerPage === num ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-600 dark:text-slate-400'}`}
                                >
                                    {num}
                                    {itemsPerPage === num && <Check className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
               </div>
               
               <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                  Hal <span className="font-bold text-slate-700 dark:text-slate-200">{currentPage}</span> dari <span className="font-bold text-slate-700 dark:text-slate-200">{totalPages}</span>
               </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
                <button
                   onClick={handlePrevPage}
                   disabled={currentPage === 1}
                   className="p-1.5 md:p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                   <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 px-2 whitespace-nowrap">
                   {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredLogs.length)} dari {filteredLogs.length}
                </div>
                <button
                   onClick={handleNextPage}
                   disabled={currentPage === totalPages || totalPages === 0}
                   className="p-1.5 md:p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                   <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}