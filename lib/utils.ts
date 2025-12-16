// app/lib/utils.ts

import { OrderStatus, ProductionStep, UserData, ProductionTypeData, DEFAULT_PERMISSIONS } from "@/types";

// --- CONSTANTS ---
export const INITIAL_STEPS_MANUAL: ProductionStep[] = [
  { id: 'm1', name: 'Pecah Gambar (PDF)', type: 'upload_pdf', isCompleted: false },
  { id: 'm2', name: 'Print Film', type: 'upload_image', isCompleted: false },
  { id: 'm3', name: 'Proofing', type: 'upload_image', isCompleted: false },
  { id: 'm4', name: 'Produksi Massal', type: 'upload_image', isCompleted: false },
];

export const INITIAL_STEPS_DTF: ProductionStep[] = [
  { id: 'd1', name: 'Cetak DTF', type: 'status_update', isCompleted: false },
  { id: 'd2', name: 'Press Kaos', type: 'upload_image', isCompleted: false },
];

export const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// --- PERBAIKAN DI SINI: MENAMBAHKAN permissions: DEFAULT_PERMISSIONS ---
export const DEFAULT_USERS: UserData[] = [
  { 
    id: '1', 
    username: 'supervisor', 
    password: '123', 
    name: 'Supervisor', 
    role: 'supervisor', 
    permissions: DEFAULT_PERMISSIONS // <--- Wajib ada
  },
  { 
    id: '2', 
    username: 'admin', 
    password: '123', 
    name: 'Admin Utama', 
    role: 'admin', 
    permissions: DEFAULT_PERMISSIONS // <--- Wajib ada
  },
  { 
    id: '3', 
    username: 'prod', 
    password: '123', 
    name: 'Staff Produksi', 
    role: 'produksi', 
    permissions: DEFAULT_PERMISSIONS // <--- Wajib ada
  },
  { 
    id: '4', 
    username: 'qc', 
    password: '123', 
    name: 'Staff QC', 
    role: 'qc', 
    permissions: DEFAULT_PERMISSIONS // <--- Wajib ada
  },
  { 
    id: '5', 
    username: 'manager', 
    password: '123', 
    name: 'Manager/CEO', 
    role: 'manager', 
    permissions: DEFAULT_PERMISSIONS // <--- Wajib ada
  },
];

export const DEFAULT_PRODUCTION_TYPES: ProductionTypeData[] = [
  { id: '1', name: 'Manual', value: 'manual' },
  { id: '2', name: 'DTF', value: 'dtf' },
];

// --- HELPER FUNCTIONS ---
export const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const getDeadlineStatus = (deadlineStr: string, status: OrderStatus) => {
  // Jika status sudah Selesai atau Kirim, tidak perlu dianggap overdue meskipun tanggal lewat
  if (status === 'Selesai' || status === 'Kirim') return 'safe';
  
  const deadline = new Date(deadlineStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 2) return 'warning';
  return 'safe';
};

export const getStatusColor = (status: OrderStatus | string) => { 
  switch (status) {
    case 'Pesanan Masuk': return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'On Process': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Finishing': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Revisi': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Ada Kendala': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Kirim': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'Selesai': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'Telat': return 'bg-red-100 text-red-800 border-red-300'; 
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const openWA = (hp: string) => {
  if (!hp) return;
  let formatted = hp.replace(/\D/g, '');
  if (formatted.startsWith('0')) formatted = '62' + formatted.slice(1);
  window.open(`https://wa.me/${formatted}`, '_blank');
};