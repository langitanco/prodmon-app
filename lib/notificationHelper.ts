// lib/notificationHelper.ts

import { createClient } from '@/lib/supabase/client';

// 1. Kirim ke 1 User (Spesifik)
export const sendNotification = async (targetUserId: string, title: string, body: string) => {
  try {
    if (!targetUserId) return;

    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: targetUserId, title, body }),
    });
  } catch (error) {
    console.error("❌ Gagal kirim notif:", error);
  }
};

// 2. Kirim ke User berdasarkan Role (Massal)
// Contoh usage: sendToRoles(['produksi', 'supervisor'], 'Judul', 'Pesan')
export const sendToRoles = async (roles: string[], title: string, body: string) => {
  const supabase = createClient();
  
  // Cari User ID yang punya role tersebut
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .in('role', roles);

  if (users && users.length > 0) {
    // Kirim notifikasi ke setiap user yang ditemukan
    // Kita pakai Promise.all agar dikirim paralel (cepat)
    const promises = users.map(u => sendNotification(u.id, title, body));
    await Promise.all(promises);
    console.log(`📢 Broadcast ke role [${roles.join(', ')}] berhasil.`);
  }
};

// 3. Kirim ke SEMUA User
export const sendToAllUsers = async (title: string, body: string) => {
  const supabase = createClient();
  
  const { data: users } = await supabase
    .from('users')
    .select('id');

  if (users && users.length > 0) {
    const promises = users.map(u => sendNotification(u.id, title, body));
    await Promise.all(promises);
    console.log("📢 Broadcast ke SEMUA USER berhasil.");
  }
};