// app/po/reseller/portal/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPOSetting, getPOProducts, submitOrder } from "@/lib/po/supabase";
import { POSetting, POProduct, POReseller, CartItem } from "@/types/po";
import { calculateItemPrice, formatRupiah } from "@/lib/po/pricing";

export default function ResellerPortalPage() {
  const router = useRouter();

  const [reseller, setReseller] = useState<POReseller | null>(null);
  const [setting, setSetting] = useState<POSetting | null>(null);
  const [products, setProducts] = useState<POProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProductIdx, setSelectedProductIdx] = useState<number>(-1);
  const [matrixData, setMatrixData] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catatan, setCatatan] = useState("");

  const [poNumber, setPoNumber] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("po_reseller");
    if (!stored) {
      router.replace("/po/reseller");
      return;
    }
    setReseller(JSON.parse(stored));

    async function load() {
      const [s, p] = await Promise.all([getPOSetting(), getPOProducts()]);
      setSetting(s);
      setProducts(p);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center text-[13.5px] font-semibold text-[#4b5563]">
        Memuat Portal...
      </div>
    );
  }

  if (!setting?.is_active) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center p-4">
        <div className="bg-white border border-[#e5e7eb] rounded-[12px] p-8 text-center max-w-sm w-full">
          <h2 className="text-[18px] font-bold text-[#0e0e0e] mb-2">
            PO Sedang Tutup
          </h2>
          <p className="text-[13px] text-[#9ca3af]">
            Pemesanan tidak dapat dilakukan saat ini.
          </p>
        </div>
      </div>
    );
  }

  const selectedProduct =
    selectedProductIdx >= 0 ? products[selectedProductIdx] : null;

  function buildVarianList(p: POProduct) {
    const varianList: Array<{ kode: string; warna: string; lengan: string }> =
      [];
    let idx = 1;
    p.colors.forEach((w) => {
      p.sleeve_types.forEach((l) => {
        varianList.push({
          kode: `V-${String(idx).padStart(2, "0")}`,
          warna: w,
          lengan: l,
        });
        idx++;
      });
    });
    return varianList;
  }

  function hitungSubtotalBaris(vi: number): { total: number; pcs: number } {
    if (!selectedProduct) return { total: 0, pcs: 0 };
    const pricingSettings = {
      sleeveSurcharge: setting!.sleeve_surcharge,
      xxlSurcharge: setting!.xxl_surcharge,
    };
    const varianList = buildVarianList(selectedProduct);
    const v = varianList[vi];
    let totalRp = 0,
      totalPcs = 0;

    selectedProduct.available_sizes.forEach((ukuran, ui) => {
      const qty = matrixData[`${vi}_${ui}`] ?? 0;
      if (qty > 0) {
        // Hapus 'qty' dan ganti dengan 'selectedProduct'
        const harga = calculateItemPrice(
          selectedProduct.base_price,
          ukuran,
          v.lengan,
          selectedProduct, // <--- Argumen ke-4: Data produk
          pricingSettings, // <--- Argumen ke-5: Setting harga
        );
        totalRp += harga * qty;
        totalPcs += qty;
      }
    });
    return { total: totalRp, pcs: totalPcs };
  }

  function hitungGrandSubtotal() {
    if (!selectedProduct) return { total: 0, pcs: 0 };
    const varianList = buildVarianList(selectedProduct);
    let totalRp = 0,
      totalPcs = 0;
    varianList.forEach((_, vi) => {
      const row = hitungSubtotalBaris(vi);
      totalRp += row.total;
      totalPcs += row.pcs;
    });
    return { total: totalRp, pcs: totalPcs };
  }

  function tambahKeKeranjang() {
    if (!selectedProduct) return;
    const pricingSettings = {
      sleeveSurcharge: setting!.sleeve_surcharge,
      xxlSurcharge: setting!.xxl_surcharge,
    };
    const varianList = buildVarianList(selectedProduct);
    const newItems: CartItem[] = [];

    varianList.forEach((v, vi) => {
      selectedProduct.available_sizes.forEach((ukuran, ui) => {
        const qty = matrixData[`${vi}_${ui}`] ?? 0;
        if (qty > 0) {
          const harga = calculateItemPrice(
            selectedProduct.base_price,
            ukuran,
            v.lengan,
            selectedProduct, // <--- Pastikan di sini tertulis selectedProduct, BUKAN qty
            pricingSettings,
          );
          newItems.push({
            cart_id: crypto.randomUUID(),
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            warna: v.warna,
            lengan: v.lengan,
            ukuran,
            qty,
            harga_satuan: harga,
            subtotal: harga * qty,
          });
        }
      });
    });

    if (newItems.length === 0) {
      alert("Isi QTY minimal satu sel.");
      return;
    }
    setCart([...cart, ...newItems]);
    setSelectedProductIdx(-1);
    setMatrixData({});
  }

  async function handleSubmit() {
    if (cart.length === 0) {
      alert("Keranjang kosong.");
      return;
    }
    if (!reseller) return;
    setSubmitting(true);

    const result = await submitOrder(
      {
        customer_type: "RESELLER",
        reseller_id: reseller.id,
        customer_name: reseller.nama,
        customer_wa: reseller.wa ?? "",
        delivery_method: "Dikirim",
        notes: catatan,
        order_items: cart,
      },
      setting!,
      products,
    );

    if (!result.success) {
      alert("Gagal memproses pesanan: " + result.error);
      setSubmitting(false);
      return;
    }

    const grandTotal = cart.reduce((s, i) => s + i.subtotal, 0);
    const daftarBarang = cart
      .map(
        (item, i) =>
          `${i + 1}. ${item.product_name} (${item.warna}, ${item.lengan}, ${item.ukuran}) — ${item.qty} pcs = ${formatRupiah(item.subtotal)}`,
      )
      .join("\n");

    const waText = [
      `Halo Admin, konfirmasi pesanan reseller.`,
      ``,
      `*Kode PO:* ${result.po_number}`,
      `*Reseller:* ${reseller.nama} (${reseller.kode})`,
      catatan ? `*Catatan:* ${catatan}` : "",
      ``,
      `*Pesanan:*`,
      daftarBarang,
      ``,
      `*Total: ${formatRupiah(grandTotal)}*`,
    ]
      .filter(Boolean)
      .join("\n");

    const phone = setting!.wa_admin_phone?.replace(/\D/g, "") || "";
    setWaUrl(`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`);
    setPoNumber(result.po_number!);
    setSubmitting(false);
  }

  const varianList = selectedProduct ? buildVarianList(selectedProduct) : [];
  const grandSubtot = hitungGrandSubtotal();
  const cartTotal = cart.reduce((s, i) => s + i.subtotal, 0);

  function handleLogout() {
    if (!confirm("Yakin ingin keluar? Keranjang belum dikirim akan hilang."))
      return;
    sessionStorage.removeItem("po_reseller");
    router.push("/po/reseller");
  }

  // ── SUKSES STATE ──
  if (poNumber) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] text-[#0e0e0e] font-sans">
        <div className="bg-[#0e0e0e] text-white py-[40px] px-4 md:px-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,_#064e3b_0%,_transparent_60%)] pointer-events-none"></div>
          <div className="relative z-10 max-w-[500px] mx-auto">
            <h2 className="text-[21px] md:text-[28px] font-extrabold tracking-tight mb-1.5">
              Pesanan Reseller Tersimpan!
            </h2>
            <p className="text-[13.6px] text-white/55">
              Simpan kode PO dan konfirmasi ke admin via WhatsApp.
            </p>
          </div>
        </div>

        <div className="max-w-[500px] mx-auto py-[24px] px-4 md:px-8">
          <div className="bg-white border border-[#e5e7eb] rounded-[12px] p-5 text-center mb-3.5">
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] mb-2.5">
              Kode PO Reseller Anda
            </div>
            <div className="text-[28px] font-extrabold tracking-[0.06em] text-[#0e0e0e] mb-3.5 font-mono">
              {poNumber}
            </div>
          </div>

          <div className="flex items-start gap-[9px] bg-[#fffbeb] border border-[#fde68a] rounded-[8px] p-[11px_14px] text-[12.8px] font-semibold text-[#92400e] mb-3.5">
            Simpan kode ini dan sertakan saat konfirmasi pembayaran ke admin.
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-white py-2.5 rounded-[8px] text-[13.6px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-2.5 decoration-transparent"
          >
            Konfirmasi via WhatsApp
          </a>

          <button
            onClick={() => {
              setPoNumber(null);
              setCart([]);
              setCatatan("");
              setMatrixData({});
            }}
            className="w-full bg-transparent border border-[#e5e7eb] text-[#4b5563] py-2 rounded-[8px] text-[12.8px] font-semibold hover:border-[#d1d5db] hover:text-[#0e0e0e] transition-colors"
          >
            Buat Pesanan Baru
          </button>
        </div>
      </div>
    );
  }

  // ── PORTAL STATE ──
  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#0e0e0e] font-sans pb-[40px]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e7eb] px-4 md:px-12 h-[58px] flex items-center justify-between sticky top-0 z-50">
        <div className="text-[15px] font-extrabold tracking-tight flex items-center gap-2">
          Portal Reseller
        </div>
        <div className="flex items-center gap-[10px]">
          <div className="hidden md:flex items-center gap-1.5 px-[12px] py-[5px] bg-[#f5f5f4] border border-[#e5e7eb] rounded-full text-[12.5px] font-bold text-[#4b5563]">
            {reseller?.nama} ({reseller?.kode})
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-[14px] py-[5px] bg-transparent border border-[#e5e7eb] rounded-full text-[12.5px] font-semibold text-[#9ca3af] hover:border-[#d1d5db] hover:text-[#0e0e0e] transition-colors"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Hero Mini */}
      <div className="bg-[#0e0e0e] text-white px-4 py-7 md:py-11 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,_#1f2937_0%,_transparent_55%)] pointer-events-none"></div>
        <div className="relative z-10 max-w-[600px] mx-auto md:mx-0">
          <div className="inline-flex items-center gap-[7px] text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></div>
            Portal Reseller Aktif
          </div>
          <h1 className="text-[21px] md:text-[28px] font-extrabold tracking-tight leading-tight mb-[6px]">
            Input <em className="not-italic text-white/40">pesanan</em> Anda
          </h1>
          <p className="text-[13.6px] text-white/55">
            Pilih produk, isi qty per kode varian, lalu tambahkan ke keranjang.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-[1200px] mx-auto p-[20px] md:py-[36px] md:px-[48px] grid grid-cols-1 md:grid-cols-[300px_1fr] gap-[20px] items-start">
        {/* KOLOM KIRI */}
        <div className="flex flex-col gap-[16px]">
          {/* Info Reseller */}
          <div className="bg-white border border-[#e5e7eb] rounded-[12px] overflow-hidden">
            <div className="p-[14px] md:p-[20px]">
              <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] mb-[14px]">
                Info Reseller
              </div>
              <div className="flex items-center gap-[10px]">
                <div className="w-[36px] h-[36px] rounded-full bg-[#e1f5ee] flex items-center justify-center text-[#085041] font-bold text-[14px]">
                  {reseller?.nama.charAt(0)}
                </div>
                <div>
                  <p className="text-[14.4px] font-bold m-0 leading-tight">
                    {reseller?.nama}
                  </p>
                  <p className="text-[11.8px] text-[#9ca3af] m-0">
                    {reseller?.kode}
                  </p>
                </div>
                <span className="ml-auto bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] px-[9px] py-[2px] rounded-full text-[11.5px] font-semibold">
                  Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Catatan Pengiriman */}
          <div className="bg-white border border-[#e5e7eb] rounded-[12px] overflow-hidden">
            <div className="p-[14px] md:p-[20px]">
              <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] mb-[14px]">
                Catatan Pengiriman
              </div>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                placeholder="Opsional: alamat atau instruksi khusus..."
                className="w-full px-[12px] py-[9px] border border-[#e5e7eb] rounded-[8px] text-[13.6px] text-[#0e0e0e] outline-none focus:border-[#0e0e0e] focus:shadow-[0_0_0_3px_rgba(14,14,14,0.07)] transition-all resize-none bg-white"
              ></textarea>
            </div>
          </div>

          {/* Keranjang Pesanan */}
          <div className="bg-white border border-[#e5e7eb] rounded-[12px] overflow-hidden">
            <div className="p-[14px] md:p-[20px]">
              <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] mb-[14px]">
                Keranjang Pesanan
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-[24px] px-[16px] text-[#9ca3af] text-[13.4px]">
                  Belum ada item. Tambahkan dari panel kanan.
                </div>
              ) : (
                <div>
                  {cart.map((item) => (
                    <div
                      key={item.cart_id}
                      className="py-[12px] border-b border-[#e5e7eb] relative last:border-0"
                    >
                      <div className="text-[14px] font-bold text-[#0e0e0e] mb-[3px] pr-[30px]">
                        {item.product_name}
                      </div>
                      <div className="text-[11.8px] text-[#9ca3af] mb-[4px]">
                        <span className="font-semibold text-[#4b5563]">
                          {item.warna}
                        </span>{" "}
                        · {item.lengan} · {item.ukuran}
                      </div>
                      <div className="text-[13px] text-[#4b5563]">
                        {item.qty} pcs ={" "}
                        <strong className="text-[#185fa5]">
                          {formatRupiah(item.subtotal)}
                        </strong>
                      </div>
                      <button
                        onClick={() =>
                          setCart(
                            cart.filter((c) => c.cart_id !== item.cart_id),
                          )
                        }
                        className="absolute top-[12px] right-0 w-[26px] h-[26px] rounded-full border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:border-[#fca5a5] hover:text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-[12px] mt-[8px] border-t border-[#e5e7eb]">
                    <span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-[0.06em]">
                      Total Bayar
                    </span>
                    <span className="text-[17.6px] font-extrabold text-[#15803d]">
                      {formatRupiah(cartTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0}
            className="w-full bg-[#0e0e0e] text-white py-[13px] px-[20px] rounded-[8px] text-[14.4px] font-bold flex justify-center items-center gap-2 hover:opacity-82 transition-opacity disabled:opacity-40"
          >
            {submitting ? "Memproses..." : "Kirim Semua Pesanan"}
          </button>
        </div>

        {/* KOLOM KANAN */}
        <div className="flex flex-col gap-[16px]">
          {/* Picker Produk */}
          <div className="bg-white border border-[#e5e7eb] rounded-[12px] overflow-hidden">
            <div className="p-[14px] md:p-[20px]">
              <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] mb-[14px]">
                Pilih Produk
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-[#0e0e0e] mb-[5px]">
                  Produk
                </label>
                <select
                  value={selectedProductIdx}
                  onChange={(e) => {
                    setSelectedProductIdx(Number(e.target.value));
                    setMatrixData({});
                  }}
                  className="w-full px-[12px] py-[9px] border border-[#e5e7eb] rounded-[8px] text-[13.6px] text-[#0e0e0e] bg-white outline-none focus:border-[#0e0e0e] focus:shadow-[0_0_0_3px_rgba(14,14,14,0.07)] transition-all cursor-pointer"
                >
                  <option value={-1}>-- Pilih produk --</option>
                  {products.map((p, i) => (
                    <option key={p.id} value={i}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabel Varian */}
          {selectedProduct && varianList.length > 0 && (
            <div className="bg-white border border-[#e5e7eb] rounded-[12px] overflow-hidden">
              <div className="p-[14px] md:p-[20px] pb-0 border-b border-[#e5e7eb]">
                <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] mb-[14px]">
                  Input QTY per Kode Varian
                </div>

                <div className="flex items-start gap-[9px] bg-[#e6f1fb] border border-[#85b7eb] rounded-[8px] p-[11px_14px] text-[13.1px] font-semibold text-[#185fa5] leading-snug mb-[14px]">
                  Setiap baris = 1 kombinasi Warna + Lengan. Isi QTY pada kolom
                  ukuran. Biarkan 0 jika tidak dipesan.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13.1px]">
                  <thead>
                    <tr>
                      <th className="px-[12px] py-[8px] text-left text-[11px] font-bold tracking-[0.05em] uppercase text-[#9ca3af] bg-[#f5f5f4] border-b border-[#e5e7eb] whitespace-nowrap min-w-[100px]">
                        Kode Varian
                      </th>
                      {selectedProduct.available_sizes.map((u) => (
                        <th
                          key={u}
                          className="px-[6px] py-[8px] text-center text-[11px] font-bold tracking-[0.05em] uppercase text-[#9ca3af] bg-[#f5f5f4] border-b border-[#e5e7eb]"
                        >
                          {u}
                        </th>
                      ))}
                      <th className="px-[6px] py-[8px] text-center text-[11px] font-bold tracking-[0.05em] uppercase text-[#9ca3af] bg-[#f5f5f4] border-b border-[#e5e7eb] min-w-[90px]">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {varianList.map((v, vi) => {
                      const rowSub = hitungSubtotalBaris(vi);
                      const isPanjang = v.lengan
                        .toLowerCase()
                        .includes("panjang");
                      const chipColor = isPanjang
                        ? "bg-[#faeeda] text-[#633806] border-[#ef9f27]"
                        : "bg-[#e6f1fb] text-[#185fa5] border-[#85b7eb]";

                      return (
                        <tr key={vi} className="even:bg-[#f5f5f4]">
                          <td className="px-[12px] py-[6px] border-b border-[#e5e7eb] align-middle text-left">
                            <span className="inline-flex items-center px-[8px] py-[2px] bg-[#f5f5f4] text-[#4b5563] border border-[#e5e7eb] rounded-[6px] text-[11.2px] font-bold font-mono tracking-[0.04em]">
                              {v.kode}
                            </span>
                            <br />
                            <span className="text-[11.5px] font-semibold text-[#4b5563]">
                              {v.warna}
                            </span>{" "}
                            <span
                              className={`inline-flex items-center px-[6px] py-[1px] border rounded-full text-[10.4px] font-semibold ${chipColor}`}
                            >
                              {v.lengan}
                            </span>
                          </td>
                          {selectedProduct.available_sizes.map((_, ui) => {
                            const val = matrixData[`${vi}_${ui}`] || "";
                            const hasVal = Number(val) > 0;
                            return (
                              <td
                                key={ui}
                                className="px-[4px] py-[6px] border-b border-[#e5e7eb] align-middle text-center"
                              >
                                <input
                                  type="number"
                                  min="0"
                                  value={val}
                                  onChange={(e) => {
                                    const parsed = Math.max(
                                      0,
                                      Number(e.target.value),
                                    );
                                    setMatrixData({
                                      ...matrixData,
                                      [`${vi}_${ui}`]: parsed,
                                    });
                                  }}
                                  className={`w-[52px] text-center border rounded-[6px] py-[5px] px-[2px] text-[13.6px] font-semibold outline-none focus:border-[#0e0e0e] focus:shadow-[0_0_0_2px_rgba(14,14,14,0.07)] transition-all ${hasVal ? "bg-[#e6f1fb] border-[#85b7eb] text-[#185fa5]" : "bg-white border-[#e5e7eb] text-[#0e0e0e]"}`}
                                />
                              </td>
                            );
                          })}
                          <td className="px-[4px] py-[6px] border-b border-[#e5e7eb] align-middle text-center">
                            {rowSub.pcs > 0 ? (
                              <>
                                <div className="text-[13.6px]">
                                  {rowSub.pcs} pcs
                                </div>
                                <div className="text-[11.5px] font-bold text-[#185fa5] whitespace-nowrap">
                                  {formatRupiah(rowSub.total)}
                                </div>
                              </>
                            ) : (
                              <span className="text-[12.8px] font-bold text-[#185fa5]">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Tabel Varian */}
              <div className="p-[12px_14px] border-t border-[#e5e7eb] bg-white flex flex-wrap items-center justify-between gap-[12px]">
                <div className="text-[13.1px] text-[#4b5563] flex items-baseline gap-[8px]">
                  <span>Subtotal:</span>
                  <strong className="text-[16px] text-[#185fa5]">
                    {formatRupiah(grandSubtot.total)}
                  </strong>
                  <span className="text-[12px] text-[#9ca3af]">
                    {grandSubtot.pcs} pcs
                  </span>
                </div>
                <div className="flex gap-[8px]">
                  <button
                    onClick={() => setMatrixData({})}
                    className="bg-transparent border border-[#e5e7eb] text-[#4b5563] px-[14px] py-[10px] rounded-[8px] text-[13.6px] font-semibold hover:border-[#d1d5db] hover:text-[#0e0e0e] transition-colors flex items-center gap-[6px]"
                  >
                    Reset
                  </button>
                  <button
                    onClick={tambahKeKeranjang}
                    className="bg-[#0e0e0e] text-white px-[18px] py-[10px] rounded-[8px] text-[13.6px] font-bold hover:opacity-82 transition-opacity flex items-center justify-center gap-[7px]"
                  >
                    Tambah ke Keranjang
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
