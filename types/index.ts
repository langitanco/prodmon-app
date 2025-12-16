// app/types/index.ts

export type UserRole = 'admin' | 'produksi' | 'qc' | 'manager' | 'supervisor';

// --- UPDATE: DEFINISI MATRIX HAK AKSES ---
export interface UserPermissions {
  // 1. Akses Halaman (Menu Sidebar)
  // (Jika config_harga=true, maka user BISA LIHAT)
  pages: {
    dashboard: boolean;
    orders: boolean;
    kalkulator: boolean;
    settings: boolean;
    trash: boolean;
    config_harga: boolean; 
    about: boolean;
  };
  
  // 2. Akses Global Order
  orders: {
    create: boolean;  
    edit: boolean;    
    delete: boolean;  
    restore: boolean; 
    permanent_delete: boolean; 
  };

  // 3. Produksi MANUAL
  prod_manual: {
    step_process: boolean; 
    upload_approval: boolean;
    access_files: boolean; 
    delete_files: boolean; 
  };

  // 4. Produksi DTF
  prod_dtf: {
    step_process: boolean; 
    upload_approval: boolean;
    access_files: boolean;
    delete_files: boolean;
  };

  // 5. Finishing & QC
  finishing: {
    qc_check: boolean; 
    qc_reset: boolean; 
    packing_update: boolean; 
    shipping_update: boolean; 
    delete_files: boolean; 
  };

  // 6. KHUSUS HARGA (BARU)
  price_config: {
    edit: boolean; // Jika false = Read Only (Cuma lihat)
  };
}

// Default Permissions
export const DEFAULT_PERMISSIONS: UserPermissions = {
  pages: { dashboard: true, orders: true, kalkulator: true, settings: false, trash: false, config_harga: false, about: true },
  orders: { create: false, edit: false, delete: false, restore: false, permanent_delete: false },
  prod_manual: { step_process: false, upload_approval: false, access_files: true, delete_files: false },
  prod_dtf: { step_process: false, upload_approval: false, access_files: true, delete_files: false },
  finishing: { qc_check: false, qc_reset: false, packing_update: false, shipping_update: false, delete_files: false },
  // Default: Tidak bisa edit harga
  price_config: { edit: false } 
};

export interface UserData {
  id: string;
  username: string;
  password?: string; 
  name: string;
  role: UserRole;
  permissions: UserPermissions; 
}

export type OrderStatus =
  | 'Pesanan Masuk'
  | 'On Process'
  | 'Finishing'
  | 'Kirim'
  | 'Selesai'
  | 'Revisi'
  | 'Ada Kendala'
  | 'Telat'; 

export interface Order {
  id: string;
  created_at: string;
  kode_produksi: string;
  nama_pemesan: string;
  no_hp: string;
  jumlah: number;
  tanggal_masuk: string;
  deadline: string;
  jenis_produksi: string;
  status: OrderStatus; 
  link_approval: { link: string | null; by: string | null; timestamp: string | null } | null;
  steps_manual: ProductionStep[];
  steps_dtf: ProductionStep[];
  finishing_qc: { isPassed: boolean; notes: string; checkedBy?: string; timestamp?: string };
  finishing_packing: { isPacked: boolean; fileUrl?: string | null; packedBy?: string | null; timestamp?: string | null };
  shipping: { 
    bukti_kirim?: string | null; uploaded_by_kirim?: string | null; timestamp_kirim?: string | null;
    bukti_terima?: string | null; uploaded_by_terima?: string | null; timestamp_terima?: string | null;
  };
  kendala: KendalaNote[];
  deleted_at?: string | null;
}

export interface ProductionStep {
  id: string;
  name: string;
  type: 'upload_image' | 'upload_pdf' | 'status_update';
  isCompleted: boolean;
  fileUrl?: string | null;
  uploadedBy?: string;
  timestamp?: string;
}

export interface KendalaNote {
  id: string;
  notes: string;
  reportedBy: string;
  timestamp: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedTimestamp?: string;
  buktiFile?: string | null;
}

export interface ProductionTypeData {
  id: string;
  name: string;
  value: string;
}