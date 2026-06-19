// lib/po/wa-messages.ts
// Helper untuk membentuk teks pesan WhatsApp & link wa.me
// Dipakai di halaman pendaftaran publik (user -> admin)
// dan di admin panel (admin -> reseller saat konfirmasi)

import { POResellerFull } from '@/types/po';

/**
 * Normalisasi nomor WA ke format 62xxx (tanpa +, tanpa 0 di depan)
 * supaya link wa.me selalu valid.
 */
export function normalizeWaNumber(raw: string): string {
  let num = raw.replace(/[^0-9]/g, '');
  if (num.startsWith('0')) {
    num = '62' + num.slice(1);
  } else if (!num.startsWith('62')) {
    num = '62' + num;
  }
  return num;
}

export function buildWaLink(phone: string, message: string): string {
  const num = normalizeWaNumber(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

/**
 * Pesan dari calon reseller -> admin, setelah submit form pendaftaran.
 */
export function buildRegistrationMessage(data: {
  nama: string;
  panggilan: string;
  whatsapp: string;
  alamat: string;
  pin: string;
}): string {
  return `Assalamu'alaikum Admin *Langitan.co*
Saya sudah mendaftar sebagai Reseller dengan data sebagai berikut:
Nama lengkap: ${data.nama}
Nama panggilan: ${data.panggilan}
Nomor WA: ${data.whatsapp}
Alamat Lengkap: ${data.alamat}
Pin Untuk Login: ${data.pin}
Mohon segera dikonfirmasi, terima kasih
🙏🏻🙏🏻🙏🏻`;
}

/**
 * Pesan dari admin -> reseller, dikirim saat admin klik "Konfirmasi WA"
 * di tab pendaftar pending.
 *
 * @param reseller   Data reseller dari po_resellers (sudah berstatus pending)
 * @param portalUrl  Link portal reseller, dibentuk dari po_setting.url_slug
 */
export function buildConfirmationMessage(
  reseller: POResellerFull,
  portalUrl: string
): string {
  return `Wa'alikum Salam 😊🙏🏻
Terima kasih sudah mendaftar sebagai reseller, berikut akses link nya: ${portalUrl}
Akses masuknya adalah:
Username: ${reseller.kode}
Pin: ${reseller.pin_hash}
Kami mohon untuk memahami dengan betul syarat dan ketentuan yang berlaku untuk reseller PO Spesial Haul Langitan ke-56
Terima kasih
*Langitan.co*
🙏🏻🙏🏻🙏🏻`;
}

/**
 * Isi syarat & ketentuan, dipakai di modal S&K pada form pendaftaran.
 */
export const SYARAT_DAN_KETENTUAN = [
  'Minimal order adalah 12, dibawah itu belum bisa di anggap sebagai Reseller',
  'Jika sudah memenuhi target yang di tentukan, Reseller akan mendapatkan fee sebesar 10.000 per pcs',
  'Tidak diperkenankan untuk menjual dengan harga lebih tinggi atau lebih rendah dari harga tertera',
  'Segala pengiriman dan packing ditanggung oleh reseller',
  'Apabila dikehendaki pengiriman dan packing dari distributor (Langitan.co), maka akan dikenai admin pengiriman dan packing sebesar 5.000',
  'Dilarang me redesign ulang poster yang sudah diberikan dengan desain sendiri',
];