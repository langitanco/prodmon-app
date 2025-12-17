// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
   // Masukkan Config yang SAMA PERSIS dengan Langkah 1 di sini
   apiKey: "AIzaSyAkYsPPuWL_h6Dyp_mLGR1TKgVw4RnqKPg",
   projectId: "notifikasi-lco-superapp",
   messagingSenderId: "246581954990",
   appId: "1:246581954990:web:0d29f7711b2bb0ef16e03f",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png' // Ganti dengan path icon aplikasi Anda
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});