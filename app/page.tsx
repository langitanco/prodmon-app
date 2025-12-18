// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Menu } from 'lucide-react';

// Layout & UI
import Sidebar from '@/app/components/layout/Sidebar';
import CustomAlert from '@/app/components/ui/CustomAlert';
import LoginScreen from '@/app/components/auth/LoginScreen';

// Dashboard
import Dashboard from '@/app/components/dashboard/Dashboard'; 

// Apps & Config
import CalculatorView from '@/app/components/apps/CalculatorView';
import ConfigPriceView from '@/app/components/apps/ConfigPriceView';
import AboutView from '@/app/components/misc/AboutView'; 

// ORDERS 
import OrderList from '@/app/components/orders/OrderList';
import CreateOrder from '@/app/components/orders/CreateOrder';
import EditOrder from '@/app/components/orders/EditOrder';
import OrderDetail from '@/app/components/orders/OrderDetail';
import TrashView from '@/app/components/orders/TrashView'; 

// Settings
import SettingsPage from '@/app/components/settings/SettingsPage'; 

// Types & Helpers
import { UserData, Order, ProductionTypeData, DEFAULT_PERMISSIONS, OrderStatus } from '@/types';
import { DEFAULT_PRODUCTION_TYPES } from '@/lib/utils';

// ✅ IMPORT LOGIKA PUSAT
import { triggerOrderNotifications } from '@/lib/orderLogic';

interface CurrentUser extends UserData {
  id: string; 
}

