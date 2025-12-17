// app/lib/notification.ts

import OneSignal from 'react-onesignal';

// --- KONFIGURASI ---
// Disarankan simpan ini di .env.local jika sudah production
const ONESIGNAL_APP_ID = "444fb267-6840-46d2-b7b9-316f105b2ce9"; 
const ONESIGNAL_API_KEY = "os_v2_app_irh3ez3iibdnfn5zgfxrawzm5hlfeypbzxfea6nskav54ifphtqwya3u5avp6u6f4bspbmm6uyulqhiq3q32uut5jnz7f7vowk25k2y"; 

/**
 * Inisialisasi OneSignal (Dijalankan sekali saat aplikasi start)
 */
export const initOneSignal = async () => {
  if (typeof window !== 'undefined') {
    try {
      // TAMBAHKAN 'as any' DI BAWAH SINI
      await OneSignal.init({ 
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true, 
        notifyButton: {
          enable: true, 
        },
      } as any); // <--- PERHATIKAN TAMBAHAN 'as any' INI
      
      await OneSignal.Slidedown.promptPush();
      console.log("OneSignal Initialized");
    } catch (error) {
      console.error("OneSignal Init Error:", error);
    }
  }
};

/**
 * Kirim Notifikasi ke HP (Push Notification)
 * @param heading Judul Notifikasi
 * @param content Isi Pesan
 */
export const sendPushNotification = async (heading: string, content: string) => {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_API_KEY}`
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['Total Subscriptions'], // Kirim ke SEMUA user
      headings: { en: heading },
      contents: { en: content },
      url: window.location.origin // Klik notif membuka aplikasi
    })
  };

  try {
    await fetch('https://onesignal.com/api/v1/notifications', options);
    console.log(`Notifikasi HP Terkirim: ${heading}`);
  } catch (err) {
    console.error("Gagal kirim notif HP:", err);
  }
};