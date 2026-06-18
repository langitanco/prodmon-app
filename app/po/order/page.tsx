"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
// Sesuaikan path import submitOrder dengan lokasi file Anda (bisa dari '@/lib/po/supabase' atau '@/lib/po/admin')
import {
  getPOSettingAdmin,
  getAllPOProducts,
  submitOrder,
} from "@/lib/po/admin";
import { formatRupiah } from "@/lib/po/pricing";
import { POSetting, POProduct } from "@/types/po";
import {
  Package,
  ArrowLeft,
  User,
  Shirt,
  ShoppingBag,
  Plus,
  Trash,
  Send,
  Check,
  Copy,
  AlertTriangle,
  Landmark,
  MessageCircle,
  Loader2,
} from "lucide-react";

type CartItem = {
  product: POProduct;
  ukuran: string;
  lengan: string;
  warna: string;
  qty: number;
  harga_satuan: number;
  subtotal: number;
};

export default function OrderFormPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  // Helper: tombol "Katalog" kembali ke slug yang sama (kalau ada), fallback ke /po
  const katalogHref = slug ? `/po/${slug}` : "/po";

  const [setting, setSetting] = useState<POSetting | null>(null);
  const [products, setProducts] = useState<POProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Data
  const [nama, setNama] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [metodeKirim, setMetodeKirim] = useState("Diambil");
  const [alamat, setAlamat] = useState("");

  // Product Selection
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [varian, setVarian] = useState({
    ukuran: "-",
    lengan: "-",
    warna: "-",
  });
  const [qty, setQty] = useState<number | "">(0);

  // Cart & Submission
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    kodePO: string;
    total: number;
  } | null>(null);

  // Copy State
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const set = await getPOSettingAdmin();
      const prods = await getAllPOProducts();
      setSetting(set);
      setProducts(prods.filter((p) => p.is_active));
      setLoading(false);
    }
    load();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  /* ── HARGA CALCULATION ── */
  const hitungHarga = () => {
    if (!selectedProduct || !setting)
      return { dasar: 0, lengan: 0, size: 0, final: 0 };

    const dasar = selectedProduct.base_price;
    let lengan = 0;
    let size = 0;

    // Surcharge lengan
    if (varian.lengan.toLowerCase().includes("panjang")) {
      lengan = setting.sleeve_surcharge || 0;
    }

    // Surcharge ukuran (XXL, 3XL, dst)
    const uk = varian.ukuran.toUpperCase();
    if (uk.includes("L") && uk !== "L" && uk !== "XL") {
      let multiplier = 0;
      const match = uk.match(/(\d+)XL/);
      if (match && parseInt(match[1]) >= 2) {
        multiplier = parseInt(match[1]) - 1;
      } else {
        const xCount = (uk.match(/X/g) || []).length;
        if (xCount >= 2) multiplier = xCount - 1;
      }
      size = (setting.xxl_surcharge || 0) * multiplier;
    }

    return { dasar, lengan, size, final: dasar + lengan + size };
  };

  const hargaPreview = hitungHarga();
  const validQty = typeof qty === "number" ? qty : 0;
  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  /* ── HANDLERS ── */
  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setVarian({
        ukuran: prod.available_sizes[0] || "-",
        lengan: prod.sleeve_types[0] || "-",
        warna: prod.colors[0] || "-",
      });
    }
    setQty(0);
  };

  const addToCart = () => {
    if (!selectedProduct || validQty <= 0) {
      alert("Silakan pilih produk dan pastikan jumlah lebih dari 0.");
      return;
    }
    const item: CartItem = {
      product: selectedProduct,
      ukuran: varian.ukuran,
      lengan: varian.lengan,
      warna: varian.warna,
      qty: validQty,
      harga_satuan: hargaPreview.final,
      subtotal: hargaPreview.final * validQty,
    };
    setCart([...cart, item]);
    setSelectedProductId("");
    setQty(0);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  /* ── SUBMIT KE SUPABASE ── */
  const submitOrderHandler = async () => {
    if (!nama || !whatsapp) {
      alert("Mohon lengkapi Nama dan No. WhatsApp.");
      return;
    }
    if (metodeKirim === "Dikirim" && !alamat.trim()) {
      alert("Mohon isi alamat lengkap pengiriman.");
      return;
    }
    if (cart.length === 0) {
      alert("Pesanan masih kosong! Tambahkan produk terlebih dahulu.");
      return;
    }

    setSubmitting(true);

    // Siapkan Payload sesuai definisi POOrderPayload
    const payload = {
      customer_type: "PUBLIC" as const,
      customer_name: nama,
      customer_wa: whatsapp,
      delivery_method: metodeKirim as "Diambil" | "Dikirim",
      shipping_address: alamat,
      order_items: cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        warna: item.warna,
        lengan: item.lengan,
        ukuran: item.ukuran,
        qty: item.qty,
        harga_satuan: item.harga_satuan,
        subtotal: item.subtotal,
      })),
    };

    try {
      // Panggil fungsi submitOrder yang akan menyimpan data dan memanggil RPC generate_po_number
      const result = await submitOrder(payload, setting!, products);

      if (!result.success) {
        alert("Gagal memproses pesanan: " + result.error);
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      // Tampilkan kode PO yang dikembalikan oleh database
      setSuccessData({
        kodePO: result.po_number || "ERROR",
        total: grandTotal,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan pada server saat menyimpan pesanan.");
      setSubmitting(false);
    }
  };

  const copyKode = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.kodePO);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── RENDER WHATSAPP URL ── */
  const getWhatsAppLink = () => {
    if (!successData || !setting) return "#";

    let infoPengiriman = `\n*Metode Pengambilan:* ${metodeKirim}`;
    if (metodeKirim === "Dikirim") {
      infoPengiriman += `\n*Alamat Pengiriman:* ${alamat}`;
    }

    const daftarBarang = cart
      .map(
        (item, i) =>
          `${i + 1}. ${item.product.name} (${item.ukuran}, ${item.lengan}, ${item.warna})\n    ${item.qty}pcs x ${formatRupiah(item.harga_satuan)} = ${formatRupiah(item.subtotal)}`,
      )
      .join("\n");

    const text = `Halo Admin, saya ingin konfirmasi pesanan PO saya.

*Kode PO:* ${successData.kodePO}
*Nama Pemesan:* ${nama}${infoPengiriman}

*Daftar Pesanan:*
${daftarBarang}
*Total Tagihan:* *${formatRupiah(successData.total)}*

Mohon info langkah pembayarannya.`;

    // Pastikan nomor diawali '62' dan hapus karakter non-angka
    const waNumber =
      setting.wa_admin_phone?.replace(/\D/g, "") || "628123456789";
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-zinc-950 font-sans selection:bg-zinc-200 pb-20">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 md:px-10 h-[60px] flex items-center justify-between">
        <div className="text-base font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
          <Package size={18} />
          <span>Form Pemesanan PO</span>
        </div>
        <Link
          href={katalogHref}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 px-3.5 py-1.5 rounded-full hover:border-gray-300 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft size={14} />
          Katalog
        </Link>
      </header>

      {/* ========================== SUKSES STATE ========================== */}
      {successData ? (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-zinc-950 text-white px-5 py-12 md:py-16 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 60%, #064e3b 0%, transparent 60%)",
              }}
            />
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10">
              <Check size={32} className="text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight relative z-10 mb-2">
              Pesanan Berhasil Disimpan!
            </h2>
            <p className="text-sm text-white/60 relative z-10">
              Simpan kode pemesanan, lalu konfirmasi ke admin via WhatsApp.
            </p>
          </div>

          <div className="max-w-xl mx-auto px-5 py-8 md:py-10">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center mb-4">
              <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2">
                Kode Pemesanan Anda
              </p>
              <p className="text-4xl font-extrabold tracking-wide text-zinc-950 mb-5 font-mono">
                {successData.kodePO}
              </p>
              <button
                onClick={copyKode}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                  copied
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-stone-100 text-gray-600 border border-gray-200 hover:bg-gray-200 hover:text-zinc-950"
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Tersalin!" : "Salin Kode"}
              </button>
            </div>

            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 text-amber-800 text-sm font-semibold">
              <AlertTriangle
                size={18}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <p>
                Harap salin dan simpan kode ini untuk konfirmasi pembayaran
                kepada admin.
              </p>
            </div>

            {setting?.bank_account_info && (
              <div className="flex items-center gap-3 bg-stone-100 border border-gray-200 rounded-xl p-3.5 mb-5 text-gray-600 text-sm">
                <Landmark size={20} className="text-gray-400 shrink-0" />
                <span>
                  Transfer ke: <strong>{setting.bank_account_info}</strong>
                </span>
              </div>
            )}

            <p className="text-sm text-gray-500 text-center mb-3">
              Klik tombol di bawah untuk kirim rincian pesanan ke WhatsApp
              Admin.
            </p>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-3.5 rounded-xl font-extrabold text-[15px] transition-colors"
            >
              <MessageCircle size={20} />
              Konfirmasi via WhatsApp
            </a>

            <Link
              href={katalogHref}
              className="w-full flex items-center justify-center gap-2 mt-3 text-gray-500 hover:text-zinc-950 py-2 text-sm font-semibold transition-colors"
            >
              <ArrowLeft size={16} />
              Kembali ke Katalog
            </Link>
          </div>
        </div>
      ) : (
        /* ========================== FORM STATE ========================== */
        <div className="animate-in fade-in duration-300">
          {/* Hero Mini */}
          <div className="bg-zinc-950 text-white px-5 md:px-10 py-8 md:py-12 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none opacity-80"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 80% 50%, #1f2937 0%, transparent 55%)",
              }}
            />
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-white/50 mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Pre-Order Aktif
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
                Isi <em className="not-italic text-white/40">detail</em> pesanan
                kamu
              </h1>
              <p className="text-sm text-white/55">
                Tambahkan produk ke pesanan, lalu kirim konfirmasi via WhatsApp.
              </p>
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="bg-white border-b border-gray-200 px-5 md:px-10">
            <div className="max-w-2xl mx-auto flex items-center py-3.5">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-zinc-950 shrink-0">
                <span className="w-5 h-5 rounded-full bg-zinc-950 text-white text-[11px] font-extrabold flex items-center justify-center">
                  1
                </span>
                Data Diri
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-3" />
              <div
                className={`flex items-center gap-2 text-[13px] font-semibold shrink-0 ${
                  cart.length > 0 ? "text-green-600" : "text-gray-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                    cart.length > 0
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  2
                </span>
                Pilih Produk
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-3" />
              <div
                className={`flex items-center gap-2 text-[13px] font-semibold shrink-0 ${
                  cart.length > 0 ? "text-zinc-950" : "text-gray-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                    cart.length > 0
                      ? "bg-zinc-950 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  3
                </span>
                Konfirmasi
              </div>
            </div>
          </div>

          {/* Form Wrap */}
          <div className="max-w-2xl mx-auto px-5 py-8 md:py-12">
            {/* CARD 1: Data Diri */}
            <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-5 md:p-7 mb-4">
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-4 flex items-center gap-2">
                <User size={14} /> Data Pemesan
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-950 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama kamu"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-zinc-950 bg-white outline-none focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-950 mb-1.5">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Contoh: 0812345678"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-zinc-950 bg-white outline-none focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 transition-all"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-zinc-950 mb-1.5">
                  Metode Pengambilan
                </label>
                <select
                  value={metodeKirim}
                  onChange={(e) => setMetodeKirim(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-zinc-950 bg-white outline-none focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 transition-all"
                >
                  <option value="Diambil">
                    Diambil di Tempat (Toko/Studio)
                  </option>
                  <option value="Dikirim">Dikirim ke Alamat</option>
                </select>
              </div>

              {metodeKirim === "Dikirim" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold text-zinc-950 mb-1.5">
                    Alamat Lengkap Pengiriman
                  </label>
                  <textarea
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    rows={3}
                    placeholder="Jalan, RT/RW, kelurahan, kecamatan, kota, kode pos..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-zinc-950 bg-white outline-none focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 transition-all resize-y min-h-[80px]"
                  />
                </div>
              )}
            </div>

            {/* CARD 2: Pilih Produk */}
            <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-5 md:p-7 mb-4">
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-4 flex items-center gap-2">
                <Shirt size={14} /> Tambah Produk ke Pesanan
              </h2>

              <div className="mb-4">
                <label className="block text-xs font-bold text-zinc-950 mb-1.5">
                  Pilih Produk
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-zinc-950 bg-white outline-none focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 transition-all"
                >
                  <option value="">-- Pilih Barang --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-1">
                    {selectedProduct.available_sizes.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-zinc-950 mb-1.5">
                          Pilih Ukuran
                        </label>
                        <select
                          value={varian.ukuran}
                          onChange={(e) =>
                            setVarian({ ...varian, ukuran: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-zinc-950 bg-white outline-none focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 transition-all"
                        >
                          {selectedProduct.available_sizes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {selectedProduct.sleeve_types.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-zinc-950 mb-1.5">
                          Pilih Jenis Lengan
                        </label>
                        <select
                          value={varian.lengan}
                          onChange={(e) =>
                            setVarian({ ...varian, lengan: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-zinc-950 bg-white outline-none focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 transition-all"
                        >
                          {selectedProduct.sleeve_types.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {selectedProduct.colors.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-zinc-950 mb-1.5">
                          Pilih Warna
                        </label>
                        <select
                          value={varian.warna}
                          onChange={(e) =>
                            setVarian({ ...varian, warna: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-zinc-950 bg-white outline-none focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 transition-all"
                        >
                          {selectedProduct.colors.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-zinc-950 mb-1.5">
                      Jumlah (QTY)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={qty}
                      onChange={(e) =>
                        setQty(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-full md:max-w-[160px] px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-zinc-950 bg-white outline-none focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 transition-all"
                    />
                  </div>

                  {validQty > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 border-dashed rounded-lg p-3.5 md:p-4 text-sm text-gray-600 leading-relaxed mb-4">
                      <strong className="text-zinc-950 block mb-1">
                        Rincian Harga Satuan
                      </strong>
                      Harga Dasar: {formatRupiah(hargaPreview.dasar)}
                      {hargaPreview.lengan > 0 && (
                        <>
                          <br />
                          Tambahan Lengan: +{formatRupiah(hargaPreview.lengan)}
                        </>
                      )}
                      {hargaPreview.size > 0 && (
                        <>
                          <br />
                          Tambahan Ukuran: +{formatRupiah(hargaPreview.size)}
                        </>
                      )}
                      <hr className="border-indigo-200 my-2" />
                      Harga Satuan:{" "}
                      <strong className="text-zinc-950">
                        {formatRupiah(hargaPreview.final)}
                      </strong>
                      <br />
                      <span className="text-blue-700 font-extrabold text-[15px] mt-1 block">
                        Total ({validQty} pcs):{" "}
                        {formatRupiah(hargaPreview.final * validQty)}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={addToCart}
                    className="w-full bg-zinc-950 text-white py-3 rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:opacity-85 transition-opacity"
                  >
                    <Plus size={16} />
                    Tambahkan ke Pesanan
                  </button>
                </div>
              )}
            </div>

            {/* CARD 3: Keranjang */}
            <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-5 md:p-7 mb-4">
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-4 flex items-center gap-2">
                <ShoppingBag size={14} /> Daftar Pesanan Anda
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
                  Belum ada barang yang ditambahkan.
                </div>
              ) : (
                <div>
                  {cart.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3.5 mb-2.5 bg-stone-50 relative group"
                    >
                      <button
                        onClick={() => removeFromCart(index)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                      <div className="font-bold text-[15px] text-zinc-950 mb-1 pr-10">
                        {item.product.name}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {item.ukuran !== "-" && (
                          <span className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                            {item.ukuran}
                          </span>
                        )}
                        {item.lengan !== "-" && (
                          <span className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                            {item.lengan}
                          </span>
                        )}
                        {item.warna !== "-" && (
                          <span className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                            {item.warna}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.qty} pcs × {formatRupiah(item.harga_satuan)} ={" "}
                        <strong className="text-blue-700">
                          {formatRupiah(item.subtotal)}
                        </strong>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
                    <span className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">
                      Total Bayar
                    </span>
                    <span className="text-xl font-extrabold text-green-600">
                      {formatRupiah(grandTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={submitOrderHandler}
              disabled={submitting || cart.length === 0}
              className="w-full bg-zinc-950 text-white py-3.5 rounded-lg text-[15px] font-extrabold flex justify-center items-center gap-2 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Proses Semua Pesanan
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
