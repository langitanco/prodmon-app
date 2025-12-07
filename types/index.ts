// app/types/index.ts

export type UserRole = 'admin' | 'produksi' | 'qc' | 'manager' | 'supervisor';

export interface MenuPermission {
  view: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;       // Izin Hapus PESANAN (Global)
  delete_files?: boolean; // Izin Hapus BUKTI UPLOAD (Spesifik)
}

export interface UserData {
  id: string;
  username: string;
  password: string; 
  name: string;
  role: UserRole;
  permissions?: Record<string, MenuPermission>; 
  allowed_menus?: string[]; 
}

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
  status: 'Pesanan Masuk' | 'On Process' | 'Finishing' | 'Kirim' | 'Selesai' | 'Revisi' | 'Ada Kendala';
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