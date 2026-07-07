// app/types/index.ts

export type UserRole = 'admin' | 'produksi' | 'qc' | 'manager' | 'supervisor';

// ─── Tipe dasar per modul ────────────────────────────────────────────────────

interface ModuleFull     { view: boolean; create: boolean; edit: boolean; delete: boolean }
interface ModuleView     { view: boolean }
interface ModuleViewEdit { view: boolean; edit: boolean }
interface ModuleTrash    { view: boolean; delete: boolean }


// ─── Definisi Hak Akses ──────────────────────────────────────────────────────

export interface UserPermissions {
  dashboard:     ModuleView;
  orders:        ModuleFull;
  produksi:      ModuleFull;
  finishing:     ModuleFull;
  salary:        ModuleView;
  logs:          ModuleView;
  weekly_notes:  ModuleView;
  settings:      ModuleFull;
  kalkulator:    ModuleView;
  config_harga:  ModuleViewEdit;
  trash:         ModuleTrash;
  nota:          ModuleView;
  keuangan:      ModuleViewEdit;
  po_management: ModuleFull;   // ← TAMBAHAN
}

// ─── DEFAULT_PERMISSIONS ─────────────────────────────────────────────────────

export const DEFAULT_PERMISSIONS: UserPermissions = {
  dashboard:     { view: true  },
  orders:        { view: true,  create: false, edit: false, delete: false },
  produksi:      { view: true,  create: false, edit: false, delete: false },
  finishing:     { view: true,  create: false, edit: false, delete: false },
  salary:        { view: false },
  logs:          { view: false },
  weekly_notes:  { view: false },
  settings:      { view: false, create: false, edit: false, delete: false },
  kalkulator:    { view: true  },
  config_harga:  { view: false, edit: false },
  trash:         { view: false, delete: false },
  nota:          { view: false },
  keuangan:      { view: false, edit: false },
  po_management: { view: false, create: false, edit: false, delete: false }, // ← TAMBAHAN
};

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserData {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  permissions: UserPermissions;
  address?: string;
  dob?: string;
  avatar_url?: string;
}

// ─── Announcment ─────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'update';
  is_active: boolean;
  created_by?: string;
  created_at: string;
  expires_at?: string | null;
}

// ─── Order ───────────────────────────────────────────────────────────────────

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
  alamat_pemesan?: string;
  jumlah: number;
  tanggal_masuk: string;
  deadline: string;
  jenis_produksi: string;
  detail_ukuran?: SizeEntry[] | null;
  status: OrderStatus;

  assigned_to?: string | null;
  assigned_user?: { name: string } | null;

  helper_id?: string | null;
  helper_user?: { name: string } | null;

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
  harga_per_pcs?:      number;
  total_harga?:        number;
  dp_masuk?:           number;
  status_pembayaran?:  'Belum DP' | 'DP' | 'Lunas';
  biaya_ukuran_besar?: number;
  biaya_lengan_panjang?: number;
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

// ─── Size / Detail Ukuran ────────────────────────────────────────────────────

export type UkuranKey = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export interface SizeEntry {
  id: string;
  warna: string;
  lengan: 'pendek' | 'panjang';
  ukuran: Partial<Record<string, number>>;
}