// app/components/misc/FCMManager.tsx

'use client';

import { useEffect } from 'react';
import { getFCM, getToken } from '@/lib/firebase'; // ✅ Import getFCM
import { createClient } from '@/lib/supabase/client'; 

const FCMManager = () => {
  const supabase = createClient(); 

  useEffect(() => {
    const setupFCM = async () => {
      console.log("🚀 1. Memulai Setup FCM...");
      
      if (typeof window === 'undefined') {
        console.log("⚠️ Berjalan di Server, stop.");
        return;
      }

      try {
        // Ambil instance messaging secara async
        const messaging = await getFCM();
        
        if (!messaging) {
          console.log("❌ Messaging tidak didukung di browser ini.");
          return;
        }
        
        console.log("✅ 2. Messaging siap. Meminta Izin...");

        const permission = await Notification.requestPermission();
        console.log("🔔 3. Status Izin:", permission);

        if (permission === 'granted') {
          console.log("⏳ 4. Sedang mengambil token...");
          
          const token = await getToken(messaging, {
            vapidKey: 'BLGGnbBrSV79Yq6qsWxWcVJ_l7oFkW1xM9tcYQaqalCew_qoIyC7KhHM0gdUzgLB4Rpq8QAJeNzUO9m-hLYdLP8' 
          });

          if (token) {
            console.log("🎉 5. FCM Token Diterima:", token);
            await saveTokenToDatabase(token);
          } else {
            console.log("⚠️ Token kosong/gagal diambil.");
          }
        } else {
          console.log("⛔ Izin notifikasi ditolak/diblokir.");
        }
      } catch (error) {
        console.error("🔥 Error setting up FCM:", error);
      }
    };

    setupFCM();
  }, []);

  const saveTokenToDatabase = async (token: string) => {
    console.log("💾 6. Menyimpan ke database...");
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('user_fcm_tokens')
        .upsert({ 
          user_id: user.id, 
          token: token,
          // Pastikan kolom updated_at sudah dibuat di DB via SQL sebelumnya
          updated_at: new Date().toISOString() 
        }, { onConflict: 'token' });
        
      if (error) {
        console.error('❌ Error saving token:', error);
      } else {
        console.log('✅ SUKSES! Token tersimpan di Database.');
      }
    } else {
      console.log("⚠️ User belum login, token tidak disimpan.");
    }
  };

  return null;
};

export default FCMManager;