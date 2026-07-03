"use client";

import { useEffect, useState } from "react";
import {
  getAllPOProducts,
  createPOProduct,
  updatePOProduct,
  deletePOProduct,
  togglePOProductActive,
  deleteProductImages,
} from "@/lib/po/admin";
import { formatRupiah } from "@/lib/po/pricing";
import { POProduct } from "@/types/po";
import { ArrowLeft, ImageOff, Plus, UploadCloud, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const EMPTY_PRODUCT: Omit<POProduct, "id"> = {
  product_code: "",
  name: "",
  category: "dewasa",
  base_price: 0,
  available_sizes: [],
  sleeve_types: [],
  colors: [],
  image_urls: [],
  description: "",
  is_active: true,
  sort_order: 0,
  enable_sleeve_surcharge: false,
  enable_xxl_surcharge: false,
  enable_sweater_xxl_surcharge: false,
};

function arrayToStr(arr: string[]) {
  return arr.join(", ");
}
function strToArray(str: string) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
        {label}{" "}
        {hint && (
          <span className="font-normal text-slate-400 dark:text-slate-500">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500 transition-all";

// Wajibkan komponen menerima properti poId
interface POProductListProps {
  poId: string;
}

export default function POProductList({ poId }: POProductListProps) {
  const [products, setProducts] = useState<POProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<POProduct | null>(null);
  const [form, setForm] = useState<Omit<POProduct, "id">>(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [pendingDeleteUrls, setPendingDeleteUrls] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [rawSizes, setRawSizes] = useState("");
  const [rawSleeves, setRawSleeves] = useState("");
  const [rawColors, setRawColors] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poId]); // Reload jika poId berganti

  useEffect(() => {
    if (showForm) {
      setRawSizes(arrayToStr(form.available_sizes));
      setRawSleeves(arrayToStr(form.sleeve_types));
      setRawColors(arrayToStr(form.colors));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm]);

  async function load() {
    setLoading(true);
    // Teruskan poId agar admin.ts bisa memfilter data
    const data = await getAllPOProducts(poId);
    setProducts(data);
    setLoading(false);
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_PRODUCT);
    setNewFiles([]);
    setPreviewUrls([]);
    setPendingDeleteUrls([]);
    setShowForm(true);
  }

  function openEdit(p: POProduct) {
    setEditTarget(p);
    setForm({
      product_code: p.product_code,
      name: p.name,
      category: p.category ?? "dewasa",
      base_price: p.base_price,
      available_sizes: p.available_sizes,
      sleeve_types: p.sleeve_types,
      colors: p.colors,
      image_urls: p.image_urls || [],
      description: p.description || "",
      is_active: p.is_active,
      sort_order: p.sort_order,
      enable_sleeve_surcharge: p.enable_sleeve_surcharge ?? false,
      enable_xxl_surcharge: p.enable_xxl_surcharge ?? false,
      enable_sweater_xxl_surcharge: p.enable_sweater_xxl_surcharge ?? false,
    });
    setNewFiles([]);
    setPreviewUrls([]);
    setPendingDeleteUrls([]);
    setShowForm(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...urls]);
    e.target.value = "";
  }

  function removeOldImage(index: number) {
    const urlToDelete = form.image_urls[index];
    const updated = [...form.image_urls];
    updated.splice(index, 1);
    setForm({ ...form, image_urls: updated });
    setPendingDeleteUrls((prev) => [...prev, urlToDelete]);
  }

  function removeNewImage(index: number) {
    const updatedFiles = [...newFiles];
    updatedFiles.splice(index, 1);
    setNewFiles(updatedFiles);

    const updatedPreviews = [...previewUrls];
    URL.revokeObjectURL(updatedPreviews[index]);
    updatedPreviews.splice(index, 1);
    setPreviewUrls(updatedPreviews);
  }

  async function handleSave() {
    if (!form.name || !form.product_code || form.base_price <= 0) {
      alert("Nama, kode produk, dan harga wajib diisi.");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    try {
      const uploadedUrls: string[] = [];

      for (const file of newFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { data, error } = await supabase.storage
          .from("po_assets")
          .upload(filePath, file);

        if (error) {
          console.error("Gagal upload gambar:", error);
          alert(`Gagal upload ${file.name}. Lanjut menyimpan data lainnya.`);
        } else if (data) {
          const { data: publicUrlData } = supabase.storage
            .from("po_assets")
            .getPublicUrl(filePath);
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      const finalProduct = {
        ...form,
        available_sizes: strToArray(rawSizes),
        sleeve_types: strToArray(rawSleeves),
        colors: strToArray(rawColors),
        image_urls: [...form.image_urls, ...uploadedUrls],
      };

      if (editTarget) {
        await updatePOProduct(editTarget.id, finalProduct);
      } else {
        // Menyisipkan po_setting_id ke produk baru menggunakan keyword 'any' agar tidak error TypeScript
        await createPOProduct({ ...finalProduct, po_setting_id: poId } as any);
      }

      if (pendingDeleteUrls.length > 0) {
        await deleteProductImages(pendingDeleteUrls);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
      setShowForm(false);
      load();
    }
  }

  async function handleToggle(id: string, current: boolean) {
    await togglePOProductActive(id, !current);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p)),
    );
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    await deletePOProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-200 origin-top bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto shadow-sm">
        <div className="flex items-start gap-4 mb-8">
          <button
            onClick={() => {
              setPendingDeleteUrls([]);
              setShowForm(false);
            }}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
              {editTarget ? "Edit" : "Baru"}
            </p>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
              {editTarget ? editTarget.name : "Tambah Produk"}
            </h2>
          </div>
        </div>

        <div className="space-y-4 md:space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Kode Produk *">
              <input
                type="text"
                value={form.product_code}
                onChange={(e) =>
                  setForm({ ...form, product_code: e.target.value })
                }
                placeholder="KAO-001"
                className={inputCls}
              />
            </Field>
            <Field label="Urutan Tampil">
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Kategori Produk *">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, category: "dewasa" })}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  form.category === "dewasa"
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Dewasa / Umum
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, category: "kids" })}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  form.category === "kids"
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Anak-anak
              </button>
            </div>
          </Field>
          <Field label="Nama Produk *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Kaos Lengan Pendek Combed 30s"
              className={inputCls}
            />
          </Field>
          <Field label="Harga Dasar (Rp) *">
            <input
              type="number"
              value={form.base_price}
              onChange={(e) =>
                setForm({ ...form, base_price: Number(e.target.value) })
              }
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Ukuran" hint="(pisahkan dengan koma)">
              <input
                type="text"
                value={rawSizes}
                onChange={(e) => setRawSizes(e.target.value)}
                placeholder="S, M, L, XL, XXL"
                className={inputCls}
              />
            </Field>
            <Field label="Jenis Lengan" hint="(pisahkan dengan koma)">
              <input
                type="text"
                value={rawSleeves}
                onChange={(e) => setRawSleeves(e.target.value)}
                placeholder="Pendek, Panjang"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Warna" hint="(pisahkan dengan koma)">
            <input
              type="text"
              value={rawColors}
              onChange={(e) => setRawColors(e.target.value)}
              placeholder="Hitam, Putih, Navy"
              className={inputCls}
            />
          </Field>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Biaya Tambahan Tambahan (Surcharge)
            </p>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.enable_xxl_surcharge}
                onChange={(e) =>
                  setForm({ ...form, enable_xxl_surcharge: e.target.checked })
                }
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Aktifkan biaya tambahan untuk size XXL (Kaos Dewasa)
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.enable_sleeve_surcharge}
                onChange={(e) =>
                  setForm({
                    ...form,
                    enable_sleeve_surcharge: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Aktifkan biaya tambahan untuk Lengan Panjang (Kaos)
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.enable_sweater_xxl_surcharge}
                onChange={(e) =>
                  setForm({
                    ...form,
                    enable_sweater_xxl_surcharge: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Aktifkan biaya tambahan untuk size XXL (Sweater/Hoodie)
              </span>
            </label>
          </div>

          <Field label="Deskripsi">
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className={inputCls}
            />
          </Field>

          <div className="pt-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">
              Foto Produk
            </label>
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col items-center justify-center gap-2 group overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2">
                Klik atau Drag gambar ke sini
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-xs">
                (Direkomendasikan max 2MB)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {(form.image_urls.length > 0 || previewUrls.length > 0) && (
              <div className="flex flex-wrap gap-3 mt-4">
                {form.image_urls.map((url, i) => (
                  <div key={`old-${i}`} className="relative w-20 h-20 group">
                    <img
                      src={url}
                      alt={`Saved ${i}`}
                      className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                    <button
                      onClick={() => removeOldImage(i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-transform hover:scale-110"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {previewUrls.map((url, i) => (
                  <div key={`new-${i}`} className="relative w-20 h-20 group">
                    <img
                      src={url}
                      alt={`New ${i}`}
                      className="w-full h-full object-cover rounded-lg border-2 border-blue-400 shadow-sm"
                    />
                    <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-blue-500 text-white px-1.5 rounded-full shadow-sm">
                      BARU
                    </span>
                    <button
                      onClick={() => removeNewImage(i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-transform hover:scale-110"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.is_active ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Produk aktif (tampil di katalog)
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setPendingDeleteUrls([]);
                setShowForm(false);
              }}
              className="w-full md:w-auto px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full md:flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Produk"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-sm">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Katalog Produk
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {products.length} produk terdaftar dalam katalog
          </p>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center text-slate-400 mb-4">
            <ImageOff size={24} />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">
            Belum ada produk
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            Katalog masih kosong. Tambahkan produk pertama Anda untuk mulai
            menerima pesanan.
          </p>
          <button
            onClick={openCreate}
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Tambah Produk Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col sm:flex-row gap-4 p-4 border rounded-2xl bg-white dark:bg-slate-900 transition-colors ${!p.is_active ? "border-slate-200 dark:border-slate-800 opacity-60" : "border-slate-200 dark:border-slate-700 shadow-sm"}`}
            >
              <div className="w-full sm:w-28 h-48 sm:h-28 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden relative">
                {p.image_urls && p.image_urls.length > 0 ? (
                  <img
                    src={p.image_urls[0]}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <ImageOff size={20} className="mb-1 opacity-50" />
                    <span className="text-[9px] font-bold uppercase">
                      No Image
                    </span>
                  </div>
                )}
                {!p.is_active && (
                  <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded">
                      NONAKTIF
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between min-w-0">
                <div className="flex-1 min-w-0 pr-0 sm:pr-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                      {p.product_code}
                    </span>
                    {!p.is_active && (
                      <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <h3
                    className="font-extrabold text-slate-800 dark:text-slate-100 truncate mb-1"
                    title={p.name}
                  >
                    {p.name}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                    {p.available_sizes.join(", ")} • {p.colors.length} Warna
                  </div>
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-auto">
                    {formatRupiah(p.base_price)}
                  </p>
                </div>
                <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-1.5 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleToggle(p.id, p.is_active)}
                    className="text-xs border border-slate-200 dark:border-slate-700 px-3 py-2 sm:py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold transition-colors"
                  >
                    {p.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="text-xs border border-slate-200 dark:border-slate-700 px-3 py-2 sm:py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="text-xs border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 sm:py-1.5 rounded-lg font-semibold transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
