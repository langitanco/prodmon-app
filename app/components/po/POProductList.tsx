// app/components/po/POProductList.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getAllPOProducts,
  createPOProduct,
  updatePOProduct,
  deletePOProduct,
  togglePOProductActive,
  deleteProductImages, // ← tambahkan ini
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

export default function POProductList() {
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
  }, []);

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
    const data = await getAllPOProducts();
    setProducts(data);
    setLoading(false);
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_PRODUCT);
    setNewFiles([]);
    setPreviewUrls([]);
    setPendingDeleteUrls([]); // ← tambahkan ini
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
    setPendingDeleteUrls([]); // ← tambahkan ini
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

    // Tandai untuk dihapus nanti, BUKAN dihapus sekarang.
    // Kalau user klik "Batal", daftar ini akan dibuang begitu saja
    // dan file di storage tetap aman karena tidak pernah dieksekusi.
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

      const finalData = {
        ...form,
        image_urls: [...form.image_urls, ...uploadedUrls],
      };

      if (editTarget) {
        await updatePOProduct(editTarget.id, finalData);
      } else {
        await createPOProduct(finalData);
      }

      // Baru sekarang, SETELAH save ke database berhasil,
      // benar-benar hapus file-file lama yang ditandai dari storage.
      if (pendingDeleteUrls.length > 0) {
        await deleteProductImages(pendingDeleteUrls);
      }

      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan produk.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    await deletePOProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleToggle(id: string, current: boolean) {
    await togglePOProductActive(id, !current);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p)),
    );
  }

  if (loading)
    return (
      <div className="flex items-center gap-3 py-8 text-slate-400 dark:text-slate-500">
        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">Memuat produk...</span>
      </div>
    );

  if (showForm) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
        <button
          onClick={() => {
            setPendingDeleteUrls([]);
            setShowForm(false);
          }}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={15} /> Kembali
        </button>

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
            {editTarget ? "Edit" : "Baru"}
          </p>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
            {editTarget ? editTarget.name : "Tambah Produk"}
          </h2>
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
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                Dewasa
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, category: "kids" })}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  form.category === "kids"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                Kids
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nama Produk *">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Kaos Basic Oversize"
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
                placeholder="95000"
                className={inputCls}
              />
              {form.base_price > 0 && (
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1.5 font-semibold">
                  {formatRupiah(form.base_price)}
                </p>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Ukuran Tersedia" hint="(pisah koma)">
              <input
                type="text"
                value={rawSizes}
                onChange={(e) => setRawSizes(e.target.value)}
                onBlur={() =>
                  setForm({ ...form, available_sizes: strToArray(rawSizes) })
                }
                placeholder="S, M, L, XL, 2XL, 3XL"
                className={inputCls}
              />
            </Field>
            <Field label="Jenis Lengan" hint="(pisah koma)">
              <input
                type="text"
                value={rawSleeves}
                onChange={(e) => setRawSleeves(e.target.value)}
                onBlur={() =>
                  setForm({ ...form, sleeve_types: strToArray(rawSleeves) })
                }
                placeholder="Pendek, Panjang"
                className={inputCls}
              />
            </Field>
            <Field label="Warna Tersedia" hint="(pisah koma)">
              <input
                type="text"
                value={rawColors}
                onChange={(e) => setRawColors(e.target.value)}
                onBlur={() =>
                  setForm({ ...form, colors: strToArray(rawColors) })
                }
                placeholder="Hitam, Putih, Abu-abu"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Foto Produk" hint="(Bisa upload lebih dari 1)">
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Klik di sini untuk mengunggah foto
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Format JPG, PNG (Direkomendasikan max 2MB)
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
                    <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-blue-500 text-white px-1.5 rounded-sm">
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
          </Field>

          <Field label="Deskripsi">
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              placeholder="Deskripsi singkat produk..."
              className={`${inputCls} resize-y`}
            />
          </Field>

          {/* Pengaturan Penyesuaian Harga */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={form.enable_sleeve_surcharge}
                onChange={(e) =>
                  setForm({
                    ...form,
                    enable_sleeve_surcharge: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Tambahan Lengan Panjang
                </span>
                <span className="text-[11px] text-slate-500">
                  Sesuaikan harga jika ada opsi lengan panjang
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={form.enable_xxl_surcharge}
                onChange={(e) =>
                  setForm({ ...form, enable_xxl_surcharge: e.target.checked })
                }
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Tambahan Size Jumbo
                </span>
                <span className="text-[11px] text-slate-500">
                  Sesuaikan harga untuk ukuran XXL atau lebih
                </span>
              </div>
            </label>
            {/* Setelah label enable_xxl_surcharge yang sudah ada */}
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={form.enable_sweater_xxl_surcharge}
                onChange={(e) =>
                  setForm({
                    ...form,
                    enable_sweater_xxl_surcharge: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Tambahan Sweater Size 2XL+
                </span>
                <span className="text-[11px] text-slate-500">
                  Harga berlipat mulai ukuran 2XL ke atas
                </span>
              </div>
            </label>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none pt-2">
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
            className="w-full md:w-auto px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />{" "}
                Menyimpan...
              </>
            ) : editTarget ? (
              "Simpan Perubahan"
            ) : (
              "Tambah Produk"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {products.length} produk terdaftar
        </p>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto flex justify-center items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors"
        >
          <Plus size={15} /> Tambah Produk
        </button>
      </div>

      {products.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-2xl border-dashed">
          <ImageOff size={32} strokeWidth={1.2} />
          <p className="text-sm font-semibold">Belum ada produk</p>
          <button
            onClick={openCreate}
            className="text-xs text-blue-500 hover:underline"
          >
            Tambahkan produk pertama →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${!p.is_active ? "opacity-60 bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {p.image_urls[0] ? (
                  <img
                    src={p.image_urls[0]}
                    alt={p.name}
                    className="w-16 h-16 sm:w-14 sm:h-14 object-cover rounded-xl flex-shrink-0 bg-slate-100 dark:bg-slate-800"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-14 sm:h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center">
                    <ImageOff
                      size={18}
                      className="text-slate-300 dark:text-slate-600"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {p.name}
                    </p>
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {p.product_code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                        p.category === "kids"
                          ? "bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400"
                          : "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {p.category === "kids" ? "Kids" : "Dewasa"}
                    </span>
                    {!p.is_active && (
                      <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {formatRupiah(p.base_price)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {p.available_sizes.join(", ")}{" "}
                    {p.colors.length > 0 && ` · ${p.colors.join(", ")}`}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-1.5 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
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
                  className="text-xs border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 px-3 py-2 sm:py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
