// app/components/apps/WeeklyNotesView.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { BookOpen, ChevronDown, ChevronUp, Loader2, MessageSquare } from 'lucide-react';

interface ProductionNote {
  id: string;
  order_id: string;
  kode_produksi: string;
  nama_pemesan: string;
  content: string;
  section: string;
  created_by_name: string;
  created_at: string;
}

interface OrderNotes {
  order_id: string;
  kode_produksi: string;
  nama_pemesan: string;
  sections: {
    produksi: ProductionNote[];
    finishing: ProductionNote[];
    pengiriman: ProductionNote[];
  };
}

const SECTION_LABELS: Record<string, string> = {
  produksi:   'Produksi',
  finishing:  'QC & Finishing',
  pengiriman: 'Pengiriman',
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

// ─── Komponen: satu baris section ────────────────────────────────────────────

function SectionRow({ label, notes }: { label: string; notes: ProductionNote[] }) {
  return (
    <div className="py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      {notes.length === 0 ? (
        <p className="text-xs text-slate-300 dark:text-slate-700 italic">Tidak ada catatan</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2 border-l-2 border-slate-200 dark:border-slate-700"
            >
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {note.content}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {note.created_by_name} · {formatTime(note.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Komponen: card satu pesanan ─────────────────────────────────────────────

function OrderCard({ orderNotes }: { orderNotes: OrderNotes }) {
  const [expanded, setExpanded] = useState(true);

  const totalNotes =
    orderNotes.sections.produksi.length +
    orderNotes.sections.finishing.length +
    orderNotes.sections.pengiriman.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header pesanan */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <div className="flex items-center gap-3 text-left">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
              {orderNotes.nama_pemesan}
            </p>
            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
              #{orderNotes.kode_produksi}
            </p>
          </div>
          {totalNotes > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              {totalNotes} catatan
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        }
      </button>

      {/* Body section */}
      {expanded && (
        <div className="px-4">
          <SectionRow label={SECTION_LABELS.produksi}   notes={orderNotes.sections.produksi} />
          <SectionRow label={SECTION_LABELS.finishing}  notes={orderNotes.sections.finishing} />
          <SectionRow label={SECTION_LABELS.pengiriman} notes={orderNotes.sections.pengiriman} />
        </div>
      )}
    </div>
  );
}

// ─── Komponen Utama ───────────────────────────────────────────────────────────

export default function WeeklyNotesView() {
  const [orderNotesList, setOrderNotesList] = useState<OrderNotes[]>([]);
  const [loading, setLoading]               = useState(true);
  const [filterWeek, setFilterWeek]         = useState<'this' | 'last' | 'all'>('this');

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const fetchNotes = async () => {
    setLoading(true);

    // Hitung range tanggal berdasarkan filter
    const now = new Date();
    let fromDate: Date | null = null;

    if (filterWeek === 'this') {
      const day = now.getDay(); // 0 = minggu
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // senin
      fromDate = new Date(now.setDate(diff));
      fromDate.setHours(0, 0, 0, 0);
    } else if (filterWeek === 'last') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      fromDate = new Date(now.setDate(diff));
      fromDate.setHours(0, 0, 0, 0);
    }

    let query = supabase
      .from('production_notes')
      .select('*')
      .order('created_at', { ascending: true });

    if (fromDate && filterWeek === 'this') {
      query = query.gte('created_at', fromDate.toISOString());
    } else if (fromDate && filterWeek === 'last') {
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 7);
      query = query
        .gte('created_at', fromDate.toISOString())
        .lt('created_at', toDate.toISOString());
    }

    const { data } = await query;
    if (!data) { setLoading(false); return; }

    // Kelompokkan per order_id
    const grouped: Record<string, OrderNotes> = {};
    for (const note of data) {
      if (!grouped[note.order_id]) {
        grouped[note.order_id] = {
          order_id:      note.order_id,
          kode_produksi: note.kode_produksi,
          nama_pemesan:  note.nama_pemesan,
          sections: { produksi: [], finishing: [], pengiriman: [] },
        };
      }
      const sec = note.section as keyof typeof grouped[string]['sections'];
      if (grouped[note.order_id].sections[sec]) {
        grouped[note.order_id].sections[sec].push(note);
      }
    }

    setOrderNotesList(Object.values(grouped));
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [filterWeek]);

  const totalCatatan = orderNotesList.reduce((acc, o) =>
    acc + o.sections.produksi.length + o.sections.finishing.length + o.sections.pengiriman.length, 0
  );

  return (
    <div className="space-y-4 md:space-y-5">

      {/* Header */}
      <div className="hidden md:block">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Catatan Rapat
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Rekap catatan produksi untuk rapat mingguan
        </p>
      </div>

      {/* Filter + summary */}
      <div className="flex flex-wrap items-center gap-2">
        {(['this', 'last', 'all'] as const).map((w) => {
          const labels = { this: 'Minggu ini', last: 'Minggu lalu', all: 'Semua' };
          return (
            <button
              key={w}
              onClick={() => setFilterWeek(w)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                filterWeek === w
                  ? 'bg-slate-800 text-white border-slate-800 dark:bg-blue-600 dark:border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {labels[w]}
            </button>
          );
        })}

        {!loading && (
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
            {orderNotesList.length} pesanan · {totalCatatan} catatan
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-sm text-slate-400">Memuat catatan...</span>
        </div>
      ) : orderNotesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Belum ada catatan</p>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
            Catatan akan muncul setelah tim produksi menambahkannya di detail pesanan
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orderNotesList.map((o) => (
            <OrderCard key={o.order_id} orderNotes={o} />
          ))}
        </div>
      )}
    </div>
  );
}