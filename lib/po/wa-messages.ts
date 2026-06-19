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
 * Pesan dari calon reseller -> admin
 */
export function buildRegistrationMessage(data: {
  nama: string;
  panggilan: string;
  whatsapp: string;
  alamat: string;
  pin: string;
}): string {
  return `*PENDAFTARAN RESELLER BARU*

Assalamu'alaikum Admin Langitan.co,
Saya ingin mengajukan diri sebagai reseller dengan data berikut:

> *Nama:* ${data.nama}
> *Username:* ${data.panggilan}
> *WhatsApp:* ${data.whatsapp}
> *Alamat:* ${data.alamat}
> *PIN:* ${data.pin}

Mohon bantuannya untuk proses aktivasi akun. Terima kasih.
_Wassalamu'alaikum._`;
}

/**
 * Pesan dari admin -> reseller
 */
export function buildConfirmationMessage(
  reseller: POResellerFull,
  portalUrl: string
): string {
  return `*KONFIRMASI PENDAFTARAN RESELLER*

Wa'alaikumussalam Wr. Wb.
Selamat! Pendaftaran Anda telah kami setujui. Sekarang Anda sudah bisa mengakses portal reseller di:

🔗 ${portalUrl}

*Detail Akun Anda:*
> Username: ${reseller.kode}
> PIN: ${reseller.pin_hash}

> *Penting:* Mohon pelajari dan patuhi syarat & ketentuan yang berlaku demi kenyamanan bersama.

Terima kasih,
*Langitan.co*`;
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
  'Dilarang meredesign ulang poster yang sudah diberikan dengan desain sendiri',
];