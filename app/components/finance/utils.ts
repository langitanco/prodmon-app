export const formatRupiah = (value: number): string => {
  if (!value || value === 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const parseRupiah = (value: string): number => {
  return parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
};

export const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
};

/** Angka total/DP/sisa tagihan turunan dari sebuah order, dipakai bareng
 *  oleh baris tabel, kartu mobile, dan ringkasan di atas. */
export const getPaymentFigures = (order: {
  total_harga?: number;
  dp_masuk?: number;
}) => {
  const totalHarga = order.total_harga ?? 0;
  const dpMasuk = order.dp_masuk ?? 0;
  const sisaTagihan = Math.max(0, totalHarga - dpMasuk);
  return { totalHarga, dpMasuk, sisaTagihan };
};