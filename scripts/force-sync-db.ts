import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const BUCKET_NAME = 'production-proofs';

function getNewFilename(oldUrl: string, kodeProduksi: string, label: string): string | null {
  if (!oldUrl || typeof oldUrl !== 'string') return null;
  const parts = oldUrl.split('/');
  const oldFilename = parts.pop();
  if (!oldFilename) return null;
  
  if (oldFilename.includes(kodeProduksi.replace(/[#/\\]/g, ''))) return oldFilename;

  const nameWithoutExt = oldFilename.split('.')[0];
  const ext = oldFilename.split('.').pop();

  let fileDate = new Date();
  if (/^\d+$/.test(nameWithoutExt)) {
    fileDate = new Date(Number(nameWithoutExt));
  }

  const tglIso = fileDate.toISOString().split('T')[0];
  const sanitizeKode = kodeProduksi.replace(/[#/\\]/g, '').replace(/\s+/g, '-').trim();
  return `${tglIso}_${sanitizeKode}_${label}.${ext}`;
}

export async function forceSyncDatabase() {
  console.log('=== MEMULAI RECOVERY: FORCE SYNC DATABASE (MULTI-ROW MODE) ===');
  const targetKode = 'LCO-05/26-0019';

  // 🟢 PERBAIKAN: Menggunakan query biasa tanpa .single() agar tidak crash jika ada data ganda
  const { data: orders, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('kode_produksi', targetKode);

  if (fetchError) {
    console.error('❌ Gagal mengambil data order dari DB:', fetchError.message);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log('⚠️ Tidak ada order yang ditemukan dengan kode tersebut.');
    return;
  }

  console.log(`Ditemukan ${orders.length} data order dengan kode yang sama. Memproses semua...`);

  // Lakukan looping untuk memperbaiki semua data yang barangkali ganda
  for (const order of orders) {
    console.log(`\nMemperbaiki Dokumen Link untuk ID Order: ${order.id}`);
    const updatedPayload: any = {};
    let hasChanges = false;

    // 1. Koreksi kolom link_approval
    if (order.link_approval && typeof order.link_approval === 'object' && 'link' in order.link_approval) {
      const newFilename = getNewFilename(order.link_approval.link, order.kode_produksi, 'ApprovalDesain');
      if (newFilename) {
        updatedPayload.link_approval = {
          ...order.link_approval,
          link: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${order.id}/${newFilename}`
        };
        hasChanges = true;
      }
    }

    // 2. Koreksi kolom steps_manual
    if (Array.isArray(order.steps_manual)) {
      const currentSteps = order.steps_manual;
      let stepsChanged = false;

      const updatedSteps = currentSteps.map((step: any) => {
        if (step && step.fileUrl) {
          const stepLabel = step.name ? step.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '') : 'Produksi';
          const newFilename = getNewFilename(step.fileUrl, order.kode_produksi, stepLabel);
          if (newFilename) {
            stepsChanged = true;
            return {
              ...step,
              fileUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${order.id}/${newFilename}`
            };
          }
        }
        return step;
      });

      if (stepsChanged) {
        updatedPayload.steps_manual = updatedSteps;
        hasChanges = true;
      }
    }

    // Tembakkan pembaruan ke DB per ID order masing-masing
    if (hasChanges) {
      const { error: updateError } = await supabase
        .from('orders')
        .update(updatedPayload)
        .eq('id', order.id);

      if (updateError) {
        console.error(`❌ Gagal memaksa update database untuk ID ${order.id}:`, updateError.message);
      } else {
        console.log(`✅ ID Order ${order.id} berhasil disinkronkan!`);
      }
    } else {
      console.log(`--- ID Order ${order.id} sudah aman/tidak perlu update.`);
    }
  }
  console.log('\n=== RECOVERY SELESAI ===');
}