import { Order, UserData } from "@/types";

export type PaymentStatus = "Belum DP" | "DP" | "Lunas";

export interface PaymentData {
  harga_per_pcs: number;
  total_harga: number;
  dp_masuk: number;
  status_pembayaran: PaymentStatus;
  /** Biaya tambahan per pcs untuk ukuran mulai XXL (kelipatan per step),
   *  diinput manual saat menghitung pembayaran order ini. */
  biaya_ukuran_besar: number;
  /** Biaya tambahan tetap per pcs untuk varian lengan panjang,
   *  diinput manual saat menghitung pembayaran order ini. */
  biaya_lengan_panjang: number;
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