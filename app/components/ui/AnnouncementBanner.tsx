// app/components/ui/AnnouncementBanner.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Announcement } from '@/types';
import { X, Info, AlertTriangle, CheckCircle, Megaphone } from 'lucide-react';

const typeConfig = {
  info:    { icon: Info,          bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-200 dark:border-blue-800',    text: 'text-blue-800 dark:text-blue-200'    },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-200' },
  success: { icon: CheckCircle,   bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-200 dark:border-green-800',   text: 'text-green-800 dark:text-green-200'   },
  update:  { icon: Megaphone,     bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-800 dark:text-purple-200' },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    // Ambil dari localStorage supaya kalau sudah di-dismiss tidak muncul lagi
    const stored = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    setDismissed(stored);

    const fetchAnnouncements = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

        // Filter expires_at di sisi client
        const filtered = (data || []).filter(a =>
            !a.expires_at || new Date(a.expires_at) > new Date()
            );
        if (filtered) setAnnouncements(filtered);
    };

    fetchAnnouncements();

    // Realtime — otomatis muncul kalau admin posting pengumuman baru
    const channel = supabase
      .channel('announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchAnnouncements)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDismiss = (id: string) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

  const visible = announcements.filter(a => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map(a => {
        const config = typeConfig[a.type];
        const Icon = config.icon;
        return (
          <div key={a.id} className={`flex items-start gap-3 p-3 md:p-4 rounded-2xl border ${config.bg} ${config.border}`}>
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.text}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${config.text}`}>{a.title}</p>
              <p className={`text-xs mt-0.5 ${config.text} opacity-80`}>{a.message}</p>
            </div>
            <button onClick={() => handleDismiss(a.id)} className={`shrink-0 ${config.text} opacity-60 hover:opacity-100 transition`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}