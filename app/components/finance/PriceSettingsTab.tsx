import React, { useEffect, useState } from "react";
import { Settings2, Save, Info } from "lucide-react";
import { formatRupiah } from "./utils";
import { HargaConfig } from "./types";

interface PriceSettingsTabProps {
  config: HargaConfig;
  canEdit: boolean;
  onSave: (next: {
    biaya_ukuran_besar: number;
    biaya_lengan_panjang: number;
  }) => Promise<{ error: unknown }>;
}

export function PriceSettingsTab({
  config,
  canEdit,
  onSave,
}: PriceSettingsTabProps) {
  const [biayaUkuran, setBiayaUkuran] = useState(config.biaya_ukuran_besar);
  const [biayaLengan, setBiayaLengan] = useState(config.biaya_lengan_panjang);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Sinkron ulang kalau config dari server berubah (mis. setelah refetch)
  useEffect(() => {
    setBiayaUkuran(config.biaya_ukuran_besar);
    setBiayaLengan(config.biaya_lengan_panjang);
  }, [config]);

  const isDirty =
    biayaUkuran !== config.biaya_ukuran_besar ||
    biayaLengan !== config.biaya_lengan_panjang;

  const handleSave = async () => {
    if (!canEdit || !isDirty) return;
    setSaving(true);
    const { error } = await onSave({
      biaya_ukuran_besar: biayaUkuran,
      biaya_lengan_panjang: biayaLengan,
    });
    setSaving(false);
    if (!error) setSavedAt(new Date().toLocaleTimeString("id-ID"));
  };

  const inputCls =
    "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const labelCls =
    "block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1";

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3 flex gap-2">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
          Perubahan di sini hanya dipakai saat menghitung pembayaran{" "}
          <strong>setelah</strong> disimpan. Order yang total harganya sudah
          pernah dihitung dan disimpan sebelumnya <strong>tidak berubah</strong>{" "}
          otomatis — kecuali kalau order itu dibuka & disimpan ulang lewat form
          pembayaran.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-4 max-w-md">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Settings2 className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Biaya Tambahan Ukuran & Lengan
          </p>
        </div>

        <div>
          <label className={labelCls}>
            Tambahan mulai ukuran XXL (per step)
          </label>
          <input
            type="number"
            disabled={!canEdit}
            value={biayaUkuran}
            onChange={(e) => setBiayaUkuran(parseInt(e.target.value, 10) || 0)}
            className={inputCls}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            XXL: +{formatRupiah(biayaUkuran)}/pcs · XXXL: +
            {formatRupiah(biayaUkuran * 2)}/pcs, dst (kelipatan per ukuran)
          </p>
        </div>

        <div>
          <label className={labelCls}>Tambahan Lengan Panjang</label>
          <input
            type="number"
            disabled={!canEdit}
            value={biayaLengan}
            onChange={(e) => setBiayaLengan(parseInt(e.target.value, 10) || 0)}
            className={inputCls}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Berlaku per pcs untuk semua entri dengan lengan panjang
          </p>
        </div>

        {canEdit ? (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
            {savedAt && !isDirty && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Tersimpan {savedAt}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 pt-1">
            Anda tidak punya akses untuk mengubah pengaturan ini.
          </p>
        )}

        {config.updated_at && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            Terakhir diubah:{" "}
            {new Date(config.updated_at).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {config.updated_by && ` oleh ${config.updated_by}`}
          </p>
        )}
      </div>
    </div>
  );
}
