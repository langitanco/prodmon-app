"use client";

import { useEffect, useState } from "react";
import { getPOSettingAdmin, updatePOSetting } from "@/lib/po/admin";
import { formatRupiah } from "@/lib/po/pricing";
import { POSetting } from "@/types/po";
import {
  ToggleLeft,
  ToggleRight,
  Tag,
  CalendarDays,
  CirclePlus,
  Phone,
  Landmark,
  Clock,
  CheckCircle2,
  XCircle,
  Save,
  Link as LinkIcon,
} from "lucide-react";

/* ── Reusable field wrapper ──────────────────────────────────────── */
function Field({
  label,
  icon: Icon,
  hint,
  children,
}: {
  label: string;
  icon: React.ElementType;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
        <Icon size={11} />
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
          {hint}
        </p>
      )}
    </div>
  );
}

/* ── Section header ──────────────────────────────────────────────── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
      {children}
    </p>
  );
}

const INPUT =
  "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all";

export default function POSettings() {
  const [setting, setSetting] = useState<POSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    is_active: false,
    title: "",
    url_slug: "",
    periode_mulai: "",
    periode_selesai: "",
    sleeve_surcharge: 0,
    xxl_surcharge: 0,
    sweater_xxl_surcharge: 0,
    wa_admin_phone: "",
    bank_account_info: "",
  });

  useEffect(() => {
    async function load() {
      const data = await getPOSettingAdmin();
      if (data) {
        setSetting(data);
        setForm({
          is_active: data.is_active,
          title: data.title || "",
          url_slug: data.url_slug || "",
          periode_mulai: data.periode_mulai || "",
          periode_selesai: data.periode_selesai || "",
          sleeve_surcharge: data.sleeve_surcharge,
          xxl_surcharge: data.xxl_surcharge,
          sweater_xxl_surcharge: data.sweater_xxl_surcharge ?? 0,
          wa_admin_phone: data.wa_admin_phone || "",
          bank_account_info: data.bank_account_info || "",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!setting) return;
    setSaving(true);

    // Kirim update sesuai dengan parameter yang diharapkan updatePOSetting
    const result = await updatePOSetting(setting.id, {
      ...form,
      periode_mulai: form.periode_mulai || undefined,
      periode_selesai: form.periode_selesai || undefined,
      wa_admin_phone: form.wa_admin_phone || undefined,
      bank_account_info: form.bank_account_info || undefined,
    });

    setSaving(false);
    if (result.success) {
      alert("Pengaturan berhasil disimpan.");
    } else {
      alert("Gagal: " + result.error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 text-slate-400 dark:text-slate-500">
        <Clock size={16} className="animate-pulse" />
        <span className="text-sm">Memuat pengaturan...</span>
      </div>
    );
  }

  if (!setting) {
    return (
      <div className="flex items-center gap-3 py-8 text-red-400">
        <XCircle size={16} />
        <span className="text-sm">Setting tidak ditemukan di database.</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 md:space-y-6 animate-in fade-in duration-200">
      {/* ── Status Toggle ─────────────────────────────────────────── */}
      <div
        className={`flex items-center justify-between gap-4 rounded-2xl border-2 p-5 transition-colors ${form.is_active ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"}`}
      >
        <div className="flex items-center gap-3">
          {form.is_active ? (
            <CheckCircle2
              size={18}
              className="text-emerald-500 flex-shrink-0"
            />
          ) : (
            <XCircle size={18} className="text-slate-400 flex-shrink-0" />
          )}
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              Status PO
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {form.is_active
                ? "PO sedang aktif — publik bisa memesan"
                : "PO nonaktif — form pemesanan ditutup"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setForm({ ...form, is_active: !form.is_active })}
          className="flex-shrink-0 transition-colors"
          aria-label="Toggle status PO"
        >
          {form.is_active ? (
            <ToggleRight size={36} className="text-emerald-500" />
          ) : (
            <ToggleLeft
              size={36}
              className="text-slate-300 dark:text-slate-600"
            />
          )}
        </button>
      </div>

      <SectionHeading>Informasi Kampanye</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
        <Field label="Judul PO" icon={Tag}>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="PO Kaos Langitan Vol. 1"
            className={INPUT}
          />
        </Field>
        <Field
          label="Nama Link Katalog"
          icon={LinkIcon}
          hint="Contoh hasil: website.com/po/katalog-merch"
        >
          <div className="flex items-center">
            <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-xl text-slate-500 text-sm font-mono">
              /po/
            </span>
            <input
              type="text"
              value={form.url_slug}
              onChange={(e) =>
                setForm({
                  ...form,
                  url_slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-"),
                })
              }
              className={INPUT + " rounded-l-none"}
              placeholder="katalog-merch"
            />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
        <Field label="Tanggal Mulai" icon={CalendarDays}>
          <input
            type="date"
            value={form.periode_mulai}
            onChange={(e) =>
              setForm({ ...form, periode_mulai: e.target.value })
            }
            className={INPUT}
          />
        </Field>
        <Field label="Tanggal Selesai" icon={CalendarDays}>
          <input
            type="date"
            value={form.periode_selesai}
            onChange={(e) =>
              setForm({ ...form, periode_selesai: e.target.value })
            }
            className={INPUT}
          />
        </Field>
      </div>

      <SectionHeading>Harga Tambahan</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
        <Field
          label="Tambahan Lengan Panjang (Rp)"
          icon={CirclePlus}
          hint={
            form.sleeve_surcharge > 0
              ? `+${formatRupiah(form.sleeve_surcharge)} untuk pilihan lengan panjang`
              : undefined
          }
        >
          <input
            type="number"
            value={form.sleeve_surcharge}
            onChange={(e) =>
              setForm({ ...form, sleeve_surcharge: Number(e.target.value) })
            }
            className={INPUT}
          />
        </Field>
        <Field
          label="Tambahan per Tingkat XXL (Rp)"
          icon={CirclePlus}
          hint={
            form.xxl_surcharge > 0 ? (
              <span>
                2XL +{formatRupiah(form.xxl_surcharge)}&nbsp;·&nbsp;3XL +
                {formatRupiah(form.xxl_surcharge * 2)}&nbsp;dst.
              </span>
            ) : undefined
          }
        >
          <input
            type="number"
            value={form.xxl_surcharge}
            onChange={(e) =>
              setForm({ ...form, xxl_surcharge: Number(e.target.value) })
            }
            className={INPUT}
          />
        </Field>
        <Field
          label="Tambahan Sweater Size 2XL+ (Rp)"
          icon={CirclePlus}
          hint={
            form.sweater_xxl_surcharge > 0 ? (
              <span>
                2XL +{formatRupiah(form.sweater_xxl_surcharge)}&nbsp;·&nbsp;3XL
                +{formatRupiah(form.sweater_xxl_surcharge * 2)}&nbsp;dst.
              </span>
            ) : undefined
          }
        >
          <input
            type="number"
            value={form.sweater_xxl_surcharge}
            onChange={(e) =>
              setForm({
                ...form,
                sweater_xxl_surcharge: Number(e.target.value),
              })
            }
            className={INPUT}
          />
        </Field>
      </div>

      <SectionHeading>Kontak &amp; Pembayaran</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
        <Field
          label="No. WhatsApp Admin"
          icon={Phone}
          hint="Awali dengan 62, bukan 0."
        >
          <input
            type="text"
            value={form.wa_admin_phone}
            onChange={(e) =>
              setForm({ ...form, wa_admin_phone: e.target.value })
            }
            placeholder="628123456789"
            className={INPUT}
          />
        </Field>
        <Field label="Info Rekening Transfer" icon={Landmark}>
          <textarea
            value={form.bank_account_info}
            onChange={(e) =>
              setForm({ ...form, bank_account_info: e.target.value })
            }
            rows={2}
            placeholder="BCA 1234567890 a/n Langitan Store"
            className={`${INPUT} resize-none h-full min-h-[80px]`}
          />
        </Field>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-colors md:w-auto md:px-8 md:ml-auto"
      >
        <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 md:justify-end">
        <Clock size={11} /> Terakhir diperbarui:{" "}
        {new Date(setting.updated_at || new Date()).toLocaleString("id-ID")}
      </div>
    </div>
  );
}
