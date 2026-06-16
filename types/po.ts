// types/po.ts

export interface POSetting {
  id: string;
  is_active: boolean;
  title: string;
  periode_mulai: string | null;
  periode_selesai: string | null;
  sleeve_surcharge: number;
  xxl_surcharge: number;
  wa_admin_phone: string | null;
  bank_account_info: string | null;
  updated_at: string;
}

export interface POProduct {
  id: string;
  product_code: string;
  name: string;
  base_price: number;
  available_sizes: string[];
  sleeve_types: string[];
  colors: string[];
  image_urls: string[];
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface POReseller {
  id: string;
  kode: string;
  nama: string;
  wa: string | null;
  kota: string | null;
}

export interface POOrderItem {
  product_id: string;
  product_name: string;
  warna: string;
  lengan: string;
  ukuran: string;
  qty: number;
  harga_satuan: number;
  subtotal: number;
}

export interface POOrderPayload {
  customer_type: 'PUBLIC' | 'RESELLER';
  reseller_id?: string;
  customer_name: string;
  customer_wa: string;
  delivery_method: 'Diambil' | 'Dikirim';
  shipping_address?: string;
  order_items: POOrderItem[];
  notes?: string;
}

export interface CartItem extends POOrderItem {
  cart_id: string; // uuid lokal, bukan dari DB
}

// State keranjang untuk public form
export interface CartState {
  items: CartItem[];
}

// Tambahkan di bawah interface yang sudah ada di types/po.ts

export interface POOrder {
  id: string;
  po_number: string;
  customer_type: 'PUBLIC' | 'RESELLER';
  reseller_id: string | null;
  customer_name: string;
  customer_wa: string;
  delivery_method: 'Diambil' | 'Dikirim';
  shipping_address: string | null;
  order_items: POOrderItem[];
  notes: string | null;
  total_amount: number;
  created_at: string;
  // Join data
  po_resellers?: { nama: string; kode: string } | null;
}

export interface POResellerFull {
  id: string;
  kode: string;
  pin_hash: string;
  nama: string;
  whatsapp: string | null;
  kota: string | null;
  is_active: boolean;
  created_at: string;
}

export interface POProductFull extends POProduct {
  // sudah lengkap di POProduct, alias ini untuk kejelasan di admin context
}