// lib/po/supabase.ts
// Semua query Supabase untuk fitur PO dikumpulkan di sini

import { createClient } from '@/lib/supabase/client';
import { POSetting, POProduct, POOrderPayload } from '@/types/po';
import { calculateItemPrice } from './pricing';

/**
 * Ambil setting PO aktif
 */
export async function getPOSetting(): Promise<POSetting | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('po_setting')
    .select('*')
    .single();

  if (error) return null;
  return data;
}

/**
 * Ambil semua produk aktif, diurutkan by sort_order
 */
export async function getPOProducts(): Promise<POProduct[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('po_products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) return [];
  return data;
}

/**
 * Login reseller via Supabase RPC
 */
export async function loginReseller(kode: string, pin: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('login_reseller', {
    p_kode: kode,
    p_pin: pin,
  });

  if (error) return { sukses: false, pesan: 'Terjadi kesalahan server.' };
  return data;
}

/**
 * Submit pesanan ke database.
 * Harga DIHITUNG ULANG di sini berdasarkan data DB, bukan dari client.
 */
export async function submitOrder(
  payload: POOrderPayload,
  setting: POSetting,
  products: POProduct[]
): Promise<{ success: boolean; po_number?: string; error?: string }> {
  const supabase = createClient();

  // Hitung ulang total (validasi harga dari server)
  const pricingSettings = {
    sleeveSurcharge: setting.sleeve_surcharge ?? 0,
    xxlSurcharge: setting.xxl_surcharge ?? 0,
    sweaterXxlSurcharge: setting.sweater_xxl_surcharge ?? 0,  // ← tambah ini
  };

  let totalAmount = 0;
  const validatedItems = payload.order_items.map((item) => {
    const product = products.find((p) => p.id === item.product_id);
    const basePrice = product ? product.base_price : 0;
    
    // PERBAIKAN DI SINI: Tambahkan item.qty sebagai argumen ke-4
    const hargaSatuan = calculateItemPrice(
      basePrice,
      item.ukuran,
      item.lengan,
      product || {},   // <--- Argumen ke-4: Data produk (pakai {} untuk jaga-jaga jika produk undefined)
      pricingSettings  // <--- Argumen ke-5: Setting harga
    );
    
    const subtotal = hargaSatuan * item.qty;
    totalAmount += subtotal;

    return { ...item, harga_satuan: hargaSatuan, subtotal };
  });

  // Generate nomor PO
  const { data: poNumber } = await supabase.rpc('generate_po_number', {
    p_type: payload.customer_type,
  });

  // Insert pesanan
  const { error } = await supabase.from('po_orders').insert({
    po_number:        poNumber,
    customer_type:    payload.customer_type,
    reseller_id:      payload.reseller_id ?? null,
    customer_name:    payload.customer_name,
    customer_wa:      payload.customer_wa,
    delivery_method:  payload.delivery_method,
    shipping_address: payload.shipping_address ?? null,
    order_items:      validatedItems,
    notes:            payload.notes ?? null,
    total_amount:     totalAmount,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, po_number: poNumber };
}