import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const BUCKET_NAME = 'production-proofs';

function generateNewFilename(kodeProduksi: string, label: string, oldFilename: string): string {
  const sanitizeKode = (str: string) => str.replace(/[#/\\]/g, '').replace(/\s+/g, '-').trim();
  const nameWithoutExt = oldFilename.split('.')[0];
  const ext = oldFilename.split('.').pop();

  let fileDate = new Date();
  if (/^\d+$/.test(nameWithoutExt)) {
    fileDate = new Date(Number(nameWithoutExt));
  }

  const tglIso = fileDate.toISOString().split('T')[0];
  return `${tglIso}_${sanitizeKode(kodeProduksi)}_${label}.${ext}`;
}

function getStoragePathFromUrl(url: any): string | null {
  if (!url || typeof url !== 'string') return null;
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  if (!url.includes(marker)) return null;
  return url.split(marker)[1];
}

// Fungsi utama untuk memproses 1 string URL
async function processSingleUrl(oldUrl: string, kodeProduksi: string, label: string, orderId: string): Promise<string> {
  const oldPath = getStoragePathFromUrl(oldUrl);
  if (!oldPath) return oldUrl; // Kembalikan asli jika bukan URL valid

  const oldFilename = oldPath.split('/').pop();
  const sanitizeKodeObj = kodeProduksi.replace(/[#/\\]/g, '').replace(/\s+/g, '-').trim();

  // Jika nama file sudah mengandung kode produksi, berarti sudah aman/ter-migrate
  if (!oldFilename || oldFilename.includes(sanitizeKodeObj)) return oldUrl; 

  const newFilename = generateNewFilename(kodeProduksi, label, oldFilename);
  const newPath = `${orderId}/${newFilename}`;

  // Pindahkan di storage
  const { error: moveError } = await supabase.storage.from(BUCKET_NAME).move(oldPath, newPath);
  
  if (moveError) {
    if (moveError.message.includes('not found') || moveError.message.includes('Object not found')) {
      console.log(`  [INFO] File tidak di storage (mungkin sudah dipindah sebelumnya): ${oldFilename}`);
    } else {
      console.error(`  [ERROR] Gagal pindah ${oldFilename}:`, moveError.message);
      return oldUrl;
    }
  } else {
    console.log(`  [SUCCESS Storage] Pindah ──> ${newFilename}`);
  }

  // Return URL baru
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${newPath}`;
}

export async function runAllInOneMigration() {
  console.log('=== MEMULAI EKSEKUSI MASSAL (Berdasarkan Struktur JSONB Tabel) ===');

  const { data: orders, error: fetchError } = await supabase.from('orders').select('*');

  if (fetchError || !orders) {
    console.error('❌ Gagal mengambil data orders:', fetchError?.message);
    return;
  }

  console.log(`Ditemukan total ${orders.length} order untuk diproses.\n`);

  for (const order of orders) {
    let hasChanges = false;
    const updatedPayload: any = {};

    console.log(`Memeriksa Order: ${order.kode_produksi}`);

    // 1. Kolom: link_approval (Mencari property 'link')
    if (order.link_approval?.link) {
      const newUrl = await processSingleUrl(order.link_approval.link, order.kode_produksi, 'ApprovalDesain', order.id);
      if (newUrl !== order.link_approval.link) {
        updatedPayload.link_approval = { ...order.link_approval, link: newUrl };
        hasChanges = true;
      }
    }

    // 2. Kolom: finishing_packing (Mencari property 'fileUrl')
    if (order.finishing_packing?.fileUrl) {
      const newUrl = await processSingleUrl(order.finishing_packing.fileUrl, order.kode_produksi, 'Packing', order.id);
      if (newUrl !== order.finishing_packing.fileUrl) {
        updatedPayload.finishing_packing = { ...order.finishing_packing, fileUrl: newUrl };
        hasChanges = true;
      }
    }

    // 3. Kolom: shipping (Mencari property 'bukti_kirim' dan 'bukti_terima')
    if (order.shipping) {
      let shippingChanged = false;
      const newShipping = { ...order.shipping };

      if (newShipping.bukti_kirim) {
        const newUrl = await processSingleUrl(newShipping.bukti_kirim, order.kode_produksi, 'BuktiKirim', order.id);
        if (newUrl !== newShipping.bukti_kirim) {
          newShipping.bukti_kirim = newUrl;
          shippingChanged = true;
        }
      }

      if (newShipping.bukti_terima) {
        const newUrl = await processSingleUrl(newShipping.bukti_terima, order.kode_produksi, 'BuktiTerima', order.id);
        if (newUrl !== newShipping.bukti_terima) {
          newShipping.bukti_terima = newUrl;
          shippingChanged = true;
        }
      }

      if (shippingChanged) {
        updatedPayload.shipping = newShipping;
        hasChanges = true;
      }
    }

    // 4. Kolom Array: steps_manual & steps_dtf
    const stepKeys = ['steps_manual', 'steps_dtf'];
    for (const stepKey of stepKeys) {
      const stepsArray = order[stepKey];
      if (Array.isArray(stepsArray) && stepsArray.length > 0) {
        let stepsChanged = false;
        const updatedSteps = [];

        for (const step of stepsArray) {
          if (step?.fileUrl) {
            const stepLabel = step.name ? step.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '') : 'Produksi';
            const newUrl = await processSingleUrl(step.fileUrl, order.kode_produksi, stepLabel, order.id);
            
            if (newUrl !== step.fileUrl) {
              updatedSteps.push({ ...step, fileUrl: newUrl });
              stepsChanged = true;
              continue;
            }
          }
          updatedSteps.push(step); // Kalau tidak ada perubahan, masukkan data asli
        }

        if (stepsChanged) {
          updatedPayload[stepKey] = updatedSteps;
          hasChanges = true;
        }
      }
    }

    // 5. Update Database jika ada yang dirubah
    if (hasChanges) {
      const { error: updateError } = await supabase
        .from('orders')
        .update(updatedPayload)
        .eq('id', order.id);

      if (updateError) {
        console.error(`  [ERROR DB] Gagal memperbarui DB:`, updateError.message);
      } else {
        console.log(`  [SUCCESS] Database order disinkronkan.`);
      }
    }
  }

  console.log('\n=== SELURUH PROSES MIGRATION MASSAL SELESAI ===');
}