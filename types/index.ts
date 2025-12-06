export type UserRole = 'admin' | 'produksi' | 'qc' | 'manager' | 'supervisor';
export type OrderStatus = 'Pesanan Masuk' | 'On Process' | 'Finishing' | 'Revisi' | 'Kirim' | 'Selesai' | 'Ada Kendala';

// --- STRUKTUR PERMISSION BARU ---
export interface MenuPermission {
  view: boolean;    // Ceklis "Lihat"
  create?: boolean; // Ceklis "Buat"
  edit?: boolean;   // Ceklis "Ubah"
  delete?: boolean; // Ceklis "Hapus"
}

export interface UserData {
  id: string;
  username: string;
  password: string; 
  name: string;
  role: UserRole;
  permissions?: Record<string, MenuPermission>; // <--- Ganti allowed_menus jadi ini
  // (Opsional: allowed_menus boleh tetap ada atau dihapus)
  allowed_menus?: string[];
}

// ... Interface lainnya (ProductionStep, Order, dll) tetap sama ...
export interface ProductionStep {
  id: string;
  name: string;
  type: 'upload_pdf' | 'upload_image' | 'status_update';
  isCompleted: boolean;
  timestamp?: string;
  uploadedBy?: string;
  fileUrl?: string;
}

export interface KendalaNote {
  id: string;
  notes: string;
  reportedBy: string;
  timestamp: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedTimestamp?: string;
  buktiFile?: string;
}

export interface ProductionTypeData {
  id: string;
  name: string;
  value: string;
}

export interface Order {
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
  finishing_packing: { isPacked: boolean; timestamp?: string; fileUrl?: string; packedBy?: string; };
  
  shipping: { 
    bukti_kirim?: string; 
    bukti_terima?: string; 
    timestamp_kirim?: string; 
    timestamp_terima?: string;
    uploaded_by_kirim?: string; 
    uploaded_by_terima?: string;
  };
  
  kendala: KendalaNote[];
  deleted_at?: string | null; 
}