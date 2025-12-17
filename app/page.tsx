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
import { UserData, Order, ProductionTypeData, DEFAULT_PERMISSIONS } from '@/types';
import { DEFAULT_PRODUCTION_TYPES } from '@/lib/utils';

// ✅ IMPORT BARU: Notifikasi Helper Canggih
import { sendNotification, sendToRoles, sendToAllUsers } from '@/lib/notificationHelper';

// --- DEFINISI TIPE ---
interface CurrentUser extends UserData {
  id: string; 
}

export default function ProductionApp() {
  // State Management
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'settings' | 'trash' | 'kalkulator' | 'config_harga' | 'about'>('dashboard');
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

  // --- INISIASI SUPABASE ---
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
      
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*') 
          .eq('id', session.user.id)
          .single();

        if (userData) {
          let safePermissions = userData.permissions;
          if (!safePermissions || !safePermissions.pages) {
              console.warn("Format permission user jadul/kosong, menggunakan default sementara.");
              safePermissions = DEFAULT_PERMISSIONS;
          }

          setCurrentUser({
            id: session.user.id,
            username: userData.username || session.user.email || '',
            name: userData.name || session.user.email?.split('@')[0] || 'User',
            role: userData.role || 'produksi',
            password: '',
            permissions: safePermissions,
          });
        } else {
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
      const parsed = data.map((o: any) => ({
        ...o,
        kendala: Array.isArray(o.kendala) ? o.kendala : []
      }));
      setOrders(parsed);
    }
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

      // ✅ 1. LOGIKA NOTIF: Pesanan Baru -> Muncul di SEMUA ROLE
      await sendToAllUsers(
        "Pesanan Baru Masuk!", 
        `Order ${payload.kode_produksi} (${payload.nama_pemesan}) baru saja dibuat.`
      );

    } else {
      showAlert('Error', error.message, 'error');
    }
  };

  const handleEditOrder = async (editedData: any) => {
    if (!selectedOrderId) return;
    const updates = {
      nama_pemesan: editedData.nama,
      no_hp: editedData.hp,
      jumlah: parseInt(editedData.jumlah),
      deadline: editedData.deadline, 
      jenis_produksi: editedData.type
    };

    const { error } = await supabase.from('orders').update(updates).eq('id', selectedOrderId);

    if (!error) {
       const oldOrder = orders.find(o => o.id === selectedOrderId);
       if(oldOrder) {
          const mergedOrder = { ...oldOrder, ...updates };
          await checkAutoStatus(mergedOrder);
       }
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
      
      const { error: uploadError } = await supabase.storage.from('production-proofs').upload(fileName, file);
      if (uploadError) { showAlert('Gagal Upload', uploadError.message, 'error'); return; }

      const { data: urlData } = supabase.storage.from('production-proofs').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      const timestamp = new Date().toLocaleString();
      const uploaderName = currentUser?.name || 'Unknown';

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
    const oldStatus = orderData.status; // Simpan status lama untuk deteksi perubahan

    // 1. Cek Kendala
    const hasUnresolvedKendala = Array.isArray(orderData.kendala) && 
                                 orderData.kendala.some((k: any) => !k.isResolved);

    // 2. Hitung Status Normal (Workflow)
    let normalStatus = 'Pesanan Masuk';
    
    const hasApproval = !!orderData.link_approval?.link;
    const steps = orderData.jenis_produksi === 'manual' ? orderData.steps_manual : orderData.steps_dtf;
    const productionDone = Array.isArray(steps) && steps.every((s: any) => s.isCompleted);

    if (!hasApproval) {
        normalStatus = 'Pesanan Masuk';
    } else if (!productionDone) {
        normalStatus = 'On Process';
    } else if (!orderData.finishing_qc?.isPassed || !orderData.finishing_packing?.isPacked) {
        normalStatus = 'Finishing';
        // Khusus jika Revisi (Finishing QC gagal)
        if (orderData.finishing_qc?.isPassed === false && orderData.finishing_qc?.notes) {
            normalStatus = 'Revisi';
        }
    } else if (!orderData.shipping?.bukti_terima) {
        normalStatus = 'Kirim';
    } else {
        normalStatus = 'Selesai';
    }

    // 3. Status Akhir
    let finalStatus = normalStatus;

    if (hasUnresolvedKendala) {
        finalStatus = 'Ada Kendala';
    } 
    
    // 4. Update Database
    const { error } = await supabase.from('orders').update({
      ...orderData,      
      status: finalStatus 
    }).eq('id', orderData.id);

    if (error) {
        showAlert('Error Update', error.message, 'error');
        return;
    } else {
        fetchOrders();
    }

    // --- 🔔 LOGIKA NOTIFIKASI OTOMATIS (Sesuai Permintaan) ---

    const titleUpdate = `Status Update: ${orderData.kode_produksi}`;

    // A. Notifikasi jika Status BERUBAH
    if (oldStatus !== finalStatus) {
      if (finalStatus === 'On Process') {
         // Logika 2: On Proses -> Produksi & Supervisor
         await sendToRoles(['produksi', 'supervisor'], titleUpdate, "Pesanan mulai diproses produksi.");
      }
      else if (finalStatus === 'Ada Kendala') {
         // Logika 3: Kendala -> Admin, Supervisor, Manager
         await sendToRoles(['admin', 'supervisor', 'manager'], "⚠️ Ada Kendala!", `Order ${orderData.kode_produksi} melaporkan kendala.`);
      }
      else if (finalStatus === 'Finishing') {
         // Logika 4: Finishing -> QC & Supervisor
         await sendToRoles(['qc', 'supervisor'], titleUpdate, "Pesanan masuk tahap Finishing & QC.");
      }
      else if (finalStatus === 'Revisi') {
         // Logika 5: Revisi -> Produksi, Supervisor, Manager
         await sendToRoles(['produksi', 'supervisor', 'manager'], "⚠️ REVISI QC", `QC Gagal: ${orderData.finishing_qc?.notes}`);
      }
      else if (finalStatus === 'Selesai') {
         // Logika 6: Selesai -> SEMUA ROLE
         await sendToAllUsers("✅ Pesanan Selesai", `Order ${orderData.kode_produksi} telah selesai sepenuhnya!`);
      }
    }

    // B. Notifikasi Urgent / Mepet (Setiap kali ada update, cek deadline)
    if (orderData.deadline && finalStatus !== 'Selesai' && finalStatus !== 'Kirim') {
      const deadline = new Date(orderData.deadline);
      const today = new Date();
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Jika sisa waktu 2 hari atau kurang (dan belum telat parah)
      if (diffDays <= 2 && diffDays >= 0) {
         // Logika 7: Urgent -> Produksi, Admin, Supervisor
         await sendToRoles(['produksi', 'admin', 'supervisor'], "🔥 URGENT / MEPET", `Order ${orderData.kode_produksi} deadline tinggal ${diffDays} hari!`);
      }
      // Jika sudah minus (Telat) - Trigger saat ada aktivitas update
      else if (diffDays < 0) {
         // Logika 8: Telat -> Produksi, Admin, Supervisor
         await sendToRoles(['produksi', 'admin', 'supervisor'], "⛔ PESANAN TELAT", `Order ${orderData.kode_produksi} sudah melewati deadline!`);
      }
    }
  };

  // --- LOGIC: SETTINGS & CONFIG ---
  const handleSaveUser = async (u: any) => {
    const payload: any = { name: u.name, role: u.role, username: u.username };
    if (u.permissions) payload.permissions = u.permissions;
    if (u.password && u.password.trim() !== '') payload.password = u.password;
    
    if (u.id) {
      const { error } = await supabase.from('users').update(payload).eq('id', u.id);
      if(!error) { fetchUsers(); showAlert('Sukses', 'User updated'); }
      else showAlert('Gagal', error.message, 'error');
    } else {
      const { error } = await supabase.from('users').insert([payload]);
      if(!error) { fetchUsers(); showAlert('Sukses', 'User baru dibuat'); }
      else showAlert('Gagal', error.message, 'error');
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
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium animate-pulse">Menyiapkan Dashboard...</p>
        </div>
      );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const activeOrders = orders.filter(o => !o.deleted_at);

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row">
      <CustomAlert alertState={alertState} closeAlert={closeAlert} />
      
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentUser={currentUser} 
        activeTab={activeTab} 
        // @ts-ignore
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

        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 pb-24 relative">
           <div className="max-w-6xl mx-auto">
              
              {/* DASHBOARD */}
              {activeTab === 'dashboard' && currentUser.permissions?.pages?.dashboard && (
                  <Dashboard 
                    role={currentUser.role} 
                    orders={activeOrders} 
                    onSelectOrder={(id: string) => { setSelectedOrderId(id); setView('detail'); setActiveTab('orders'); }} 
                  />
              )}

              {/* ORDERS */}
              {activeTab === 'orders' && currentUser.permissions?.pages?.orders && (
                <>
                  {view === 'list' && (
                    <OrderList 
                      role={currentUser.role} 
                      orders={activeOrders} 
                      productionTypes={productionTypes}
                      onSelectOrder={(id: string) => { setSelectedOrderId(id); setView('detail'); }} 
                      onNewOrder={() => setView('create')}
                      onDeleteOrder={handleDeleteOrder}
                      currentUser={currentUser} 
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

              {/* TRASH */}
              {activeTab === 'trash' && currentUser.permissions?.pages?.trash && (
                 <TrashView 
                    orders={orders.filter(o => o.deleted_at)} 
                    onRestore={handleRestoreOrder} 
                    onPermanentDelete={handlePermanentDelete} 
                 />
              )}

              {/* SETTINGS */}
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

              {/* APPS */}
              {activeTab === 'kalkulator' && currentUser.permissions?.pages?.kalkulator && <CalculatorView />}
              {activeTab === 'config_harga' && currentUser.permissions?.pages?.config_harga && <ConfigPriceView />}
              {activeTab === 'about' && <AboutView />}

           </div>
        </main>
      </div>
    </div>
  );
}