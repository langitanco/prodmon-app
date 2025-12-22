// app/page.tsx - DENGAN DEBUG LOGS
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import imageCompression from 'browser-image-compression'; 

// Layout & UI
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header'; 
import CustomAlert from '@/app/components/ui/CustomAlert';
import LoginScreen from '@/app/components/auth/LoginScreen';
import ProfileModal from '@/app/components/ui/ProfileModal';

// Dashboard - Lazy load untuk performa
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
const CompletedOrders = dynamic(() => import('@/app/components/orders/CompletedOrders')); // <-- UPDATE 1: Import Component Baru
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

export default function ProductionApp() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // UPDATE 2: Tambahkan 'completed_orders' ke dalam tipe state activeTab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'completed_orders' | 'settings' | 'trash' | 'kalkulator' | 'config_harga' | 'about'>('dashboard');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionTypeData[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'confirm'; onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'success' });

  // OPTIMASI: Singleton Supabase client dengan useMemo
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

  // ✅ FETCH NOTIFIKASI DENGAN DEBUG LOGS
  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      console.log('📬 Raw data dari database:', data); // ✅ DEBUG LOG
      
      if (error) {
        console.error('❌ Error fetching notifications:', error);
        return;
      }
      
      if (data) {
        const mappedNotifications = data.map((n: any) => {
          console.log('🔍 Mapping notifikasi:', {
            id: n.id,
            title: n.title,
            order_id: n.order_id, // ✅ Cek apakah order_id ada
            raw: n
          });
          
          return {
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleString('id-ID', { 
              day: '2-digit', 
              month: 'short',
              year: 'numeric',
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isRead: n.is_read,
            orderId: n.order_id // ✅ Ambil order_id dari database
          };
        });
        
        console.log('✅ Notifications setelah mapping:', mappedNotifications);
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  }, [currentUser, supabase]);

  // ✅ HANDLER KLIK NOTIFIKASI DENGAN DEBUG
  const handleNotificationClick = useCallback(async (notificationId: string, orderId: string) => {
    console.log('🔔 handleNotificationClick dipanggil:', { notificationId, orderId });

    try {
      // 1. Tandai notifikasi sebagai sudah dibaca di database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('❌ Error update notifikasi:', error);
      } else {
        console.log('✅ Notifikasi berhasil ditandai sebagai read');
        
        // 2. Update state lokal
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('❌ Error menandai notifikasi sebagai dibaca:', error);
    }

    // 3. Navigasi ke halaman detail pesanan
    console.log('🚀 Navigasi ke pesanan:', orderId);
    setActiveTab('orders');
    setView('detail');
    setSelectedOrderId(orderId);
    
    // 4. Tutup sidebar jika di mobile
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

  // OPTIMASI: useCallback untuk fetch functions
  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        assigned_user:users!assigned_to ( name ) 
      `) 
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
      await Promise.all([
        fetchOrders(),
        fetchUsers(),
        fetchProductionTypes(),
        fetchNotifications()
      ]);
    };
    loadAppData();

    // OPTIMASI: Tingkatkan interval refresh dari 30s ke 60s untuk mobile
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [currentUser, fetchOrders, fetchUsers, fetchProductionTypes, fetchNotifications]);

  // ==========================================
  // FITUR: BACK BUTTON HANDLER (NAVIGATION)
  // ==========================================
  useEffect(() => {
    // Fungsi yang jalan saat tombol Back ditekan
    const handlePopState = (event: PopStateEvent) => {
      // Cek apakah sekarang sedang BUKAN di dashboard?
      if (activeTab !== 'dashboard') {
        // Jika iya, jangan biarkan browser keluar/mundur jauh
        // Tapi paksa aplikasi ganti state ke 'dashboard'
        setActiveTab('dashboard');
        
        // Reset juga view internal agar bersih
        setView('list'); 
        setSelectedOrderId(null);
        
        // Opsional: Jika di mobile, ini mencegah efek 'flicker' browser
        // event.preventDefault(); // (Browser modern kadang mengabaikan ini, tapi history api di bawah yang memegang kendali)
      }
    };

    // Pasang pendengar event tombol back
    window.addEventListener('popstate', handlePopState);

    // LOGIKA PUSH HISTORY:
    // Setiap kali 'activeTab' berubah...
    if (activeTab !== 'dashboard') {
      // Jika kita pindah ke menu selain dashboard (misal: orders),
      // Kita tambahkan "history palsu" ke browser.
      // Ini membuat tombol Back menjadi "aktif" (bisa ditekan).
      window.history.pushState({ tab: activeTab }, '', `?tab=${activeTab}`);
    } else {
      // Jika kembali ke dashboard, kita tidak perlu pushState baru agar tumpukan history tidak menumpuk,
      // tapi secara alami tombol back akan memakan stack yang kita buat sebelumnya.
    }

    // Bersihkan listener saat component unmount atau tab berubah
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab]); // Dependency array: jalankan setiap kali activeTab berubah

  const handleLogout = useCallback(async () => {
    showConfirm('Logout', 'Apakah anda yakin ingin keluar?', async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        window.location.reload(); 
    });
  }, [showConfirm, supabase]);

  const handleUpdateProfile = useCallback(async (newData: any) => {
    if (!currentUser) return;
    
    const { error } = await supabase.from('users').update({
      name: newData.name,
      address: newData.address,
      dob: newData.dob,
      avatar_url: newData.avatar_url
    }).eq('id', currentUser.id);

    if (!error) {
      setCurrentUser({ ...currentUser, ...newData });
      setShowProfileModal(false);
      showAlert('Sukses', 'Profil berhasil diperbarui');
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
      status: 'Pesanan Masuk' as OrderStatus,
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
    if (!error && data) {
      await fetchOrders(); 
      setView('list'); 
      showAlert('Sukses', 'Pesanan berhasil dibuat');
      await triggerOrderNotifications(data);
      await fetchNotifications();
    } else { 
      showAlert('Error', error?.message || 'Gagal', 'error'); 
    }
  }, [generateProductionCode, supabase, fetchOrders, showAlert, fetchNotifications]);

  const handleEditOrder = useCallback(async (editedData: any) => {
    if (!selectedOrderId) return;
    const updates = {
      nama_pemesan: editedData.nama, no_hp: editedData.hp, jumlah: parseInt(editedData.jumlah),
      deadline: editedData.deadline, jenis_produksi: editedData.type, assigned_to: editedData.assigned_to || null
    };
    const { error } = await supabase.from('orders').update(updates).eq('id', selectedOrderId);
    if (!error) {
       const oldOrder = orders.find(o => o.id === selectedOrderId);
       if(oldOrder) await checkAutoStatus({ ...oldOrder, ...updates });
      await fetchOrders(); 
      setView('detail'); 
      showAlert('Sukses', 'Data diupdate');
    }
  }, [selectedOrderId, supabase, orders, fetchOrders, showAlert]);

  const handleDeleteOrder = useCallback(async (id: string) => {
    showConfirm('Hapus?', 'Data dipindah ke sampah.', async () => {
      const { error } = await supabase.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (!error) { await fetchOrders(); setView('list'); showAlert('Sukses', 'Berhasil'); }
    });
  }, [showConfirm, supabase, fetchOrders, showAlert]);

  const handleRestoreOrder = useCallback(async (id: string) => {
    const { error } = await supabase.from('orders').update({ deleted_at: null }).eq('id', id);
    if (!error) { fetchOrders(); showAlert('Sukses', 'Dipulihkan'); }
  }, [supabase, fetchOrders, showAlert]);

  const handlePermanentDelete = useCallback(async (id: string) => {
    showConfirm('HAPUS PERMANEN?', 'Data tidak bisa kembali!', async () => {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (!error) { fetchOrders(); showAlert('Sukses', 'Terhapus'); }
    });
  }, [showConfirm, supabase, fetchOrders, showAlert]);

  const triggerUpload = useCallback((targetType: string, stepId?: string, kendalaId?: string) => {
    const input = document.createElement('input'); 
    input.type = 'file'; 
    input.accept = 'image/*,application/pdf';
    
    input.onchange = async (e: any) => {
      let file = e.target.files?.[0]; 
      if (!file || !selectedOrderId) return;
      
      if (file.type.startsWith('image/')) {
        try { 
          file = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true }); 
        } catch (error) { 
          console.error("Kompresi gagal:", error); 
        }
      }
      
      const fileName = `${selectedOrderId}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('production-proofs').upload(fileName, file);
      
      if (uploadError) { 
        showAlert('Gagal', uploadError.message, 'error'); 
        return; 
      }
      
      const { data: urlData } = supabase.storage.from('production-proofs').getPublicUrl(fileName);
      const order = orders.find(o => o.id === selectedOrderId); 
      if (!order) return;
      
      let updatedOrder = JSON.parse(JSON.stringify(order));
      const common = { fileUrl: urlData.publicUrl, timestamp: new Date().toLocaleString(), uploadedBy: currentUser?.name };
      
      if (targetType === 'approval') {
        updatedOrder.link_approval = { link: urlData.publicUrl, by: currentUser?.name, timestamp: common.timestamp };
      } else if (targetType === 'step' && stepId) {
         const steps = updatedOrder.jenis_produksi === 'manual' ? updatedOrder.steps_manual : updatedOrder.steps_dtf;
         const idx = steps.findIndex((s: any) => s.id === stepId); 
         if (idx >= 0) steps[idx] = { ...steps[idx], isCompleted: true, ...common };
      } else if (targetType === 'packing') {
        updatedOrder.finishing_packing = { isPacked: true, ...common };
      } else if (targetType === 'shipping_kirim') {
        updatedOrder.shipping.bukti_kirim = urlData.publicUrl;
      } else if (targetType === 'shipping_terima') {
        updatedOrder.shipping.bukti_terima = urlData.publicUrl;
      } else if (targetType === 'kendala_bukti' && kendalaId) { 
        const idx = updatedOrder.kendala.findIndex((k: any) => k.id === kendalaId); 
        if(idx >= 0) updatedOrder.kendala[idx].buktiFile = urlData.publicUrl; 
      }
      
      checkAutoStatus(updatedOrder);
    };
    
    input.click();
  }, [selectedOrderId, supabase, orders, currentUser, showAlert]);

  const checkAutoStatus = useCallback(async (orderData: Order) => {
    const oldStatus = orderData.status as OrderStatus;
    const hasUnresolvedKendala = orderData.kendala?.some((k: any) => !k.isResolved);
    let normalStatus = 'Pesanan Masuk';
    const steps = orderData.jenis_produksi === 'manual' ? orderData.steps_manual : orderData.steps_dtf;
    const productionDone = steps?.every((s: any) => s.isCompleted);
    
    if (!orderData.link_approval?.link) {
      normalStatus = 'Pesanan Masuk';
    } else if (!productionDone) {
      normalStatus = 'On Process';
    } else if (!orderData.finishing_qc?.isPassed || !orderData.finishing_packing?.isPacked) {
      normalStatus = (orderData.finishing_qc?.isPassed === false && orderData.finishing_qc?.notes) ? 'Revisi' : 'Finishing';
    } else if (!orderData.shipping?.bukti_terima) {
      normalStatus = 'Kirim';
    } else {
      normalStatus = 'Selesai';
    }
    
    const finalStatus = (hasUnresolvedKendala ? 'Ada Kendala' : normalStatus) as OrderStatus;
    const { error } = await supabase.from('orders').update({ ...orderData, status: finalStatus }).eq('id', orderData.id);
    
    if (!error) { 
      fetchOrders(); 
      await triggerOrderNotifications({ ...orderData, status: finalStatus }, oldStatus);
      await fetchNotifications();
    }
  }, [supabase, fetchOrders, fetchNotifications]);

  const handleSaveUser = useCallback(async (u: any) => {
    const payload: any = { name: u.name, role: u.role, username: u.username }; 
    if (u.permissions) payload.permissions = u.permissions; 
    if (u.password?.trim()) payload.password = u.password;
    
    const { error } = u.id 
      ? await supabase.from('users').update(payload).eq('id', u.id) 
      : await supabase.from('users').insert([payload]); 
      
    if(!error) { fetchUsers(); showAlert('Sukses', 'User tersimpan'); }
  }, [supabase, fetchUsers, showAlert]);

  const handleDeleteUser = useCallback(async (id: string) => { 
    showConfirm('Hapus?', 'User dihapus.', async () => { 
      const { error } = await supabase.from('users').delete().eq('id', id); 
      if(!error) { fetchUsers(); showAlert('Sukses', 'Dihapus'); } 
    }); 
  }, [showConfirm, supabase, fetchUsers, showAlert]);

  const handleSaveType = useCallback(async (t: any) => { 
    const payload = { name: t.name, value: t.value }; 
    const { error } = t.id 
      ? await supabase.from('production_types').update(payload).eq('id', t.id) 
      : await supabase.from('production_types').insert([payload]); 
      
    if(!error) { fetchProductionTypes(); showAlert('Sukses', 'Tipe tersimpan'); } 
  }, [supabase, fetchProductionTypes, showAlert]);

  const handleDeleteType = useCallback(async (id: string) => { 
    showConfirm('Hapus?', 'Yakin hapus tipe ini?', async () => { 
      const { error } = await supabase.from('production_types').delete().eq('id', id); 
      if(!error) { fetchProductionTypes(); showAlert('Sukses', 'Dihapus'); } 
    }); 
  }, [showConfirm, supabase, fetchProductionTypes, showAlert]);

  // OPTIMASI: useMemo untuk data yang sering diakses
  const activeOrders = useMemo(() => orders.filter(o => !o.deleted_at), [orders]);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="h-screen overflow-hidden bg-gray-100 flex flex-col md:flex-row font-sans text-slate-800">
       <CustomAlert alertState={alertState} closeAlert={closeAlert} />
       
       {currentUser && (
         <ProfileModal 
           user={currentUser} 
           isOpen={showProfileModal} 
           onClose={() => setShowProfileModal(false)} 
           onSave={handleUpdateProfile} 
         />
       )}
    
       <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          currentUser={currentUser} 
          activeTab={activeTab} 
          handleNav={(tab: any) => { setActiveTab(tab); setView('list'); setSidebarOpen(false); }}
          onLogout={handleLogout} 
          onOpenProfile={() => setShowProfileModal(true)} 
       />

       <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Header 
            currentUser={currentUser} 
            onToggleSidebar={() => setSidebarOpen(true)} 
            onLogout={handleLogout} 
            sidebarOpen={sidebarOpen} 
            currentPage={activeTab}
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
          />
          
          <main className="flex-1 overflow-y-auto px-4 md:px-6 py-2 md:py-3 pb-32 relative bg-gray-100 no-scrollbar">
             <div className="max-w-7xl mx-auto">
                {activeTab === 'dashboard' && currentUser.permissions?.pages?.dashboard && (
                  <Dashboard 
                    role={currentUser.role} 
                    orders={activeOrders} 
                    onSelectOrder={(id) => { setSelectedOrderId(id); setView('detail'); setActiveTab('orders'); }} 
                  />
                )}
                
                {activeTab === 'orders' && currentUser.permissions?.pages?.orders && (
                  <>
                    {view === 'list' && (
                      <OrderList 
                        role={currentUser.role} 
                        orders={activeOrders} 
                        productionTypes={productionTypes} 
                        onSelectOrder={(id) => { setSelectedOrderId(id); setView('detail'); }} 
                        onNewOrder={() => setView('create')} 
                        onDeleteOrder={handleDeleteOrder} 
                        currentUser={currentUser} 
                      />
                    )}
                    {view === 'create' && (
                      <CreateOrder 
                        users={usersList} 
                        productionTypes={productionTypes} 
                        onCancel={() => setView('list')} 
                        onSubmit={handleCreateOrder} 
                      />
                    )}
                    {view === 'edit' && selectedOrderId && (
                      <EditOrder 
                        users={usersList} 
                        order={orders.find(o => o.id === selectedOrderId)!} 
                        productionTypes={productionTypes} 
                        onCancel={() => setView('detail')} 
                        onSubmit={handleEditOrder} 
                      />
                    )}
                    {view === 'detail' && selectedOrderId && (
                      <OrderDetail 
                        currentUser={currentUser} 
                        order={orders.find(o => o.id === selectedOrderId)!} 
                        onBack={() => { setSelectedOrderId(null); setView('list'); }} 
                        onEdit={() => setView('edit')} 
                        onTriggerUpload={triggerUpload} 
                        onUpdateOrder={checkAutoStatus} 
                        onDelete={handleDeleteOrder} 
                        onConfirm={showConfirm} 
                      />
                    )}
                  </>
                )}

                {/* UPDATE 3: Render Component CompletedOrders */}
                {activeTab === 'completed_orders' && currentUser.permissions?.pages?.orders && (
                   <CompletedOrders orders={activeOrders} />
                )}
                
                {activeTab === 'trash' && currentUser.permissions?.pages?.trash && (
                  <TrashView 
                    orders={orders.filter(o => o.deleted_at)} 
                    onRestore={handleRestoreOrder} 
                    onPermanentDelete={handlePermanentDelete} 
                  />
                )}
                
                {activeTab === 'settings' && currentUser.permissions?.pages?.settings && (
                  <SettingsPage 
                    users={usersList} 
                    productionTypes={productionTypes} 
                    onSaveUser={handleSaveUser} 
                    onDeleteUser={handleDeleteUser} 
                    onSaveProductionType={handleSaveType} 
                    onDeleteProductionType={handleDeleteType} 
                  />
                )}
                
                {activeTab === 'kalkulator' && currentUser.permissions?.pages?.kalkulator && <CalculatorView />}
                {activeTab === 'config_harga' && currentUser.permissions?.pages?.config_harga && <ConfigPriceView />}
                {activeTab === 'about' && <AboutView />}
             </div>
          </main>
       </div>
    </div>
  );
}