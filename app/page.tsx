'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import { UserData, Order, ProductionTypeData } from '@/types';
import { DEFAULT_USERS, DEFAULT_PRODUCTION_TYPES } from '@/lib/utils';

import Sidebar from '@/app/components/layout/Sidebar';
import CustomAlert from '@/app/components/ui/CustomAlert';
import LoginScreen from '@/app/components/auth/LoginScreen';
import Dashboard from '@/app/components/dashboard/Dashboard';
import OrderList from '@/app/components/orders/OrderList';
import CreateOrder from '@/app/components/orders/CreateOrder';
import EditOrder from '@/app/components/orders/EditOrder';
import OrderDetail from '@/app/components/orders/OrderDetail';
import TrashView from '@/app/components/orders/TrashView';
import SettingsPage from '@/app/components/settings/SettingsPage';
import CalculatorView from '@/app/components/apps/CalculatorView';
import ConfigPriceView from '@/app/components/apps/ConfigPriceView';

import { Menu } from 'lucide-react';

export default function ProductionApp() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'settings' | 'trash' | 'kalkulator' | 'config_harga'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionTypeData[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'success' });

  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setAlertState({ isOpen: true, title, message, type, onConfirm: undefined });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlertState({ isOpen: true, title, message, type: 'confirm', onConfirm });
  };

  const closeAlert = () => setAlertState(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) { localStorage.removeItem('currentUser'); }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchOrders();
      await fetchUsers();
      await fetchProductionTypes();
    };
    loadData();

    const channel = supabase.channel('realtime-db')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_types' }, () => fetchProductionTypes())
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) {
       const parsedOrders = data.map((order: any) => ({
         ...order,
         kendala: (order.kendala || []).map((k: any) => ({ ...k, isResolved: k.isResolved || false }))
       }));
       setOrders(parsedOrders);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('username');
    if (!data || data.length === 0) {
      if(usersList.length === 0) setUsersList(DEFAULT_USERS); 
    } else {
      setUsersList(data);
    }
  };

  const fetchProductionTypes = async () => {
    const { data } = await supabase.from('production_types').select('*').order('name');
    if (!data || data.length === 0) {
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
    return `${prefix}${String(maxSequence + 1).padStart(4, '0')}`;
  };

  const handleCreateOrder = async (newOrderData: any) => {
    const payload: any = {
      kode_produksi: generateProductionCode(),
      nama_pemesan: newOrderData.nama,
      no_hp: newOrderData.hp,
      jumlah: parseInt(newOrderData.jumlah) || 0,
      tanggal_masuk: new Date().toISOString().split('T')[0], 
      deadline: newOrderData.deadline,
      jenis_produksi: newOrderData.type,
      status: 'Pesanan Masuk',
      steps_manual: [{ id: 'm1', name: 'Pecah Gambar (PDF)', type: 'upload_pdf', isCompleted: false }, { id: 'm2', name: 'Print Film', type: 'upload_image', isCompleted: false }, { id: 'm3', name: 'Proofing', type: 'upload_image', isCompleted: false }, { id: 'm4', name: 'Produksi Massal', type: 'upload_image', isCompleted: false }],
      steps_dtf: [{ id: 'd1', name: 'Cetak DTF', type: 'status_update', isCompleted: false }, { id: 'd2', name: 'Press Kaos', type: 'upload_image', isCompleted: false }],
      finishing_qc: { isPassed: false, notes: '' },
      finishing_packing: { isPacked: false },
      shipping: {},
      kendala: []
    };
    
    const { error } = await supabase.from('orders').insert([payload]);
    if (!error) {
      await fetchOrders();
      setView('list');
      showAlert('Sukses', 'Pesanan baru berhasil dibuat!');
    } else {
      showAlert('Error', 'Gagal: ' + error.message, 'error');
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
       showAlert('Sukses', 'Data pesanan berhasil diupdate!');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    showConfirm('Pindahkan ke Sampah?', 'Pesanan ini akan dipindahkan ke folder sampah.', async () => {
      const { error } = await supabase.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if(!error) {
        await fetchOrders();
        setView('list');
        showAlert('Sukses', 'Pesanan dipindahkan ke sampah!');
      }
    });
  };

  const handleRestoreOrder = async (id: string) => {
    showConfirm('Pulihkan Pesanan?', 'Pesanan akan kembali aktif.', async () => {
      const { error } = await supabase.from('orders').update({ deleted_at: null }).eq('id', id);
      if(!error) { await fetchOrders(); showAlert('Sukses', 'Pesanan dipulihkan!'); }
    });
  };

  const handlePermanentDelete = async (id: string) => {
    showConfirm('HAPUS PERMANEN?', 'Data tidak bisa dikembalikan!', async () => {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if(!error) { await fetchOrders(); showAlert('Sukses', 'Pesanan dihapus permanen!'); }
    });
  };

  const triggerUpload = (targetType: string, stepId?: string, kendalaId?: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e: any) => {
       const file = e.target.files?.[0];
       if (!file || !selectedOrderId) return;
       
       const fileExt = file.name.split('.').pop();
       const fileName = `${selectedOrderId}/${Date.now()}.${fileExt}`;
       const { error: uploadError } = await supabase.storage.from('production-proofs').upload(fileName, file);
       
       if (uploadError) { showAlert('Gagal', uploadError.message, 'error'); return; }
       
       const { data: urlData } = supabase.storage.from('production-proofs').getPublicUrl(fileName);
       const publicUrl = urlData.publicUrl;
       const timestamp = new Date().toLocaleString();
       const uploader = currentUser?.name || 'unknown';

       const order = orders.find(o => o.id === selectedOrderId);
       if (!order) return;
       
       let updatedOrder = JSON.parse(JSON.stringify(order));

       if (targetType === 'approval') {
          updatedOrder.link_approval = { link: publicUrl, by: uploader, timestamp };
       } else if (targetType === 'step' && stepId) {
          const steps = updatedOrder.jenis_produksi === 'manual' ? updatedOrder.steps_manual : updatedOrder.steps_dtf;
          const idx = steps.findIndex((s: any) => s.id === stepId);
          if (idx >= 0) { steps[idx].isCompleted=true; steps[idx].fileUrl=publicUrl; steps[idx].timestamp=timestamp; steps[idx].uploadedBy=uploader; }
       } else if (targetType === 'packing') {
          updatedOrder.finishing_packing = { isPacked: true, fileUrl: publicUrl, timestamp, packedBy: uploader };
       } else if (targetType === 'shipping_kirim') {
          updatedOrder.shipping.bukti_kirim = publicUrl; updatedOrder.shipping.timestamp_kirim = timestamp; updatedOrder.shipping.uploaded_by_kirim = uploader;
       } else if (targetType === 'shipping_terima') {
          updatedOrder.shipping.bukti_terima = publicUrl; updatedOrder.shipping.timestamp_terima = timestamp; updatedOrder.shipping.uploaded_by_terima = uploader;
       } else if (targetType === 'kendala_bukti' && kendalaId) {
          const idx = updatedOrder.kendala.findIndex((k: any) => k.id === kendalaId);
          if (idx >= 0) updatedOrder.kendala[idx].buktiFile = publicUrl;
       }
       
       checkAutoStatus(updatedOrder);
    };
    input.click();
  };

  const checkAutoStatus = async (orderData: Order) => {
    let newStatus = orderData.status;
    const hasApproval = !!(orderData.link_approval?.link);
    const steps = orderData.jenis_produksi === 'manual' ? orderData.steps_manual : orderData.steps_dtf;
    const productionDone = steps.every(s => s.isCompleted);
    const hasActiveKendala = orderData.kendala.some(k => !k.isResolved); 
    
    if (!hasApproval) {
      newStatus = 'Pesanan Masuk';
    } else if (!productionDone) {
      newStatus = 'On Process';
    } 
    else if (!orderData.finishing_qc.isPassed || !orderData.finishing_packing.isPacked) {
      newStatus = 'Finishing';
    } 
    else if (!orderData.shipping.bukti_kirim || !orderData.shipping.bukti_terima) {
      newStatus = 'Kirim';
    } 
    else {
      newStatus = 'Selesai';
    }
    
    if (hasActiveKendala) {
      newStatus = 'Ada Kendala';
    }
    
    const { error } = await supabase.from('orders').update({
        ...orderData,
        status: newStatus
    }).eq('id', orderData.id);

    if (error) showAlert('Error', 'Gagal update: ' + error.message, 'error');
    else fetchOrders();
  };

  const handleSaveUser = async (u: any) => {
      const payload = { username: u.username, password: u.password, name: u.name, role: u.role };
      let res;
      if(u.id) res = await supabase.from('users').update(payload).eq('id', u.id);
      else res = await supabase.from('users').insert([payload]);
      
      if(!res.error) { fetchUsers(); showAlert('Sukses', 'User tersimpan'); }
      else showAlert('Gagal', res.error.message, 'error');
  };

  const handleDeleteUser = async (id: string) => {
      showConfirm('Hapus User?', 'User akan dihapus.', async() => {
         const { error } = await supabase.from('users').delete().eq('id', id);
         if(!error) { fetchUsers(); showAlert('Sukses', 'User dihapus'); }
      });
  };

  const handleSaveType = async (t: any) => {
      const payload = { name: t.name, value: t.value };
      let res;
      if(t.id) res = await supabase.from('production_types').update(payload).eq('id', t.id);
      else res = await supabase.from('production_types').insert([payload]);
      
      if(!res.error) { fetchProductionTypes(); showAlert('Sukses', 'Jenis produksi tersimpan'); }
      else showAlert('Gagal', res.error.message, 'error');
  };

  const handleDeleteType = async (id: string) => {
      showConfirm('Hapus Jenis?', 'Data akan dihapus.', async() => {
         const { error } = await supabase.from('production_types').delete().eq('id', id);
         if(!error) { fetchProductionTypes(); showAlert('Sukses', 'Jenis dihapus'); }
      });
  };

  if (!currentUser) return <LoginScreen usersList={usersList} onLogin={handleLogin} />;

  const handleNav = (tab: any) => { setActiveTab(tab); setView('list'); setSidebarOpen(false); };

  const activeOrders = orders.filter(o => !o.deleted_at);

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row">
      <CustomAlert alertState={alertState} closeAlert={closeAlert} />
      
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentUser={currentUser} 
        activeTab={activeTab} 
        handleNav={handleNav} 
        handleLogout={handleLogout} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-white px-4 py-3 shadow-md flex items-center justify-between sticky top-0 z-30 border-b">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200 transition">
                <Menu className="w-6 h-6"/>
              </button>
              <span className="font-bold text-slate-800 text-lg">Langitan.co</span>
            </div>
            <div className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded uppercase tracking-wide">{currentUser.role}</div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 pb-24">
           <div className="max-w-6xl mx-auto">
              
              {activeTab === 'dashboard' && (
                  <Dashboard 
                    role={currentUser.role} 
                    orders={activeOrders} 
                    onSelectOrder={(id) => { setSelectedOrderId(id); setView('detail'); setActiveTab('orders'); }} 
                  />
              )}

              {activeTab === 'orders' && (
                <>
                  {view === 'list' && (
                    <OrderList 
                      role={currentUser.role} 
                      orders={activeOrders} 
                      productionTypes={productionTypes}
                      onSelectOrder={(id) => { setSelectedOrderId(id); setView('detail'); }} 
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
                 <TrashView orders={orders.filter(o => o.deleted_at)} onRestore={handleRestoreOrder} onPermanentDelete={handlePermanentDelete} />
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
                 <ConfigPriceView />
              )}

           </div>
        </main>
      </div>
    </div>
  );
}