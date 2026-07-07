import { Order, UserData } from "@/types";

export type PaymentStatus = "Belum DP" | "DP" | "Lunas";

export interface PaymentData {
  harga_per_pcs: number;
  total_harga: number;
  dp_masuk: number;
  status_pembayaran: PaymentStatus;
}

export interface FinanceViewProps {
  orders: Order[];
  currentUser: UserData;
  onUpdatePayment: (orderId: string, data: PaymentData) => Promise<void>;
}

/**
 * Field-field pembayaran belum ada di tipe `Order` global, jadi kita pakai
 * helper type ini alih-alih menyebar `as any` di banyak tempat.
 */
export type OrderWithPayment = Order & Partial<PaymentData>;

/**
 * Master data biaya tambahan ukuran & lengan. Disimpan sebagai satu baris
 * (id = 1) di tabel `harga_config`. Mengubah nilai ini TIDAK mengubah
 * total_harga order yang sudah pernah dihitung sebelumnya — nilai itu
 * sudah permanen tersimpan di kolom `total_harga` masing-masing order.
 */
export interface HargaConfig {
  id: number;
  biaya_ukuran_besar: number;
  biaya_lengan_panjang: number;
  updated_at?: string;
  updated_by?: string;
}