export default function ProductionApp() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'settings' | 'trash' | 'kalkulator' | 'config_harga' | 'about'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionTypeData[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'confirm'; onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'success' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setAlertState({ isOpen: true, title, message, type, onConfirm: undefined });
  };
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlertState({ isOpen: true, title, message, type: 'confirm', onConfirm });
  };
  const closeAlert = () => setAlertState(prev => ({ ...prev, isOpen: false }));

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
          });
        }
      }
      setLoadingUser(false);
    };
    initSession();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const loadAppData = async () => {
      await fetchOrders();
      await fetchUsers();
      await fetchProductionTypes();
    };
    loadAppData();
  }, [currentUser]);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data.map((o: any) => ({ ...o, kendala: Array.isArray(o.kendala) ? o.kendala : [] })));
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('name');
    if (data) setUsersList(data);
  };

  const fetchProductionTypes = async () => {
    const { data } = await supabase.from('production_types').select('*').order('name');
    if (data) setProductionTypes(data);
    else if (productionTypes.length === 0) setProductionTypes(DEFAULT_PRODUCTION_TYPES);
  };

  const generateProductionCode = () => {
    const now = new Date();
    const prefix = `LCO-${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}-`;
    const existingCodes = orders.filter(o => o.kode_produksi?.startsWith(prefix)).map(o => parseInt(o.kode_produksi.split('-').pop()!) || 0);
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
    } else {
      showAlert('Error', error?.message || 'Gagal', 'error');
    }
  };

  const handleEditOrder = async (editedData: any) => {
    if (!selectedOrderId) return;
    const updates = {
      nama_pemesan: editedData.nama, no_hp: editedData.hp, jumlah: parseInt(editedData.jumlah),
      deadline: editedData.deadline, jenis_produksi: editedData.type
    };
    const { error } = await supabase.from('orders').update(updates).eq('id', selectedOrderId);
    if (!error) {
       const oldOrder = orders.find(o => o.id === selectedOrderId);
       if(oldOrder) await checkAutoStatus({ ...oldOrder, ...updates });
      await fetchOrders(); setView('detail'); showAlert('Sukses', 'Data diupdate');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    showConfirm('Hapus?', 'Data dipindah ke sampah.', async () => {
      const { error } = await supabase.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (!error) { await fetchOrders(); setView('list'); showAlert('Sukses', 'Berhasil'); }
    });
  };

  const handleRestoreOrder = async (id: string) => {
    const { error } = await supabase.from('orders').update({ deleted_at: null }).eq('id', id);
    if (!error) { fetchOrders(); showAlert('Sukses', 'Dipulihkan'); }
  };

  const handlePermanentDelete = async (id: string) => {
    showConfirm('HAPUS PERMANEN?', 'Data tidak bisa kembali!', async () => {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (!error) { fetchOrders(); showAlert('Sukses', 'Terhapus'); }
    });
  };

  const triggerUpload = (targetType: string, stepId?: string, kendalaId?: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file || !selectedOrderId) return;
      const fileName = `${selectedOrderId}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('production-proofs').upload(fileName, file);
      if (uploadError) { showAlert('Gagal', uploadError.message, 'error'); return; }
      const { data: urlData } = supabase.storage.from('production-proofs').getPublicUrl(fileName);
      const order = orders.find(o => o.id === selectedOrderId);
      if (!order) return;
      let updatedOrder = JSON.parse(JSON.stringify(order));
      const common = { fileUrl: urlData.publicUrl, timestamp: new Date().toLocaleString(), uploadedBy: currentUser?.name };
      
      if (targetType === 'approval') updatedOrder.link_approval = { link: urlData.publicUrl, by: currentUser?.name, timestamp: common.timestamp };
      else if (targetType === 'step' && stepId) {
         const steps = updatedOrder.jenis_produksi === 'manual' ? updatedOrder.steps_manual : updatedOrder.steps_dtf;
         const idx = steps.findIndex((s: any) => s.id === stepId);
         if (idx >= 0) { steps[idx] = { ...steps[idx], isCompleted: true, ...common }; }
      } else if (targetType === 'packing') updatedOrder.finishing_packing = { isPacked: true, ...common };
      else if (targetType === 'shipping_kirim') updatedOrder.shipping.bukti_kirim = urlData.publicUrl;
      else if (targetType === 'shipping_terima') updatedOrder.shipping.bukti_terima = urlData.publicUrl;
      else if (targetType === 'kendala_bukti' && kendalaId) {
         const idx = updatedOrder.kendala.findIndex((k: any) => k.id === kendalaId);
         if(idx >= 0) updatedOrder.kendala[idx].buktiFile = urlData.publicUrl;
      }
      checkAutoStatus(updatedOrder);
    };
    input.click();
  };

  const checkAutoStatus = async (orderData: Order) => {
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
    const { error } = await supabase.from('orders').update({ ...orderData, status: finalStatus }).eq('id', orderData.id);

    if (!error) {
        fetchOrders();
        await triggerOrderNotifications({ ...orderData, status: finalStatus }, oldStatus);
    }
  };

  const handleSaveUser = async (u: any) => {
    const payload: any = { name: u.name, role: u.role, username: u.username };
    if (u.permissions) payload.permissions = u.permissions;
    if (u.password?.trim()) payload.password = u.password;
    const { error } = u.id ? await supabase.from('users').update(payload).eq('id', u.id) : await supabase.from('users').insert([payload]);
    if(!error) { fetchUsers(); showAlert('Sukses', 'User tersimpan'); }
  };

  const handleDeleteUser = async (id: string) => {
    showConfirm('Hapus?', 'User dihapus.', async () => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if(!error) { fetchUsers(); showAlert('Sukses', 'Dihapus'); }
    });
  };

  const handleSaveType = async (t: any) => {
    const payload = { name: t.name, value: t.value };
    const { error } = t.id ? await supabase.from('production_types').update(payload).eq('id', t.id) : await supabase.from('production_types').insert([payload]);
    if(!error) { fetchProductionTypes(); showAlert('Sukses', 'Tipe tersimpan'); }
  };

  const handleDeleteType = async (id: string) => {
    showConfirm('Hapus?', 'Yakin hapus tipe ini?', async () => {
      const { error } = await supabase.from('production_types').delete().eq('id', id);
      if(!error) { fetchProductionTypes(); showAlert('Sukses', 'Dihapus'); }
    });
  };

  if (loadingUser) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!currentUser) return <LoginScreen />;

  const activeOrders = orders.filter(o => !o.deleted_at);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <CustomAlert alertState={alertState} closeAlert={closeAlert} />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={currentUser} activeTab={activeTab} 
        handleNav={(tab: any) => { setActiveTab(tab); setView('list'); setSidebarOpen(false); }} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-white px-4 py-3 shadow-md flex items-center justify-between border-b">
            <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg"><Menu className="w-6 h-6"/></button><span className="font-bold">LCO Production</span></div>
            <div className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded">{currentUser.role}</div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 pb-24 relative">
           <div className="max-w-6xl mx-auto">
              {activeTab === 'dashboard' && currentUser.permissions?.pages?.dashboard && <Dashboard role={currentUser.role} orders={activeOrders} onSelectOrder={(id) => { setSelectedOrderId(id); setView('detail'); setActiveTab('orders'); }} />}
              {activeTab === 'orders' && currentUser.permissions?.pages?.orders && (
                <>
                  {view === 'list' && <OrderList role={currentUser.role} orders={activeOrders} productionTypes={productionTypes} onSelectOrder={(id) => { setSelectedOrderId(id); setView('detail'); }} onNewOrder={() => setView('create')} onDeleteOrder={handleDeleteOrder} currentUser={currentUser} />}
                  {view === 'create' && <CreateOrder productionTypes={productionTypes} onCancel={() => setView('list')} onSubmit={handleCreateOrder} />}
                  {view === 'edit' && selectedOrderId && <EditOrder order={orders.find(o => o.id === selectedOrderId)!} productionTypes={productionTypes} onCancel={() => setView('detail')} onSubmit={handleEditOrder} />}
                  {view === 'detail' && selectedOrderId && <OrderDetail currentUser={currentUser} order={orders.find(o => o.id === selectedOrderId)!} onBack={() => { setSelectedOrderId(null); setView('list'); }} onEdit={() => setView('edit')} onTriggerUpload={triggerUpload} onUpdateOrder={checkAutoStatus} onDelete={handleDeleteOrder} onConfirm={showConfirm} />}
                </>
              )}
              {activeTab === 'trash' && currentUser.permissions?.pages?.trash && <TrashView orders={orders.filter(o => o.deleted_at)} onRestore={handleRestoreOrder} onPermanentDelete={handlePermanentDelete} />}
              {activeTab === 'settings' && currentUser.permissions?.pages?.settings && <SettingsPage users={usersList} productionTypes={productionTypes} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} onSaveProductionType={handleSaveType} onDeleteProductionType={handleDeleteType} />}
              {activeTab === 'kalkulator' && currentUser.permissions?.pages?.kalkulator && <CalculatorView />}
              {activeTab === 'config_harga' && currentUser.permissions?.pages?.config_harga && <ConfigPriceView />}
              {activeTab === 'about' && <AboutView />}
           </div>
        </main>
      </div>
    </div>
  );
}