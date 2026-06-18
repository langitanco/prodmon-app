"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPOSettingAdmin, getAllPOProducts } from "@/lib/po/admin";
import { formatRupiah } from "@/lib/po/pricing";
import { POSetting, POProduct } from "@/types/po";
import {
  Package,
  CalendarDays,
  Users,
  ArrowRight,
  LayoutGrid,
  Pencil,
  CheckCircle2,
  XCircle,
  Clock,
  Shirt,
  Camera,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export default function CatalogPage() {
  const params = useParams();
  const slug = params?.slug as string;

  // Helper: tambahkan slug sebagai query param ke link tujuan
  const withSlug = (path: string) => (slug ? `${path}?slug=${slug}` : path);

  const [setting, setSetting] = useState<POSetting | null>(null);
  const [products, setProducts] = useState<POProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<POProduct | null>(
    null,
  );
  const [imageIndex, setImageIndex] = useState(0);

  // Swipe states for mobile modal
  const [touchStart, setTouchStart] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const set = await getPOSettingAdmin();
      const prods = await getAllPOProducts();

      setSetting(set);
      setProducts(prods.filter((p) => p.is_active));
      setLoading(false);
    }
    loadData();
  }, []);

  // Keyboard navigation for Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedProduct) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProduct, imageIndex]);

  const isActive = setting?.is_active ?? false;
  const brandName = setting?.title || "Katalog PO";
  const periode = `${setting?.periode_mulai || "-"} — ${setting?.periode_selesai || "-"}`;

  /* ── Modal Handlers ── */
  const openModal = (product: POProduct) => {
    setSelectedProduct(product);
    setImageIndex(0);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedProduct(null);
    document.body.style.overflow = "";
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedProduct || selectedProduct.image_urls.length <= 1) return;
    setImageIndex((prev) => (prev + 1) % selectedProduct.image_urls.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedProduct || selectedProduct.image_urls.length <= 1) return;
    setImageIndex((prev) =>
      prev === 0 ? selectedProduct.image_urls.length - 1 : prev - 1,
    );
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 45) nextImage();
    if (diff < -45) prevImage();
  };

  return (
    <div className="min-h-screen bg-stone-100 text-zinc-950 font-sans selection:bg-zinc-200">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 md:px-10 lg:px-16 h-[60px] flex items-center justify-between">
        <div className="text-base font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
          <Package size={18} />
          <span>{brandName}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
            <CalendarDays size={14} />
            {periode}
          </span>
          <Link
            href={withSlug("/po/reseller")}
            className="hidden sm:flex items-center gap-1.5 bg-transparent text-zinc-950 border border-gray-300 px-4 py-2 rounded-full text-xs font-bold hover:bg-stone-100 hover:border-zinc-950 transition-all"
          >
            <Users size={14} />
            Reseller
          </Link>
          {isActive ? (
            <Link
              href={withSlug("/po/order")}
              className="flex items-center gap-1.5 bg-zinc-950 text-white px-4 py-2 rounded-full text-xs font-bold hover:opacity-80 transition-opacity"
            >
              <ArrowRight size={14} />
              <span className="hidden sm:inline">Buka Form Pemesanan</span>
              <span className="sm:hidden">Pesan</span>
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 bg-zinc-300 text-zinc-500 px-4 py-2 rounded-full text-xs font-bold cursor-not-allowed"
            >
              <ArrowRight size={14} />
              PO Ditutup
            </button>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-zinc-950 text-white px-5 md:px-10 lg:px-16 py-16 md:py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            backgroundImage:
              "radial-gradient(circle at 72% 30%, #1f2937 0%, transparent 52%), radial-gradient(circle at 20% 80%, #111827 0%, transparent 45%)",
          }}
        />

        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-white/55 mb-5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span>{isActive ? "Pre-Order Aktif" : "PO Ditutup"}</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-5">
            Temukan produk <em className="not-italic text-white/40">favorit</em>{" "}
            kamu di sini
          </h1>

          <p className="text-sm md:text-base text-white/60 max-w-md mb-9 leading-relaxed">
            Periode PO: {periode}. Pilih produk, lihat detail dan foto lengkap,
            lalu lanjut ke form pemesanan.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                document
                  .getElementById("sec-catalog")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-2 bg-white text-zinc-950 px-6 py-3 rounded-full font-extrabold text-sm hover:opacity-90 hover:-translate-y-[1px] transition-all"
            >
              <LayoutGrid size={16} />
              Lihat Katalog
            </button>
            {isActive && (
              <Link
                href={withSlug("/po/order")}
                className="inline-flex items-center gap-2 bg-transparent border border-white/25 text-white/85 px-6 py-3 rounded-full font-bold text-sm hover:border-white/55 hover:text-white transition-all"
              >
                <Pencil size={16} />
                Buka Form Pemesanan
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── KATALOG ── */}
      <section
        id="sec-catalog"
        className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 py-12 md:py-16 scroll-mt-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Katalog Produk
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Klik produk untuk melihat detail, foto, dan varian lengkap.
            </p>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-200/50 px-3 py-1 rounded-full">
            {products.length} produk
          </span>
        </div>

        {/* Status Banner */}
        {!loading && (
          <div className="mb-8">
            {isActive ? (
              <div className="flex items-start gap-2.5 p-3.5 md:px-5 md:py-3.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-semibold break-words">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <span>
                  PO sedang <strong className="font-extrabold">AKTIF</strong> —
                  Silakan lakukan pemesanan sekarang.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3.5 md:px-5 md:py-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold break-words">
                <XCircle size={18} className="shrink-0 mt-0.5" />
                <span>
                  PO sedang <strong className="font-extrabold">TUTUP</strong> —
                  Pemesanan tidak tersedia saat ini.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Grid Area */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {loading ? (
            <div className="col-span-full text-center py-16 text-gray-400 text-sm">
              <div className="w-8 h-8 border-[3px] border-gray-200 border-t-zinc-950 rounded-full animate-spin mx-auto mb-3" />
              <p>Memuat produk...</p>
            </div>
          ) : !isActive && products.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400 text-sm">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p>Pemesanan sedang ditutup.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400 text-sm">
              <Package size={32} className="mx-auto mb-3 opacity-50" />
              <p>Belum ada produk aktif di katalog.</p>
            </div>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                onClick={() => openModal(p)}
                className="bg-white border border-gray-200 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-all duration-200 hover:border-gray-300 hover:-translate-y-1 group"
              >
                {/* Thumbnail */}
                <div className="w-full aspect-[4/3] bg-slate-100 relative overflow-hidden shrink-0">
                  {p.image_urls[0] ? (
                    <img
                      src={p.image_urls[0]}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Shirt size={36} />
                    </div>
                  )}
                  {p.image_urls.length > 1 && (
                    <div className="absolute bottom-2.5 right-2.5 bg-black/50 text-white text-[10px] md:text-xs font-bold px-2 md:px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                      <Camera size={12} />
                      {p.image_urls.length}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-3.5 md:p-4 flex-1 flex flex-col">
                  <h3 className="text-sm md:text-[15px] font-bold leading-snug text-zinc-950">
                    {p.name}
                  </h3>
                  <p className="text-[15px] md:text-base font-extrabold text-zinc-950 mt-0.5">
                    {formatRupiah(p.base_price)}
                  </p>
                  {p.description && (
                    <p className="text-xs text-gray-400 leading-relaxed mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  {/* CTA Footer Card */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] md:text-xs font-bold text-gray-500 flex items-center gap-1">
                      <Eye size={13} /> Detail
                    </span>
                    <div className="flex gap-1 overflow-hidden">
                      {p.available_sizes.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] md:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 border border-gray-200 text-gray-400 whitespace-nowrap"
                        >
                          {s}
                        </span>
                      ))}
                      {p.available_sizes.length > 3 && (
                        <span className="text-[10px] md:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 border border-gray-200 text-gray-400">
                          +{p.available_sizes.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="bg-zinc-950 text-white px-5 md:px-10 lg:px-16 py-14 md:py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2.5">
          Siap untuk memesan?
        </h2>
        <p className="text-sm text-white/55 mb-7 max-w-md mx-auto">
          Isi form pemesanan sekarang sebelum periode PO berakhir.
        </p>
        {isActive ? (
          <Link
            href={withSlug("/po/order")}
            className="inline-flex items-center gap-2 bg-white text-zinc-950 px-8 py-3.5 rounded-full font-extrabold text-sm hover:opacity-90 transition-opacity"
          >
            <ArrowRight size={16} />
            Buka Form Pemesanan
          </Link>
        ) : (
          <button
            disabled
            className="inline-flex items-center gap-2 bg-zinc-800 text-zinc-500 px-8 py-3.5 rounded-full font-extrabold text-sm cursor-not-allowed"
          >
            Pemesanan Ditutup
          </button>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-200 text-center px-5 py-6 text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Katalog PO — Langitan.co</p>
      </footer>

      {/* ── MODAL DETAIL ── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-3 sm:p-5 backdrop-blur-sm transition-opacity"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col sm:flex-row shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Slider Side */}
            <div
              className="w-full sm:flex-[1.2] bg-slate-100 relative overflow-hidden flex items-center justify-center aspect-[4/3] sm:aspect-auto sm:min-h-[360px] select-none"
              onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={selectedProduct.image_urls[imageIndex] || ""}
                alt={selectedProduct.name}
                className="w-full h-full object-cover animate-in fade-in duration-300"
                key={imageIndex}
              />

              {selectedProduct.image_urls.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors z-10"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors z-10"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {selectedProduct.image_urls.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImageIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === imageIndex
                            ? "bg-white scale-150"
                            : "bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={closeModal}
                className="sm:hidden absolute top-3 right-3 bg-white/90 text-zinc-950 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info Side */}
            <div className="flex-1 flex flex-col p-4 sm:p-7 overflow-y-auto">
              <div className="hidden sm:flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
                  Pre-Order
                </span>
                <button
                  onClick={closeModal}
                  className="bg-stone-100 hover:bg-stone-200 text-zinc-950 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <h2 className="text-[17px] sm:text-2xl font-extrabold leading-tight text-zinc-950 mb-1 sm:mb-2">
                {selectedProduct.name}
              </h2>
              <p className="text-[17px] sm:text-xl font-extrabold text-zinc-950 pb-3 sm:pb-5 border-b border-gray-200 mb-3 sm:mb-5">
                {formatRupiah(selectedProduct.base_price)}
              </p>

              <div className="hidden sm:block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-3">
                Spesifikasi
              </div>

              <div className="flex flex-col gap-1 sm:gap-0 sm:mb-6">
                <div className="flex sm:items-start gap-3 py-1 sm:py-2.5 sm:border-b sm:border-gray-100 text-[13px] sm:text-sm">
                  <span className="text-gray-400 font-medium w-16 sm:w-24 shrink-0">
                    Ukuran
                  </span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {selectedProduct.available_sizes.length > 0
                      ? selectedProduct.available_sizes.map((s) => (
                          <span
                            key={s}
                            className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-stone-100 border border-gray-200 text-gray-500"
                          >
                            {s}
                          </span>
                        ))
                      : "-"}
                  </div>
                </div>

                <div className="flex sm:items-start gap-3 py-1 sm:py-2.5 sm:border-b sm:border-gray-100 text-[13px] sm:text-sm">
                  <span className="text-gray-400 font-medium w-16 sm:w-24 shrink-0">
                    Warna
                  </span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {selectedProduct.colors.length > 0
                      ? selectedProduct.colors.map((w) => (
                          <span
                            key={w}
                            className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-stone-100 border border-gray-200 text-gray-500"
                          >
                            {w}
                          </span>
                        ))
                      : "-"}
                  </div>
                </div>

                <div className="flex sm:items-start gap-3 py-1 sm:py-2.5 sm:border-b sm:border-gray-100 text-[13px] sm:text-sm">
                  <span className="text-gray-400 font-medium w-16 sm:w-24 shrink-0">
                    Lengan
                  </span>
                  <span className="font-semibold text-zinc-950">
                    {selectedProduct.sleeve_types.length > 0
                      ? selectedProduct.sleeve_types.join(", ")
                      : "-"}
                  </span>
                </div>
              </div>

              {selectedProduct.description && (
                <p className="hidden sm:block text-sm text-gray-500 leading-relaxed mb-6 mt-1">
                  {selectedProduct.description}
                </p>
              )}

              {/* Order Button in Modal */}
              <div className="mt-4 sm:mt-auto pt-2">
                {isActive ? (
                  <Link
                    href={withSlug("/po/order")}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-950 text-white px-5 py-3 sm:py-3.5 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity"
                  >
                    <Pencil size={16} />
                    Isi Form Pemesanan
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 bg-zinc-200 text-zinc-400 px-5 py-3 sm:py-3.5 rounded-xl font-bold text-sm cursor-not-allowed"
                  >
                    PO Ditutup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
