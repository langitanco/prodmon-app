"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAllPOOrders,
  getAllPOProducts,
  getPOSettingAdmin,
} from "@/lib/po/admin";
import { POOrder, POProduct, POSetting } from "@/types/po";
import {
  RefreshCw,
  ClipboardList,
  Download,
  AlertTriangle,
  ShoppingBag,
  Shirt,
  Baby,
  Snowflake,
} from "lucide-react";

/* ── Tipe bantu untuk hasil rekap ── */
type RekapRow = {
  jenis: string; // Warna + Lengan, mis. "Hitam Pendek"
  perUkuran: Record<string, number>; // { S: 1, M: 0, L: 5, ... }
  jumlah: number;
  isExtra: boolean; // true jika kombinasi tidak terdaftar di master produk
};

type RekapProduk = {
  product_id: string;
  product_code: string;
  product_name: string;
  ukuranList: string[]; // urutan kolom, dari available_sizes produk
  rows: RekapRow[];
  totalPerUkuran: Record<string, number>;
  totalJumlah: number;
};

// Tambahkan ini di PORekapList.tsx
interface PORekapListProps {
  poId: string;
}
export default function PORekapList({ poId }: PORekapListProps) {
  const [orders, setOrders] = useState<POOrder[]>([]);
  const [products, setProducts] = useState<POProduct[]>([]);
  const [setting, setSetting] = useState<POSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    load();
  }, [poId]);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const [ordersData, productsData, settingData] = await Promise.all([
      getAllPOOrders(poId),
      getAllPOProducts(poId),
      getPOSettingAdmin(poId),
    ]);
    setOrders(ordersData);
    setProducts(productsData);
    setSetting(settingData);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }

  /* ── Olah data pesanan menjadi rekap per produk ── */
  const rekapList: RekapProduk[] = useMemo(() => {
    if (products.length === 0) return [];

    // Map product_id -> produk master, untuk lookup cepat
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Kumpulkan total qty per (product_id, jenis/Warna+Lengan, ukuran)
    // key: `${product_id}::${jenis}::${ukuran}`
    const qtyMap = new Map<string, number>();
    // Catat product_id mana saja yang punya minimal 1 item pesanan
    const productIdsWithOrders = new Set<string>();

    orders.forEach((order) => {
      order.order_items.forEach((item) => {
        productIdsWithOrders.add(item.product_id);
        const jenis = [item.lengan, item.warna]
          .filter(Boolean)
          .join(" ")
          .trim();
        // Format: "Warna Lengan" sesuai contoh ("Hitam Pendek")
        const jenisLabel = `${item.warna} ${item.lengan}`.trim() || "-";
        const key = `${item.product_id}::${jenisLabel}::${item.ukuran}`;
        qtyMap.set(key, (qtyMap.get(key) || 0) + item.qty);
      });
    });

    const result: RekapProduk[] = [];

    productIdsWithOrders.forEach((productId) => {
      const master = productMap.get(productId);

      // Nama & kode produk: fallback ke data dari order_items jika produk sudah dihapus dari master
      const fallbackItem = orders
        .flatMap((o) => o.order_items)
        .find((i) => i.product_id === productId);

      const productCode = master?.product_code || "—";
      const productName =
        master?.name || fallbackItem?.product_name || "Produk Tidak Dikenal";

      // Daftar ukuran: pakai urutan dari master produk jika ada
      const masterUkuran = master?.available_sizes || [];

      // Daftar kombinasi Warna x Lengan resmi dari master produk
      const masterColors = master?.colors || [];
      const masterSleeves = master?.sleeve_types || [];
      const masterJenisList: string[] = [];
      masterColors.forEach((warna) => {
        masterSleeves.forEach((lengan) => {
          masterJenisList.push(`${warna} ${lengan}`.trim());
        });
      });
      // Jika produk tidak punya sleeve_types (misal produk tanpa varian lengan)
      if (masterSleeves.length === 0) {
        masterColors.forEach((warna) => masterJenisList.push(warna));
      }

      // Temukan semua kombinasi jenis & ukuran yang benar-benar muncul di pesanan untuk produk ini
      const jenisSetFromOrders = new Set<string>();
      const ukuranSetFromOrders = new Set<string>();
      qtyMap.forEach((_, key) => {
        const [pid, jenis, ukuran] = key.split("::");
        if (pid === productId) {
          jenisSetFromOrders.add(jenis);
          ukuranSetFromOrders.add(ukuran);
        }
      });

      // Gabungkan ukuran: urutan master dulu, lalu tambahan yang muncul di order tapi tak ada di master
      const ukuranList = [...masterUkuran];
      ukuranSetFromOrders.forEach((u) => {
        if (!ukuranList.includes(u)) ukuranList.push(u);
      });

      // Gabungkan jenis: urutan master dulu, lalu tambahan ekstra (ditandai isExtra)
      const jenisListFinal: { label: string; isExtra: boolean }[] = [];
      masterJenisList.forEach((j) => {
        jenisListFinal.push({ label: j, isExtra: false });
      });
      jenisSetFromOrders.forEach((j) => {
        if (!masterJenisList.includes(j)) {
          jenisListFinal.push({ label: j, isExtra: true });
        }
      });

      // Bangun baris rekap
      const rows: RekapRow[] = jenisListFinal.map(({ label, isExtra }) => {
        const perUkuran: Record<string, number> = {};
        let jumlah = 0;
        ukuranList.forEach((ukuran) => {
          const qty = qtyMap.get(`${productId}::${label}::${ukuran}`) || 0;
          perUkuran[ukuran] = qty;
          jumlah += qty;
        });
        return { jenis: label, perUkuran, jumlah, isExtra };
      });

      // Hitung total per kolom ukuran & total keseluruhan
      const totalPerUkuran: Record<string, number> = {};
      let totalJumlah = 0;
      ukuranList.forEach((ukuran) => {
        const total = rows.reduce((s, r) => s + (r.perUkuran[ukuran] || 0), 0);
        totalPerUkuran[ukuran] = total;
        totalJumlah += total;
      });

      result.push({
        product_id: productId,
        product_code: productCode,
        product_name: productName,
        ukuranList,
        rows,
        totalPerUkuran,
        totalJumlah,
      });
    });

    // Urutkan berdasarkan sort_order produk master (jika ada), lalu nama produk
    result.sort((a, b) => {
      const ma = productMap.get(a.product_id);
      const mb = productMap.get(b.product_id);
      const sa = ma?.sort_order ?? 999;
      const sb = mb?.sort_order ?? 999;
      if (sa !== sb) return sa - sb;
      return a.product_name.localeCompare(b.product_name);
    });

    return result;
  }, [orders, products]);

  const totalUnitProduksi = rekapList.reduce((s, r) => s + r.totalJumlah, 0);

  /* ── Rekap Belanja Bahan: per Jenis Garmen (lintas semua produk) ── */
  type BelanjaRow = {
    label: string;
    perUkuran: Record<string, number>;
    jumlah: number;
  };
  type BelanjaSection = {
    key: string;
    label: string;
    columns: string[];
    rows: BelanjaRow[];
    totalPerUkuran: Record<string, number>;
    totalJumlah: number;
  };

  const GARMENT_LABELS: Record<string, string> = {
    kaos_dewasa: "Kaos Dewasa",
    kaos_kids: "Kaos Kids",
    sweater: "Sweater",
    hoodie: "Hoodie",
  };
  const GARMENT_ORDER = ["kaos_dewasa", "kaos_kids", "sweater", "hoodie"];

  const belanjaSections: BelanjaSection[] = useMemo(() => {
    if (orders.length === 0 || products.length === 0) return [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Kolom ukuran per garment: ambil urutan dari master produk dulu
    const columnsByGarment: Record<string, string[]> = {};
    products.forEach((p) => {
      const gt = p.garment_type || "kaos_dewasa";
      if (!columnsByGarment[gt]) columnsByGarment[gt] = [];
      p.available_sizes.forEach((u) => {
        if (!columnsByGarment[gt].includes(u)) columnsByGarment[gt].push(u);
      });
    });

    // Kumpulkan qty per garment_type::(warna+lengan)::ukuran, lintas SEMUA produk
    const qtyMap = new Map<string, number>();
    orders.forEach((order) => {
      order.order_items.forEach((item) => {
        const master = productMap.get(item.product_id);
        const garmentType = master?.garment_type || "kaos_dewasa";
        const jenisLabel = `${item.warna} ${item.lengan}`.trim() || "-";
        const key = `${garmentType}::${jenisLabel}::${item.ukuran}`;
        qtyMap.set(key, (qtyMap.get(key) || 0) + item.qty);

        // Jaga-jaga kalau ukuran di order tidak ada di master produk manapun
        if (!columnsByGarment[garmentType]) columnsByGarment[garmentType] = [];
        if (!columnsByGarment[garmentType].includes(item.ukuran)) {
          columnsByGarment[garmentType].push(item.ukuran);
        }
      });
    });

    const sections: BelanjaSection[] = [];

    GARMENT_ORDER.forEach((garmentType) => {
      const columns = columnsByGarment[garmentType];
      if (!columns || columns.length === 0) return;

      const jenisSet = new Set<string>();
      qtyMap.forEach((_, key) => {
        const [gt, jenis] = key.split("::");
        if (gt === garmentType) jenisSet.add(jenis);
      });
      if (jenisSet.size === 0) return;

      const rows: BelanjaRow[] = Array.from(jenisSet)
        .sort()
        .map((jenis) => {
          const perUkuran: Record<string, number> = {};
          let jumlah = 0;
          columns.forEach((ukuran) => {
            const qty = qtyMap.get(`${garmentType}::${jenis}::${ukuran}`) || 0;
            perUkuran[ukuran] = qty;
            jumlah += qty;
          });
          return { label: jenis, perUkuran, jumlah };
        });

      const totalPerUkuran: Record<string, number> = {};
      let totalJumlah = 0;
      columns.forEach((ukuran) => {
        const t = rows.reduce((s, r) => s + (r.perUkuran[ukuran] || 0), 0);
        totalPerUkuran[ukuran] = t;
        totalJumlah += t;
      });

      sections.push({
        key: garmentType,
        label: GARMENT_LABELS[garmentType] || garmentType,
        columns,
        rows,
        totalPerUkuran,
        totalJumlah,
      });
    });

    return sections;
  }, [orders, products]);

  /* ── Export Excel: gabung jadi 2 sheet (Belanja & Produksi) ── */
  async function handleExportExcel() {
    if (rekapList.length === 0) {
      alert("Tidak ada data rekap untuk diexport.");
      return;
    }
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Rekap Belanja Bahan (semua jenis garmen digabung) ──
      if (belanjaSections.length > 0) {
        const belanjaData: (string | number)[][] = [];
        let maxCols = 0;

        belanjaSections.forEach((section, idx) => {
          if (idx > 0) belanjaData.push([]); // baris kosong pemisah antar section

          belanjaData.push([section.label]);
          const header = ["WARNA / LENGAN", ...section.columns, "JUMLAH"];
          belanjaData.push(header);
          maxCols = Math.max(maxCols, header.length);

          section.rows.forEach((row) => {
            belanjaData.push([
              row.label,
              ...section.columns.map((u) => row.perUkuran[u] || 0),
              row.jumlah,
            ]);
          });

          belanjaData.push([
            "TOTAL",
            ...section.columns.map((u) => section.totalPerUkuran[u] || 0),
            section.totalJumlah,
          ]);
        });

        const wsBelanja = XLSX.utils.aoa_to_sheet(belanjaData);
        wsBelanja["!cols"] = [
          { wch: 24 },
          ...Array(Math.max(maxCols - 2, 0)).fill({ wch: 8 }),
          { wch: 10 },
        ];
        XLSX.utils.book_append_sheet(wb, wsBelanja, "Rekap Belanja Bahan");
      }

      // ── Sheet 2: Rekap Produksi per Produk (semua produk digabung) ──
      const rekapData: (string | number)[][] = [];
      let maxColsProduk = 0;

      rekapList.forEach((rekap, idx) => {
        if (idx > 0) rekapData.push([]); // baris kosong pemisah antar produk

        rekapData.push([`${rekap.product_code} - ${rekap.product_name}`]);
        const header = ["JENIS", ...rekap.ukuranList, "JUMLAH"];
        rekapData.push(header);
        maxColsProduk = Math.max(maxColsProduk, header.length);

        rekap.rows.forEach((row) => {
          rekapData.push([
            row.isExtra ? `${row.jenis} (*)` : row.jenis,
            ...rekap.ukuranList.map((u) => row.perUkuran[u] || 0),
            row.jumlah,
          ]);
        });

        rekapData.push([
          "TOTAL",
          ...rekap.ukuranList.map((u) => rekap.totalPerUkuran[u] || 0),
          rekap.totalJumlah,
        ]);
      });

      const wsRekap = XLSX.utils.aoa_to_sheet(rekapData);
      wsRekap["!cols"] = [
        { wch: 24 },
        ...Array(Math.max(maxColsProduk - 2, 0)).fill({ wch: 8 }),
        { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(wb, wsRekap, "Rekap Produksi");

      const tanggalFile = new Date().toISOString().slice(0, 10);
      const namaPO = (setting?.title || "PO")
        .replace(/[\\/?*[\]:]/g, "") // buang karakter terlarang nama file
        .trim();
      XLSX.writeFile(wb, `Rekap-${namaPO}-${tanggalFile}.xlsx`);
    } catch (err) {
      console.error(err);
      alert(
        "Gagal membuat file Excel. Pastikan package 'xlsx' sudah terinstall.",
      );
    } finally {
      setExporting(false);
    }
  }

  /* ── Loading ── */
  if (loading)
    return (
      <div className="flex items-center gap-3 py-8 text-slate-400 dark:text-slate-500">
        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">Memuat rekap...</span>
      </div>
    );

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {rekapList.length} produk dengan pesanan
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Total {totalUnitProduksi} pcs untuk diproduksi
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex justify-center items-center gap-2 text-sm px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exporting || rekapList.length === 0}
            className="flex justify-center items-center gap-2 text-sm px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold transition-colors"
          >
            <Download size={14} className={exporting ? "animate-bounce" : ""} />
            {exporting ? "Membuat..." : "Download Excel"}
          </button>
        </div>
      </div>

      {/* ── Rekap Belanja Bahan (per Jenis Garmen) ── */}
      {belanjaSections.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-slate-400" />
            <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Rekap Belanja Bahan
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              — per warna & lengan, lintas semua produk
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {belanjaSections.map((section) => {
              const Icon =
                section.key === "kaos_kids"
                  ? Baby
                  : section.key === "sweater" || section.key === "hoodie"
                    ? Snowflake
                    : Shirt;
              return (
                <div
                  key={section.key}
                  className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden"
                >
                  <div className="bg-slate-50 dark:bg-slate-800/60 px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        className="text-slate-500 dark:text-slate-400"
                      />
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {section.label}
                      </h3>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {section.totalJumlah} pcs
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-[420px]">
                      <thead>
                        <tr className="bg-white dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left px-4 py-2.5 font-extrabold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            WARNA / LENGAN
                          </th>
                          {section.columns.map((ukuran) => (
                            <th
                              key={ukuran}
                              className="text-center px-3 py-2.5 font-extrabold text-slate-600 dark:text-slate-300 whitespace-nowrap"
                            >
                              {ukuran}
                            </th>
                          ))}
                          <th className="text-center px-4 py-2.5 font-extrabold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            JML
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row) => (
                          <tr
                            key={row.label}
                            className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                          >
                            <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {row.label}
                            </td>
                            {section.columns.map((ukuran) => (
                              <td
                                key={ukuran}
                                className="text-center px-3 py-2.5 text-slate-600 dark:text-slate-400"
                              >
                                {row.perUkuran[ukuran] > 0
                                  ? row.perUkuran[ukuran]
                                  : ""}
                              </td>
                            ))}
                            <td className="text-center px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                              {row.jumlah}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-t-2 border-slate-300 dark:border-slate-600">
                          <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-100">
                            TOTAL
                          </td>
                          {section.columns.map((ukuran) => (
                            <td
                              key={ukuran}
                              className="text-center px-3 py-3 font-extrabold text-slate-800 dark:text-slate-100"
                            >
                              {section.totalPerUkuran[ukuran] || 0}
                            </td>
                          ))}
                          <td className="text-center px-4 py-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                            {section.totalJumlah}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {rekapList.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 border-dashed rounded-2xl">
          <ClipboardList size={32} strokeWidth={1.2} />
          <p className="text-sm font-semibold">Belum ada data rekap</p>
          <p className="text-xs">Rekap akan muncul setelah ada pesanan masuk</p>
        </div>
      ) : (
        <div className="space-y-8">
          {rekapList.map((rekap) => (
            <div
              key={rekap.product_id}
              className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden"
            >
              {/* Header produk */}
              <div className="bg-slate-50 dark:bg-slate-800/60 px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md shrink-0">
                    {rekap.product_code}
                  </span>
                  <h3 className="font-bold text-sm sm:text-[15px] text-slate-800 dark:text-slate-200 truncate">
                    {rekap.product_name}
                  </h3>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                  {rekap.totalJumlah} pcs
                </span>
              </div>

              {/* Tabel rekap */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[480px]">
                  <thead>
                    <tr className="bg-white dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-4 py-2.5 font-extrabold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        JENIS
                      </th>
                      {rekap.ukuranList.map((ukuran) => (
                        <th
                          key={ukuran}
                          className="text-center px-3 py-2.5 font-extrabold text-slate-600 dark:text-slate-300 whitespace-nowrap"
                        >
                          {ukuran}
                        </th>
                      ))}
                      <th className="text-center px-4 py-2.5 font-extrabold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        JUMLAH
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekap.rows.map((row) => (
                      <tr
                        key={row.jenis}
                        className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            {row.jenis}
                            {row.isExtra && (
                              <span title="Kombinasi ini tidak terdaftar di master produk saat ini">
                                <AlertTriangle
                                  size={12}
                                  className="text-amber-500"
                                />
                              </span>
                            )}
                          </span>
                        </td>
                        {rekap.ukuranList.map((ukuran) => (
                          <td
                            key={ukuran}
                            className="text-center px-3 py-2.5 text-slate-600 dark:text-slate-400"
                          >
                            {row.perUkuran[ukuran] > 0
                              ? row.perUkuran[ukuran]
                              : ""}
                          </td>
                        ))}
                        <td className="text-center px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {row.jumlah}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-t-2 border-slate-300 dark:border-slate-600">
                      <td className="px-4 py-3 font-extrabold text-slate-800 dark:text-slate-100">
                        TOTAL
                      </td>
                      {rekap.ukuranList.map((ukuran) => (
                        <td
                          key={ukuran}
                          className="text-center px-3 py-3 font-extrabold text-slate-800 dark:text-slate-100"
                        >
                          {rekap.totalPerUkuran[ukuran] || 0}
                        </td>
                      ))}
                      <td className="text-center px-4 py-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                        {rekap.totalJumlah}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
