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
  // Hanya proses jika tipenya benar-benar string URL
  if (!url || typeof url !== 'string') return null;
  
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  if (!url.includes(marker)) return null;
  return url.split(marker)[1];
}

async function simulateMigrateFile(oldUrl: any, kodeProduksi: string, label: string, orderId: string): Promise<any> {
  // 🟢 PENANGANAN JIKA DATA BERUPA OBJECT (Mengandung property 'link')
  if (oldUrl && typeof oldUrl === 'object' && 'link' in oldUrl) {
    const currentLink = oldUrl.link;
    const oldPath = getStoragePathFromUrl(currentLink);
    if (!oldPath) return oldUrl;

    const oldFilename = oldPath.split('/').pop();
    if (!oldFilename) return oldUrl;

    if (oldFilename.includes(kodeProduksi.replace(/[#/\\]/g, ''))) {
      console.log(`  [SKIP] File di dalam Object sudah format baru: ${oldFilename}`);
      return oldUrl;
    }

    const newFilename = generateNewFilename(kodeProduksi, label, oldFilename);
    const newPath = `${orderId}/${newFilename}`;

    console.log(`  [SIMULASI MOVE OBJECT FILE] ${oldPath} \n       └──> ${newPath}`);

    const newLink = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${newPath}`;
    
    // Kembalikan struktur object asli, tapi link di dalamnya sudah diperbarui
    return {
      ...oldUrl,
      link: newLink
    };
  }

  // 🟢 PENANGANAN JIKA DATA BERUPA STRING URL BIASA
  const oldPath = getStoragePathFromUrl(oldUrl);
  if (!oldPath) return oldUrl;

  const oldFilename = oldPath.split('/').pop();
  if (!oldFilename) return oldUrl;

  if (oldFilename.includes(kodeProduksi.replace(/[#/\\]/g, ''))) {
    console.log(`  [SKIP] Sudah format baru: ${oldFilename}`);
    return oldUrl;
  }

  const newFilename = generateNewFilename(kodeProduksi, label, oldFilename);
  const newPath = `${orderId}/${newFilename}`;

  console.log(`  [SIMULASI MOVE] ${oldPath} \n       └──> ${newPath}`);

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${newPath}`;
}

export async function runDryRunMigration() {
  console.log('=== MEMULAI SIMULASI MIGRASI UNTUK ORDER TERTENTU ===');

  // Masukkan kode produksi yang kamu berikan persis seperti yang tertulis di database
  const testCodes = ['LCO-05/26-0019']; 

  // Tarik data hanya untuk kode yang ada di testCodes
  const { data: orders, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .in('kode_produksi', testCodes);

  if (fetchError || !orders) {
    console.error('Gagal mengambil data orders:', fetchError);
    return;
  }

  if (orders.length === 0) {
    console.log('Tidak ada order yang ditemukan. Pastikan penulisannya persis sama dengan di database (termasuk huruf besar/kecil dan spasi jika ada).');
    return;
  }

  console.log(`Ditemukan ${orders.length} order untuk disimulasikan.\n`);

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
        const newUrl = await simulateMigrateFile(order[file.key], order.kode_produksi, file.label, order.id);
        if (newUrl && newUrl !== order[file.key]) {
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
          const newUrl = await simulateMigrateFile(step.fileUrl, order.kode_produksi, stepLabel, order.id);
          
          if (newUrl && newUrl !== step.fileUrl) {
            updatedSteps[i] = { ...step, fileUrl: newUrl };
            stepsChanged = true;
            hasChanges = true;
          }
        }
      }

      if (stepsChanged) {
        updatedPayload[stepKey] = updatedSteps;
      }
    }

    if (hasChanges) {
      console.log(`\n  [SIMULASI DB UPDATE] Payload untuk order ${order.kode_produksi}:`);
      console.log(JSON.stringify(updatedPayload, null, 2));
    }
  }

  console.log('\n=== SIMULASI SELESAI ===');
}