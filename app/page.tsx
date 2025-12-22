// app/page.tsx - FULL FIX & OPTIMIZED
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import imageCompression from 'browser-image-compression'; 

// Layout & UI
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header'; 
import CustomAlert from '@/app/components/ui/CustomAlert';
import LoginScreen from '@/app/components/auth/LoginScreen';
import ProfileModal from '@/app/components/ui/ProfileModal';

// Dashboard - Lazy load
import dynamic from 'next/dynamic';
const Dashboard = dynamic(() => import('@/app/components/dashboard/Dashboard'), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>,
  ssr: false
});

// Apps & Config - Lazy load
const CalculatorView = dynamic(() => import('@/app/components/apps/CalculatorView'));
const ConfigPriceView = dynamic(() => import('@/app/components/apps/ConfigPriceView'));
const AboutView = dynamic(() => import('@/app/components/misc/AboutView'));

// ORDERS - Lazy load
const OrderList = dynamic(() => import('@/app/components/orders/OrderList'));
const CreateOrder = dynamic(() => import('@/app/components/orders/CreateOrder'));
const EditOrder = dynamic(() => import('@/app/components/orders/EditOrder'));
const OrderDetail = dynamic(() => import('@/app/components/orders/OrderDetail'));
const CompletedOrders = dynamic(() => import('@/app/components/orders/CompletedOrders')); 
const TrashView = dynamic(() => import('@/app/components/orders/TrashView'));

// Settings - Lazy load
const SettingsPage = dynamic(() => import('@/app/components/settings/SettingsPage'));

// Types & Helpers
import { UserData, Order, ProductionTypeData, DEFAULT_PERMISSIONS, OrderStatus } from '@/types';
import { DEFAULT_PRODUCTION_TYPES } from '@/lib/utils';
import { triggerOrderNotifications } from '@/lib/orderLogic';

interface CurrentUser extends UserData {
  id: string; 
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  orderId?: string;
}

// Interface Context Upload
interface UploadContextState {
  type: string;
  stepId?: string;
  kendalaId?: string;
}

