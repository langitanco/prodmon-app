// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
   apiKey: "AIzaSyAkYsPPuWL_h6Dyp_mLGR1TKgVw4RnqKPg",
   authDomain: "notifikasi-lco-superapp.firebaseapp.com",
   projectId: "notifikasi-lco-superapp",
   storageBucket: "notifikasi-lco-superapp.firebasestorage.app",
   messagingSenderId: "246581954990",
   appId: "1:246581954990:web:0d29f7711b2bb0ef16e03f"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png', // Logo utama yang muncul di samping teks
    badge: '/logo.png', // Ikon kecil yang muncul di bar status HP
    data: {
      url: '/' // Halaman yang dibuka saat notif diklik
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});