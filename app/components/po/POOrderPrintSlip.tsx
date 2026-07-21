"use client";

import { POOrder } from "@/types/po";
import { formatRupiah } from "@/lib/po/pricing";

/**
 * Komponen ini murni untuk TAMPILAN CETAK (A4).
 * Tidak ada interaksi di dalamnya — dirender tersembunyi di layar,
 * lalu di-print / di-screenshot jadi PDF oleh POOrderList.tsx.
 *
 * Catatan:
 * - `storeName` & `logoUrl` sengaja dibuat sebagai props opsional.
 *   Kalau kamu punya nama toko / logo di tabel po_settings, sambungkan
 *   dari sana (mis. setting.store_name, setting.logo_url). Kalau belum
 *   ada kolomnya, tinggal hardcode dulu.
 */

interface POOrderPrintSlipProps {
  order: POOrder;
  storeName?: string;
  logoUrl?: string;
  storeAddress?: string;
}

const PAYMENT_LABEL: Record<string, string> = {
  BELUM_BAYAR: "Belum Bayar",
  DP: "DP",
  LUNAS: "Lunas",
};

// Warna badge status pembayaran: { background, text }
const PAYMENT_COLOR: Record<string, { bg: string; text: string }> = {
  BELUM_BAYAR: { bg: "#FCEBEB", text: "#791F1F" },
  DP: { bg: "#FAEEDA", text: "#633806" },
  LUNAS: { bg: "#EAF3DE", text: "#173404" },
};

