// lib/po/admin.ts
// Fungsi Supabase khusus untuk admin PO — semua perlu auth

import { createClient } from '@/lib/supabase/client';
import { POSetting, POProduct, POOrder, POResellerFull,POOrderItem } from '@/types/po';

// ─────────────────────────────────────────────
// SETTING
// ─────────────────────────────────────────────

// Ganti fungsi getPOSettingAdmin lama dengan ini
export async function getPOSettingAdmin(poId?: string) {
  const supabase = createClient();
  let query = supabase.from('po_setting').select('*');
  
  // Jika poId dikirim, filter berdasarkan ID tersebut
  if (poId) {
    query = query.eq('id', poId);
  } else {
    // Fallback: jika tidak ada poId, ambil baris pertama seperti sistem lama
    query = query.limit(1);
  }

  const { data, error } = await query.single();
  if (error) return null;
  return data;
}

export async function getPOSettingBySlug(slug: string): Promise<POSetting | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('po_setting')
    .select('*')
    .eq('url_slug', slug)
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

// Ganti fungsi getAllPOProducts lama dengan ini
export async function getAllPOProducts(poId?: string): Promise<POProduct[]> {
  const supabase = createClient();
  let query = supabase.from('po_products').select('*');
  
  // Filter berdasarkan PO tertentu jika parameter tersedia
  if (poId) {
    query = query.eq('po_setting_id', poId);
  }

  const { data } = await query.order('sort_order', { ascending: true });
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
 
  // 1. Ambil dulu image_urls produk ini sebelum row-nya dihapus
  const { data: product } = await supabase
    .from('po_products')
    .select('image_urls')
    .eq('id', id)
    .single();
 
  // 2. Hapus row dari database
  const { error } = await supabase.from('po_products').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
 
  // 3. Baru hapus file-file gambarnya dari storage (setelah row sukses terhapus)
  if (product?.image_urls?.length) {
    await deleteProductImages(product.image_urls);
  }
 
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

  const total_amount = payload.order_items.reduce(
    (sum: number, item: any) => sum + item.subtotal,
    0
  );

  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  const po_number = `PO-${dateStr}-${randomStr}`;

  const orderData = {
    po_number: po_number,
    customer_type: payload.customer_type,
    customer_name: payload.customer_name,
    customer_wa: payload.customer_wa,
    delivery_method: payload.delivery_method,
    shipping_address: payload.shipping_address,
    order_items: payload.order_items,
    total_amount: total_amount,
    reseller_id: payload.reseller_id || null,
    po_setting_id: setting.id,   // ← WAJIB ditambahkan
  };

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

export async function getAllPOOrders(poId?: string): Promise<POOrder[]> {
  const supabase = createClient();
  let query = supabase
    .from('po_orders')
    .select('*, po_resellers(nama, kode)');

  if (poId) {
    query = query.eq('po_setting_id', poId);
  }

  const { data } = await query.order('created_at', { ascending: false });
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

// ─── Ganti fungsi updatePaymentStatus di lib/po/admin.ts dengan ini ───

export async function updatePaymentStatus(
  id: string,
  payment_status: 'BELUM_BAYAR' | 'DP' | 'LUNAS',
  paid_amount?: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('po_orders')
    .update({
      payment_status,
      ...(paid_amount !== undefined ? { paid_amount } : {}),
      payment_updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id'); // ← WAJIB: supaya kita bisa tahu berapa baris yang benar-benar terupdate

  if (error) {
    return { success: false, error: error.message };
  }

  // Jika RLS menolak update, Supabase tidak melempar error,
  // tapi `data` akan jadi array kosong karena 0 baris ter-update.
  if (!data || data.length === 0) {
    return {
      success: false,
      error:
        'Update tidak diterapkan (kemungkinan diblokir oleh RLS policy, atau ID tidak ditemukan).',
    };
  }

  return { success: true };
}

export async function updatePOOrderFull(
  id: string,
  updates: {
    customer_name: string;
    customer_wa: string;
    delivery_method: 'Diambil' | 'Dikirim';
    shipping_address: string | null;
    notes: string | null;
    order_items: import('@/types/po').POOrderItem[];
    total_amount: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('po_orders')
    .update(updates)
    .eq('id', id)
    .select('id'); // wajib, supaya bisa deteksi RLS silent failure
 
  if (error) {
    return { success: false, error: error.message };
  }
 
  if (!data || data.length === 0) {
    return {
      success: false,
      error: 'Update tidak diterapkan (kemungkinan diblokir oleh RLS policy, atau ID tidak ditemukan).',
    };
  }
 
  return { success: true };
}
// ─────────────────────────────────────────────
// STATISTIK
// ─────────────────────────────────────────────

export async function getPOStats(poId?: string): Promise<{
  totalOrders: number;
  totalPublic: number;
  totalReseller: number;
  totalAmount: number;
  totalProducts: number;
}> {
  const supabase = createClient();

  let ordersQuery = supabase
    .from('po_orders')
    .select('customer_type, total_amount, order_items');
  if (poId) {
    ordersQuery = ordersQuery.eq('po_setting_id', poId);
  }
  const { data } = await ordersQuery;

  if (!data) return { 
    totalOrders: 0, 
    totalPublic: 0, 
    totalReseller: 0, 
    totalAmount: 0,
    totalProducts: 0 
  };

  let productsQuery = supabase
    .from('po_products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  if (poId) {
    productsQuery = productsQuery.eq('po_setting_id', poId);
  }
  const { count: totalProducts } = await productsQuery;

  // Jumlahkan qty semua item dalam satu pesanan
  const sumQty = (items: POOrderItem[] | null | undefined) =>
    (items || []).reduce((s, item) => s + (item.qty || 0), 0);

  return {
    // ← sekarang total PCS terinput, bukan jumlah baris pesanan
    totalOrders: data.reduce((sum, o) => sum + sumQty(o.order_items), 0),
    totalPublic: data
      .filter((o) => o.customer_type === 'PUBLIC')
      .reduce((sum, o) => sum + sumQty(o.order_items), 0),
    totalReseller: data
      .filter((o) => o.customer_type === 'RESELLER')
      .reduce((sum, o) => sum + sumQty(o.order_items), 0),
    totalAmount: data.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    totalProducts: totalProducts || 0,
  };
}

// ─── Tambahkan ke lib/po/admin.ts ───
// (pastikan import createClient sudah ada di paling atas file, biasanya sudah ada)
 
/**
 * Ekstrak path relatif di dalam bucket dari public URL Supabase Storage.
 * Contoh input:
 *   https://xxxx.supabase.co/storage/v1/object/public/po_assets/products/123-abc.jpg
 * Contoh output:
 *   products/123-abc.jpg
 *
 * Mengembalikan null jika format URL tidak dikenali (misal sudah berupa path biasa,
 * atau bukan URL Supabase Storage sama sekali) — supaya pemanggil bisa skip dengan aman.
 */
function extractStoragePath(url: string, bucket: string = 'po_assets'): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
 
/**
 * Hapus satu atau lebih file gambar produk dari bucket 'po_assets'
 * berdasarkan public URL-nya. Aman dipanggil dengan array kosong.
 * Tidak melempar error ke pemanggil — kegagalan hapus file di storage
 * tidak boleh menggagalkan operasi utama (hapus produk / update produk).
 */
export async function deleteProductImages(imageUrls: string[]): Promise<void> {
  if (!imageUrls || imageUrls.length === 0) return;
 
  const supabase = createClient();
  const paths = imageUrls
    .map((url) => extractStoragePath(url))
    .filter((p): p is string => Boolean(p));
 
  if (paths.length === 0) return;
 
  const { error } = await supabase.storage.from('po_assets').remove(paths);
  if (error) {
    // Sengaja hanya log, tidak throw — supaya hapus produk tetap berhasil
    // walau file di storage gagal terhapus (misal sudah terhapus manual sebelumnya).
    console.error('Gagal menghapus file gambar dari storage:', error.message);
  }
}

// ─────────────────────────────────────────────
// LIST & CREATE PO (untuk multi-PO management)
// ─────────────────────────────────────────────

export async function getAllPOSettings(): Promise<POSetting[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('po_setting')
    .select('*')
    .order('updated_at', { ascending: false });
  return data || [];
}

export async function createPOSetting(
  input: { title: string; url_slug: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('po_setting')
    .insert({
      title: input.title,
      url_slug: input.url_slug,
      is_active: false,
    })
    .select('id')
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
}