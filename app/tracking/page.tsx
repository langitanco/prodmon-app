// app/tracking/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Loader2, AlertCircle, Package } from 'lucide-react';
import TrackingTimeline from './TrackingTimeline';

const smartFormat = (input: string): string => {
  const cleaned = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const match = cleaned.match(/^([A-Z]{3})(\d{2})(\d{2})(\d{4})$/);
  if (match) {
    const [, prefix, p1, p2, p3] = match;
    return `${prefix}-${p1}/${p2}-${p3}`;
  }
  return input.toUpperCase().trim();
};

// ─── Komponen inner (pakai useSearchParams di sini) ──────────────────────────

function TrackingPageInner() {
  const [searchCode, setSearchCode]   = useState('');
  const [result, setResult]           = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError]             = useState(false);

  const searchParams = useSearchParams();
  const didAutoSearch = useRef(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const doSearch = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setResult(null);
    setError(false);

    const formatted = smartFormat(code);

    // Coba formatted dulu, kalau tidak ketemu coba raw input
    let data = null;

    const { data: data1 } = await supabase
      .from('orders')
      .select(`
        kode_produksi, nama_pemesan, jumlah, jenis_produksi,
        status, tanggal_masuk, deadline,
        link_approval, steps_manual, steps_dtf,
        finishing_qc, finishing_packing, shipping
      `)
      .ilike('kode_produksi', formatted)
      .single();

    if (data1) {
      data = data1;
    } else {
      const { data: data2 } = await supabase
        .from('orders')
        .select(`
          kode_produksi, nama_pemesan, jumlah, jenis_produksi,
          status, tanggal_masuk, deadline,
          link_approval, steps_manual, steps_dtf,
          finishing_qc, finishing_packing, shipping
        `)
        .ilike('kode_produksi', code.trim())
        .single();

      if (data2) data = data2;
    }

    if (data) setResult(data);
    else setError(true);
    setLoading(false);
  };

  useEffect(() => {
    const kodeFromUrl = searchParams.get('kode');
    if (kodeFromUrl && !didAutoSearch.current) {
      didAutoSearch.current = true;
      // searchParams.get() sudah otomatis decode, jadi langsung pakai saja
      setSearchCode(kodeFromUrl);
      doSearch(kodeFromUrl);
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(searchCode);
  };

  const formatted   = searchCode ? smartFormat(searchCode) : '';
  const showPreview = searchCode.length >= 6 && formatted !== searchCode.toUpperCase().trim();

  const SearchForm = (
    <form onSubmit={handleSearch} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
          Kode produksi
        </label>
        <input
          type="text"
          placeholder="lco04260001 atau LCO-04/26-0001"
          className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition uppercase"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
        />
        {showPreview && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Akan dicari sebagai:{' '}
            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{formatted}</span>
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !searchCode.trim()}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Mencari...</>
          : <><Search className="w-4 h-4" /> Lacak pesanan</>
        }
      </button>
    </form>
  );

  const ResultArea = (
    <>
      {loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Mencari pesanan...</p>
        </div>
      )}
      {!loading && hasSearched && error && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Pesanan tidak ditemukan</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Periksa kembali kode produksi Anda</p>
          </div>
        </div>
      )}
      {!hasSearched && !loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Package className="w-6 h-6 text-slate-400 dark:text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Masukkan kode produksi</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Format bebas — sistem otomatis menyesuaikan</p>
          </div>
        </div>
      )}
      {!loading && result && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <TrackingTimeline result={result} />
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── MOBILE layout ── */}
      <div className="md:hidden flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="Langitan.co" className="h-8 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white leading-none">Langitan.co</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Tracking pesanan</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-4 shadow-sm">
            {SearchForm}
          </div>
          {ResultArea}
          <p className="text-center text-[11px] text-slate-300 dark:text-slate-700 mt-8">Langitan.co · Sistem Produksi</p>
        </div>
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:flex min-h-screen">
        <div className="w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="Langitan.co" className="h-8 w-auto object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white leading-none">Langitan.co</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Tracking pesanan</p>
              </div>
            </div>
            {SearchForm}
          </div>
          <div className="p-6 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Petunjuk</p>
            <ul className="space-y-2.5">
              {[
                'Masukkan kode produksi Anda',
                'Format bebas, sistem akan menyesuaikan otomatis',
                'Contoh: lco04260001 atau LCO-04/26-0001',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-300 dark:text-slate-700">Langitan.co · Sistem Produksi</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-2xl mx-auto px-8 py-10">
            {(loading || !result || (hasSearched && error)) && (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  {loading && (
                    <>
                      <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Mencari pesanan...</p>
                    </>
                  )}
                  {!loading && hasSearched && error && (
                    <>
                      <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-7 h-7 text-red-500 dark:text-red-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Pesanan tidak ditemukan</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Periksa kembali kode produksi Anda</p>
                    </>
                  )}
                  {!hasSearched && !loading && (
                    <>
                      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Package className="w-7 h-7 text-slate-400 dark:text-slate-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Masukkan kode produksi</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Hasil tracking akan muncul di sini</p>
                    </>
                  )}
                </div>
              </div>
            )}
            {!loading && result && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <TrackingTimeline result={result} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export default dibungkus Suspense ───────────────────────────────────────

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TrackingPageInner />
    </Suspense>
  );
}