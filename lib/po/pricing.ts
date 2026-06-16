// lib/po/pricing.ts

interface PricingSettings {
  sleeveSurcharge: number;
  xxlSurcharge: number;
}

/**
 * Hitung harga satuan berdasarkan varian.
 * Dipakai di frontend (preview) DAN saat insert ke DB.
 */
export function calculateItemPrice(
  basePrice: number,
  size: string,
  sleeveType: string,
  settings: PricingSettings
): number {
  let additionalSleeve = 0;
  let additionalSize = 0;

  // Tambahan lengan panjang
  if (sleeveType.toLowerCase().includes('panjang')) {
    additionalSleeve = settings.sleeveSurcharge;
  }

  // Tambahan ukuran XXL+
  const upperSize = size.toUpperCase();
  if (upperSize.includes('L') && upperSize !== 'L' && upperSize !== 'XL') {
    const match2 = upperSize.match(/^(\d+)XL$/);
    if (match2) {
      const num = parseInt(match2[1], 10);
      if (num >= 2) additionalSize = settings.xxlSurcharge * (num - 1);
    } else {
      const xCount = (upperSize.match(/X/g) || []).length;
      if (xCount >= 2) additionalSize = settings.xxlSurcharge * (xCount - 1);
    }
  }

  return basePrice + additionalSleeve + additionalSize;
}

/**
 * Format angka ke Rupiah Indonesia
 */
export function formatRupiah(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID');
}