export default function POOrderPrintSlip({
  order,
  storeName = "Nama Toko",
  logoUrl,
  storeAddress,
}: POOrderPrintSlipProps) {
  const printedAt = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sisaTagihan = Math.max(
    0,
    order.total_amount - (order.paid_amount || 0),
  );

  const paymentColor =
    PAYMENT_COLOR[order.payment_status] ?? PAYMENT_COLOR.BELUM_BAYAR;

  // Urutkan item: kode/nama produk -> lengan -> warna -> ukuran.
  const sortedItems = [...order.order_items].sort((a, b) => {
    const kodeA = a.product_name || "";
    const kodeB = b.product_name || "";
    if (kodeA !== kodeB)
      return kodeA.localeCompare(kodeB, undefined, { numeric: true });

    const lenganA = a.lengan || "";
    const lenganB = b.lengan || "";
    if (lenganA !== lenganB) return lenganA.localeCompare(lenganB);

    const warnaA = a.warna || "";
    const warnaB = b.warna || "";
    if (warnaA !== warnaB) return warnaA.localeCompare(warnaB);

    return (a.ukuran || "").localeCompare(b.ukuran || "", undefined, {
      numeric: true,
    });
  });

  const storeInitials = storeName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      id="po-print-area"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        background: "#ffffff",
        color: "#1a1a1a",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        boxSizing: "border-box",
      }}
    >
      {/* ── Header toko ─────────────────────────────────────── */}
      <div
        style={{
          borderBottom: logoUrl ? "none" : "2px solid #1a1a1a",
        }}
      >
        {logoUrl ? (
          // Gambar kop/header custom, selebar penuh kertas (edge-to-edge) —
          // dianggap sudah lengkap dengan nama, alamat, kontak di dalam
          // desainnya sendiri, jadi tidak perlu elemen teks tambahan di sini.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={storeName}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        ) : (
          // Fallback: avatar inisial + nama toko, dipakai hanya kalau
          // logo/kop belum diupload.
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "15mm 15mm 14px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: "#E6F1FB",
                color: "#0C447C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "16px",
                flexShrink: 0,
              }}
            >
              {storeInitials || "T"}
            </div>
            <div>
              <p style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                {storeName}
              </p>
              {storeAddress && (
                <p
                  style={{ fontSize: "10px", color: "#666", margin: "3px 0 0" }}
                >
                  {storeAddress}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bar detail pesanan (dulunya di header, sekarang di bawah kop) ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "#f4f3f0",
          padding: "14px 15mm",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.06em",
              color: "#999",
              margin: 0,
            }}
          >
            STRUK PESANAN
          </p>
          <p
            style={{
              fontSize: "16px",
              fontWeight: 700,
              margin: "4px 0 0",
              fontFamily: "monospace",
            }}
          >
            {order.po_number}
          </p>
        </div>
        <div>
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.06em",
              color: "#999",
              margin: 0,
            }}
          >
            TIPE CUSTOMER
          </p>
          <p style={{ fontSize: "13px", fontWeight: 700, margin: "4px 0 0" }}>
            {order.customer_type}
          </p>
        </div>
        <div>
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.06em",
              color: "#999",
              margin: 0,
            }}
          >
            TANGGAL
          </p>
          <p style={{ fontSize: "13px", fontWeight: 700, margin: "4px 0 0" }}>
            {new Date(order.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.06em",
              color: "#999",
              margin: "0 0 6px",
            }}
          >
            STATUS BAYAR
          </p>
          <span
            style={{
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: "5px",
              fontSize: "10px",
              fontWeight: 700,
              background: paymentColor.bg,
              color: paymentColor.text,
            }}
          >
            {PAYMENT_LABEL[order.payment_status] ?? order.payment_status}
          </span>
        </div>
      </div>

      <div style={{ padding: "0 15mm" }}>
        {/* ── Info pelanggan ────────────────────────────────── */}
        <table style={{ width: "100%", margin: "18px 0", fontSize: "12px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", verticalAlign: "top", padding: 0 }}>
                <p
                  style={{
                    color: "#999",
                    letterSpacing: "0.06em",
                    margin: "0 0 6px",
                    fontSize: "9px",
                  }}
                >
                  PELANGGAN
                </p>
                <p style={{ fontWeight: 700, margin: "0 0 3px" }}>
                  {order.customer_name}
                </p>
                <p style={{ margin: "0 0 3px", color: "#555" }}>
                  {order.customer_wa}
                </p>
                {order.po_resellers && (
                  <p style={{ margin: 0, color: "#555" }}>
                    Reseller: {order.po_resellers.nama} (
                    {order.po_resellers.kode})
                  </p>
                )}
              </td>
              <td style={{ width: "50%", verticalAlign: "top", padding: 0 }}>
                <p
                  style={{
                    color: "#999",
                    letterSpacing: "0.06em",
                    margin: "0 0 6px",
                    fontSize: "9px",
                  }}
                >
                  PENGIRIMAN
                </p>
                <p style={{ fontWeight: 700, margin: "0 0 3px" }}>
                  {order.delivery_method}
                </p>
                {order.shipping_address && (
                  <p style={{ margin: "0 0 3px", color: "#555" }}>
                    {order.shipping_address}
                  </p>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Tabel item ────────────────────────────────────── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "16px",
            fontSize: "11px",
          }}
        >
          <thead>
            <tr style={{ background: "#f4f3f0" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  fontWeight: 700,
                  color: "#555",
                  borderRadius: "6px 0 0 6px",
                }}
              >
                Produk
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  fontWeight: 700,
                  color: "#555",
                }}
              >
                Warna
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  fontWeight: 700,
                  color: "#555",
                }}
              >
                Lengan
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  fontWeight: 700,
                  color: "#555",
                }}
              >
                Ukuran
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  fontWeight: 700,
                  color: "#555",
                }}
              >
                Qty
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "8px 6px",
                  fontWeight: 700,
                  color: "#555",
                }}
              >
                Harga
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "8px 10px",
                  fontWeight: 700,
                  color: "#555",
                  borderRadius: "0 6px 6px 0",
                }}
              >
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, i) => (
              <tr
                key={i}
                style={{
                  borderBottom:
                    i === order.order_items.length - 1
                      ? "none"
                      : "0.5px solid #e5e5e5",
                }}
              >
                <td style={{ padding: "9px 10px", fontWeight: 700 }}>
                  {item.product_name}
                </td>
                <td
                  style={{
                    padding: "9px 6px",
                    textAlign: "center",
                    color: "#555",
                  }}
                >
                  {item.warna}
                </td>
                <td
                  style={{
                    padding: "9px 6px",
                    textAlign: "center",
                    color: "#555",
                  }}
                >
                  {item.lengan}
                </td>
                <td
                  style={{
                    padding: "9px 6px",
                    textAlign: "center",
                    color: "#555",
                  }}
                >
                  {item.ukuran}
                </td>
                <td style={{ padding: "9px 6px", textAlign: "center" }}>
                  {item.qty}
                </td>
                <td
                  style={{
                    padding: "9px 6px",
                    textAlign: "right",
                    color: "#555",
                  }}
                >
                  {formatRupiah(item.harga_satuan)}
                </td>
                <td
                  style={{
                    padding: "9px 10px",
                    textAlign: "right",
                    fontWeight: 700,
                  }}
                >
                  {formatRupiah(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Total ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              minWidth: "260px",
              background: "#f4f3f0",
              borderRadius: "8px",
              padding: "14px 16px",
              fontSize: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
              }}
            >
              <span style={{ color: "#666" }}>Total</span>
              <span style={{ fontWeight: 700 }}>
                {formatRupiah(order.total_amount)}
              </span>
            </div>

            {order.payment_status !== "BELUM_BAYAR" && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "3px 0",
                }}
              >
                <span style={{ color: "#666" }}>Sudah Dibayar</span>
                <span>{formatRupiah(order.paid_amount || 0)}</span>
              </div>
            )}

            {sisaTagihan > 0 ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0 0",
                  marginTop: "6px",
                  borderTop: "0.5px solid #ddd",
                  fontSize: "13px",
                }}
              >
                <span style={{ fontWeight: 700, color: "#a32d2d" }}>
                  Sisa Tagihan
                </span>
                <span style={{ fontWeight: 700, color: "#a32d2d" }}>
                  {formatRupiah(sisaTagihan)}
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0 0",
                  marginTop: "6px",
                  borderTop: "0.5px solid #ddd",
                  fontSize: "13px",
                }}
              >
                <span style={{ fontWeight: 700 }}>Lunas</span>
                <span style={{ fontWeight: 700, color: "#3b6d11" }}>Rp 0</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Catatan ───────────────────────────────────────── */}
        {order.notes && (
          <div
            style={{
              borderLeft: "3px solid #bbb",
              borderRadius: 0,
              padding: "8px 14px",
              marginBottom: "24px",
              fontSize: "11px",
              background: "#f9f9f7",
            }}
          >
            <p style={{ fontWeight: 700, margin: "0 0 4px" }}>
              Catatan Pembeli:
            </p>
            <p style={{ margin: 0, color: "#444" }}>{order.notes}</p>
          </div>
        )}

        {/* ── Tanda tangan ──────────────────────────────────── */}
        <table style={{ width: "100%", marginTop: "48px", fontSize: "11px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", textAlign: "center" }}>
                <div
                  style={{
                    borderTop: "0.5px solid #999",
                    paddingTop: "8px",
                    margin: "0 24px",
                    color: "#666",
                  }}
                >
                  Disiapkan oleh
                </div>
              </td>
              <td style={{ width: "50%", textAlign: "center" }}>
                <div
                  style={{
                    borderTop: "0.5px solid #999",
                    paddingTop: "8px",
                    margin: "0 24px",
                    color: "#666",
                  }}
                >
                  Tanda Tangan Penerima
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <p
          style={{
            textAlign: "center",
            fontSize: "9px",
            color: "#aaa",
            margin: "32px 0 15mm",
          }}
        >
          Dicetak {printedAt}
        </p>
      </div>
    </div>
  );
}
