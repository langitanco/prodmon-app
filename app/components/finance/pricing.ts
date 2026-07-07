import { SizeEntry } from "@/types";
import { HargaConfig } from "./types";

/** Urutan ukuran dari terkecil ke terbesar, dipakai untuk menentukan
 *  berapa banyak "step" kelipatan biaya tambahan yang berlaku. */
const SIZE_ORDER = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;

/** Ukuran mulai index ini (XXL) yang kena biaya tambahan. */
const SURCHARGE_START_INDEX = SIZE_ORDER.indexOf("XXL");

/**
 * Hitung biaya tambahan untuk satu ukuran tertentu.
 * XXL = 1x biaya_ukuran_besar, XXXL = 2x, dst (kelipatan).
 * Ukuran di bawah XXL (S/M/L/XL) atau ukuran tak dikenal = 0.
 */
export function getSizeSurcharge(
  ukuranKey: string,
  config: Pick<HargaConfig, "biaya_ukuran_besar">,
): number {
  const idx = SIZE_ORDER.indexOf(ukuranKey.toUpperCase() as any);
  if (idx === -1 || idx < SURCHARGE_START_INDEX) return 0;
  const step = idx - SURCHARGE_START_INDEX + 1;
  return step * config.biaya_ukuran_besar;
}

export interface SizePricingRow {
  ukuran: string;
  qty: number;
  hargaPerPcs: number;
  subtotal: number;
}

export interface EntryPricingSummary {
  entryId: string;
  warna: string;
  lengan: "pendek" | "panjang";
  totalPcs: number;
  subtotal: number;
  sizes: SizePricingRow[];
}

export interface PricingResult {
  totalPcs: number;
  totalHarga: number;
  entries: EntryPricingSummary[];
  /** true jika order tidak punya detail_ukuran, jadi memakai kalkulasi lama (harga x jumlah). */
  isLegacy: boolean;
}

/**
 * Hitung total harga dari breakdown detail_ukuran (warna + lengan + ukuran).
 * Kalau detailUkuran kosong/tidak ada (order lama sebelum fitur ini),
 * fallback ke kalkulasi sederhana: hargaDasar x jumlah.
 */
export function calculateTotalHarga(
  detailUkuran: SizeEntry[] | null | undefined,
  hargaDasar: number,
  jumlahFallback: number,
  config: HargaConfig,
): PricingResult {
  if (!detailUkuran || detailUkuran.length === 0) {
    return {
      totalPcs: jumlahFallback,
      totalHarga: hargaDasar * jumlahFallback,
      entries: [],
      isLegacy: true,
    };
  }

  const entries: EntryPricingSummary[] = [];
  let totalPcs = 0;
  let totalHarga = 0;

  for (const entry of detailUkuran) {
    const lenganSurcharge =
      entry.lengan === "panjang" ? config.biaya_lengan_panjang : 0;

    const sizes: SizePricingRow[] = Object.entries(entry.ukuran || {})
      .filter(([, qty]) => (qty ?? 0) > 0)
      .map(([ukuran, qtyRaw]) => {
        const qty = qtyRaw ?? 0;
        const hargaPerPcs =
          hargaDasar + getSizeSurcharge(ukuran, config) + lenganSurcharge;
        return { ukuran, qty, hargaPerPcs, subtotal: hargaPerPcs * qty };
      })
      .sort((a, b) => {
        const ia = SIZE_ORDER.indexOf(a.ukuran.toUpperCase() as any);
        const ib = SIZE_ORDER.indexOf(b.ukuran.toUpperCase() as any);
        if (ia === -1 && ib === -1) return a.ukuran.localeCompare(b.ukuran);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });

    const entryPcs = sizes.reduce((acc, s) => acc + s.qty, 0);
    const entrySubtotal = sizes.reduce((acc, s) => acc + s.subtotal, 0);

    entries.push({
      entryId: entry.id,
      warna: entry.warna,
      lengan: entry.lengan,
      totalPcs: entryPcs,
      subtotal: entrySubtotal,
      sizes,
    });

    totalPcs += entryPcs;
    totalHarga += entrySubtotal;
  }

  return { totalPcs, totalHarga, entries, isLegacy: false };
}