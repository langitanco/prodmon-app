'use client';

// --- GANTI SELURUH BAGIAN IMPORT DI ATAS DENGAN INI ---
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Menu } from 'lucide-react';

import Sidebar from '@/app/components/layout/Sidebar';
import CustomAlert from '@/app/components/ui/CustomAlert';
import LoginScreen from '@/app/components/auth/LoginScreen';

// Dashboard
import Dashboard from '@/app/components/dashboard/Dashboard'; 

// Apps (Kalkulator & Config Harga ada di folder apps)
import CalculatorView from '@/app/components/apps/CalculatorView';
import ConfigPriceView from '@/app/components/apps/ConfigPriceView';

// ORDERS (Perhatikan: di screenshot folder Anda namanya 'orders', bukan 'apps')
import OrderList from '@/app/components/orders/OrderList';
import CreateOrder from '@/app/components/orders/CreateOrder';
import EditOrder from '@/app/components/orders/EditOrder';
import OrderDetail from '@/app/components/orders/OrderDetail';

// TrashView (Cek di folder mana file ini berada, saya asumsikan di orders)
import TrashView from '@/app/components/orders/TrashView'; 

// Settings
import SettingsPage from '@/app/components/settings/SettingsPage'; 
import { UserData, Order, ProductionTypeData } from '@/types';
import { DEFAULT_PRODUCTION_TYPES } from '@/lib/utils';

// --- DEFINISI TIPE ---
interface CurrentUser extends UserData {
  id: string; // ID dari Supabase Auth
}

