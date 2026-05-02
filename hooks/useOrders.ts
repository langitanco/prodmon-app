// app/hooks/useOrders.ts
import { useState, useCallback, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Order, OrderStatus, UserData } from '@/types';
import { triggerOrderNotifications } from '@/lib/orderLogic';

interface UseOrdersProps {
  supabase: SupabaseClient;
  currentUser: (UserData & { id: string }) | null;
  fetchNotifications: () => Promise<void>;
  showAlert: (title: string, message: string, type?: 'success' | 'error') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  setView: (view: 'list' | 'detail' | 'create' | 'edit') => void;
}

export function useOrders({
  supabase,
  currentUser,
  fetchNotifications,
  showAlert,
  showConfirm,
  setView,
}: UseOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select(`*, assigned_user:users!assigned_to ( name ), helper_user:users!helper_id ( name )`)
      .order('created_at', { ascending: false });

    if (data) setOrders(data.map((o: any) => ({
      ...o,
      kendala: Array.isArray(o.kendala) ? o.kendala : [],
    })));
  }, [supabase]);

  const activeOrders = useMemo(() => orders.filter(o => !o.deleted_at), [orders]);

  // ─── Generate Kode Produksi ───────────────────────────────────────────────

  const generateProductionCode = useCallback(() => {
    const now = new Date();
    const prefix = `LCO-${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}-`;
    const existingCodes = orders
      .filter(o => o.kode_produksi?.startsWith(prefix))
      .map(o => parseInt(o.kode_produksi.split('-').pop()!) || 0);
    const max = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }, [orders]);

  // ─── Write Log ────────────────────────────────────────────────────────────

  const writeLog = useCallback(async ({
    order,
    category,
    event,
    ket = '-',
    newVal = '',
    isSystem = false,
    meta = {},
  }: {
    order: Order;
    category: 'STATUS' | 'FILE' | 'KENDALA' | 'QC' | 'REVISI' | 'SISTEM';
    event: string;
    ket?: string;
    newVal?: string;
    isSystem?: boolean;
    meta?: any;
  }) => {
    if (!currentUser && !isSystem) return;

    const { error } = await supabase.from('order_logs').insert([{
      order_id: order.id,
      kode_produksi: order.kode_produksi,
      category,
      event_name: event,
      description: ket,
      old_value: order.status,
      new_value: newVal || order.status,
      oleh: isSystem ? 'Sistem' : (currentUser?.name || 'Unknown'),
      metadata: meta,
    }]);

    if (error) console.error('Gagal mencatat log R&D:', error);
  }, [currentUser, supabase]);

  // ─── Check Auto Status ────────────────────────────────────────────────────

  const checkAutoStatus = useCallback(async (orderData: Order) => {
    const oldStatus = orderData.status as OrderStatus;
    const hasUnresolvedKendala = orderData.kendala?.some((k: any) => !k.isResolved);

    const type = orderData.jenis_produksi?.toLowerCase() || '';
    const isManual = type.includes('manual') || type.includes('sablon');
    const steps = (isManual ? orderData.steps_manual : orderData.steps_dtf) as any[];
    const productionDone = Array.isArray(steps) && steps.length > 0 && steps.every((s: any) => s.isCompleted);

    let normalStatus = 'Pesanan Masuk';

    if (!orderData.link_approval?.link) {
      normalStatus = 'Pesanan Masuk';
    } else if (!productionDone) {
      normalStatus = 'On Process';
    } else if (!orderData.finishing_qc?.isPassed || !orderData.finishing_packing?.isPacked) {
      if (orderData.finishing_qc?.isPassed === false && orderData.finishing_qc?.notes) {
        normalStatus = 'Revisi';
      } else {
        normalStatus = 'Finishing';
      }
    } else if (!orderData.shipping?.bukti_terima) {
      normalStatus = 'Kirim';
    } else {
      normalStatus = 'Selesai';
    }

    const finalStatus = (hasUnresolvedKendala ? 'Ada Kendala' : normalStatus) as OrderStatus;

    const payload: any = { ...orderData, status: finalStatus };
    delete payload.assigned_user;
    delete payload.helper_user;
    delete payload.id;
    delete payload.created_at;

    const { error } = await supabase.from('orders').update(payload).eq('id', orderData.id);

    if (!error) {
      if (oldStatus !== finalStatus) {
        await writeLog({
          order: orderData,
          category: 'STATUS',
          event: 'Perubahan Status Otomatis',
          ket: `Status berubah dari ${oldStatus} menjadi ${finalStatus}`,
          newVal: finalStatus,
          isSystem: true,
        });
      }
      fetchOrders();
      await triggerOrderNotifications({ ...orderData, status: finalStatus }, oldStatus);
      await fetchNotifications();
    } else {
      console.error('DB Error Details:', JSON.stringify(error, null, 2));
      showAlert('Error Database', error.message || error.details || 'Gagal menyimpan data', 'error');
    }
  }, [supabase, fetchOrders, fetchNotifications, showAlert, writeLog]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const handleCreateOrder = useCallback(async (formData: any) => {
    const payload: any = {
      kode_produksi: generateProductionCode(),
      nama_pemesan: formData.nama,
      no_hp: formData.hp,
      jumlah: parseInt(formData.jumlah) || 0,
      tanggal_masuk: new Date().toISOString().split('T')[0],
      deadline: formData.deadline,
      jenis_produksi: formData.type,
      assigned_to: formData.assigned_to || null,
      helper_id: formData.helper_id || null,
      status: 'Pesanan Masuk',
      steps_manual: [
        { id: 'm1', name: 'Pecah Gambar (PDF)', type: 'upload_pdf', isCompleted: false },
        { id: 'm2', name: 'Print Film', type: 'upload_image', isCompleted: false },
        { id: 'm3', name: 'Proofing', type: 'upload_image', isCompleted: false },
        { id: 'm4', name: 'Produksi Massal', type: 'upload_image', isCompleted: false },
      ],
      steps_dtf: [
        { id: 'd1', name: 'Cetak DTF', type: 'status_update', isCompleted: false },
        { id: 'd2', name: 'Press Kaos', type: 'upload_image', isCompleted: false },
      ],
      finishing_qc: { isPassed: false, notes: '' },
      finishing_packing: { isPacked: false },
      shipping: {},
      kendala: [],
    };

    const { data, error } = await supabase.from('orders').insert([payload]).select().single();
    if (!error) {
      await writeLog({
        order: data,
        category: 'STATUS',
        event: 'Pesanan Masuk',
        ket: 'Pesanan baru dibuat',
        isSystem: true,
      });
      await fetchOrders();
      setView('list');
      showAlert('Sukses', 'Pesanan dibuat');
      triggerOrderNotifications(data);
    } else {
      showAlert('Error', error.message, 'error');
    }
  }, [generateProductionCode, supabase, fetchOrders, showAlert, writeLog, setView]);

  const handleEditOrder = useCallback(async (d: any, selectedOrderId: string) => {
    const updates = {
      nama_pemesan: d.nama,
      no_hp: d.hp,
      jumlah: parseInt(d.jumlah),
      deadline: d.deadline,
      jenis_produksi: d.type,
      assigned_to: d.assigned_to || null,
      helper_id: d.helper_id || null,
    };
    const { error } = await supabase.from('orders').update(updates).eq('id', selectedOrderId);
    if (!error) {
      const old = orders.find(o => o.id === selectedOrderId);
      if (old) await checkAutoStatus({ ...old, ...updates });
      await fetchOrders();
      setView('detail');
      showAlert('Sukses', 'Diupdate');
    }
  }, [supabase, orders, fetchOrders, showAlert, checkAutoStatus, setView]);

  const handleDeleteOrder = useCallback(async (id: string) => {
    const orderToDelete = orders.find(o => o.id === id);
    showConfirm('Hapus?', 'Pindah ke sampah.', async () => {
      const { error } = await supabase.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (!error) {
        if (orderToDelete) {
          await writeLog({
            order: orderToDelete,
            category: 'STATUS',
            event: 'Pesanan Dihapus',
            ket: 'Pesanan dipindahkan ke sampah',
            newVal: 'Sampah',
          });
        }
        await fetchOrders();
        setView('list');
        showAlert('Sukses', 'Dihapus');
      }
    });
  }, [showConfirm, supabase, fetchOrders, showAlert, orders, writeLog, setView]);

  const handleRestoreOrder = useCallback(async (id: string) => {
    const orderToRestore = orders.find(o => o.id === id);
    const { error } = await supabase.from('orders').update({ deleted_at: null }).eq('id', id);
    if (!error) {
      if (orderToRestore) {
        await writeLog({
          order: orderToRestore,
          category: 'STATUS',
          event: 'Pesanan Dipulihkan',
          ket: 'Pesanan dikembalikan dari sampah',
          newVal: orderToRestore.status,
        });
      }
      fetchOrders();
      showAlert('Sukses', 'Dipulihkan');
    }
  }, [supabase, fetchOrders, showAlert, orders, writeLog]);

  const handlePermanentDelete = useCallback(async (id: string) => {
    showConfirm('Hapus Permanen?', 'Data dan semua file lampiran akan hilang selamanya.', async () => {
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select('link_approval, steps_manual, steps_dtf, finishing_packing, shipping, kendala')
          .eq('id', id)
          .single();

        if (orderData) {
          const BUCKET_NAME = 'production-proofs';
          const filesToDelete: string[] = [];

          const extractPath = (rawPath: string) => {
            if (typeof rawPath !== 'string' || !rawPath.includes(`/${BUCKET_NAME}/`)) return;
            const path = decodeURIComponent(rawPath).split(`/${BUCKET_NAME}/`)[1]?.split('?')[0];
            if (path) filesToDelete.push(path);
          };

          const processData = (obj: any) => {
            if (!obj) return;
            if (typeof obj === 'string') extractPath(obj);
            else if (Array.isArray(obj)) obj.forEach(processData);
            else if (typeof obj === 'object') Object.values(obj).forEach(processData);
          };

          processData(orderData);
          if (filesToDelete.length > 0) {
            await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
          }
        }

        const { error: logError } = await supabase.from('order_logs').delete().eq('order_id', id);
        if (logError) console.error('Gagal menghapus log:', logError);

        const { error: dbError } = await supabase.from('orders').delete().eq('id', id);
        if (!dbError) {
          await fetchOrders();
          showAlert('Sukses', 'Order dan file terkait telah dihapus selamanya');
        } else {
          throw dbError;
        }
      } catch (err: any) {
        showAlert('Gagal Hapus', err.message, 'error');
      }
    });
  }, [showConfirm, supabase, fetchOrders, showAlert]);

  return {
    orders,
    activeOrders,
    fetchOrders,
    writeLog,
    checkAutoStatus,
    handleCreateOrder,
    handleEditOrder,
    handleDeleteOrder,
    handleRestoreOrder,
    handlePermanentDelete,
  };
}