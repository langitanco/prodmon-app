// app/components/orders/CreateOrder.tsx

import React, { useState, useEffect } from 'react';
import { ProductionTypeData, UserData } from '@/types';
import SizeInputForm, { SizeEntry } from './SizeInputForm';

interface CreateOrderProps {
  productionTypes: ProductionTypeData[];
  users: UserData[];
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

export default function CreateOrder({ productionTypes, users, onCancel, onSubmit }: CreateOrderProps) {
  const [showSizeForm, setShowSizeForm] = useState(false);

  const [form, setForm] = useState({
    nama: '',
    hp: '',
    alamat_pemesan: '',
    jumlah: 0,
    detail_ukuran: null as SizeEntry[] | null,
    deadline: new Date().toISOString().split('T')[0],
    type: productionTypes[0]?.value || 'manual',
    assigned_to: '',
    helper_id: '',
  });

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setForm(f => ({ ...f, deadline: d.toISOString().split('T')[0] }));
  }, []);

  const handleSizeSave = (detail: SizeEntry[], totalJumlah: number) => {
    setForm(f => ({ ...f, detail_ukuran: detail, jumlah: totalJumlah }));
    setShowSizeForm(false);
  };

  const isDisabled =
    !form.nama || !form.hp || !form.deadline || !form.jumlah || !form.assigned_to || !form.detail_ukuran;

  // ── SizeInputForm ──────────────────────────────────────────────────────────
  if (showSizeForm) {
    return (
      <SizeInputForm
        initialData={form.detail_ukuran ?? undefined}
        onSave={handleSizeSave}
        onCancel={() => setShowSizeForm(false)}
      />
    );
  }

  // Normalisasi nomor HP ke format WA internasional (tanpa + atau spasi)
  const normalizePhone = (raw: string): string => {
    // Hapus semua karakter selain angka dan +
    let cleaned = raw.replace(/[^\d+]/g, '');
    // Jika diawali +, hapus + saja
    if (cleaned.startsWith('+')) return cleaned.slice(1);
    // Jika diawali 0, ganti dengan 62 (Indonesia)
    if (cleaned.startsWith('0')) return '62' + cleaned.slice(1);
    // Sudah pakai kode negara langsung (62xxx, 1xxx, 44xxx, dll)
    return cleaned;
  };

  const handleHpBlur = () => {
    if (!form.hp) return;
    setForm(f => ({ ...f, hp: normalizePhone(f.hp) }));
  };

  // ── Form Utama ─────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">

      {/* Wrapper: full height, no scroll on desktop */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-5 md:px-8 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="font-bold text-lg md:text-xl text-slate-800 dark:text-white">Buat Pesanan Baru</h2>
        </div>

        {/* Body — 2 kolom di desktop, scroll hanya di mobile */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden p-4 md:p-6">
          <div className="h-full flex flex-col md:grid md:grid-cols-2 md:gap-x-8 gap-y-3 md:gap-y-0">

            {/* ── KOLOM KIRI ── */}
            <div className="flex flex-col gap-3 md:gap-4 md:justify-between">

              {/* Nama Pemesan */}
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">
                  Nama Pemesan
                </label>
                <input
                  className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="Masukkan nama pemesan"
                  value={form.nama}
                  onChange={e => setForm({ ...form, nama: e.target.value })}
                />
              </div>

              {/* No HP & Jumlah */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">
                    No HP
                  </label>
                  <input
                    className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="08xx / +62xx"
                    value={form.hp}
                    onChange={e => setForm({ ...form, hp: e.target.value })}
                    onBlur={handleHpBlur}   // ← tambah ini
                  />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">
                    Jumlah
                  </label>
                  <input
                    readOnly
                    className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl font-medium bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 text-sm cursor-not-allowed placeholder-slate-400 dark:placeholder-slate-500"
                    value={form.jumlah > 0 ? `${form.jumlah} pcs` : ''}
                    placeholder="Otomatis dari ukuran"
                  />
                </div>
              </div>

              {/* Detail Ukuran */}
              <div className="flex-1 flex flex-col">
                <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">
                  Detail Ukuran <span className="text-red-500">(Wajib)</span>
                </label>

                {!form.detail_ukuran ? (
                  <button
                    onClick={() => setShowSizeForm(true)}
                    className="flex-1 min-h-[80px] w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 transition"
                  >
                    + Isi Detail Ukuran
                  </button>
                ) : (
                  <div className="flex-1 flex flex-col border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="flex-1 p-3 md:p-4 space-y-2 overflow-y-auto">
                      {form.detail_ukuran.map(e => {
                        const total = Object.values(e.ukuran).reduce((a: number, b) => a + (b ?? 0), 0);
                        const ukuranList = Object.entries(e.ukuran)
                          .filter(([, v]) => (v ?? 0) > 0)
                          .map(([k, v]) => `${k}:${v}`)
                          .join(', ');
                        return (
                          <div key={e.id} className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                {e.warna} &middot; Lengan {e.lengan}
                              </span>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{ukuranList}</p>
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {total} pcs
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 px-3 md:px-4 py-2 flex items-center justify-between shrink-0">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        Total: {form.jumlah} pcs
                      </span>
                      <button
                        onClick={() => setShowSizeForm(true)}
                        className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition underline underline-offset-2"
                      >
                        Ubah
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">
                  Alamat Pemesan <span className="normal-case font-normal text-slate-400">(Opsional, untuk Label Kirim)</span>
                </label>
                <textarea
                  className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500 resize-none h-16 md:h-20"
                  placeholder="Masukkan alamat lengkap pengiriman..."
                  value={form.alamat_pemesan}
                  onChange={e => setForm({ ...form, alamat_pemesan: e.target.value })}
                />
              </div>

            </div>

            {/* Divider vertikal di desktop */}
            <div className="hidden md:block absolute left-1/2 top-[72px] bottom-[72px] w-px bg-slate-100 dark:bg-slate-800 pointer-events-none" />

            {/* ── KOLOM KANAN ── */}
            <div className="flex flex-col gap-3 md:gap-4 md:justify-between">

              {/* Jenis */}
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">
                  Jenis
                </label>
                <select
                  className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  {productionTypes.map(pt => (
                    <option key={pt.id} value={pt.value} className="dark:bg-slate-800">{pt.name}</option>
                  ))}
                </select>
              </div>

              {/* Penanggung Jawab */}
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1 md:mb-2">
                  Penanggung Jawab (Wajib)
                </label>
                <select
                  className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
                  value={form.assigned_to}
                  onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                >
                  <option value="" className="dark:bg-slate-800">Pilih PIC Produksi</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id} className="dark:bg-slate-800">
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Helper */}
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-1 md:mb-2">
                  Helper / Pembantu (Opsional)
                </label>
                <select
                  className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
                  value={form.helper_id}
                  onChange={e => setForm({ ...form, helper_id: e.target.value })}
                >
                  <option value="" className="dark:bg-slate-800">-- Tidak Ada Helper --</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id} className="dark:bg-slate-800">
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Helper akan ikut terhitung di menu gaji jika dipilih.</p>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1 md:mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  className="w-full border-2 border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
                  value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })}
                />
              </div>

              {/* Spacer supaya tombol tetap di bawah */}
              <div className="flex-1 hidden md:block" />

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 border-2 border-slate-200 dark:border-slate-700 py-2 md:py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={() => onSubmit(form)}
                  disabled={isDisabled}
                  className="flex-1 bg-blue-600 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  Simpan
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}