export default function ProductionApp() {
  // State Management
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'settings' | 'trash' | 'kalkulator' | 'config_harga'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionTypeData[]>([]);
  
  // View State
  const [view, setView] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Alert State
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'success' });

  // Init Supabase
  const supabase = createClientComponentClient();

  // --- HELPER ALERT ---
  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setAlertState({ isOpen: true, title, message, type, onConfirm: undefined });
  };
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlertState({ isOpen: true, title, message, type: 'confirm', onConfirm });
  };
  const closeAlert = () => setAlertState(prev => ({ ...prev, isOpen: false }));

  // --- EFFECT: AUTHENTICATION & DATA LOAD ---
  useEffect(() => {
    const initSession = async () => {
      setLoadingUser(true);
      
      // 1. Cek Session Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // 2. Ambil detail role dari tabel 'users' berdasarkan ID auth
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData) {
          // Set user dengan data gabungan dari Auth + Tabel Users
          setCurrentUser({
            id: session.user.id,
            username: userData.username || session.user.email || '',
            name: userData.name || session.user.email?.split('@')[0] || 'User',
            role: userData.role || 'prod',
            password: '', // Password tidak disimpan di client state untuk keamanan
            // Jika ada field lain di UserData, tambahkan defaultnya di sini
          });
        } else {
          // Jika login tapi data tidak ada di tabel users
          console.error("User login di Auth tapi tidak ada di tabel public.users");
          await supabase.auth.signOut();
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingUser(false);
    };

    initSession();

    // Listener perubahan auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        initSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- EFFECT: FETCH DATA APLIKASI ---
  useEffect(() => {
    if (!currentUser) return;

    const loadAppData = async () => {
      await fetchOrders();
      await fetchUsers();
      await fetchProductionTypes();
    };

    loadAppData();

    // Realtime Subscription
    const channel = supabase.channel('realtime-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchUsers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_types' }, fetchProductionTypes)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  // --- DATA FETCHING FUNCTIONS ---
  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) {
      // Parsing JSON fields jika perlu
      const parsed = data.map((o: any) => ({
        ...o,
        kendala: Array.isArray(o.kendala) ? o.kendala : []
      }));
      setOrders(parsed);
    }
  };

  const fetchUsers = async () => {
    // Ambil semua user untuk keperluan Settings (Supervisor only)
    const { data } = await supabase.from('users').select('*').order('name');
    if (data) setUsersList(data);
  };

  const fetchProductionTypes = async () => {
    const { data } = await supabase.from('production_types').select('*').order('name');
    if (data) setProductionTypes(data);
    else if (productionTypes.length === 0) setProductionTypes(DEFAULT_PRODUCTION_TYPES);
  };

  // --- LOGIC: ORDERS ---
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
    const max = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  };

  const handleCreateOrder = async (formData: any) => {
    const payload: any = {
      kode_produksi: generateProductionCode(),
      nama_pemesan: formData.nama,
      no_hp: formData.hp,
      jumlah: parseInt(formData.jumlah) || 0,
      tanggal_masuk: new Date().toISOString().split('T')[0],
      deadline: formData.deadline,
      jenis_produksi: formData.type,
      status: 'Pesanan Masuk',
      // Default steps
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

    const { error } = await supabase.from('orders').insert([payload]);
    if (!error) {
      await fetchOrders();
      setView('list');
      showAlert('Sukses', 'Pesanan berhasil dibuat');
    } else {
      showAlert('Error', error.message, 'error');
    }
  };

  const handleEditOrder = async (editedData: any) => {
    if (!selectedOrderId) return;
    const { error } = await supabase.from('orders').update({
      nama_pemesan: editedData.nama,
      no_hp: editedData.hp,
      jumlah: parseInt(editedData.jumlah),
      deadline: editedData.deadline,
      jenis_produksi: editedData.type
    }).eq('id', selectedOrderId);

    if (!error) {
      await fetchOrders();
      setView('detail');
      showAlert('Sukses', 'Data berhasil diupdate');
    } else {
      showAlert('Error', error.message, 'error');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    showConfirm('Hapus ke Sampah?', 'Data akan dipindah ke sampah.', async () => {
      const { error } = await supabase.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (!error) {
        await fetchOrders();
        setView('list');
        showAlert('Sukses', 'Pesanan dihapus (soft delete)');
      }
    });
  };

  const handleRestoreOrder = async (id: string) => {
    const { error } = await supabase.from('orders').update({ deleted_at: null }).eq('id', id);
    if (!error) { fetchOrders(); showAlert('Sukses', 'Pesanan dipulihkan'); }
  };

  const handlePermanentDelete = async (id: string) => {
    showConfirm('HAPUS PERMANEN?', 'Data tidak bisa kembali!', async () => {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (!error) { fetchOrders(); showAlert('Sukses', 'Data terhapus permanen'); }
    });
  };

  // --- LOGIC: UPLOADS & STATUS ---
  const triggerUpload = (targetType: string, stepId?: string, kendalaId?: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file || !selectedOrderId) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedOrderId}/${Date.now()}.${fileExt}`;
      
      // Upload ke bucket 'production-proofs'
      const { error: uploadError } = await supabase.storage.from('production-proofs').upload(fileName, file);
      if (uploadError) { showAlert('Gagal Upload', uploadError.message, 'error'); return; }

      const { data: urlData } = supabase.storage.from('production-proofs').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      const timestamp = new Date().toLocaleString();
      const uploaderName = currentUser?.name || 'Unknown';

      // Update Local State Logic (Simplifikasi update JSON)
      const order = orders.find(o => o.id === selectedOrderId);
      if (!order) return;
      
      let updatedOrder = JSON.parse(JSON.stringify(order));

      if (targetType === 'approval') {
         updatedOrder.link_approval = { link: publicUrl, by: uploaderName, timestamp };
      } else if (targetType === 'step' && stepId) {
         const steps = updatedOrder.jenis_produksi === 'manual' ? updatedOrder.steps_manual : updatedOrder.steps_dtf;
         const idx = steps.findIndex((s: any) => s.id === stepId);
         if (idx >= 0) { 
           steps[idx].isCompleted = true; 
           steps[idx].fileUrl = publicUrl; 
           steps[idx].timestamp = timestamp; 
           steps[idx].uploadedBy = uploaderName; 
         }
      } else if (targetType === 'packing') {
         updatedOrder.finishing_packing = { isPacked: true, fileUrl: publicUrl, timestamp, packedBy: uploaderName };
      } else if (targetType === 'shipping_kirim') {
         updatedOrder.shipping.bukti_kirim = publicUrl;
      } else if (targetType === 'shipping_terima') {
         updatedOrder.shipping.bukti_terima = publicUrl;
      } else if (targetType === 'kendala_bukti' && kendalaId) {
         const idx = updatedOrder.kendala.findIndex((k: any) => k.id === kendalaId);
         if(idx >= 0) updatedOrder.kendala[idx].buktiFile = publicUrl;
      }

      checkAutoStatus(updatedOrder);
    };
    input.click();
  };

  const checkAutoStatus = async (orderData: Order) => {
    // Logika penentuan status otomatis
    let newStatus = orderData.status;
    const hasApproval = !!orderData.link_approval?.link;
    const steps = orderData.jenis_produksi === 'manual' ? orderData.steps_manual : orderData.steps_dtf;
    const productionDone = steps.every((s: any) => s.isCompleted);
    
    if (!hasApproval) newStatus = 'Pesanan Masuk';
    else if (!productionDone) newStatus = 'On Process';
    else if (!orderData.finishing_qc?.isPassed || !orderData.finishing_packing?.isPacked) newStatus = 'Finishing';
    else if (!orderData.shipping?.bukti_kirim) newStatus = 'Kirim';
    else newStatus = 'Selesai';

    // Update DB
    const { error } = await supabase.from('orders').update({
      ...orderData, // Update JSON fields
      status: newStatus
    }).eq('id', orderData.id);

    if (error) showAlert('Error Update', error.message, 'error');
    else fetchOrders();
  };

  // --- LOGIC: SETTINGS & CONFIG ---
  const handleSaveUser = async (u: any) => {
    // Note: Untuk production, sebaiknya create user lewat Supabase Auth Admin API
    // Di sini kita hanya update tabel 'users'
    const payload = { name: u.name, role: u.role, username: u.username };
    
    if (u.id) {
      const { error } = await supabase.from('users').update(payload).eq('id', u.id);
      if(!error) { fetchUsers(); showAlert('Sukses', 'User updated'); }
      else showAlert('Gagal', error.message, 'error');
    } else {
      // Create user baru (Hanya insert ke tabel public, belum auth sebenarnya jika tanpa edge functions)
      showAlert('Info', 'Fitur Create User baru harus via Signup Supabase.', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    showConfirm('Hapus User?', 'User akan dihapus dari database.', async () => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if(!error) { fetchUsers(); showAlert('Sukses', 'User dihapus'); }
      else showAlert('Gagal', error.message, 'error');
    });
  };

  const handleSaveType = async (t: any) => {
    const payload = { name: t.name, value: t.value };
    if (t.id) {
      const { error } = await supabase.from('production_types').update(payload).eq('id', t.id);
      if(!error) { fetchProductionTypes(); showAlert('Sukses', 'Tipe produksi disimpan'); }
    } else {
      const { error } = await supabase.from('production_types').insert([payload]);
      if(!error) { fetchProductionTypes(); showAlert('Sukses', 'Tipe produksi baru dibuat'); }
    }
  };

  const handleDeleteType = async (id: string) => {
    showConfirm('Hapus Tipe?', 'Yakin hapus tipe produksi ini?', async () => {
      const { error } = await supabase.from('production_types').delete().eq('id', id);
      if(!error) { fetchProductionTypes(); showAlert('Sukses', 'Tipe dihapus'); }
    });
  };


  // --- MAIN RENDER ---

  if (loadingUser) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          {/* Animasi Spinner */}
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium animate-pulse">Menyiapkan Dashboard...</p>
        </div>
      );
  }

  // Jika tidak ada user (belum login atau session habis), tampilkan Login
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Filter orders active (bukan sampah)
  const activeOrders = orders.filter(o => !o.deleted_at);

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row">
      <CustomAlert alertState={alertState} closeAlert={closeAlert} />
      
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentUser={currentUser} 
        activeTab={activeTab} 
        handleNav={(tab: any) => { setActiveTab(tab); setView('list'); setSidebarOpen(false); }} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white px-4 py-3 shadow-md flex items-center justify-between sticky top-0 z-30 border-b">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200 transition">
                <Menu className="w-6 h-6"/>
              </button>
              <span className="font-bold text-slate-800 text-lg">LCO Production</span>
            </div>
            <div className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded uppercase tracking-wide">
              {currentUser.role}
            </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 pb-24">
           <div className="max-w-6xl mx-auto">
              
              {activeTab === 'dashboard' && (
                  <Dashboard 
                    role={currentUser.role} 
                    orders={activeOrders} 
                    onSelectOrder={(id: string) => { setSelectedOrderId(id); setView('detail'); setActiveTab('orders'); }} 
                  />
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
                  
                  {view === 'create' && (
                    <CreateOrder 
                      productionTypes={productionTypes} 
                      onCancel={() => setView('list')} 
                      onSubmit={handleCreateOrder}
                    />
                  )}
                  
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

              {activeTab === 'trash' && currentUser.role === 'supervisor' && (
                 <TrashView 
                    orders={orders.filter(o => o.deleted_at)} 
                    onRestore={handleRestoreOrder} 
                    onPermanentDelete={handlePermanentDelete} 
                 />
              )}

              {activeTab === 'settings' && currentUser.role === 'supervisor' && (
                 <SettingsPage 
                    users={usersList} 
                    productionTypes={productionTypes} 
                    onSaveUser={handleSaveUser} 
                    onDeleteUser={handleDeleteUser} 
                    onSaveProductionType={handleSaveType}
                    onDeleteProductionType={handleDeleteType}
                 />
              )}

              {activeTab === 'kalkulator' && (
                 <CalculatorView />
              )}

              {activeTab === 'config_harga' && currentUser.role === 'supervisor' && (
                 // Perhatikan di sini: Saya mengirim prop currentUser jika komponen membutuhkannya
                 <ConfigPriceView />
              )}

           </div>
        </main>
      </div>
    </div>
  );
}