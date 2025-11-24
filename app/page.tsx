'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, CheckCircle, Package, Truck, 
  ClipboardList, LogOut, Calendar, ChevronRight, Loader2,
  Phone, AlertTriangle, BarChart3, Clock, ShieldCheck, Filter,
  RefreshCw, Pencil, Save, X, Eye, EyeOff, FileText, Search, Trash2,
  LayoutDashboard, Users, Settings, Menu, MessageSquare, TrendingUp,
  Info, AlertCircle
} from 'lucide-react';

// ============================================================================
// [KONFIGURASI SUPABASE]
// ============================================================================

// 1. SAAT DI VS CODE / LAPTOP (PRODUCTION):
// Hapus tanda komentar (//) pada baris import di bawah ini agar konek ke DB asli:
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || '';
const supabaseKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || '';

// Jika import di atas diaktifkan, aktifkan juga baris ini:
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key');

// --- TYPE DEFINITIONS ---

type UserRole = 'admin' | 'produksi' | 'qc' | 'manager' | 'supervisor';
type OrderStatus = 'Pesanan Masuk' | 'On Process' | 'Finishing' | 'Revisi' | 'Kirim' | 'Selesai' | 'Ada Kendala';

interface UserData {
  id: string;
  username: string;
  password: string; 
  name: string;
  role: UserRole;
}

interface ProductionStep {
  id: string;
  name: string;
  type: 'upload_pdf' | 'upload_image' | 'status_update';
  isCompleted: boolean;
  timestamp?: string;
  uploadedBy?: string;
  fileUrl?: string;
}

interface KendalaNote {
  id: string;
  notes: string;
  reportedBy: string;
  timestamp: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedTimestamp?: string;
  buktiFile?: string;
}

interface ProductionTypeData {
  id: string;
  name: string;
  value: string;
}

interface Order {
  id: string;
  kode_produksi: string;
  nama_pemesan: string;
  no_hp: string;
  jumlah: number;
  tanggal_masuk: string;
  deadline: string;
  jenis_produksi: string;
  status: OrderStatus;
  
  link_approval?: { link: string; by?: string; timestamp?: string; } | null;

  steps_manual: ProductionStep[];
  steps_dtf: ProductionStep[];
  finishing_qc: { isPassed: boolean; notes: string; checkedBy?: string; timestamp?: string; };
  
  // UPDATE: Tambahkan packedBy
  finishing_packing: { isPacked: boolean; timestamp?: string; fileUrl?: string; packedBy?: string; };
  
  // UPDATE: Tambahkan info uploader shipping
  shipping: { 
    bukti_kirim?: string; 
    bukti_terima?: string; 
    timestamp_kirim?: string; 
    timestamp_terima?: string;
    uploaded_by_kirim?: string;  // BARU
    uploaded_by_terima?: string; // BARU
  };
  
  kendala: KendalaNote[];
  deleted_at?: string | null; 
}

// --- CONSTANTS ---

const INITIAL_STEPS_MANUAL: ProductionStep[] = [
  { id: 'm1', name: 'Pecah Gambar (PDF)', type: 'upload_pdf', isCompleted: false },
  { id: 'm2', name: 'Print Film', type: 'upload_image', isCompleted: false },
  { id: 'm3', name: 'Proofing', type: 'upload_image', isCompleted: false },
  { id: 'm4', name: 'Produksi Massal', type: 'upload_image', isCompleted: false },
];

const INITIAL_STEPS_DTF: ProductionStep[] = [
  { id: 'd1', name: 'Cetak DTF', type: 'status_update', isCompleted: false },
  { id: 'd2', name: 'Press Kaos', type: 'upload_image', isCompleted: false },
];

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DEFAULT_USERS: UserData[] = [
  { id: '1', username: 'supervisor', password: '123', name: 'Supervisor', role: 'supervisor' },
  { id: '2', username: 'admin', password: '123', name: 'Admin Utama', role: 'admin' },
  { id: '3', username: 'prod', password: '123', name: 'Staff Produksi', role: 'produksi' },
  { id: '4', username: 'qc', password: '123', name: 'Staff QC', role: 'qc' },
  { id: '5', username: 'manager', password: '123', name: 'Manager/CEO', role: 'manager' },
];

const DEFAULT_PRODUCTION_TYPES: ProductionTypeData[] = [
  { id: '1', name: 'Manual', value: 'manual' },
  { id: '2', name: 'DTF', value: 'dtf' },
];

