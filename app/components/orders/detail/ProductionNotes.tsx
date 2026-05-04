// app/components/orders/detail/ProductionNotes.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, MessageSquare, Send, Trash2 } from 'lucide-react';
import { UserData } from '@/types';

interface ProductionNote {
  id: string;
  content: string;
  section: string;
  created_by_id: string;
  created_by_name: string;
  created_at: string;
}

interface ProductionNotesProps {
  orderId: string;
  kodeProduksi: string;
  namaPemesan: string;
  section: 'produksi' | 'finishing' | 'pengiriman';
  currentUser: UserData;
}

export default function ProductionNotes({
  orderId, kodeProduksi, namaPemesan, section, currentUser,
}: ProductionNotesProps) {
  const [notes, setNotes]       = useState<ProductionNote[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // ─── Fetch catatan ──────────────────────────────────────────────────────

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('production_notes')
      .select('*')
      .eq('order_id', orderId)
      .eq('section', section)
      .order('created_at', { ascending: true });
    setNotes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [orderId, section]);

  // ─── Tambah catatan ─────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    await supabase.from('production_notes').insert({
      order_id:        orderId,
      kode_produksi:   kodeProduksi,
      nama_pemesan:    namaPemesan,
      content:         input.trim(),
      section,
      created_by_id:   currentUser.id,
      created_by_name: currentUser.name,
    });
    setInput('');
    await fetchNotes();
    setSending(false);
  };

  // ─── Hapus catatan ──────────────────────────────────────────────────────

  const handleDelete = async (noteId: string) => {
    await supabase.from('production_notes').delete().eq('id', noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const canDelete = (note: ProductionNote) =>
    note.created_by_id === currentUser.id || currentUser.role === 'supervisor';

  // ─── Format waktu ───────────────────────────────────────────────────────

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Catatan
        </span>
        {notes.length > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {notes.length}
          </span>
        )}
      </div>

      {/* List catatan */}
      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
          <span className="text-xs text-slate-400">Memuat catatan...</span>
        </div>
      ) : notes.length === 0 ? (
        <p className="text-[11px] text-slate-300 dark:text-slate-700 italic mb-3">
          Belum ada catatan
        </p>
      ) : (
        <div className="space-y-2 mb-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2 border-l-2 border-slate-200 dark:border-slate-700"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {note.content}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  {note.created_by_name} · {formatTime(note.created_at)}
                </p>
              </div>
              {canDelete(note) && (
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition flex-shrink-0 mt-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input catatan baru */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Tulis catatan..."
          className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {sending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Send className="w-3.5 h-3.5" />
          }
        </button>
      </div>
    </div>
  );
}