'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, CheckCircle, Package, Truck, 
  ClipboardList, LogOut, Calendar, ChevronRight, Loader2,
  Phone, AlertTriangle, BarChart3, Clock, ShieldCheck, Filter,
  RefreshCw, Pencil, Save, X, Eye, FileText, Search, Trash2,
  LayoutDashboard, Users, Settings, Menu, MessageSquare, TrendingUp
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

type UserRole = 'admin' | 'produksi' | 'qc' | 'manager';
type ProductionType = 'manual' | 'dtf';
type OrderStatus = 'Pesanan Masuk' | 'On Process' | 'Finishing' | 'Revisi' | 'Kirim' | 'Selesai';

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
}

interface Order {
  id: string;
  kode_produksi: string;
  nama_pemesan: string;
  no_hp: string;
  jumlah: number;
  tanggal_masuk: string;
  deadline: string;
  jenis_produksi: ProductionType;
  status: OrderStatus;
  link_approval?: string;
  steps_manual: ProductionStep[];
  steps_dtf: ProductionStep[];
  finishing_qc: { isPassed: boolean; notes: string; checkedBy?: string; timestamp?: string; };
  finishing_packing: { isPacked: boolean; timestamp?: string; };
  shipping: { bukti_kirim?: string; bukti_terima?: string; timestamp_kirim?: string; timestamp_terima?: string; };
  kendala: KendalaNote[];
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
  { id: '1', username: 'admin', password: '123', name: 'Admin Utama', role: 'admin' },
  { id: '2', username: 'prod', password: '123', name: 'Staff Produksi', role: 'produksi' },
  { id: '3', username: 'qc', password: '123', name: 'Staff QC', role: 'qc' },
  { id: '4', username: 'manager', password: '123', name: 'Manager/CEO', role: 'manager' },
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
    case 'Kirim': return 'bg-orange-100 text-orange-800 border-orange-300';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'settings'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Sidebar default false (closed) on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<{ type: string, stepId?: string } | null>(null);

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
    };
    loadData();

    // @ts-ignore
    const channel = supabase.channel('realtime-db')
      // @ts-ignore
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      // @ts-ignore
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchUsers())
      .subscribe();
    
    // @ts-ignore
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    // @ts-ignore
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error) {
      // Ensure all orders have kendala array (for backward compatibility)
      const ordersWithKendala = (data || []).map((order: any) => ({
        ...order,
        kendala: order.kendala || []
      }));
      setOrders(ordersWithKendala);
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
    if (!currentUser || currentUser.role !== 'admin') return;
    if (!userData.id) {
       const exists = usersList.find(u => u.username === userData.username);
       if(exists) { alert('Username sudah dipakai!'); return; }
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
      setUsersList(prev => prev.map(u => u.id === userData.id ? { ...u, ...payload } : u));
      if(!error && userData.id) alert('Data user diperbarui (Simulasi)');
    } else {
      // @ts-ignore
      const res = await supabase.from('users').insert([payload]);
      error = res.error;
      const newUser = { id: Date.now().toString(), ...payload } as UserData;
      setUsersList(prev => [...prev, newUser]);
      alert('User baru ditambahkan (Simulasi)');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (confirm('Hapus pengguna ini?')) {
      // @ts-ignore
      const { error } = await supabase.from('users').delete().eq('id', id);
      setUsersList(prev => prev.filter(u => u.id !== id));
      if(!error) alert('User dihapus (Simulasi)');
    }
  };

  const triggerUpload = (targetType: string, stepId?: string) => {
    uploadTargetRef.current = { type: targetType, stepId };
    fileInputRef.current?.click();
  };

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
      const order = orders.find(o => o.id === selectedOrderId);
      if (!order) return;
      let updatedOrder = { ...order };
      const target = uploadTargetRef.current;
      if (target.type === 'approval') updatedOrder.link_approval = publicUrl;
      else if (target.type === 'step' && target.stepId) {
        const steps = updatedOrder.jenis_produksi === 'manual' ? updatedOrder.steps_manual : updatedOrder.steps_dtf;
        const idx = steps.findIndex(s => s.id === target.stepId);
        if (idx >= 0) {
          steps[idx].isCompleted = true;
          steps[idx].fileUrl = publicUrl;
          steps[idx].timestamp = timestamp;
          steps[idx].uploadedBy = currentUser?.role || 'unknown';
        }
      }
      else if (target.type === 'packing') {
          updatedOrder.finishing_packing.isPacked = true;
          updatedOrder.finishing_packing.timestamp = timestamp;
      } else if (target.type === 'shipping_kirim') {
          updatedOrder.shipping.bukti_kirim = publicUrl;
          updatedOrder.shipping.timestamp_kirim = timestamp;
      } else if (target.type === 'shipping_terima') {
          updatedOrder.shipping.bukti_terima = publicUrl;
          updatedOrder.shipping.timestamp_terima = timestamp;
      }
      await saveOrderUpdate(updatedOrder);
    } catch (error: any) {
      alert('Gagal upload (Simulasi): ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const checkAutoStatus = (order: Order): Order => {
    let updated = { ...order };
    
    // Jangan auto-update jika sedang revisi
    if (updated.status === 'Revisi') return updated;
    
    if (updated.status === 'Pesanan Masuk' && updated.link_approval) updated.status = 'On Process';
    if (updated.status === 'On Process') {
      const steps = updated.jenis_produksi === 'manual' ? updated.steps_manual : updated.steps_dtf;
      if (steps.every(s => s.isCompleted)) updated.status = 'Finishing';
    }
    if (updated.status === 'Finishing' && updated.finishing_qc.isPassed && updated.finishing_packing.isPacked) updated.status = 'Kirim';
    if (updated.status === 'Kirim' && updated.shipping.bukti_kirim && updated.shipping.bukti_terima) updated.status = 'Selesai';
    return updated;
  };

  const saveOrderUpdate = async (orderData: Order) => {
    const finalOrder = checkAutoStatus(orderData);
    setOrders(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
    
    // Prepare update payload - only include kendala if it exists in schema
    const updatePayload: any = {
        nama_pemesan: finalOrder.nama_pemesan,
        no_hp: finalOrder.no_hp,
        jumlah: finalOrder.jumlah,
        deadline: finalOrder.deadline,
        jenis_produksi: finalOrder.jenis_produksi,
        status: finalOrder.status,
        link_approval: finalOrder.link_approval,
        steps_manual: finalOrder.steps_manual,
        steps_dtf: finalOrder.steps_dtf,
        finishing_qc: finalOrder.finishing_qc,
        finishing_packing: finalOrder.finishing_packing,
        shipping: finalOrder.shipping
    };
    
    // Only add kendala if it exists (for new DB schema)
    if (finalOrder.kendala !== undefined) {
      updatePayload.kendala = finalOrder.kendala;
    }
    
    // @ts-ignore
    const { error } = await supabase.from('orders').update(updatePayload).eq('id', finalOrder.id);
    if (error) {
      console.error('DB Error:', error);
      // Only show alert if it's not a schema issue
      if (!error.message.includes('kendala')) {
        alert('Gagal update DB: ' + error.message);
      }
    }
  };

  const handleCreateOrder = async (newOrderData: any) => {
    const payload: any = {
      kode_produksi: `ORD-${Math.floor(Math.random() * 10000)}`,
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
    
    // Only add kendala if column exists in DB schema
    // This prevents error on older DB versions
    payload.kendala = [];
    
    // @ts-ignore
    const { error } = await supabase.from('orders').insert([payload]);
    if (error && !error.message.includes('kendala')) {
      alert('Gagal: ' + error.message);
    } else if (!error) {
      setView('list');
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
  };

  if (!currentUser) return <LoginScreen usersList={usersList} onLogin={handleLogin} />;

  // Navigation Handler (Auto close sidebar on mobile)
  const handleNav = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setView('list');
    setSidebarOpen(false); // Auto close on mobile
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col md:flex-row">
      <input type="file" hidden ref={fileInputRef} accept="image/*,application/pdf" onChange={handleFileChange} />
      {uploading && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center text-white flex-col">
          <Loader2 className="w-10 h-10 animate-spin mb-2" />
          <p>Upload...</p>
        </div>
      )}

      {/* OVERLAY UNTUK MOBILE */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR RESPONSIF */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-slate-900 text-white z-40 
        transition-transform duration-300 ease-in-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 flex flex-col shrink-0
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
           <div className="bg-blue-600 p-2 rounded-lg"><ClipboardList className="w-6 h-6 text-white"/></div>
           <div>
             <h1 className="font-bold text-xl tracking-wide">ProdMon</h1>
             <div className="text-xs text-slate-400">Production System</div>
           </div>
           {/* Tombol Close di Sidebar Mobile */}
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
            
            {currentUser.role === 'admin' && (
              <button 
                onClick={() => handleNav('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Settings className="w-5 h-5"/> Pengaturan
              </button>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition w-full font-medium">
            <LogOut className="w-5 h-5"/> Keluar Aplikasi
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header (Sticky) */}
        <header className="md:hidden bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-20 border-b">
           <div className="flex items-center gap-3">
             <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200 transition">
               <Menu className="w-6 h-6"/>
             </button>
             <span className="font-bold text-slate-800 text-lg">ProdMon</span>
           </div>
           <div className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded uppercase tracking-wide">{currentUser.role}</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
               <Dashboard role={currentUser.role} orders={orders} onSelectOrder={(id: string) => { setSelectedOrderId(id); setView('detail'); setActiveTab('orders'); }} />
            )}

            {activeTab === 'orders' && (
               <>
                 {view === 'list' && (
                   <OrderList 
                     role={currentUser.role} 
                     orders={orders} 
                     onSelectOrder={(id: string) => { setSelectedOrderId(id); setView('detail'); }} 
                     onNewOrder={() => setView('create')} 
                   />
                 )}
                 {view === 'create' && <CreateOrder onCancel={() => setView('list')} onSubmit={handleCreateOrder}/>}
                 {view === 'edit' && selectedOrderId && (
                   <EditOrder 
                     order={orders.find(o => o.id === selectedOrderId)!}
                     onCancel={() => setView('detail')} 
                     onSubmit={handleEditOrder}
                   />
                 )}
                 {view === 'detail' && selectedOrderId && (
                    <OrderDetail 
                      role={currentUser.role}
                      order={orders.find(o => o.id === selectedOrderId)!}
                      onBack={() => { setSelectedOrderId(null); setView('list'); }}
                      onEdit={() => setView('edit')}
                      onTriggerUpload={triggerUpload}
                      onUpdateOrder={saveOrderUpdate}
                    />
                 )}
               </>
            )}

            {activeTab === 'settings' && currentUser.role === 'admin' && (
               <SettingsPage users={usersList} onSave={handleSaveUser} onDelete={handleDeleteUser} />
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
                 className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-800 placeholder-slate-400"
                 placeholder="Masukkan username"
                 value={username}
                 onChange={e => setUsername(e.target.value)}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-700 uppercase mb-2 tracking-wide">Password</label>
               <input 
                 type="password" 
                 className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-800 placeholder-slate-400"
                 placeholder="Masukkan password"
                 value={password}
                 onChange={e => setPassword(e.target.value)}
               />
             </div>
             
             {error && <div className="text-red-600 text-sm text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}

             <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg active:scale-[0.98] transform">
               Login System
             </button>
           </form>
           
           <div className="mt-8 text-center text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
             <strong>Default Login:</strong><br/>
             admin/123, prod/123, qc/123, manager/123
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

  const stats = {
    total: orders.length,
    thisMonth: ordersThisMonth.length,
    process: orders.filter((o: any) => o.status === 'On Process' || o.status === 'Finishing').length,
    overdue: orders.filter((o: any) => getDeadlineStatus(o.deadline, o.status) === 'overdue').length,
    completed: orders.filter((o: any) => o.status === 'Selesai').length
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard Overview</h2>
      
      {/* UPDATED: Grid Responsif 3 Kolom di HP (grid-cols-3), lebar penuh di Desktop */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <div className="bg-white p-3 md:p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-500 text-[10px] md:text-xs font-bold uppercase whitespace-nowrap truncate">Total Order</div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1">{stats.total}</div>
        </div>
        <div className="bg-indigo-50 p-3 md:p-5 rounded-xl border border-indigo-100">
          <div className="text-indigo-700 text-[10px] md:text-xs font-bold uppercase whitespace-nowrap truncate">Bulan Ini</div>
          <div className="text-2xl md:text-3xl font-extrabold text-indigo-800 mt-1">{stats.thisMonth}</div>
        </div>
        <div className="bg-blue-50 p-3 md:p-5 rounded-xl border border-blue-100">
          <div className="text-blue-700 text-[10px] md:text-xs font-bold uppercase whitespace-nowrap truncate">Sedang Proses</div>
          <div className="text-2xl md:text-3xl font-extrabold text-blue-800 mt-1">{stats.process}</div>
        </div>
        <div className="bg-red-50 p-3 md:p-5 rounded-xl border border-red-100">
          <div className="text-red-700 text-[10px] md:text-xs font-bold uppercase whitespace-nowrap truncate">Telat Deadline</div>
          <div className="text-2xl md:text-3xl font-extrabold text-red-800 mt-1">{stats.overdue}</div>
        </div>
        <div className="bg-green-50 p-3 md:p-5 rounded-xl border border-green-100">
          <div className="text-green-700 text-[10px] md:text-xs font-bold uppercase whitespace-nowrap truncate">Selesai</div>
          <div className="text-2xl md:text-3xl font-extrabold text-green-800 mt-1">{stats.completed}</div>
        </div>
        <div className="bg-purple-50 p-3 md:p-5 rounded-xl border border-purple-100">
          <div className="text-purple-700 text-[10px] md:text-xs font-bold uppercase whitespace-nowrap truncate">Total Jumlah</div>
          <div className="text-2xl md:text-3xl font-extrabold text-purple-800 mt-1">{orders.reduce((sum: number, o: Order) => sum + o.jumlah, 0)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
           <h3 className="font-bold text-lg text-slate-800">Pesanan Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 min-w-[600px]">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-600">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Kode</th>
                <th className="px-6 py-4 whitespace-nowrap">Pemesan</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Deadline</th>
                <th className="px-6 py-4 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 5).map((o: any) => {
                const deadlineStatus = getDeadlineStatus(o.deadline, o.status);
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono font-medium text-slate-500 whitespace-nowrap">{o.kode_produksi}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">{o.nama_pemesan}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border whitespace-nowrap ${getStatusColor(o.status)}`}>{o.status}</span></td>
                    <td className={`px-6 py-4 font-medium whitespace-nowrap ${deadlineStatus === 'overdue' ? 'text-red-600 font-bold' : 'text-slate-700'}`}>{formatDate(o.deadline)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => onSelectOrder(o.id)} className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 px-3 py-1.5 rounded border border-blue-100">Detail</button>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Belum ada pesanan</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrderList({ role, orders, onSelectOrder, onNewOrder }: any) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');

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
    return statusMatch && monthMatch;
  });

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Daftar Pesanan</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Kelola {filteredOrders.length} pesanan masuk</p>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3">
          <select 
            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 font-medium"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">Semua Bulan</option>
            {MONTHS.map((m, i) => (
              <option key={i} value={i.toString()}>{m}</option>
            ))}
          </select>

          {role === 'admin' && (
            <button onClick={onNewOrder} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-sm active:scale-95">
              <ClipboardList className="w-4 h-4"/> Tambah Baru
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {[
          { id: null, label: 'Semua' },
          { id: 'process', label: 'Sedang Proses' },
          { id: 'overdue', label: 'Telat Deadline' },
          { id: 'completed', label: 'Selesai' }
        ].map((f) => (
          <button 
            key={f.id || 'all'}
            onClick={() => setStatusFilter(f.id)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border ${statusFilter === f.id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order: Order) => {
             const deadlineStatus = getDeadlineStatus(order.deadline, order.status);
             return (
              <div key={order.id} onClick={() => onSelectOrder(order.id)} className={`bg-white rounded-2xl shadow-sm border p-5 cursor-pointer hover:shadow-md transition relative overflow-hidden active:scale-[0.98] ${deadlineStatus === 'overdue' ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'}`}>
                {deadlineStatus === 'overdue' && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-bl-lg z-10">TELAT</div>}
                
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">#{order.kode_produksi}</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wide whitespace-nowrap ${getStatusColor(order.status)}`}>{order.status}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mb-1 leading-tight">{order.nama_pemesan}</h3>
                <div className="text-xs text-slate-500 mb-4 font-medium flex items-center gap-1">
                   <Calendar className="w-3 h-3"/> Masuk: {formatDate(order.tanggal_masuk)}
                </div>
                
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium"><FileText className="w-4 h-4"/> Jumlah</span>
                    <span className="font-bold text-slate-800">{order.jumlah} Pcs</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium"><BarChart3 className="w-4 h-4"/> Tipe</span>
                    <span className="font-bold text-slate-800 uppercase bg-slate-50 px-2 rounded">{order.jenis_produksi}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium"><Clock className="w-4 h-4"/> Deadline</span>
                    <span className={`font-bold ${deadlineStatus === 'overdue' ? 'text-red-600' : 'text-slate-800'}`}>{formatDate(order.deadline)}</span>
                  </div>
                </div>
              </div>
             );
          })}
          {filteredOrders.length === 0 && <div className="col-span-full text-center text-slate-400 py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">Tidak ada pesanan sesuai filter</div>}
      </div>
    </div>
  );
}

function SettingsPage({ users, onSave, onDelete }: { users: UserData[], onSave: (u:any) => void, onDelete: (id: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const openModal = (user?: UserData) => {
    setEditingUser(user || { username: '', password: '', name: '', role: 'produksi' });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editingUser);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Pengaturan Pengguna</h2>
            <p className="text-sm text-slate-500 mt-1">Kelola akses dan akun aplikasi</p>
         </div>
         <button onClick={() => openModal()} className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-sm transition">
           <Users className="w-4 h-4"/> Tambah User
         </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 min-w-[600px]">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-600">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Password</th>
                <th className="px-6 py-4">Role (Akses)</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                  <td className="px-6 py-4 font-mono text-slate-600">{u.username}</td>
                  <td className="px-6 py-4 font-mono text-slate-400">••••••</td>
                  <td className="px-6 py-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-extrabold uppercase border border-slate-200">{u.role}</span></td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(u)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"><Pencil className="w-4 h-4"/></button>
                    <button onClick={() => onDelete(u.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">Tidak ada user</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM (Responsive) */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-lg text-slate-800">{editingUser.id ? 'Edit User' : 'Tambah User Baru'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-200 rounded-full hover:bg-slate-300 transition"><X className="w-4 h-4 text-slate-600"/></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nama Lengkap</label>
                 <input required className="w-full border-2 border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name: e.target.value})} />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Username</label>
                 <input required className="w-full border-2 border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800" value={editingUser.username} onChange={e=>setEditingUser({...editingUser, username: e.target.value})} />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Password</label>
                 <input required className="w-full border-2 border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800" value={editingUser.password} onChange={e=>setEditingUser({...editingUser, password: e.target.value})} />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Role / Hak Akses</label>
                 <select className="w-full border-2 border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-slate-800" value={editingUser.role} onChange={e=>setEditingUser({...editingUser, role: e.target.value})}>
                   <option value="admin">Admin (Akses Penuh)</option>
                   <option value="produksi">Produksi (Update Progress)</option>
                   <option value="qc">QC (Quality Control)</option>
                   <option value="manager">Manager/CEO (View Only)</option>
                 </select>
               </div>
               <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-600 transition">Batal</button>
                 <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition shadow-lg">Simpan</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateOrder({ onCancel, onSubmit }: any) {
  const [form, setForm] = useState({ nama: '', hp: '', jumlah: '', deadline: new Date().toISOString().split('T')[0], type: 'manual' as ProductionType });
  useEffect(() => { const d = new Date(); d.setDate(d.getDate() + 3); setForm(f => ({ ...f, deadline: d.toISOString().split('T')[0] })); }, []);
  const isDisabled = !form.nama || !form.hp || !form.deadline || !form.jumlah;

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border shadow-sm max-w-2xl mx-auto">
      <h2 className="font-bold text-xl mb-6 text-slate-800">Buat Pesanan Baru</h2>
      <div className="space-y-5">
        <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nama Pemesan</label>
            <input className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 placeholder-slate-400" placeholder="Masukkan nama pemesan" value={form.nama} onChange={e=>setForm({...form, nama: e.target.value})} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">No HP</label>
            <input className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 placeholder-slate-400" placeholder="08xxxxxxxxxx" value={form.hp} onChange={e=>setForm({...form, hp: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Jumlah</label>
            <input type="number" className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 placeholder-slate-400" placeholder="0" value={form.jumlah} onChange={e=>setForm({...form, jumlah: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Deadline</label>
            <input type="date" className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800" value={form.deadline} onChange={e=>setForm({...form, deadline: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Jenis</label>
            <select className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-slate-800" value={form.type} onChange={e=>setForm({...form, type: e.target.value as ProductionType})}>
              <option value="manual">Manual</option>
              <option value="dtf">DTF</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-6">
            <button onClick={onCancel} className="flex-1 border-2 border-slate-200 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">Batal</button>
            <button onClick={()=>onSubmit(form)} disabled={isDisabled} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition">Simpan</button>
        </div>
      </div>
    </div>
  )
}

function EditOrder({ order, onCancel, onSubmit }: any) {
  const [form, setForm] = useState({ 
    nama: order.nama_pemesan, 
    hp: order.no_hp, 
    jumlah: order.jumlah.toString(), 
    deadline: order.deadline, 
    type: order.jenis_produksi 
  });
  
  const isDisabled = !form.nama || !form.hp || !form.deadline || !form.jumlah;

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border shadow-sm max-w-2xl mx-auto">
      <h2 className="font-bold text-xl mb-6 text-slate-800">Edit Pesanan</h2>
      <div className="space-y-5">
        <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nama Pemesan</label>
            <input className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 placeholder-slate-400" placeholder="Masukkan nama pemesan" value={form.nama} onChange={e=>setForm({...form, nama: e.target.value})} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">No HP</label>
            <input className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 placeholder-slate-400" placeholder="08xxxxxxxxxx" value={form.hp} onChange={e=>setForm({...form, hp: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Jumlah</label>
            <input type="number" className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 placeholder-slate-400" placeholder="0" value={form.jumlah} onChange={e=>setForm({...form, jumlah: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Deadline</label>
            <input type="date" className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800" value={form.deadline} onChange={e=>setForm({...form, deadline: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Jenis</label>
            <select className="w-full border-2 border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-slate-800" value={form.type} onChange={e=>setForm({...form, type: e.target.value as ProductionType})}>
              <option value="manual">Manual</option>
              <option value="dtf">DTF</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-6">
            <button onClick={onCancel} className="flex-1 border-2 border-slate-200 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">Batal</button>
            <button onClick={()=>onSubmit(form)} disabled={isDisabled} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition">Update</button>
        </div>
      </div>
    </div>
  )
}

function OrderDetail({ role, order, onBack, onEdit, onTriggerUpload, onUpdateOrder }: any) {
  const [qcNote, setQcNote] = useState(order.finishing_qc.notes || '');
  const [kendalaNote, setKendalaNote] = useState('');
  const [showKendalaForm, setShowKendalaForm] = useState(false);
  
  const canEditApproval = role === 'admin';
  const canEditProduction = role === 'produksi' || role === 'admin';
  const canEditQC = role === 'qc' || role === 'admin';
  const canEditShipping = role === 'admin'; 
  const isManager = role === 'manager';
  const currentSteps = order.jenis_produksi === 'manual' ? order.steps_manual : order.steps_dtf;

  const handleStatusStep = (stepId: string) => {
    const updated = JSON.parse(JSON.stringify(order));
    const steps = updated.jenis_produksi === 'manual' ? updated.steps_manual : updated.steps_dtf;
    const idx = steps.findIndex((s: any) => s.id === stepId);
    if (idx >= 0) { steps[idx].isCompleted = true; steps[idx].uploadedBy = role; steps[idx].timestamp = new Date().toLocaleString(); }
    onUpdateOrder(updated);
  };

  const handleQC = (pass: boolean) => {
    const updated = JSON.parse(JSON.stringify(order));
    updated.finishing_qc = { 
      isPassed: pass, 
      notes: pass ? 'Lolos QC' : qcNote, 
      checkedBy: role, 
      timestamp: new Date().toLocaleString() 
    };
    // Set status menjadi Revisi jika tidak lolos
    if (!pass) {
      updated.status = 'Revisi';
    }
    onUpdateOrder(updated); 
  };

  // Handler untuk mengembalikan dari status Revisi ke On Process
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
      reportedBy: role,
      timestamp: new Date().toLocaleString()
    });
    onUpdateOrder(updated);
    setKendalaNote('');
    setShowKendalaForm(false);
  };

  const handleDeleteKendala = (kendalaId: string) => {
    if (!confirm('Hapus catatan kendala ini?')) return;
    const updated = JSON.parse(JSON.stringify(order));
    updated.kendala = updated.kendala.filter((k: KendalaNote) => k.id !== kendalaId);
    onUpdateOrder(updated);
  };

  const handleFileDelete = (field: string, isStep = false, stepId?: string) => {
      if (!confirm('Yakin hapus?')) return;
      const updated = JSON.parse(JSON.stringify(order));
      if (isStep && stepId) {
        const steps = updated.jenis_produksi === 'manual' ? updated.steps_manual : updated.steps_dtf;
        const idx = steps.findIndex((s: any) => s.id === stepId);
        if(idx>=0) { steps[idx].isCompleted=false; steps[idx].fileUrl=null; }
      } else if (field === 'approval') updated.link_approval = null;
      else if (field === 'packing') { updated.finishing_packing.isPacked=false; }
      else if (field.includes('shipping')) { if(field.includes('kirim')) updated.shipping.bukti_kirim=null; else updated.shipping.bukti_terima=null; }
      onUpdateOrder(updated);
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-2 font-bold transition p-2 -ml-2 rounded-lg hover:bg-slate-100 w-fit">
          <ChevronRight className="w-5 h-5 rotate-180"/> Kembali
        </button>
        {canEditApproval && !isManager && (
          <button onClick={onEdit} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-sm">
            <Pencil className="w-4 h-4"/> Edit Pesanan
          </button>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-extrabold text-slate-800">{order.nama_pemesan}</h1>
           <div className="text-sm text-slate-500 mt-1 font-medium flex flex-wrap gap-3">
             <span className="bg-slate-100 px-2 py-0.5 rounded">#{order.kode_produksi}</span>
             <span>{order.jumlah} Pcs</span>
             <span>{formatDate(order.deadline)}</span>
           </div>
        </div>
        <div className={`px-4 py-2 rounded-lg font-extrabold text-sm border uppercase tracking-wide ${getStatusColor(order.status)}`}>{order.status}</div>
      </div>

      {/* Tampilan Catatan Revisi jika status Revisi */}
      {order.status === 'Revisi' && order.finishing_qc.notes && (
        <div className="bg-yellow-50 border-2 border-yellow-300 p-5 rounded-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-700"/>
                <h3 className="font-bold text-yellow-900">Catatan Revisi dari QC</h3>
              </div>
              <p className="text-sm text-yellow-800 bg-white p-3 rounded-lg border border-yellow-200 font-medium">{order.finishing_qc.notes}</p>
              <div className="text-xs text-yellow-700 mt-2">Dicek oleh: {order.finishing_qc.checkedBy} | {order.finishing_qc.timestamp}</div>
            </div>
          </div>
          {canEditProduction && (
            <button onClick={handleRevisiSelesai} className="mt-4 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-lg w-full sm:w-auto">
              Revisi Selesai - Lanjut Produksi
            </button>
          )}
        </div>
      )}

      {/* 1. Approval */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg"><div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</div> Approval Desain</h3>
         {order.link_approval ? (
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-green-50 p-4 rounded-xl border border-green-200 gap-3">
             <div className="flex items-center gap-3 text-green-800 font-medium">
               <Eye className="w-5 h-5"/> <a href={order.link_approval} target="_blank" className="underline hover:text-green-900">Lihat File Approval</a>
             </div>
             {canEditApproval && !isManager && <button onClick={() => handleFileDelete('approval')} className="text-red-500 bg-white border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50">Hapus</button>}
           </div>
         ) : (
           (canEditApproval && !isManager) ? <button onClick={() => onTriggerUpload('approval')} className="w-full border-2 border-dashed border-blue-200 p-6 text-sm text-blue-600 rounded-xl bg-blue-50 hover:bg-blue-100 transition font-bold flex flex-col items-center gap-2"><Upload className="w-6 h-6"/> Upload File Approval</button> : <div className="text-sm italic text-slate-400 text-center py-4 bg-slate-50 rounded-xl">Menunggu Admin upload approval...</div>
         )}
      </div>

      {/* 2. Produksi dengan Catatan Kendala */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
         <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
             <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</div> 
             Produksi ({order.jenis_produksi})
           </h3>
           {canEditProduction && (order.status === 'On Process' || order.status === 'Revisi') && (
             <button 
               onClick={() => setShowKendalaForm(!showKendalaForm)}
               className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-orange-700 transition flex items-center gap-1.5"
             >
               <MessageSquare className="w-3.5 h-3.5"/> Lapor Kendala
             </button>
           )}
         </div>

         {/* Form Kendala */}
         {showKendalaForm && (
           <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
             <label className="block text-xs font-bold text-orange-800 uppercase mb-2">Catatan Kendala</label>
             <textarea 
               placeholder="Jelaskan kendala yang sedang dialami..."
               className="w-full text-sm p-3 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 placeholder-slate-400"
               value={kendalaNote}
               onChange={e => setKendalaNote(e.target.value)}
               rows={3}
             />
             <div className="flex gap-2 mt-3">
               <button 
                 onClick={handleAddKendala}
                 disabled={!kendalaNote.trim()}
                 className="bg-orange-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Kirim Laporan
               </button>
               <button 
                 onClick={() => { setShowKendalaForm(false); setKendalaNote(''); }}
                 className="border-2 border-slate-200 text-slate-600 text-xs px-4 py-2 rounded-lg font-bold hover:bg-slate-50"
               >
                 Batal
               </button>
             </div>
           </div>
         )}

         {/* Daftar Kendala */}
         {order.kendala && order.kendala.length > 0 && (
           <div className="mb-5 space-y-2">
             <div className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
               <AlertTriangle className="w-4 h-4 text-orange-600"/> 
               Catatan Kendala ({order.kendala.length})
             </div>
             {order.kendala.map((k: KendalaNote) => (
               <div key={k.id} className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                 <div className="flex justify-between items-start gap-2">
                   <div className="flex-1">
                     <p className="text-sm text-orange-900 font-medium mb-1">{k.notes}</p>
                     <div className="text-xs text-orange-700">
                       Dilaporkan oleh: <span className="font-bold">{k.reportedBy}</span> | {k.timestamp}
                     </div>
                   </div>
                   {(role === 'admin' || k.reportedBy === role) && (
                     <button 
                       onClick={() => handleDeleteKendala(k.id)}
                       className="text-red-500 hover:text-red-700 p-1"
                     >
                       <Trash2 className="w-4 h-4"/>
                     </button>
                   )}
                 </div>
               </div>
             ))}
           </div>
         )}

         {/* Steps Produksi */}
         <div className="space-y-4">
           {currentSteps.map((step: any) => (
             <div key={step.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 last:border-0 gap-3">
                <div>
                  <div className={`font-bold ${step.isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.name}</div>
                  {step.fileUrl && <a href={step.fileUrl} target="_blank" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mt-1"><Eye className="w-3 h-3"/> Lihat Bukti</a>}
                </div>
                {step.isCompleted ? (
                  <div className="flex items-center gap-3 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 self-start sm:self-auto">
                     <CheckCircle className="w-5 h-5 text-green-600"/>
                     <span className="text-xs font-bold text-green-700">Selesai</span>
                     {canEditProduction && !isManager && <button onClick={() => handleFileDelete('step', true, step.id)} className="text-red-400 hover:text-red-600 ml-2"><Trash2 className="w-4 h-4"/></button>}
                  </div>
                ) : (
                  (canEditProduction && !isManager && (order.status === 'On Process' || order.status === 'Revisi')) && (
                    step.type === 'status_update' 
                    ? <button onClick={() => handleStatusStep(step.id)} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition w-full sm:w-auto">Tandai Selesai</button>
                    : <button onClick={() => onTriggerUpload('step', step.id)} className="border-2 border-slate-200 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition w-full sm:w-auto flex items-center justify-center gap-2"><Camera className="w-4 h-4"/> Upload Bukti</button>
                  )
                )}
             </div>
           ))}
         </div>
      </div>

       {/* 3. QC & Packing */}
       <div className="bg-white p-6 rounded-2xl border shadow-sm">
         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg"><div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</div> QC & Packing</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <div className="text-xs font-bold mb-3 uppercase text-slate-500 tracking-wide">Quality Control</div>
              {order.finishing_qc.isPassed ? <div className="text-green-700 text-sm font-bold flex items-center gap-2 bg-green-100 p-3 rounded-lg border border-green-200"><CheckCircle className="w-5 h-5"/> Lolos QC</div> : 
                (canEditQC && !isManager && order.status === 'Finishing' ? (
                  <div className="space-y-3">
                    <textarea placeholder="Catatan revisi (wajib diisi jika revisi)..." className="w-full text-sm p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 placeholder-slate-400" value={qcNote} onChange={e=>setQcNote(e.target.value)} rows={3}/>
                    <div className="flex gap-2">
                       <button onClick={()=>handleQC(true)} className="bg-green-600 text-white text-xs px-4 py-2.5 rounded-lg flex-1 font-bold hover:bg-green-700 shadow-sm">Lolos</button>
                       <button onClick={()=>handleQC(false)} disabled={!qcNote.trim()} className="bg-red-600 text-white text-xs px-4 py-2.5 rounded-lg flex-1 font-bold hover:bg-red-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Revisi</button>
                    </div>
                  </div>
                ) : <div className="text-xs text-slate-400 italic py-2">Menunggu proses sebelumnya...</div>)
              }
            </div>
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <div className="text-xs font-bold mb-3 uppercase text-slate-500 tracking-wide">Packing</div>
              {order.finishing_packing.isPacked ? <div className="text-green-700 text-sm font-bold flex items-center gap-2 bg-green-100 p-3 rounded-lg border border-green-200"><Package className="w-5 h-5"/> Sudah Dipacking</div> : 
                (canEditQC && !isManager && order.status === 'Finishing' && order.finishing_qc.isPassed ? <button onClick={()=>onTriggerUpload('packing')} className="bg-purple-600 text-white text-sm w-full py-3 rounded-xl font-bold hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg"><Camera className="w-4 h-4"/> Foto Packing</button> : <div className="text-xs text-slate-400 italic py-2">Menunggu QC Lolos...</div>)
              }
            </div>
         </div>
       </div>

       {/* 4. Shipping */}
       <div className="bg-white p-6 rounded-2xl border shadow-sm">
         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg"><div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</div> Pengiriman</h3>
         <div className="space-y-3">
           <div className="flex justify-between items-center text-sm border border-slate-200 p-4 rounded-xl bg-slate-50/50">
             <span className="font-bold text-slate-700">Resi Kirim</span>
             {order.shipping.bukti_kirim ? <a href={order.shipping.bukti_kirim} target="_blank" className="text-green-600 font-bold underline hover:text-green-800">Lihat Bukti</a> : (canEditShipping && !isManager && order.status === 'Kirim' ? <button onClick={()=>onTriggerUpload('shipping_kirim')} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm">Upload</button> : <span className="text-slate-300 font-bold">-</span>)}
           </div>
           <div className="flex justify-between items-center text-sm border border-slate-200 p-4 rounded-xl bg-slate-50/50">
             <span className="font-bold text-slate-700">Bukti Terima</span>
             {order.shipping.bukti_terima ? <a href={order.shipping.bukti_terima} target="_blank" className="text-green-600 font-bold underline hover:text-green-800">Lihat Bukti</a> : (canEditShipping && !isManager && order.status === 'Kirim' ? <button onClick={()=>onTriggerUpload('shipping_terima')} className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-orange-700 shadow-sm">Upload</button> : <span className="text-slate-300 font-bold">-</span>)}
           </div>
         </div>
       </div>

    </div>
  );
}