export default function ProductionApp() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'completed_orders' | 'settings' | 'trash' | 'kalkulator' | 'config_harga' | 'about'>('dashboard');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionTypeData[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- STATE BARU: UPLOAD VIA REF (SOLUSI LEMOT/GAGAL) ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadContext, setUploadContext] = useState<UploadContextState | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'confirm'; onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'success' });

  // OPTIMASI: Singleton Supabase
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const showAlert = useCallback((title: string, message: string, type: 'success' | 'error' = 'success') => {
    setAlertState({ isOpen: true, title, message, type, onConfirm: undefined });
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setAlertState({ isOpen: true, title, message, type: 'confirm', onConfirm });
  }, []);

  const closeAlert = useCallback(() => setAlertState(prev => ({ ...prev, isOpen: false })), []);

  // FETCH NOTIFIKASI
  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        const mappedNotifications = data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleString('id-ID', { 
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit' 
            }),
            isRead: n.is_read,
            orderId: n.order_id 
          }));
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Err notification', error);
    }
  }, [currentUser, supabase]);

  const handleNotificationClick = useCallback(async (notificationId: string, orderId: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    } catch (e) {}

    setActiveTab('orders');
    setView('detail');
    setSelectedOrderId(orderId);
    setSidebarOpen(false);
  }, [supabase]);

  useEffect(() => {
    const initSession = async () => {
      setLoadingUser(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (userData) {
          setCurrentUser({
            id: session.user.id,
            username: userData.username || '',
            name: userData.name || 'User',
            role: userData.role || 'produksi',
            password: '',
            permissions: userData.permissions || DEFAULT_PERMISSIONS,
            address: userData.address,
            dob: userData.dob,
            avatar_url: userData.avatar_url
          });
        }
      }
      setLoadingUser(false);
    };
    initSession();
  }, [supabase]);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select(`*, assigned_user:users!assigned_to ( name )`) 
      .order('created_at', { ascending: false });
      
    if (data) setOrders(data.map((o: any) => ({ ...o, kendala: Array.isArray(o.kendala) ? o.kendala : [] })));
  }, [supabase]);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('users').select('*').order('name');
    if (data) setUsersList(data);
  }, [supabase]);

  const fetchProductionTypes = useCallback(async () => {
    const { data } = await supabase.from('production_types').select('*').order('name');
    if (data) setProductionTypes(data);
    else if (productionTypes.length === 0) setProductionTypes(DEFAULT_PRODUCTION_TYPES);
  }, [supabase, productionTypes.length]);

  useEffect(() => {
    if (!currentUser) return;
    const loadAppData = async () => {
      await Promise.all([fetchOrders(), fetchUsers(), fetchProductionTypes(), fetchNotifications()]);
    };
    loadAppData();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [currentUser, fetchOrders, fetchUsers, fetchProductionTypes, fetchNotifications]);

  // NAVIGATION HANDLER
  useEffect(() => {
    const handlePopState = () => {
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard'); setView('list'); setSelectedOrderId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    if (activeTab !== 'dashboard') window.history.pushState({ tab: activeTab }, '', `?tab=${activeTab}`);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const handleLogout = useCallback(async () => {
    showConfirm('Logout', 'Keluar aplikasi?', async () => {
        await supabase.auth.signOut();
        window.location.reload(); 
    });
  }, [showConfirm, supabase]);

  const handleUpdateProfile = useCallback(async (newData: any) => {
    if (!currentUser) return;
    const { error } = await supabase.from('users').update({
      name: newData.name, address: newData.address, dob: newData.dob, avatar_url: newData.avatar_url
    }).eq('id', currentUser.id);

    if (!error) {
      setCurrentUser({ ...currentUser, ...newData });
      setShowProfileModal(false);
      showAlert('Sukses', 'Profil diperbarui');
    } else {
      showAlert('Gagal', error.message, 'error');
    }
  }, [currentUser, supabase, showAlert]);

  const generateProductionCode = useCallback(() => {
    const now = new Date();
    const prefix = `LCO-${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}-`;
    const existingCodes = orders.filter(o => o.kode_produksi?.startsWith(prefix)).map(o => parseInt(o.kode_produksi.split('-').pop()!) || 0);
    const max = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }, [orders]);

  // ===============================================
  // 🟢 LOGIKA UPDATE STATUS (FIX ERROR 400 DB)
  // ===============================================
  const checkAutoStatus = useCallback(async (orderData: Order) => {
    const oldStatus = orderData.status as OrderStatus;
    const hasUnresolvedKendala = orderData.kendala?.some((k: any) => !k.isResolved);
    
    let normalStatus = 'Pesanan Masuk';
    const steps = orderData.jenis_produksi === 'manual' ? orderData.steps_manual : orderData.steps_dtf;
    const productionDone = steps?.every((s: any) => s.isCompleted);
    
    if (!orderData.link_approval?.link) normalStatus = 'Pesanan Masuk';
    else if (!productionDone) normalStatus = 'On Process';
    else if (!orderData.finishing_qc?.isPassed || !orderData.finishing_packing?.isPacked) {
      normalStatus = (orderData.finishing_qc?.isPassed === false && orderData.finishing_qc?.notes) ? 'Revisi' : 'Finishing';
    } else if (!orderData.shipping?.bukti_terima) normalStatus = 'Kirim';
    else normalStatus = 'Selesai';
    
    const finalStatus = (hasUnresolvedKendala ? 'Ada Kendala' : normalStatus) as OrderStatus;
    
    // 🔥 PENTING: BERSIHKAN PAYLOAD DARI DATA JOIN (assigned_user)
    const payload: any = { ...orderData, status: finalStatus };
    delete payload.assigned_user; // Hapus data join
    delete payload.id;            // Hapus ID (tidak perlu di update)
    delete payload.created_at; 

    console.log('📦 Saving to DB:', payload);

    const { error } = await supabase.from('orders').update(payload).eq('id', orderData.id);
    
    if (!error) { 
      fetchOrders(); 
      await triggerOrderNotifications({ ...orderData, status: finalStatus }, oldStatus);
      await fetchNotifications();
    } else {
      console.error('DB Error:', error);
      showAlert('Error Database', error.message, 'error');
    }
  }, [supabase, fetchOrders, fetchNotifications, showAlert]);

  // ===============================================
  // 🟢 LOGIKA UPLOAD BARU (USE REF + PDF LIMIT)
  // ===============================================
  const triggerUpload = useCallback((targetType: string, stepId?: string, kendalaId?: string) => {
    setUploadContext({ type: targetType, stepId, kendalaId });
    // Timeout agar state context siap sebelum file dialog muncul
    setTimeout(() => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; 
            fileInputRef.current.click();
        }
    }, 50);
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !selectedOrderId || !uploadContext) return;
      
      setIsUploading(true);
      let processedFile = file;

      // 1. KOMPRESI GAMBAR
      if (file.type.startsWith('image/')) {
        try { 
          processedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }); 
        } catch (error) { console.error("Kompresi gagal, pakai asli", error); }
      } 
      // 2. VALIDASI UKURAN PDF (Max 15MB) - JANGAN DIKOMPRES
      else if (file.type === 'application/pdf') {
         const MAX_MB = 15;
         if (file.size > MAX_MB * 1024 * 1024) {
            alert(`File PDF terlalu besar (> ${MAX_MB}MB). Harap kecilkan ukuran file.`);
            setIsUploading(false);
            return;
         }
      }

      // 3. UPLOAD KE SUPABASE
      const fileName = `${selectedOrderId}/${Date.now()}.${processedFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('production-proofs').upload(fileName, processedFile, { upsert: false });
      
      if (uploadError) { 
        showAlert('Gagal Upload', uploadError.message, 'error'); 
        setIsUploading(false);
        return; 
      }

      const { data: urlData } = supabase.storage.from('production-proofs').getPublicUrl(fileName);
      
      // 4. UPDATE STATE LOKAL & DB
      const order = orders.find(o => o.id === selectedOrderId); 
      if (!order) { setIsUploading(false); return; }
      
      let updatedOrder = JSON.parse(JSON.stringify(order));
      const common = { fileUrl: urlData.publicUrl, timestamp: new Date().toLocaleString(), uploadedBy: currentUser?.name };
      
      if (uploadContext.type === 'approval') updatedOrder.link_approval = { link: urlData.publicUrl, by: currentUser?.name, timestamp: common.timestamp };
      else if (uploadContext.type === 'step' && uploadContext.stepId) {
         const steps = updatedOrder.jenis_produksi === 'manual' ? updatedOrder.steps_manual : updatedOrder.steps_dtf;
         const idx = steps.findIndex((s: any) => s.id === uploadContext.stepId); 
         if (idx >= 0) steps[idx] = { ...steps[idx], isCompleted: true, ...common };
      } else if (uploadContext.type === 'packing') updatedOrder.finishing_packing = { isPacked: true, ...common };
      else if (uploadContext.type === 'shipping_kirim') updatedOrder.shipping.bukti_kirim = urlData.publicUrl;
      else if (uploadContext.type === 'shipping_terima') updatedOrder.shipping.bukti_terima = urlData.publicUrl;
      else if (uploadContext.type === 'kendala_bukti' && uploadContext.kendalaId) { 
        const idx = updatedOrder.kendala.findIndex((k: any) => k.id === uploadContext.kendalaId); 
        if(idx >= 0) updatedOrder.kendala[idx].buktiFile = urlData.publicUrl; 
      }
      
      await checkAutoStatus(updatedOrder);
      
      setIsUploading(false);
      setUploadContext(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showAlert('Sukses', 'File terupload');
  };

  // CRUD HANDLERS (Create, Edit, Delete...)
  const handleCreateOrder = useCallback(async (formData: any) => {
    // ... Logika create (sama seperti sebelumnya, disederhanakan di sini)
    // Gunakan logika create yang sudah ada
    const payload: any = {
      kode_produksi: generateProductionCode(),
      nama_pemesan: formData.nama,
      no_hp: formData.hp,
      jumlah: parseInt(formData.jumlah) || 0,
      tanggal_masuk: new Date().toISOString().split('T')[0],
      deadline: formData.deadline,
      jenis_produksi: formData.type,
      assigned_to: formData.assigned_to || null, 
      status: 'Pesanan Masuk',
      steps_manual: [
        { id: 'm1', name: 'Pecah Gambar (PDF)', type: 'upload_pdf', isCompleted: false },
        { id: 'm2', name: 'Print Film', type: 'upload_image', isCompleted: false },
        { id: 'm3', name: 'Proofing', type: 'upload_image', isCompleted: false },
        { id: 'm4', name: 'Produksi Massal', type: 'upload_image', isCompleted: false }
      ],
      steps_dtf: [
        { id: 'd1', name: 'Cetak DTF', type: 'status_update', isCompleted: false },
        { id: 'd2', name: 'Press Kaos', type: 'upload_image', isCompleted: false }
      ],
      finishing_qc: { isPassed: false, notes: '' },
      finishing_packing: { isPacked: false },
      shipping: {},
      kendala: []
    };
    const { data, error } = await supabase.from('orders').insert([payload]).select().single();
    if (!error) { await fetchOrders(); setView('list'); showAlert('Sukses', 'Pesanan dibuat'); triggerOrderNotifications(data); }
    else showAlert('Error', error.message, 'error');
  }, [generateProductionCode, supabase, fetchOrders, showAlert]);

  const handleEditOrder = useCallback(async (d: any) => {
    if (!selectedOrderId) return;
    const updates = { nama_pemesan: d.nama, no_hp: d.hp, jumlah: parseInt(d.jumlah), deadline: d.deadline, jenis_produksi: d.type, assigned_to: d.assigned_to || null };
    const { error } = await supabase.from('orders').update(updates).eq('id', selectedOrderId);
    if (!error) {
       const old = orders.find(o => o.id === selectedOrderId);
       if(old) await checkAutoStatus({ ...old, ...updates });
      await fetchOrders(); setView('detail'); showAlert('Sukses', 'Diupdate');
    }
  }, [selectedOrderId, supabase, orders, fetchOrders, showAlert, checkAutoStatus]);

  const handleDeleteOrder = useCallback(async (id: string) => {
    showConfirm('Hapus?', 'Pindah ke sampah.', async () => {
      const { error } = await supabase.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (!error) { await fetchOrders(); setView('list'); showAlert('Sukses', 'Dihapus'); }
    });
  }, [showConfirm, supabase, fetchOrders, showAlert]);

  const handleRestoreOrder = useCallback(async (id: string) => {
    await supabase.from('orders').update({ deleted_at: null }).eq('id', id); fetchOrders(); showAlert('Sukses', 'Dipulihkan');
  }, [supabase, fetchOrders, showAlert]);

  const handlePermanentDelete = useCallback(async (id: string) => {
    showConfirm('Hapus Permanen?', 'Data hilang selamanya.', async () => {
      await supabase.from('orders').delete().eq('id', id); fetchOrders(); showAlert('Sukses', 'Terhapus Permanen');
    });
  }, [showConfirm, supabase, fetchOrders, showAlert]);

  // Settings Handlers
  const handleSaveUser = useCallback(async (u: any) => {
    const p: any = { name: u.name, role: u.role, username: u.username }; 
    if (u.permissions) p.permissions = u.permissions; 
    if (u.password?.trim()) p.password = u.password;
    const { error } = u.id ? await supabase.from('users').update(p).eq('id', u.id) : await supabase.from('users').insert([p]);
    if(!error) { fetchUsers(); showAlert('Sukses', 'User tersimpan'); }
  }, [supabase, fetchUsers, showAlert]);

  const handleDeleteUser = useCallback(async (id: string) => { 
    showConfirm('Hapus User?', 'User akan dihapus.', async () => { await supabase.from('users').delete().eq('id', id); fetchUsers(); showAlert('Sukses', 'Dihapus'); }); 
  }, [showConfirm, supabase, fetchUsers, showAlert]);

  const handleSaveType = useCallback(async (t: any) => { 
    const p = { name: t.name, value: t.value }; 
    const { error } = t.id ? await supabase.from('production_types').update(p).eq('id', t.id) : await supabase.from('production_types').insert([p]);
    if(!error) { fetchProductionTypes(); showAlert('Sukses', 'Tipe tersimpan'); } 
  }, [supabase, fetchProductionTypes, showAlert]);

  const handleDeleteType = useCallback(async (id: string) => { 
    showConfirm('Hapus Tipe?', 'Yakin hapus?', async () => { await supabase.from('production_types').delete().eq('id', id); fetchProductionTypes(); showAlert('Sukses', 'Dihapus'); }); 
  }, [showConfirm, supabase, fetchProductionTypes, showAlert]);

  const activeOrders = useMemo(() => orders.filter(o => !o.deleted_at), [orders]);

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="h-screen overflow-hidden bg-gray-100 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 relative">
       
       {/* 🚀 HIDDEN INPUT UNTUK UPLOAD (PERBAIKAN UTAMA) */}
       <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
       
       {isUploading && (
         <div className="absolute inset-0 z-[9999] bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <Loader2 className="w-12 h-12 animate-spin mb-3 text-blue-400" />
            <p className="font-bold">Mengupload File...</p>
            <p className="text-xs text-gray-300 mt-1">Mohon tunggu, jangan tutup aplikasi</p>
         </div>
       )}

       <CustomAlert alertState={alertState} closeAlert={closeAlert} />
       {currentUser && <ProfileModal user={currentUser} isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} onSave={handleUpdateProfile} />}
    
       <Sidebar 
          sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={currentUser} activeTab={activeTab} 
          handleNav={(tab: any) => { setActiveTab(tab); setView('list'); setSidebarOpen(false); }}
          onLogout={handleLogout} onOpenProfile={() => setShowProfileModal(true)} 
       />

       <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Header currentUser={currentUser} onToggleSidebar={() => setSidebarOpen(true)} onLogout={handleLogout} sidebarOpen={sidebarOpen} currentPage={activeTab} notifications={notifications} onNotificationClick={handleNotificationClick} />
          
          <main className="flex-1 overflow-y-auto px-4 md:px-6 py-2 md:py-3 pb-32 relative bg-gray-100 dark:bg-slate-950 no-scrollbar">
             <div className="max-w-7xl mx-auto">
                {activeTab === 'dashboard' && currentUser.permissions?.pages?.dashboard && (
                  <Dashboard role={currentUser.role} orders={activeOrders} onSelectOrder={(id) => { setSelectedOrderId(id); setView('detail'); setActiveTab('orders'); }} />
                )}
                {activeTab === 'orders' && currentUser.permissions?.pages?.orders && (
                  <>
                    {view === 'list' && <OrderList role={currentUser.role} orders={activeOrders} productionTypes={productionTypes} onSelectOrder={(id) => { setSelectedOrderId(id); setView('detail'); }} onNewOrder={() => setView('create')} onDeleteOrder={handleDeleteOrder} currentUser={currentUser} />}
                    {view === 'create' && <CreateOrder users={usersList} productionTypes={productionTypes} onCancel={() => setView('list')} onSubmit={handleCreateOrder} />}
                    {view === 'edit' && selectedOrderId && <EditOrder users={usersList} order={orders.find(o => o.id === selectedOrderId)!} productionTypes={productionTypes} onCancel={() => setView('detail')} onSubmit={handleEditOrder} />}
                    {view === 'detail' && selectedOrderId && <OrderDetail currentUser={currentUser} order={orders.find(o => o.id === selectedOrderId)!} onBack={() => { setSelectedOrderId(null); setView('list'); }} onEdit={() => setView('edit')} onTriggerUpload={triggerUpload} onUpdateOrder={checkAutoStatus} onDelete={handleDeleteOrder} onConfirm={showConfirm} />}
                  </>
                )}
                {activeTab === 'completed_orders' && <CompletedOrders orders={activeOrders} />}
                {activeTab === 'trash' && <TrashView orders={orders.filter(o => o.deleted_at)} onRestore={handleRestoreOrder} onPermanentDelete={handlePermanentDelete} />}
                {activeTab === 'settings' && <SettingsPage users={usersList} productionTypes={productionTypes} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} onSaveProductionType={handleSaveType} onDeleteProductionType={handleDeleteType} />}
                {activeTab === 'kalkulator' && <CalculatorView />}
                {activeTab === 'config_harga' && <ConfigPriceView />}
                {activeTab === 'about' && <AboutView />}
             </div>
          </main>
       </div>
    </div>
  );
}

// Icon Import untuk Loading Overlay
import { Loader2 } from 'lucide-react';