// hooks/useUpload.ts
import { useState, useRef, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { getDocumentLabel, generateStorageFilename } from '@/lib/utils';
import imageCompression from 'browser-image-compression';
import { Order, UserData } from '@/types';

interface UploadContextState {
  type: string;
  stepId?: string;
  kendalaId?: string;
}

interface UseUploadProps {
  supabase: SupabaseClient;
  currentUser: (UserData & { id: string }) | null;
  orders: Order[];
  selectedOrderId: string | null;
  checkAutoStatus: (order: Order) => Promise<void>;
  writeLog: (params: {
    order: Order;
    category: 'STATUS' | 'FILE' | 'KENDALA' | 'QC' | 'REVISI' | 'SISTEM';
    event: string;
    ket?: string;
    newVal?: string;
    isSystem?: boolean;
    meta?: any;
  }) => Promise<void>;
  showAlert: (title: string, message: string, type?: 'success' | 'error') => void;
}

export function useUpload({
  supabase,
  currentUser,
  orders,
  selectedOrderId,
  checkAutoStatus,
  writeLog,
  showAlert,
}: UseUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadContext, setUploadContext] = useState<UploadContextState | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const triggerUpload = useCallback((targetType: string, stepId?: string, kendalaId?: string) => {
    setUploadContext({ type: targetType, stepId, kendalaId });
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
    }, 50);
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || !selectedOrderId || !uploadContext) return;

  // 🟢 Ambil data order dulu — dibutuhkan untuk penamaan file
  const order = orders.find((o: Order) => o.id === selectedOrderId);
  if (!order) return;

  setIsUploading(true);
  let processedFile = file;

  if (file.type.startsWith('image/')) {
    try {
      processedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
    } catch (error) {
      console.error('Kompresi gagal, pakai asli', error);
    }
  } else if (file.type === 'application/pdf') {
    const MAX_MB = 15;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`File PDF terlalu besar (> ${MAX_MB}MB). Harap kecilkan ukuran file.`);
      setIsUploading(false);
      return;
    }
  }

  // 🟢 Cari nama step (kalau type === 'step') untuk label dokumen
  let stepName: string | undefined;
  if (uploadContext.type === 'step' && uploadContext.stepId) {
    const steps = order.jenis_produksi === 'manual' ? order.steps_manual : order.steps_dtf;
    const step = steps?.find((s: any) => s.id === uploadContext.stepId);
    stepName = (step as any)?.name;
  }

  // 🟢 Susun nama file terstruktur: YYYY-MM-DD_KodeProduksi_JenisDokumen.ext
  const docLabel = getDocumentLabel(uploadContext.type, stepName);
  const ext = processedFile.name.split('.').pop();
  const baseFilename = generateStorageFilename(docLabel, order.kode_produksi);
  const fileName = `${selectedOrderId}/${baseFilename}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('production-proofs')
    .upload(fileName, processedFile, { upsert: true }); // 🟢 upsert:true — replace kalau upload ulang/revisi

  if (uploadError) {
    showAlert('Gagal Upload', uploadError.message, 'error');
    setIsUploading(false);
    return;
  }

  const { data: urlData } = supabase.storage.from('production-proofs').getPublicUrl(fileName);

  // (hapus baris "const order = orders.find(...)" yang lama di bawah sini, karena sudah diambil di atas)

  await writeLog({
    order,
    category: 'FILE',
    event: `Upload File ${uploadContext.type}`,
    ket: `Nama File: ${baseFilename}.${ext}`, // 🟢 log pakai nama baru yang jelas
    meta: { url: urlData.publicUrl, context: uploadContext },
  });

  // ...lanjut kode yang sudah ada (updatedOrder, dst) — tidak perlu diubah

    const updatedOrder = JSON.parse(JSON.stringify(order));
    const common = {
      fileUrl: urlData.publicUrl,
      timestamp: new Date().toLocaleString(),
      uploadedBy: currentUser?.name,
    };

    if (uploadContext.type === 'approval') {
      updatedOrder.link_approval = {
        link: urlData.publicUrl,
        by: currentUser?.name,
        timestamp: common.timestamp,
      };
    } else if (uploadContext.type === 'step' && uploadContext.stepId) {
      const steps = updatedOrder.jenis_produksi === 'manual'
        ? updatedOrder.steps_manual
        : updatedOrder.steps_dtf;
      const idx = steps.findIndex((s: any) => s.id === uploadContext.stepId);

      if (idx >= 0) {
        const isProofing = steps[idx].name.toLowerCase().includes('proofing');
        steps[idx] = {
          ...steps[idx],
          fileUrl: urlData.publicUrl,
          timestamp: common.timestamp,
          uploadedBy: currentUser?.name,
          isCompleted: !isProofing,
          proofing_note: isProofing ? undefined : steps[idx].proofing_note,
        };
      }
    } else if (uploadContext.type === 'packing') {
      updatedOrder.finishing_packing = { isPacked: true, ...common };
    } else if (uploadContext.type === 'shipping_kirim') {
      updatedOrder.shipping.bukti_kirim = urlData.publicUrl;
    } else if (uploadContext.type === 'shipping_terima') {
      updatedOrder.shipping.bukti_terima = urlData.publicUrl;
    } else if (uploadContext.type === 'kendala_bukti' && uploadContext.kendalaId) {
      const idx = updatedOrder.kendala.findIndex((k: any) => k.id === uploadContext.kendalaId);
      if (idx >= 0) updatedOrder.kendala[idx].buktiFile = urlData.publicUrl;
    }

    await checkAutoStatus(updatedOrder);

    setIsUploading(false);
    setUploadContext(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showAlert('Sukses', 'File terupload');
  }, [selectedOrderId, uploadContext, supabase, orders, currentUser, writeLog, checkAutoStatus, showAlert]);

  return {
    fileInputRef,
    isUploading,
    triggerUpload,
    handleFileChange,
  };
}