// --- HELPER FUNCTIONS ---

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getDeadlineStatus = (deadlineStr: string, status: OrderStatus) => {
  if (status === 'Selesai') return 'safe';
  const deadline = new Date(deadlineStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 2) return 'warning';
  return 'safe';
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'Pesanan Masuk': return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'On Process': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Finishing': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Revisi': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Ada Kendala': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Kirim': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'Selesai': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const openWA = (hp: string) => {
  if (!hp) return;
  let formatted = hp.replace(/\D/g, '');
  if (formatted.startsWith('0')) formatted = '62' + formatted.slice(1);
  window.open(`https://wa.me/${formatted}`, '_blank');
};

// --- MAIN COMPONENT ---

export default function ProductionApp() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'settings' | 'trash'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionTypeData[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Sidebar default false (closed) on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // CUSTOM ALERT STATE
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'success' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<{ type: string, stepId?: string, kendalaId?: string } | null>(null);

  // --- CUSTOM ALERT HANDLERS ---
  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setAlertState({ isOpen: true, title, message, type, onConfirm: undefined });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlertState({ isOpen: true, title, message, type: 'confirm', onConfirm });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  // Set Document Title
  useEffect(() => {
    document.title = "ProdMon - Sistem Produksi";
  }, []);

  // Load user session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchOrders();
      await fetchUsers();
      await fetchProductionTypes();
    };
    loadData();

    // @ts-ignore
    const channel = supabase.channel('realtime-db')
      // @ts-ignore
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      // @ts-ignore
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchUsers())
      // @ts-ignore
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_types' }, () => fetchProductionTypes())
      .subscribe();
    
    // @ts-ignore
    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const fetchOrders = async () => {
    // @ts-ignore
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error) {
      const ordersWithKendala = (data || []).map((order: any) => ({
        ...order,
        kendala: (order.kendala || []).map((k: any) => ({
          ...k,
          isResolved: k.isResolved || false
        }))
      }));
      const filteredOrders = currentUser?.role === 'supervisor' 
        ? ordersWithKendala 
        : ordersWithKendala.filter((o: Order) => !o.deleted_at);
      setOrders(filteredOrders);
    }
  };

  const fetchUsers = async () => {
    // @ts-ignore
    const { data, error } = await supabase.from('users').select('*').order('username');
    if (error || !data || data.length === 0) {
      if(usersList.length === 0) setUsersList(DEFAULT_USERS); 
    } else {
      setUsersList(data);
    }
  };

  const fetchProductionTypes = async () => {
    // @ts-ignore
    const { data, error } = await supabase.from('production_types').select('*').order('name');
    if (error || !data || data.length === 0) {
      if(productionTypes.length === 0) setProductionTypes(DEFAULT_PRODUCTION_TYPES);
    } else {
      setProductionTypes(data);
    }
  };

  const handleLogin = (user: UserData) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setActiveTab('dashboard');
    setView('list');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setView('list');
  };

  // --- LOGIC Upload & Updates ---
  const handleSaveUser = async (userData: any) => {
    if (!currentUser || currentUser.role !== 'supervisor') return;
    if (!userData.id) {
       const exists = usersList.find(u => u.username === userData.username);
       if(exists) { showAlert('Gagal', 'Username sudah dipakai!', 'error'); return; }
    }
    const payload = {
      username: userData.username,
      password: userData.password,
      name: userData.name,
      role: userData.role
    };
    let error;
    if (userData.id) {
      // @ts-ignore
      const res = await supabase.from('users').update(payload).eq('id', userData.id);
      error = res.error;
      if(!error) {
        await fetchUsers();
        showAlert('Sukses', 'Data user berhasil diperbarui!');
      } else {
        showAlert('Error', 'Gagal update user: ' + error.message, 'error');
      }
    } else {
      // @ts-ignore
      const res = await supabase.from('users').insert([payload]);
      error = res.error;
      if(!error) {
        await fetchUsers();
        showAlert('Sukses', 'User baru berhasil ditambahkan!');
      } else {
        showAlert('Error', 'Gagal tambah user: ' + error.message, 'error');
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!currentUser || currentUser.role !== 'supervisor') return;
    showConfirm('Hapus Pengguna?', 'Yakin ingin menghapus pengguna ini?', async () => {
      // @ts-ignore
      const { error } = await supabase.from('users').delete().eq('id', id);
      if(!error) {
        await fetchUsers();
        showAlert('Sukses', 'User berhasil dihapus!');
      } else {
        showAlert('Error', 'Gagal hapus user: ' + error.message, 'error');
      }
    });
  };

  const handleSaveProductionType = async (prodTypeData: any) => {
    if (!currentUser || currentUser.role !== 'supervisor') return;
    if (!prodTypeData.id) {
       const exists = productionTypes.find(pt => pt.value === prodTypeData.value);
       if(exists) { showAlert('Gagal', 'Jenis produksi sudah ada!', 'error'); return; }
    }
    const payload = {
      name: prodTypeData.name,
      value: prodTypeData.value
    };
    let error;
    if (prodTypeData.id) {
      // @ts-ignore
      const res = await supabase.from('production_types').update(payload).eq('id', prodTypeData.id);
      error = res.error;
      if(!error) {
        await fetchProductionTypes();
        showAlert('Sukses', 'Jenis produksi berhasil diperbarui!');
      } else {
        setProductionTypes(prev => prev.map(pt => pt.id === prodTypeData.id ? prodTypeData : pt));
        showAlert('Info', 'Data diupdate secara lokal (DB error)', 'error');
      }
    } else {
      // @ts-ignore
      const res = await supabase.from('production_types').insert([payload]);
      error = res.error;
      if(!error) {
        await fetchProductionTypes();
        showAlert('Sukses', 'Jenis produksi baru berhasil ditambahkan!');
      } else {
        setProductionTypes(prev => [...prev, { ...prodTypeData, id: Date.now().toString() }]);
        showAlert('Info', 'Data ditambahkan secara lokal (DB error)', 'error');
      }
    }
  };

  const handleDeleteProductionType = async (id: string) => {
    if (!currentUser || currentUser.role !== 'supervisor') return;
    showConfirm('Hapus Jenis Produksi?', 'Data yang dihapus tidak bisa dikembalikan.', async () => {
      // @ts-ignore
      const { error } = await supabase.from('production_types').delete().eq('id', id);
      if(!error) {
        await fetchProductionTypes();
        showAlert('Sukses', 'Jenis produksi berhasil dihapus!');
      } else {
        showAlert('Error', 'Gagal hapus jenis produksi: ' + error.message, 'error');
      }
    });
  };

  const handleDeleteOrder = async (id: string) => {
    if (!currentUser || currentUser.role !== 'supervisor') return;
    showConfirm('Pindahkan ke Sampah?', 'Pesanan ini akan dipindahkan ke folder sampah.', async () => {
      const updatePayload = { deleted_at: new Date().toISOString() };
      // @ts-ignore
      const { error } = await supabase.from('orders').update(updatePayload).eq('id', id);
      if(!error) {
        await fetchOrders();
        showAlert('Sukses', 'Pesanan berhasil dipindahkan ke sampah!');
        setSelectedOrderId(null);
        setView('list');
      } else {
        showAlert('Error', 'Gagal hapus pesanan: ' + error.message, 'error');
      }
    });
  };

  const handleRestoreOrder = async (id: string) => {
    if (!currentUser || currentUser.role !== 'supervisor') return;
    showConfirm('Pulihkan Pesanan?', 'Pesanan akan kembali ke daftar aktif.', async () => {
      const updatePayload = { deleted_at: null };
      // @ts-ignore
      const { error } = await supabase.from('orders').update(updatePayload).eq('id', id);
      if(!error) {
        await fetchOrders();
        showAlert('Sukses', 'Pesanan berhasil dipulihkan!');
      } else {
        showAlert('Error', 'Gagal pulihkan pesanan: ' + error.message, 'error');
      }
    });
  };

  const handlePermanentDeleteOrder = async (id: string) => {
    if (!currentUser || currentUser.role !== 'supervisor') return;
    showConfirm('HAPUS PERMANEN?', 'PERINGATAN: Data akan hilang selamanya dan tidak bisa dikembalikan!', async () => {
      // @ts-ignore
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if(!error) {
        await fetchOrders();
        showAlert('Sukses', 'Pesanan berhasil dihapus permanen!');
      } else {
        showAlert('Error', 'Gagal hapus permanen: ' + error.message, 'error');
      }
    });
  };

  const triggerUpload = (targetType: string, stepId?: string, kendalaId?: string) => {
    uploadTargetRef.current = { type: targetType, stepId, kendalaId };
    fileInputRef.current?.click();
  };

 
  // Cari fungsi handleFileChange dan ganti isinya dengan ini:

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrderId || !uploadTargetRef.current) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedOrderId}/${Date.now()}.${fileExt}`;
      // @ts-ignore
      const { error: uploadError } = await supabase.storage.from('production-proofs').upload(fileName, file);
      if (uploadError) throw uploadError;
      // @ts-ignore
      const { data: urlData } = supabase.storage.from('production-proofs').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      const timestamp = new Date().toLocaleString();
      // Ambil nama user yang sedang login
      const uploaderName = currentUser?.name || currentUser?.role || 'unknown';

      const order = orders.find(o => o.id === selectedOrderId);
      if (!order) return;
      let updatedOrder = { ...order };
      const target = uploadTargetRef.current;
      
      // LOGIKA UPDATE DATA + NAMA UPLOADER
      if (target.type === 'approval') {
          // UPDATE: Simpan sebagai Object JSON
          updatedOrder.link_approval = {
            link: publicUrl,
            by: uploaderName,
            timestamp: timestamp
          };
      }
      else if (target.type === 'step' && target.stepId) {
        const steps = updatedOrder.jenis_produksi === 'manual' ? updatedOrder.steps_manual : updatedOrder.steps_dtf;
        const idx = steps.findIndex(s => s.id === target.stepId);
        if (idx >= 0) {
          steps[idx].isCompleted = true;
          steps[idx].fileUrl = publicUrl;
          steps[idx].timestamp = timestamp;
          steps[idx].uploadedBy = uploaderName; // Simpan Nama
        }
      }
      else if (target.type === 'kendala_bukti' && target.kendalaId) {
        const idx = updatedOrder.kendala.findIndex(k => k.id === target.kendalaId);
        if (idx >= 0) {
          updatedOrder.kendala[idx].buktiFile = publicUrl;
        }
      }
      else if (target.type === 'packing') {
          updatedOrder.finishing_packing.isPacked = true;
          updatedOrder.finishing_packing.timestamp = timestamp;
          updatedOrder.finishing_packing.fileUrl = publicUrl;
          updatedOrder.finishing_packing.packedBy = uploaderName; // Simpan Nama
      } else if (target.type === 'shipping_kirim') {
          updatedOrder.shipping.bukti_kirim = publicUrl;
          updatedOrder.shipping.timestamp_kirim = timestamp;
          updatedOrder.shipping.uploaded_by_kirim = uploaderName; // Simpan Nama
      } else if (target.type === 'shipping_terima') {
          updatedOrder.shipping.bukti_terima = publicUrl;
          updatedOrder.shipping.timestamp_terima = timestamp;
          updatedOrder.shipping.uploaded_by_terima = uploaderName; // Simpan Nama
      }
      await saveOrderUpdate(updatedOrder);
    } catch (error: any) {
      showAlert('Error', 'Gagal upload: ' + error.message, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const checkAutoStatus = (order: Order): Order => {
    let updated = { ...order };
    
    // Cek Kendala
    const hasUnresolvedKendala = updated.kendala && updated.kendala.some(k => !k.isResolved);
    if (hasUnresolvedKendala) {
      updated.status = 'Ada Kendala';
      return updated;
    }

    const hasApproval = !!(updated.link_approval && updated.link_approval.link);
    const steps = updated.jenis_produksi === 'manual' ? updated.steps_manual : updated.steps_dtf;
    const isProductionDone = steps.every(s => s.isCompleted);
    const isQCPassed = updated.finishing_qc.isPassed;
    // Logika Revisi: Tidak lolos QC DAN ada catatannya
    const isQCRevisi = !isQCPassed && updated.finishing_qc.notes && updated.finishing_qc.notes !== 'Lolos QC'; 
    const isPacked = updated.finishing_packing.isPacked;
    const hasResi = !!updated.shipping.bukti_kirim;
    const hasTerima = !!updated.shipping.bukti_terima;

    if (!hasApproval) {
      updated.status = 'Pesanan Masuk';
    } else {
      if (!isProductionDone) {
        updated.status = 'On Process';
      } else {
        if (isQCRevisi) {
          updated.status = 'Revisi';
        } else if (!isQCPassed || !isPacked) {
          // Jika QC di-reset (hapus), dia akan masuk ke sini (Finishing)
          updated.status = 'Finishing';
        } else {
          if (!hasResi || !hasTerima) {
            updated.status = 'Kirim';
          } else {
            updated.status = 'Selesai';
          }
        }
      }
    }
    return updated;
  };

  const saveOrderUpdate = async (orderData: Order) => {
    const finalOrder = checkAutoStatus(orderData);
    setOrders(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
    
    const updatePayload: any = {
        nama_pemesan: finalOrder.nama_pemesan,
        no_hp: finalOrder.no_hp,
        jumlah: finalOrder.jumlah,
        deadline: finalOrder.deadline,
        jenis_produksi: finalOrder.jenis_produksi,
        status: finalOrder.status,
        
        // --- FIELD LAMA ---
        link_approval: finalOrder.link_approval,
        
        steps_manual: finalOrder.steps_manual,
        steps_dtf: finalOrder.steps_dtf,
        finishing_qc: finalOrder.finishing_qc,
        finishing_packing: finalOrder.finishing_packing, // packedBy tersimpan otomatis karena ini JSON
        shipping: finalOrder.shipping // uploaded_by tersimpan otomatis karena ini JSON
    };
    
    if (finalOrder.kendala !== undefined) {
      updatePayload.kendala = finalOrder.kendala;
    }
    
    // @ts-ignore
    const { error } = await supabase.from('orders').update(updatePayload).eq('id', finalOrder.id);
    
    if (error) {
      console.error('DB Error:', error);
      // ... error handling
    }
  };

  const generateProductionCode = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const prefix = `LCO-${month}/${year}-`;
    const existingCodes = orders
      .filter(o => o.kode_produksi && o.kode_produksi.startsWith(prefix))
      .map(o => {
        const parts = o.kode_produksi.split('-');
        return parseInt(parts[parts.length - 1]) || 0;
      });
    const maxSequence = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    const nextSequence = maxSequence + 1;
    return `${prefix}${String(nextSequence).padStart(4, '0')}`;
  };

  const handleCreateOrder = async (newOrderData: any) => {
    const newProductionCode = generateProductionCode();
    const payload: any = {
      kode_produksi: newProductionCode,
      nama_pemesan: newOrderData.nama,
      no_hp: newOrderData.hp,
      jumlah: parseInt(newOrderData.jumlah) || 0,
      tanggal_masuk: new Date().toISOString().split('T')[0], 
      deadline: newOrderData.deadline,
      jenis_produksi: newOrderData.type,
      status: 'Pesanan Masuk',
      steps_manual: INITIAL_STEPS_MANUAL,
      steps_dtf: INITIAL_STEPS_DTF,
      finishing_qc: { isPassed: false, notes: '' },
      finishing_packing: { isPacked: false },
      shipping: {}
    };
    payload.kendala = [];
    
    // @ts-ignore
    const { error } = await supabase.from('orders').insert([payload]);
    if (error) {
      if (error.code === '23505') {
         showAlert('Gagal', 'Kode produksi duplikat. Silakan coba simpan lagi.', 'error');
      } else if (!error.message.includes('kendala')) {
         showAlert('Error', 'Gagal: ' + error.message, 'error');
      }
    } else {
      await fetchOrders();
      setView('list');
      showAlert('Sukses', 'Pesanan baru berhasil dibuat!');
    }
  };

  const handleEditOrder = async (editedData: any) => {
    if (!selectedOrderId) return;
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;
    
    const updatedOrder = {
      ...order,
      nama_pemesan: editedData.nama,
      no_hp: editedData.hp,
      jumlah: parseInt(editedData.jumlah) || 0,
      deadline: editedData.deadline,
      jenis_produksi: editedData.type
    };
    
    await saveOrderUpdate(updatedOrder);
    setView('detail');
    showAlert('Sukses', 'Data pesanan berhasil diupdate!');
  };

  if (!currentUser) return <LoginScreen usersList={usersList} onLogin={handleLogin} />;

  const handleNav = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setView('list');
    setSidebarOpen(false);
  };

  const activeOrders = orders.filter(o => !o.deleted_at);
  const deletedOrders = orders.filter(o => o.deleted_at);

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row">
      {/* --- CUSTOM ALERT MODAL --- */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
             <div className={`p-4 flex items-center gap-3 ${alertState.type === 'error' ? 'bg-red-50' : alertState.type === 'confirm' ? 'bg-blue-50' : 'bg-green-50'}`}>
                {alertState.type === 'error' ? <AlertCircle className="w-6 h-6 text-red-600"/> : 
                 alertState.type === 'confirm' ? <AlertTriangle className="w-6 h-6 text-blue-600"/> : 
                 <CheckCircle className="w-6 h-6 text-green-600"/>}
                <h3 className={`font-bold text-lg ${alertState.type === 'error' ? 'text-red-800' : alertState.type === 'confirm' ? 'text-blue-800' : 'text-green-800'}`}>
                  {alertState.title}
                </h3>
             </div>
             <div className="p-6">
                <p className="text-slate-600 font-medium">{alertState.message}</p>
             </div>
             <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                {alertState.type === 'confirm' && (
                  <button 
                    onClick={closeAlert}
                    className="px-4 py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (alertState.type === 'confirm' && alertState.onConfirm) {
                      alertState.onConfirm();
                    }
                    closeAlert();
                  }}
                  className={`px-6 py-2 rounded-lg text-white font-bold text-sm shadow-lg transition transform active:scale-95 ${alertState.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {alertState.type === 'confirm' ? 'Ya, Lanjutkan' : 'OK'}
                </button>
             </div>
          </div>
        </div>
      )}

      <input type="file" hidden ref={fileInputRef} accept="image/*,application/pdf" onChange={handleFileChange} />
      {uploading && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center text-white flex-col backdrop-blur-sm">
          <Loader2 className="w-12 h-12 animate-spin mb-3 text-blue-400" />
          <p className="font-bold text-lg">Mengupload...</p>
        </div>
      )}

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[55] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-slate-900 text-white z-[60] 
        transition-transform duration-300 ease-in-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 flex flex-col shrink-0
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><ClipboardList className="w-6 h-6 text-white"/></div>
            <div>
              <h1 className="font-bold text-xl tracking-wide">ProdMon</h1>
              <div className="text-xs text-slate-400 font-medium">Monitoring Produksi</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">V.3.0</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-slate-400 hover:text-white">
              <X className="w-6 h-6"/>
            </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 uppercase mb-1 font-semibold">Login Sebagai</div>
              <div className="font-bold text-white truncate text-lg">{currentUser.name}</div>
              <div className="text-xs text-blue-400 font-bold uppercase mt-1 tracking-wider">{currentUser.role}</div>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => handleNav('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard className="w-5 h-5"/> Dashboard
            </button>
            <button 
              onClick={() => handleNav('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <ClipboardList className="w-5 h-5"/> Daftar Pesanan
            </button>
            
            {currentUser.role === 'supervisor' && (
              <>
                <button 
                  onClick={() => handleNav('trash')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'trash' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Trash2 className="w-5 h-5"/> Sampah
                </button>
                <button 
                  onClick={() => handleNav('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Settings className="w-5 h-5"/> Pengaturan
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition w-full font-medium">
            <LogOut className="w-5 h-5"/> Keluar Aplikasi
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-white px-4 py-3 shadow-md flex items-center justify-between sticky top-0 z-50 border-b">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200 transition">
                <Menu className="w-6 h-6"/>
              </button>
              <span className="font-bold text-slate-800 text-lg">ProdMon</span>
            </div>
            <div className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded uppercase tracking-wide">{currentUser.role}</div>
        </header>

        {/* UPDATE MARGIN & PADDING FOR MOBILE 
          - px-4 (16px) for horizontal margin on mobile
          - py-6 (24px) for vertical spacing between header and content titles
          - md:p-8 retains the spacious layout on desktop
        */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 pb-24">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
               <Dashboard role={currentUser.role} orders={activeOrders} onSelectOrder={(id: string) => { setSelectedOrderId(id); setView('detail'); setActiveTab('orders'); }} />
            )}

            {activeTab === 'orders' && (
               <>
                 {view === 'list' && (
                   <OrderList 
                     role={currentUser.role} 
                     orders={activeOrders} 
                     productionTypes={productionTypes}
                     onSelectOrder={(id: string) => { setSelectedOrderId(id); setView('detail'); }} 
                     onNewOrder={() => setView('create')}
                     onDeleteOrder={handleDeleteOrder}
                   />
                 )}
                 {view === 'create' && <CreateOrder productionTypes={productionTypes} onCancel={() => setView('list')} onSubmit={handleCreateOrder}/>}
                 {view === 'edit' && selectedOrderId && (
                   <EditOrder 
                     order={orders.find(o => o.id === selectedOrderId)!}
                     productionTypes={productionTypes}
                     onCancel={() => setView('detail')} 
                     onSubmit={handleEditOrder}
                   />
                 )}
                 {view === 'detail' && selectedOrderId && (
                    <OrderDetail 
                      currentUser={currentUser} // UPDATE: Pass full user object
                      order={orders.find(o => o.id === selectedOrderId)!}
                      onBack={() => { setSelectedOrderId(null); setView('list'); }}
                      onEdit={() => setView('edit')}
                      onTriggerUpload={triggerUpload}
                      onUpdateOrder={saveOrderUpdate}
                      onDelete={handleDeleteOrder}
                      onConfirm={showConfirm}
                    />
                  )}
               </>
            )}

            {activeTab === 'trash' && currentUser.role === 'supervisor' && (
               <TrashView 
                 orders={deletedOrders} 
                 onRestore={handleRestoreOrder}
                 onPermanentDelete={handlePermanentDeleteOrder}
               />
            )}

            {activeTab === 'settings' && currentUser.role === 'supervisor' && (
               <SettingsPage 
                 users={usersList} 
                 productionTypes={productionTypes}
                 onSaveUser={handleSaveUser} 
                 onDeleteUser={handleDeleteUser}
                 onSaveProductionType={handleSaveProductionType}
                 onDeleteProductionType={handleDeleteProductionType}
               />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS (Updated Layout for Mobile) ---

function LoginScreen({ usersList, onLogin }: { usersList: UserData[], onLogin: (u: UserData) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = usersList.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Username atau Password salah!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="p-8 w-full">
            <div className="text-center mb-8">
              <div className="bg-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <ClipboardList className="w-8 h-8 text-white"/>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">Selamat Datang</h2>
              <p className="text-slate-600 text-sm mt-1 font-medium">Silakan login untuk melanjutkan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 tracking-wide">Username</label>
                <input 
                  type="text" 
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-800 placeholder-slate-400"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 tracking-wide">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-800 placeholder-slate-400 pr-12"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {error && <div className="text-red-600 text-sm text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}

              <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg active:scale-[0.98] transform">
                Login System
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <strong>Default Login:</strong><br/>
              supervisor/123, admin/123, prod/123, qc/123, manager/123
            </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ role, orders, onSelectOrder }: any) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const ordersThisMonth = orders.filter((o: Order) => {
    const orderDate = new Date(o.tanggal_masuk);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });

  const totalPcsThisMonth = ordersThisMonth.reduce((sum: number, o: Order) => sum + o.jumlah, 0);

  const stats = {
    total: orders.length,
    pcsThisMonth: totalPcsThisMonth,
    process: orders.filter((o: any) => o.status === 'On Process' || o.status === 'Finishing').length,
    overdue: orders.filter((o: any) => getDeadlineStatus(o.deadline, o.status) === 'overdue').length,
    completed: orders.filter((o: any) => o.status === 'Selesai').length,
    totalPcs: orders.reduce((sum: number, o: Order) => sum + o.jumlah, 0)
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 md:mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
        {[
          { label: 'Total Order', val: stats.total, bg: 'bg-white', text: 'text-slate-800', border: 'border-slate-200' },
          { label: 'PCS Bulan Ini', val: stats.pcsThisMonth, bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-100' },
          { label: 'Sedang Proses', val: stats.process, bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-100' },
          { label: 'Telat Deadline', val: stats.overdue, bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-100' },
          { label: 'Selesai', val: stats.completed, bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-100' },
          { label: 'Total PCS', val: stats.totalPcs, bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-100' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-2 md:p-5 rounded-xl shadow-sm border ${s.border}`}>
            <div className={`${s.text} opacity-70 text-[9px] md:text-xs font-bold uppercase whitespace-nowrap truncate`}>{s.label}</div>
            <div className={`text-xl md:text-3xl font-extrabold ${s.text} mt-0.5 md:mt-1`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-3 md:p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-md md:text-lg text-slate-800">Pesanan Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600 min-w-full md:min-w-[600px]">
            <thead className="bg-slate-50 text-[10px] md:text-xs uppercase font-bold text-slate-600">
              <tr>
                <th className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap">Kode</th>
                <th className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap">Pemesan</th>
                <th className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap">Status</th>
                <th className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap">Deadline</th>
                <th className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 5).map((o: any) => {
                const deadlineStatus = getDeadlineStatus(o.deadline, o.status);
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition text-[10px] md:text-sm">
                    <td className="px-2 py-2 md:px-6 md:py-4 font-mono font-medium text-slate-500 whitespace-nowrap">{o.kode_produksi}</td>
                    <td className="px-2 py-2 md:px-6 md:py-4 font-bold text-slate-800 whitespace-nowrap max-w-[100px] md:max-w-none truncate">{o.nama_pemesan}</td>
                    <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-extrabold uppercase tracking-wide border whitespace-nowrap ${getStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className={`px-2 py-2 md:px-6 md:py-4 font-medium whitespace-nowrap ${deadlineStatus === 'overdue' ? 'text-red-600 font-bold' : 'text-slate-700'}`}>{formatDate(o.deadline)}</td>
                    <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap text-right">
                      <button onClick={() => onSelectOrder(o.id)} className="text-blue-600 hover:text-blue-800 text-[9px] md:text-xs font-bold bg-blue-50 px-2 py-1 md:px-3 md:py-1.5 rounded border border-blue-100">Detail</button>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">Belum ada pesanan</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrashView({ orders, onRestore, onPermanentDelete }: any) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Sampah</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">{orders.length} pesanan terhapus</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
          <Trash2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-400 font-medium">Sampah kosong</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
          {orders.map((order: Order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-300 p-4 md:p-5 relative overflow-hidden opacity-75">
              <div className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-bl-lg">DIHAPUS</div>
              
              <div className="flex justify-between items-start mb-2 md:mb-4 mt-1">
                <span className="text-[10px] md:text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md">#{order.kode_produksi}</span>
                <span className={`text-[9px] md:text-[10px] font-extrabold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border uppercase tracking-wide whitespace-nowrap ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
              <h3 className="font-bold text-sm md:text-lg text-slate-800 line-clamp-1 mb-0.5 leading-tight">{order.nama_pemesan}</h3>
              <div className="text-[10px] md:text-xs text-slate-500 mb-2 md:mb-4 font-medium">
                Dihapus: {order.deleted_at ? formatDate(order.deleted_at) : '-'}
              </div>
              
              <div className="mt-2 flex gap-2">
                <button 
                  onClick={() => onRestore(order.id)}
                  className="flex-1 bg-green-600 text-white px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-green-700 transition border border-green-700 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5"/> Pulihkan
                </button>
                <button 
                  onClick={() => onPermanentDelete(order.id)}
                  className="flex-1 bg-red-600 text-white px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-red-700 transition border border-red-700 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5"/> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderList({ role, orders, productionTypes, onSelectOrder, onNewOrder, onDeleteOrder }: any) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredOrders = orders.filter((o: Order) => {
    let statusMatch = true;
    if (statusFilter === 'process') statusMatch = o.status === 'On Process' || o.status === 'Finishing';
    else if (statusFilter === 'overdue') statusMatch = getDeadlineStatus(o.deadline, o.status) === 'overdue';
    else if (statusFilter === 'completed') statusMatch = o.status === 'Selesai';

    let monthMatch = true;
    if (monthFilter !== 'all') {
      const orderDate = new Date(o.tanggal_masuk);
      const orderMonth = orderDate.getMonth(); 
      monthMatch = orderMonth.toString() === monthFilter;
    }

    let typeMatch = true;
    if (typeFilter !== 'all') {
      typeMatch = o.jenis_produksi === typeFilter;
    }

    return statusMatch && monthMatch && typeMatch;
  });

  return (
    <div className="space-y-4 md:space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Daftar Pesanan</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1 font-medium">Kelola {filteredOrders.length} pesanan masuk</p>
        </div>

        <div className="flex flex-row w-full md:w-auto items-center gap-2 md:gap-3 overflow-x-auto pb-1">
          <select 
            className="bg-white border border-slate-300 text-slate-700 text-[10px] md:text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">Semua Bulan</option>
            {MONTHS.map((m, i) => (
              <option key={i} value={i.toString()}>{m}</option>
            ))}
          </select>

          <select 
            className="bg-white border border-slate-300 text-slate-700 text-[10px] md:text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Semua Jenis</option>
            {productionTypes.map((pt: ProductionTypeData) => (
              <option key={pt.id} value={pt.value}>{pt.name}</option>
            ))}
          </select>

          {(role === 'admin' || role === 'supervisor') && (
            <button onClick={onNewOrder} className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-[10px] md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-sm active:scale-95 whitespace-nowrap ml-auto md:ml-0">
              <ClipboardList className="w-3 h-3 md:w-4 md:h-4"/> Tambah
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: null, label: 'Semua' },
          { id: 'process', label: 'Proses' },
          { id: 'overdue', label: 'Telat' },
          { id: 'completed', label: 'Selesai' }
        ].map((f) => (
          <button 
            key={f.id || 'all'}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[10px] md:text-sm font-bold whitespace-nowrap transition border ${statusFilter === f.id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
          {filteredOrders.map((order: Order) => {
             const deadlineStatus = getDeadlineStatus(order.deadline, order.status);
             const hasUnresolvedKendala = order.kendala && order.kendala.some(k => !k.isResolved);
             return (
              <div key={order.id} onClick={() => onSelectOrder(order.id)} className={`bg-white rounded-2xl shadow-sm border p-3 md:p-5 cursor-pointer hover:shadow-md transition relative overflow-hidden active:scale-[0.98] ${deadlineStatus === 'overdue' ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'}`}>
                {deadlineStatus === 'overdue' && <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] md:text-[10px] px-2 py-0.5 font-bold rounded-bl-lg z-10">TELAT</div>}
                {hasUnresolvedKendala && <div className="absolute top-0 left-0 bg-orange-500 text-white text-[8px] md:text-[10px] px-2 py-0.5 font-bold rounded-br-lg z-10 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>KENDALA</div>}
                
                <div className="flex justify-between items-start mb-1 md:mb-4 mt-1">
                  <span className="text-[10px] md:text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md">#{order.kode_produksi}</span>
                  <span className={`text-[9px] md:text-[10px] font-extrabold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border uppercase tracking-wide whitespace-nowrap ${getStatusColor(order.status)}`}>{order.status}</span>
                </div>
                <h3 className="font-bold text-sm md:text-lg text-slate-800 line-clamp-1 mb-0.5 md:mb-1 leading-tight">{order.nama_pemesan}</h3>
                <div className="text-[10px] md:text-xs text-slate-500 mb-2 md:mb-4 font-medium flex items-center gap-1">
                   <Calendar className="w-3 h-3"/> {formatDate(order.tanggal_masuk)}
                </div>
                
                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 md:grid-cols-1 gap-1 md:gap-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between text-[10px] md:text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium hidden md:flex"><FileText className="w-4 h-4"/> Jumlah</span>
                    <span className="text-slate-500 text-[8px] md:hidden uppercase font-bold">Jml</span>
                    <span className="font-bold text-slate-800">{order.jumlah} Pcs</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between text-[10px] md:text-sm border-l md:border-l-0 border-slate-100 pl-2 md:pl-0">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium hidden md:flex"><BarChart3 className="w-4 h-4"/> Tipe</span>
                    <span className="text-slate-500 text-[8px] md:hidden uppercase font-bold">Tipe</span>
                    <span className="font-bold text-slate-800 uppercase bg-slate-50 md:px-2 rounded">{order.jenis_produksi}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between text-[10px] md:text-sm border-l md:border-l-0 border-slate-100 pl-2 md:pl-0">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium hidden md:flex"><Clock className="w-4 h-4"/> Deadline</span>
                    <span className="text-slate-500 text-[8px] md:hidden uppercase font-bold">Deadline</span>
                    <span className={`font-bold ${deadlineStatus === 'overdue' ? 'text-red-600' : 'text-slate-800'}`}>{formatDate(order.deadline)}</span>
                  </div>
                </div>

                {role === 'supervisor' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }}
                    className="mt-3 w-full bg-red-50 text-red-600 px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-red-100 transition border border-red-200 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5"/> Hapus
                  </button>
                )}
              </div>
             );
          })}
          {filteredOrders.length === 0 && <div className="col-span-full text-center text-slate-400 py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs">Tidak ada pesanan sesuai filter</div>}
      </div>
    </div>
  );
}

function SettingsPage({ users, productionTypes, onSaveUser, onDeleteUser, onSaveProductionType, onDeleteProductionType }: any) {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  const openUserModal = (user?: UserData) => {
    setEditingUser(user || { username: '', password: '', name: '', role: 'produksi' });
    setIsUserModalOpen(true);
  };

  const openTypeModal = (type?: ProductionTypeData) => {
    setEditingType(type || { name: '', value: '' });
    setIsTypeModalOpen(true);
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUser(editingUser);
    setIsUserModalOpen(false);
  };

  const handleTypeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProductionType(editingType);
    setIsTypeModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* User Management */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Pengaturan Pengguna</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola akses dan akun aplikasi</p>
           </div>
           <button onClick={() => openUserModal()} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm transition">
             <Users className="w-4 h-4"/> Tambah User
           </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] md:text-sm text-left text-slate-600 min-w-[500px]">
              <thead className="bg-slate-50 text-[10px] md:text-xs uppercase font-bold text-slate-600">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4">Nama</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Username</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Role</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u: UserData) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-slate-600">{u.username}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[9px] md:text-[10px] font-extrabold uppercase border border-slate-200">{u.role}</span></td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-right space-x-2">
                      <button onClick={() => openUserModal(u)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"><Pencil className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                      <button onClick={() => onDeleteUser(u.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">Tidak ada user</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Production Type Management */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Jenis Produksi</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola jenis produksi</p>
           </div>
           <button onClick={() => openTypeModal()} className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-sm transition">
             <Package className="w-4 h-4"/> Tambah Jenis
           </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] md:text-sm text-left text-slate-600 min-w-[500px]">
              <thead className="bg-slate-50 text-[10px] md:text-xs uppercase font-bold text-slate-600">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4">Nama Jenis</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Value/Kode</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productionTypes.map((pt: ProductionTypeData) => (
                  <tr key={pt.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-800">{pt.name}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 font-mono text-slate-600">{pt.value}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-right space-x-2">
                      <button onClick={() => openTypeModal(pt)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"><Pencil className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                      <button onClick={() => onDeleteProductionType(pt.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                    </td>
                  </tr>
                ))}
                {productionTypes.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-slate-400">Tidak ada jenis produksi</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Modal */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-lg text-slate-800">{editingUser.id ? 'Edit User' : 'Tambah User'}</h3>
               <button onClick={() => setIsUserModalOpen(false)} className="p-1.5 bg-slate-200 rounded-full hover:bg-slate-300 transition"><X className="w-4 h-4 text-slate-600"/></button>
            </div>
            <form onSubmit={handleUserFormSubmit} className="p-4 space-y-3">
               <div>
                 <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1">Nama Lengkap</label>
                 <input required className="w-full border-2 border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name: e.target.value})} />
               </div>
               <div>
                 <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1">Username</label>
                 <input required className="w-full border-2 border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm" value={editingUser.username} onChange={e=>setEditingUser({...editingUser, username: e.target.value})} />
               </div>
               <div>
                 <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                 <input required className="w-full border-2 border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm" value={editingUser.password} onChange={e=>setEditingUser({...editingUser, password: e.target.value})} />
               </div>
               <div>
                 <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1">Role</label>
                 <select className="w-full border-2 border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-slate-800 text-sm" value={editingUser.role} onChange={e=>setEditingUser({...editingUser, role: e.target.value})}>
                   <option value="supervisor">Supervisor</option>
                   <option value="admin">Admin</option>
                   <option value="produksi">Produksi</option>
                   <option value="qc">QC</option>
                   <option value="manager">Manager</option>
                 </select>
               </div>
               <div className="pt-3 flex gap-2">
                 <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2 border-2 border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 transition text-sm">Batal</button>
                 <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition shadow-lg text-sm">Simpan</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Production Type Modal */}
      {isTypeModalOpen && editingType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-lg text-slate-800">{editingType.id ? 'Edit Jenis' : 'Tambah Jenis'}</h3>
               <button onClick={() => setIsTypeModalOpen(false)} className="p-1.5 bg-slate-200 rounded-full hover:bg-slate-300 transition"><X className="w-4 h-4 text-slate-600"/></button>
            </div>
            <form onSubmit={handleTypeFormSubmit} className="p-4 space-y-3">
               <div>
                 <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1">Nama Jenis</label>
                 <input required className="w-full border-2 border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm" placeholder="contoh: DTF" value={editingType.name} onChange={e=>setEditingType({...editingType, name: e.target.value})} />
               </div>
               <div>
                 <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1">Value/Kode</label>
                 <input required className="w-full border-2 border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 font-mono text-sm" placeholder="contoh: dtf" value={editingType.value} onChange={e=>setEditingType({...editingType, value: e.target.value.toLowerCase().replace(/\s/g, '')})} />
               </div>
               <div className="pt-3 flex gap-2">
                 <button type="button" onClick={() => setIsTypeModalOpen(false)} className="flex-1 py-2 border-2 border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 transition text-sm">Batal</button>
                 <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition shadow-lg text-sm">Simpan</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateOrder({ productionTypes, onCancel, onSubmit }: any) {
  const [form, setForm] = useState({ nama: '', hp: '', jumlah: '', deadline: new Date().toISOString().split('T')[0], type: productionTypes[0]?.value || 'manual' });
  useEffect(() => { const d = new Date(); d.setDate(d.getDate() + 3); setForm(f => ({ ...f, deadline: d.toISOString().split('T')[0] })); }, []);
  const isDisabled = !form.nama || !form.hp || !form.deadline || !form.jumlah;

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl border shadow-sm max-w-2xl mx-auto">
      <h2 className="font-bold text-lg md:text-xl mb-4 md:mb-6 text-slate-800">Buat Pesanan Baru</h2>
      <div className="space-y-3 md:space-y-5">
        <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Nama Pemesan</label>
            <input className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm placeholder-slate-400" placeholder="Masukkan nama pemesan" value={form.nama} onChange={e=>setForm({...form, nama: e.target.value})} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">No HP</label>
            <input className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm placeholder-slate-400" placeholder="08xxxxxxxxxx" value={form.hp} onChange={e=>setForm({...form, hp: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Jumlah</label>
            <input type="number" className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm placeholder-slate-400" placeholder="0" value={form.jumlah} onChange={e=>setForm({...form, jumlah: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Deadline</label>
            <input type="date" className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm" value={form.deadline} onChange={e=>setForm({...form, deadline: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Jenis</label>
            <select className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-slate-800 text-sm" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
              {productionTypes.map((pt: ProductionTypeData) => (
                <option key={pt.id} value={pt.value}>{pt.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-4 md:pt-6">
            <button onClick={onCancel} className="flex-1 border-2 border-slate-200 py-2 md:py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition text-sm">Batal</button>
            <button onClick={()=>onSubmit(form)} disabled={isDisabled} className="flex-1 bg-blue-600 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition text-sm">Simpan</button>
        </div>
      </div>
    </div>
  )
}

function EditOrder({ order, productionTypes, onCancel, onSubmit }: any) {
  const [form, setForm] = useState({ 
    nama: order.nama_pemesan, 
    hp: order.no_hp, 
    jumlah: order.jumlah.toString(), 
    deadline: order.deadline, 
    type: order.jenis_produksi 
  });
  
  const isDisabled = !form.nama || !form.hp || !form.deadline || !form.jumlah;

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl border shadow-sm max-w-2xl mx-auto">
      <h2 className="font-bold text-lg md:text-xl mb-4 md:mb-6 text-slate-800">Edit Pesanan</h2>
      <div className="space-y-3 md:space-y-5">
        <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Nama Pemesan</label>
            <input className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm placeholder-slate-400" placeholder="Masukkan nama pemesan" value={form.nama} onChange={e=>setForm({...form, nama: e.target.value})} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">No HP</label>
            <input className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm placeholder-slate-400" placeholder="08xxxxxxxxxx" value={form.hp} onChange={e=>setForm({...form, hp: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Jumlah</label>
            <input type="number" className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm placeholder-slate-400" placeholder="0" value={form.jumlah} onChange={e=>setForm({...form, jumlah: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Deadline</label>
            <input type="date" className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 text-sm" value={form.deadline} onChange={e=>setForm({...form, deadline: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-1 md:mb-2">Jenis</label>
            <select className="w-full border-2 border-slate-200 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-slate-800 text-sm" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
              {productionTypes.map((pt: ProductionTypeData) => (
                <option key={pt.id} value={pt.value}>{pt.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-4 md:pt-6">
            <button onClick={onCancel} className="flex-1 border-2 border-slate-200 py-2 md:py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition text-sm">Batal</button>
            <button onClick={()=>onSubmit(form)} disabled={isDisabled} className="flex-1 bg-blue-600 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition text-sm">Update</button>
        </div>
      </div>
    </div>
  )
}

function OrderDetail({ currentUser, order, onBack, onEdit, onTriggerUpload, onUpdateOrder, onDelete, onConfirm }: any) {
  const [qcNote, setQcNote] = useState(order.finishing_qc.notes || '');
  const [kendalaNote, setKendalaNote] = useState('');
  const [showKendalaForm, setShowKendalaForm] = useState(false);
  
  const role = currentUser.role;
  const userName = currentUser.name; 

  const canEditApproval = role === 'admin' || role === 'supervisor';
  const canEditProduction = role === 'produksi' || role === 'admin' || role === 'supervisor';
  const canEditQC = role === 'qc' || role === 'admin' || role === 'supervisor';
  const canEditShipping = role === 'admin' || role === 'supervisor'; 
  const isManager = role === 'manager';
  const currentSteps = order.jenis_produksi === 'manual' ? order.steps_manual : order.steps_dtf;

  const handleStatusStep = (stepId: string) => {
    const updated = JSON.parse(JSON.stringify(order));
    const steps = updated.jenis_produksi === 'manual' ? updated.steps_manual : updated.steps_dtf;
    const idx = steps.findIndex((s: any) => s.id === stepId);
    if (idx >= 0) { 
      steps[idx].isCompleted = true; 
      steps[idx].uploadedBy = userName; 
      steps[idx].timestamp = new Date().toLocaleString(); 
    }
    onUpdateOrder(updated);
  };

  const handleQC = (pass: boolean) => {
    const updated = JSON.parse(JSON.stringify(order));
    updated.finishing_qc = { 
      isPassed: pass, 
      notes: pass ? 'Lolos QC' : qcNote, 
      checkedBy: userName, 
      timestamp: new Date().toLocaleString() 
    };
    if (!pass) updated.status = 'Revisi';
    onUpdateOrder(updated); 
  };

  const handleDeleteQC = () => {
    if (!onConfirm) return;
    onConfirm('Reset Status QC?', 'Status QC akan dikembalikan ke belum dicek.', () => {
      const updated = JSON.parse(JSON.stringify(order));
      updated.finishing_qc = { isPassed: false, notes: '', checkedBy: '', timestamp: '' };
      onUpdateOrder(updated);
    });
  };

  const handleRevisiSelesai = () => {
    const updated = JSON.parse(JSON.stringify(order));
    updated.status = 'On Process';
    updated.finishing_qc = { isPassed: false, notes: '' };
    onUpdateOrder(updated);
  };

  const handleAddKendala = () => {
    if (!kendalaNote.trim()) return;
    const updated = JSON.parse(JSON.stringify(order));
    if (!updated.kendala) updated.kendala = [];
    updated.kendala.push({
      id: Date.now().toString(),
      notes: kendalaNote,
      reportedBy: userName,
      timestamp: new Date().toLocaleString(),
      isResolved: false
    });
    updated.status = 'Ada Kendala';
    onUpdateOrder(updated);
    setKendalaNote('');
    setShowKendalaForm(false);
  };

  const handleResolveKendala = (kendalaId: string) => {
    const updated = JSON.parse(JSON.stringify(order));
    const idx = updated.kendala.findIndex((k: KendalaNote) => k.id === kendalaId);
    if (idx >= 0) {
      updated.kendala[idx].isResolved = true;
      updated.kendala[idx].resolvedBy = userName;
      updated.kendala[idx].resolvedTimestamp = new Date().toLocaleString();
    }
    onUpdateOrder(updated);
  };

  const handleDeleteKendala = (kendalaId: string) => {
    if (!onConfirm) return;
    onConfirm('Hapus Kendala?', 'Yakin ingin menghapus catatan kendala ini?', () => {
      const updated = JSON.parse(JSON.stringify(order));
      updated.kendala = updated.kendala.filter((k: KendalaNote) => k.id !== kendalaId);
      onUpdateOrder(updated);
    });
  };

  const handleFileDelete = (field: string, isStep = false, stepId?: string) => {
      if (!onConfirm) return;
      onConfirm('Hapus File/Bukti?', 'File yang sudah dihapus tidak bisa dikembalikan.', () => {
        const updated = JSON.parse(JSON.stringify(order));
        if (isStep && stepId) {
          const steps = updated.jenis_produksi === 'manual' ? updated.steps_manual : updated.steps_dtf;
          const idx = steps.findIndex((s: any) => s.id === stepId);
          if(idx>=0) { steps[idx].isCompleted=false; steps[idx].fileUrl=null; }
        } 
        else if (field === 'approval') {
            updated.link_approval = null;
            updated.approval_by = null;
            updated.approval_timestamp = null;
        }
        else if (field === 'packing') { 
          updated.finishing_packing.isPacked=false; 
          updated.finishing_packing.fileUrl=null;
          updated.finishing_packing.packedBy=null;
          updated.finishing_packing.timestamp=null;
        }
        else if (field === 'shipping_kirim') { 
            updated.shipping.bukti_kirim=null; 
            updated.shipping.uploaded_by_kirim=null;
            updated.shipping.timestamp_kirim=null;
        }
        else if (field === 'shipping_terima') { 
            updated.shipping.bukti_terima=null;
            updated.shipping.uploaded_by_terima=null;
            updated.shipping.timestamp_terima=null;
        }
        onUpdateOrder(updated);
      });
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="text-xs md:text-sm text-slate-500 hover:text-blue-600 flex items-center gap-2 font-bold transition p-2 -ml-2 rounded-lg hover:bg-slate-100 w-fit">
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 rotate-180"/> Kembali
        </button>
        <div className="flex gap-2">
          {(canEditApproval || role === 'admin') && !isManager && (
            <button onClick={onEdit} className="bg-blue-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-sm">
              <Pencil className="w-3 h-3 md:w-4 md:h-4"/> Edit
            </button>
          )}
          {role === 'supervisor' && (
            <button onClick={() => onDelete(order.id)} className="bg-red-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-sm">
              <Trash2 className="w-3 h-3 md:w-4 md:h-4"/> Hapus
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div className="flex-1">
            <h1 className="text-lg md:text-2xl font-extrabold text-slate-800 mb-1 md:mb-2">{order.nama_pemesan}</h1>
            <div className="text-xs md:text-sm text-slate-500 font-medium flex flex-wrap gap-2 md:gap-3 items-center">
              <span className="bg-slate-100 px-2 py-0.5 rounded">#{order.kode_produksi}</span>
              <span>{order.jumlah} Pcs</span>
              <span>{formatDate(order.deadline)}</span>
              <button onClick={() => openWA(order.no_hp)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
                <Phone className="w-3 h-3"/> WA
              </button>
            </div>
        </div>
        <div className={`px-2 py-1 md:px-4 md:py-2 rounded-lg font-extrabold text-[10px] md:text-sm border uppercase tracking-wide whitespace-nowrap ${getStatusColor(order.status)}`}>{order.status}</div>
      </div>

      {order.status === 'Revisi' && order.finishing_qc.notes && (
        <div className="bg-yellow-50 border-2 border-yellow-300 p-3 md:p-5 rounded-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-700"/>
                <h3 className="font-bold text-yellow-900 text-sm md:text-base">Catatan Revisi dari QC</h3>
              </div>
              <p className="text-xs md:text-sm text-yellow-800 bg-white p-2 md:p-3 rounded-lg border border-yellow-200 font-medium">{order.finishing_qc.notes}</p>
              <div className="text-[10px] md:text-xs text-yellow-700 mt-2">Dicek oleh: {order.finishing_qc.checkedBy} | {order.finishing_qc.timestamp}</div>
            </div>
          </div>
          {canEditProduction && (
            <button onClick={handleRevisiSelesai} className="mt-3 md:mt-4 bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-sm font-bold hover:bg-blue-700 transition shadow-lg w-full sm:w-auto">
              Revisi Selesai - Lanjut Produksi
            </button>
          )}
        </div>
      )}

      {/* STEP 1: APPROVAL (VERSI JSON) */}
      <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-lg"><div className="bg-slate-100 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">1</div> Approval Desain</h3>
          
          {/* Cek apakah ada link_approval DAN link_approval.link */}
          {order.link_approval && order.link_approval.link ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-green-50 p-3 md:p-4 rounded-xl border border-green-200 gap-2 md:gap-3">
              <div className="flex-1">
                  <div className="flex items-center gap-2 md:gap-3 text-green-800 font-medium text-xs md:text-sm mb-1">
                    {/* Akses URL lewat .link */}
                    <Eye className="w-4 h-4 md:w-5 md:h-5"/> <a href={order.link_approval.link} target="_blank" className="underline hover:text-green-900">Lihat File Approval</a>
                  </div>
                  {/* Tampilkan Uploader lewat .by */}
                  {order.link_approval.by ? (
                      <div className="text-[10px] text-green-700">Oleh: <span className="font-bold">{order.link_approval.by}</span> | {order.link_approval.timestamp}</div>
                  ) : (
                      <div className="text-[10px] text-slate-400 italic">Data lama (tanpa nama)</div>
                  )}
              </div>
              {canEditApproval && !isManager && <button onClick={() => handleFileDelete('approval')} className="text-red-500 bg-white border border-red-200 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold hover:bg-red-50 mt-2 sm:mt-0">Hapus</button>}
            </div>
          ) : (
            (canEditApproval && !isManager) ? <button onClick={() => onTriggerUpload('approval')} className="w-full border-2 border-dashed border-blue-200 p-4 md:p-6 text-xs md:text-sm text-blue-600 rounded-xl bg-blue-50 hover:bg-blue-100 transition font-bold flex flex-col items-center gap-2"><Upload className="w-5 h-5 md:w-6 md:h-6"/> Upload File Approval</button> : <div className="text-xs md:text-sm italic text-slate-400 text-center py-4 bg-slate-50 rounded-xl">Menunggu Admin upload approval...</div>
          )}
      </div>

      {/* STEP 2: PRODUKSI */}
      <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-lg">
              <div className="bg-slate-100 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">2</div> 
              Produksi ({order.jenis_produksi})
            </h3>
            {canEditProduction && (order.status === 'On Process' || order.status === 'Revisi' || order.status === 'Ada Kendala') && (
              <button onClick={() => setShowKendalaForm(!showKendalaForm)} className="text-[10px] md:text-xs bg-orange-600 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-lg font-bold hover:bg-orange-700 transition flex items-center gap-1.5 shadow-sm">
                <MessageSquare className="w-3 h-3 md:w-3.5 md:h-3.5"/> Lapor Kendala
              </button>
            )}
          </div>

          {showKendalaForm && (
            <div className="mb-4 p-3 md:p-4 bg-orange-50 border-2 border-orange-300 rounded-xl">
              <label className="block text-[10px] md:text-xs font-bold text-orange-800 uppercase mb-1 md:mb-2">Catatan Kendala</label>
              <textarea placeholder="Jelaskan kendala yang sedang dialami..." className="w-full text-xs md:text-sm p-2 md:p-3 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 placeholder-slate-400" value={kendalaNote} onChange={e => setKendalaNote(e.target.value)} rows={3} />
              <div className="flex gap-2 mt-2 md:mt-3">
                <button onClick={handleAddKendala} disabled={!kendalaNote.trim()} className="bg-orange-600 text-white text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Kirim Laporan</button>
                <button onClick={() => { setShowKendalaForm(false); setKendalaNote(''); }} className="border-2 border-slate-200 text-slate-600 text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold hover:bg-slate-50">Batal</button>
              </div>
            </div>
          )}

          {order.kendala && order.kendala.length > 0 && (
            <div className="mb-4 md:mb-5 space-y-2">
              <div className="text-[10px] md:text-xs font-bold uppercase text-slate-500 mb-2 md:mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-orange-600"/> Catatan Kendala ({order.kendala.filter((k: KendalaNote) => !k.isResolved).length} belum selesai / {order.kendala.length} total)
              </div>
              {order.kendala.map((k: KendalaNote) => (
                <div key={k.id} className={`border-2 p-3 md:p-4 rounded-xl ${k.isResolved ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-300'}`}>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-xs md:text-sm font-medium ${k.isResolved ? 'text-gray-600 line-through' : 'text-orange-900'}`}>{k.notes}</p>
                        {k.isResolved && <span className="bg-green-100 text-green-700 text-[8px] md:text-[10px] px-2 py-0.5 rounded-full font-bold">SELESAI</span>}
                      </div>
                      <div className="text-[10px] md:text-xs text-orange-700">Dilaporkan: <span className="font-bold">{k.reportedBy}</span> | {k.timestamp}</div>
                      {k.isResolved && k.resolvedBy && <div className="text-[10px] md:text-xs text-green-700 mt-1">Diselesaikan: <span className="font-bold">{k.resolvedBy}</span> | {k.resolvedTimestamp}</div>}
                      {k.buktiFile && <a href={k.buktiFile} target="_blank" className="text-[10px] md:text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mt-1"><Eye className="w-3 h-3"/> Lihat Bukti Penanganan</a>}
                    </div>
                    <div className="flex gap-1">
                      {!k.isResolved && (role === 'admin' || role === 'supervisor') && (
                        <>
                          <button onClick={() => onTriggerUpload('kendala_bukti', undefined, k.id)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition" title="Upload Bukti"><Upload className="w-3 h-3 md:w-4 md:h-4"/></button>
                          <button onClick={() => handleResolveKendala(k.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition" title="Tandai Selesai"><CheckCircle className="w-3 h-3 md:w-4 md:h-4"/></button>
                        </>
                      )}
                      {((role === 'admin' || role === 'supervisor') || k.reportedBy === userName) && (
                        <button onClick={() => handleDeleteKendala(k.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="Hapus"><Trash2 className="w-3 h-3 md:w-4 md:h-4"/></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 md:space-y-4">
            {currentSteps.map((step: any) => (
              <div key={step.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 md:pb-4 last:border-0 gap-2 md:gap-3">
                  <div>
                    <div className={`font-bold text-xs md:text-base ${step.isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.name}</div>
                    {step.isCompleted && <div className="text-[10px] text-slate-500">Oleh: <span className="font-bold">{step.uploadedBy}</span> | {step.timestamp}</div>}
                    {step.fileUrl && <a href={step.fileUrl} target="_blank" className="text-[10px] md:text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mt-0.5"><Eye className="w-3 h-3"/> Lihat Bukti</a>}
                  </div>
                  {step.isCompleted ? (
                    <div className="flex items-center gap-2 md:gap-3 bg-green-50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-green-100 self-start sm:self-auto">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600"/>
                      <span className="text-[10px] md:text-xs font-bold text-green-700">Selesai</span>
                      {canEditProduction && !isManager && <button onClick={() => handleFileDelete('step', true, step.id)} className="text-red-400 hover:text-red-600 ml-1 md:ml-2"><Trash2 className="w-3 h-3 md:w-4 md:h-4"/></button>}
                    </div>
                  ) : (
                    (canEditProduction && !isManager && (order.status === 'On Process' || order.status === 'Revisi' || order.status === 'Ada Kendala')) && (
                      step.type === 'status_update' 
                      ? <button onClick={() => handleStatusStep(step.id)} className="bg-blue-600 text-white text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold hover:bg-blue-700 transition w-full sm:w-auto">Tandai Selesai</button>
                      : <button onClick={() => onTriggerUpload('step', step.id)} className="border-2 border-slate-200 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold text-slate-600 hover:bg-slate-50 transition w-full sm:w-auto flex items-center justify-center gap-2"><Camera className="w-3 h-3 md:w-4 md:h-4"/> Upload Bukti</button>
                    )
                  )}
              </div>
            ))}
          </div>
      </div>

       {/* STEP 3: QC & PACKING */}
       <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm">
         <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-lg"><div className="bg-slate-100 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">3</div> QC & Packing</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
            {/* QC */}
            <div className="border border-slate-200 p-3 md:p-4 rounded-xl bg-slate-50/50">
              <div className="text-[10px] md:text-xs font-bold mb-2 md:mb-3 uppercase text-slate-500 tracking-wide">Quality Control</div>
              {order.finishing_qc.isPassed || (order.finishing_qc.notes && !order.finishing_qc.isPassed) ? (
                  <div className={`text-xs md:text-sm font-bold flex flex-col gap-2 p-2 md:p-3 rounded-lg border ${order.finishing_qc.isPassed ? 'bg-green-100 border-green-200 text-green-700' : 'bg-red-100 border-red-200 text-red-700'}`}>
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2">
                             {order.finishing_qc.isPassed ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5"/> : <X className="w-4 h-4 md:w-5 md:h-5"/>}
                             {order.finishing_qc.isPassed ? 'Lolos QC' : 'Revisi QC'}
                         </div>
                         {canEditQC && !isManager && (
                           <button onClick={handleDeleteQC} className="bg-white/50 hover:bg-white p-1 rounded text-red-600 hover:text-red-800 transition"><Trash2 className="w-3 h-3 md:w-4 md:h-4"/></button>
                         )}
                      </div>
                      <div className="text-[10px] font-normal opacity-80">
                         Oleh: <span className="font-bold">{order.finishing_qc.checkedBy}</span> | {order.finishing_qc.timestamp}
                      </div>
                      {!order.finishing_qc.isPassed && <div className="text-[10px] italic">"{order.finishing_qc.notes}"</div>}
                  </div>
                ) : (
                (canEditQC && !isManager && order.status === 'Finishing' ? (
                  <div className="space-y-2 md:space-y-3">
                    <textarea placeholder="Catatan revisi (wajib diisi jika revisi)..." className="w-full text-xs md:text-sm p-2 md:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 placeholder-slate-400" value={qcNote} onChange={e=>setQcNote(e.target.value)} rows={3}/>
                    <div className="flex gap-2">
                       <button onClick={()=>handleQC(true)} className="bg-green-600 text-white text-[10px] md:text-xs px-3 py-2 md:px-4 md:py-2.5 rounded-lg flex-1 font-bold hover:bg-green-700 shadow-sm">Lolos</button>
                       <button onClick={()=>handleQC(false)} disabled={!qcNote.trim()} className="bg-red-600 text-white text-[10px] md:text-xs px-3 py-2 md:px-4 md:py-2.5 rounded-lg flex-1 font-bold hover:bg-red-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Revisi</button>
                    </div>
                  </div>
                ) : <div className="text-[10px] md:text-xs text-slate-400 italic py-2">Menunggu proses sebelumnya...</div>)
              )}
            </div>
            
            {/* PACKING */}
            <div className="border border-slate-200 p-3 md:p-4 rounded-xl bg-slate-50/50">
              <div className="text-[10px] md:text-xs font-bold mb-2 md:mb-3 uppercase text-slate-500 tracking-wide">Packing</div>
              {order.finishing_packing.isPacked ? (
                <div className="text-green-700 text-xs md:text-sm font-bold flex flex-col gap-2 bg-green-100 p-2 md:p-3 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Package className="w-4 h-4 md:w-5 md:h-5"/> Sudah Dipacking
                        </div>
                        {canEditQC && !isManager && (
                            <button onClick={() => handleFileDelete('packing')} className="bg-white/50 hover:bg-white p-1 rounded text-red-600 hover:text-red-800 transition"><Trash2 className="w-3 h-3 md:w-4 md:h-4"/></button>
                        )}
                    </div>
                    {/* UPDATE: Tampilkan Uploader Packing */}
                    {order.finishing_packing.packedBy && (
                        <div className="text-[10px] font-normal opacity-80 text-green-800">
                            Oleh: <span className="font-bold">{order.finishing_packing.packedBy}</span> | {order.finishing_packing.timestamp}
                        </div>
                    )}
                    {order.finishing_packing.fileUrl && (
                        <a href={order.finishing_packing.fileUrl} target="_blank" className="text-[10px] text-green-800 hover:underline flex items-center gap-1"><Eye className="w-3 h-3"/> Lihat Foto Packing</a>
                    )}
                </div>
               ) : (
                (canEditQC && !isManager && order.status === 'Finishing' && order.finishing_qc.isPassed ? <button onClick={()=>onTriggerUpload('packing')} className="bg-purple-600 text-white text-xs md:text-sm w-full py-2 md:py-3 rounded-xl font-bold hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg"><Camera className="w-3 h-3 md:w-4 md:h-4"/> Foto Packing</button> : <div className="text-[10px] md:text-xs text-slate-400 italic py-2">Menunggu QC Lolos...</div>)
              )}
            </div>
         </div>
       </div>

       {/* STEP 4: PENGIRIMAN */}
       <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm">
         <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-lg"><div className="bg-slate-100 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">4</div> Pengiriman</h3>
         <div className="space-y-2 md:space-y-3">
           {/* Resi Kirim */}
           <div className="flex flex-col gap-2 border border-slate-200 p-3 md:p-4 rounded-xl bg-slate-50/50">
             <div className="flex justify-between items-center text-xs md:text-sm">
                 <span className="font-bold text-slate-700">Resi Kirim</span>
                 {order.shipping.bukti_kirim ? (
                     <div className="flex items-center gap-2">
                        <a href={order.shipping.bukti_kirim} target="_blank" className="text-green-600 font-bold underline hover:text-green-800">Lihat Bukti</a>
                        {/* UPDATE: Tombol Hapus Bukti Kirim */}
                        {canEditShipping && !isManager && (
                            <button onClick={() => handleFileDelete('shipping_kirim')} className="bg-red-50 text-red-500 p-1 rounded hover:bg-red-100 border border-red-200 ml-2"><Trash2 className="w-3 h-3"/></button>
                        )}
                     </div>
                 ) : (
                     (canEditShipping && !isManager && order.status === 'Kirim' ? <button onClick={()=>onTriggerUpload('shipping_kirim')} className="text-[10px] md:text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm">Upload</button> : <span className="text-slate-300 font-bold">-</span>)
                 )}
             </div>
             {/* UPDATE: Tampilkan Uploader Resi */}
             {order.shipping.uploaded_by_kirim && (
                 <div className="text-[10px] text-slate-500">Oleh: <span className="font-bold">{order.shipping.uploaded_by_kirim}</span> | {order.shipping.timestamp_kirim}</div>
             )}
           </div>
           
           {/* Bukti Terima */}
           <div className="flex flex-col gap-2 border border-slate-200 p-3 md:p-4 rounded-xl bg-slate-50/50">
             <div className="flex justify-between items-center text-xs md:text-sm">
                 <span className="font-bold text-slate-700">Bukti Terima</span>
                 {order.shipping.bukti_terima ? (
                     <div className="flex items-center gap-2">
                        <a href={order.shipping.bukti_terima} target="_blank" className="text-green-600 font-bold underline hover:text-green-800">Lihat Bukti</a>
                        {/* UPDATE: Tombol Hapus Bukti Terima */}
                        {canEditShipping && !isManager && (
                            <button onClick={() => handleFileDelete('shipping_terima')} className="bg-red-50 text-red-500 p-1 rounded hover:bg-red-100 border border-red-200 ml-2"><Trash2 className="w-3 h-3"/></button>
                        )}
                     </div>
                 ) : (
                     (canEditShipping && !isManager && order.status === 'Kirim' ? <button onClick={()=>onTriggerUpload('shipping_terima')} className="text-[10px] md:text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-orange-700 shadow-sm">Upload</button> : <span className="text-slate-300 font-bold">-</span>)
                 )}
             </div>
             {/* UPDATE: Tampilkan Uploader Terima */}
             {order.shipping.uploaded_by_terima && (
                 <div className="text-[10px] text-slate-500">Oleh: <span className="font-bold">{order.shipping.uploaded_by_terima}</span> | {order.shipping.timestamp_terima}</div>
             )}
           </div>
         </div>
       </div>

    </div>
  );
}