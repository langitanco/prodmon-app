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

// Cukup biarkan ini untuk menerima pesan di background. 
// JANGAN panggil self.registration.showNotification di sini jika di API sudah ada payload 'notification'
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received ', payload);
});