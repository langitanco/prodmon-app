// lib/orderLogic.ts
import { Order } from '@/types';
import { sendToRoles, sendToAllUsers } from './notificationHelper';

/**
 * Pemicu Utama Notifikasi LCO SuperApp V.7.0
 * Mengatur siapa yang menerima pesan berdasarkan status dan deadline
 */
export const triggerOrderNotifications = async (orderData: Order, oldStatus?: string) => {
  const finalStatus = orderData.status;
  const title = `Update: ${orderData.kode_produksi}`;

  // 1. LOGIKA: Pesanan Baru (Hanya jika pesanan baru saja di-insert)
  if (!oldStatus) {
    await sendToAllUsers(
      "📦 Pesanan Baru Masuk!", 
      `Order ${orderData.kode_produksi} (${orderData.nama_pemesan}) baru saja dibuat.`
    );
    return;
  }

  // 2. LOGIKA: Perubahan Status (Hanya jika status berubah)
  if (oldStatus !== finalStatus) {
    switch (finalStatus) {
      case 'On Process':
        // Produksi & Supervisor
        await sendToRoles(['produksi', 'supervisor'], title, "Pesanan mulai diproses produksi.");
        break;
      
      case 'Ada Kendala':
        // Admin, Supervisor, Manager
        await sendToRoles(['admin', 'supervisor', 'manager'], "⚠️ ADA KENDALA!", `Order ${orderData.kode_produksi} melaporkan kendala.`);
        break;

      case 'Finishing':
        // QC & Supervisor
        await sendToRoles(['qc', 'supervisor'], title, "Pesanan masuk tahap Finishing & QC.");
        break;

      case 'Revisi':
        // Produksi, Supervisor, Manager
        await sendToRoles(['produksi', 'supervisor', 'manager'], "⚠️ REVISI QC", `QC Gagal: ${orderData.finishing_qc?.notes}`);
        break;

      case 'Selesai':
        // Semua Role
        await sendToAllUsers("✅ Pesanan Selesai", `Order ${orderData.kode_produksi} telah selesai sepenuhnya!`);
        break;
    }
  }

  // 3. LOGIKA: Urgent & Telat (Pengecekan Waktu Realtime)
  if (orderData.deadline && finalStatus !== 'Selesai' && finalStatus !== 'Kirim') {
    const deadline = new Date(orderData.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // Telat -> Produksi, Admin, Supervisor
      await sendToRoles(['produksi', 'admin', 'supervisor'], "⛔ PESANAN TELAT", `Order ${orderData.kode_produksi} sudah melewati deadline!`);
    } else if (diffDays <= 2) {
      // Urgent -> Produksi, Admin, Supervisor
      await sendToRoles(['produksi', 'admin', 'supervisor'], "🔥 URGENT / MEPET", `Order ${orderData.kode_produksi} deadline tinggal ${diffDays} hari!`);
    }
  }
};