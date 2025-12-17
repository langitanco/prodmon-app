// app/components/misc/TestNotifButton.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestNotifButton() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSendTest = async () => {
    setIsLoading(true);

    try {
      // 1. Ambil ID User yang sedang login
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("⚠️ Anda belum login!");
        setIsLoading(false);
        return;
      }

      // 2. Panggil API Server untuk kirim notif ke diri sendiri
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, // Kirim ke diri sendiri
          title: "Uji Coba Dashboard",
          body: `Halo ${user.email}, ini tes notifikasi dari tombol dashboard!`,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Sukses! Terkirim ke ${result.sent_count} perangkat.`);
      } else {
        alert(`❌ Gagal: ${result.error}`);
        console.error(result);
      }

    } catch (error) {
      console.error("Error sending notif:", error);
      alert("❌ Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-50">
      <button
        onClick={handleSendTest}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl font-bold text-white transition-all
          ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'}
        `}
      >
        {isLoading ? (
          <span>Mengirim...</span>
        ) : (
          <>
            🔔 <span>Tes Notifikasi</span>
          </>
        )}
      </button>
    </div>
  );
}