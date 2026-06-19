// lib/po/admin.ts
// Fungsi Supabase khusus untuk admin PO — semua perlu auth

import { createClient } from '@/lib/supabase/client';
import { POSetting, POProduct, POOrder, POResellerFull } from '@/types/po';

// ─────────────────────────────────────────────
// SETTING
// ─────────────────────────────────────────────

export async function getPOSettingAdmin() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('po_setting')
    .select('*') // Pastikan menggunakan '*' atau eksplisit memanggil 'url_slug'
    .single();

  if (error) return null;
  return data;
}

export async function updatePOSetting(
  id: string,
  updates: Partial<Omit<POSetting, 'id' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('po_setting')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─────────────────────────────────────────────
// PRODUK
// ─────────────────────────────────────────────

export async function getAllPOProducts(): Promise<POProduct[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('po_products')
    .select('*')
    .order('sort_order', { ascending: true });
  return data || [];
}

export async function createPOProduct(
  product: Omit<POProduct, 'id'>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('po_products').insert(product);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePOProduct(
  id: string,
  updates: Partial<Omit<POProduct, 'id'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('po_products')
    .update(updates)
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deletePOProduct(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('po_products').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function togglePOProductActive(
  id: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  return updatePOProduct(id, { is_active });
}

// ─────────────────────────────────────────────
// RESELLER
// ─────────────────────────────────────────────

export async function getAllResellers(): Promise<POResellerFull[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('po_resellers')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getPendingResellers(): Promise<POResellerFull[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('po_resellers')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  return data || [];
}
 
export async function confirmReseller(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('po_resellers')
    .update({ status: 'confirmed', is_active: true })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function createReseller(
  reseller: { kode: string; pin_hash: string; nama: string; whatsapp?: string; kota?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('po_resellers').insert(reseller);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateReseller(
  id: string,
  updates: Partial<Omit<POResellerFull, 'id' | 'created_at'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('po_resellers')
    .update(updates)
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function toggleResellerActive(
  id: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateReseller(id, { is_active });
}

export async function deleteReseller(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('po_resellers').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

export async function submitOrder(
  payload: any,
  setting: POSetting,
  products: POProduct[]
): Promise<{ success: boolean; po_number?: string; error?: string }> {
  const supabase = createClient();

  // 1. Hitung total amount dari items
  const total_amount = payload.order_items.reduce(
    (sum: number, item: any) => sum + item.subtotal,
    0
  );

  // 2. Generate Nomor PO sementara (Format: PO-YYMMDD-XXXX)
  // Catatan: Jika di Supabase Anda sudah membuat trigger/RPC khusus untuk ini, 
  // bagian ini bisa disesuaikan atau dihapus.
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // Hasil: 260617 (YYMMDD)
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit acak
  const po_number = `PO-${dateStr}-${randomStr}`;

  // 3. Siapkan data yang akan di-insert ke tabel po_orders
  const orderData = {
    po_number: po_number,
    customer_type: payload.customer_type,
    customer_name: payload.customer_name,
    customer_wa: payload.customer_wa,
    delivery_method: payload.delivery_method,
    shipping_address: payload.shipping_address,
    order_items: payload.order_items, // Disimpan sebagai JSONB di Supabase
    total_amount: total_amount,
    reseller_id: payload.reseller_id || null, // Null jika pemesan PUBLIC
  };

  // 4. Insert ke database
  const { data, error } = await supabase
    .from('po_orders')
    .insert(orderData)
    .select('po_number')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, po_number: data.po_number };
}

export async function getAllPOOrders(): Promise<POOrder[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('po_orders')
    .select('*, po_resellers(nama, kode)')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getPOOrderById(id: string): Promise<POOrder | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('po_orders')
    .select('*, po_resellers(nama, kode)')
    .eq('id', id)
    .single();
  return data;
}

export async function deletePOOrder(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('po_orders').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─────────────────────────────────────────────
// STATISTIK
// ─────────────────────────────────────────────

export async function getPOStats(): Promise<{
  totalOrders: number;
  totalPublic: number;
  totalReseller: number;
  totalAmount: number;
  totalProducts: number;
}> {
  const supabase = createClient();
  const { data } = await supabase
    .from('po_orders')
    .select('customer_type, total_amount');

  if (!data) return { 
    totalOrders: 0, 
    totalPublic: 0, 
    totalReseller: 0, 
    totalAmount: 0,
    totalProducts: 0 
  };

  const { count: totalProducts } = await supabase
    .from('po_products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true); // Hitung produk yang aktif saja

  return {
    totalOrders: data.length,
    totalPublic: data.filter((o) => o.customer_type === 'PUBLIC').length,
    totalReseller: data.filter((o) => o.customer_type === 'RESELLER').length,
    totalAmount: data.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    totalProducts: totalProducts || 0,
  };
}