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

async function migrateFile(oldUrl: any, kodeProduksi: string, label: string, orderId: string): Promise<any> {
  // 1. PENANGANAN OBJECT (seperti link_approval)
  if (oldUrl && typeof oldUrl === 'object' && 'link' in oldUrl) {
    const currentLink = oldUrl.link;
    const oldPath = getStoragePathFromUrl(currentLink);
    if (!oldPath) return oldUrl;

    const oldFilename = oldPath.split('/').pop();
    if (!oldFilename) return oldUrl;

    if (oldFilename.includes(kodeProduksi.replace(/[#/\\]/g, ''))) return oldUrl; // Sudah format baru

    const newFilename = generateNewFilename(kodeProduksi, label, oldFilename);
    const newPath = `${orderId}/${newFilename}`;

    console.log(`  [MOVING DI STORAGE] ${oldPath} ──> ${newPath}`);
    
    // EKSEKUSI PINDAH FILE
    const { error: moveError } = await supabase.storage.from(BUCKET_NAME).move(oldPath, newPath);
    if (moveError) {
      console.error(`  [ERROR STORAGE] Gagal memindah ${oldPath}:`, moveError.message);
      return oldUrl;
    }

    const newLink = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${newPath}`;
    return { ...oldUrl, link: newLink };
  }

  // 2. PENANGANAN STRING URL BIASA
  const oldPath = getStoragePathFromUrl(oldUrl);
  if (!oldPath) return oldUrl;

  const oldFilename = oldPath.split('/').pop();
  if (!oldFilename) return oldUrl;

  if (oldFilename.includes(kodeProduksi.replace(/[#/\\]/g, ''))) return oldUrl; // Sudah format baru

  const newFilename = generateNewFilename(kodeProduksi, label, oldFilename);
  const newPath = `${orderId}/${newFilename}`;

  console.log(`  [MOVING DI STORAGE] ${oldPath} ──> ${newPath}`);
  
  // EKSEKUSI PINDAH FILE
  const { error: moveError } = await supabase.storage.from(BUCKET_NAME).move(oldPath, newPath);
  if (moveError) {
    console.error(`  [ERROR STORAGE] Gagal memindah ${oldPath}:`, moveError.message);
    return oldUrl;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${newPath}`;
}

export async function runLiveMigration() {
  console.log('=== MEMULAI MIGRASI LIVE (STORAGE & DATABASE) ===');

  // TAHAP 1: EKSEKUSI 1 ORDER SAJA DULU SEBAGAI FINAL TEST
  const testCodes = ['LCO-05/26-0019']; 
  const { data: orders, error: fetchError } = await supabase.from('orders').select('*').in('kode_produksi', testCodes);

  // JIKA SUDAH YAKIN UNTUK SEMUA DATA, GANTI 2 BARIS DI ATAS MENJADI:
  // const { data: orders, error: fetchError } = await supabase.from('orders').select('*');

  if (fetchError || !orders) return console.error('Gagal mengambil data:', fetchError);
  console.log(`Memproses ${orders.length} order...\n`);

  for (const order of orders) {
    let hasChanges = false;
    const updatedPayload: any = {};

    const singleFiles = [
      { key: 'link_approval', label: 'ApprovalDesain' },
      { key: 'packing_photo', label: 'Packing' },
      { key: 'shipping_photo_kirim', label: 'BuktiKirim' },
      { key: 'shipping_photo_terima', label: 'BuktiTerima' }
    ];

    for (const file of singleFiles) {
      if (order[file.key]) {
        const newUrl = await migrateFile(order[file.key], order.kode_produksi, file.label, order.id);
        if (newUrl && JSON.stringify(newUrl) !== JSON.stringify(order[file.key])) {
          updatedPayload[file.key] = newUrl;
          hasChanges = true;
        }
      }
    }

    const stepKey = order.jenis_produksi === 'manual' ? 'steps_manual' : 'steps_dtf';
    const stepsArray = order[stepKey];

    if (Array.isArray(stepsArray) && stepsArray.length > 0) {
      const updatedSteps = [...stepsArray];
      let stepsChanged = false;

      for (let i = 0; i < updatedSteps.length; i++) {
        const step = updatedSteps[i];
        if (step && step.fileUrl) {
          const stepLabel = step.name ? step.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '') : 'Produksi';
          const newUrl = await migrateFile(step.fileUrl, order.kode_produksi, stepLabel, order.id);
          
          if (newUrl && newUrl !== step.fileUrl) {
            updatedSteps[i] = { ...step, fileUrl: newUrl };
            stepsChanged = true;
            hasChanges = true;
          }
        }
      }
      if (stepsChanged) updatedPayload[stepKey] = updatedSteps;
    }

    if (hasChanges) {
      // EKSEKUSI UPDATE DATABASE
      const { error: updateError } = await supabase.from('orders').update(updatedPayload).eq('id', order.id);
      if (updateError) {
        console.error(`  [ERROR DB] Gagal update DB order ${order.kode_produksi}:`, updateError.message);
      } else {
        console.log(`  [SUCCESS] Database order ${order.kode_produksi} diperbarui.`);
      }
    } else {
      console.log(`  [SKIP] Order ${order.kode_produksi} tidak ada file yang perlu diubah.`);
    }
  }
  console.log('\n=== MIGRASI SELESAI ===');
}