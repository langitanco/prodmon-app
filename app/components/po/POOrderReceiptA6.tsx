"use client";

import { POOrder } from "@/types/po";
import { formatRupiah } from "@/lib/po/pricing";

interface POOrderReceiptA6Props {
  order: POOrder;
  storeName?: string;
  storeAddress?: string;
  adminPhone?: string;
  logoUrl?: string;
}

const PAYMENT_LABEL: Record<string, string> = {
  BELUM_BAYAR: "Belum Bayar",
  DP: "DP",
  LUNAS: "Lunas",
};

export default function POOrderReceiptA6({
  order,
  storeName = "Langitan.co",
  storeAddress,
  adminPhone,
  logoUrl,
}: POOrderReceiptA6Props) {
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
  const isDikirim = order.delivery_method === "Dikirim";

  return (
    <div
      style={{
        width: "100%",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        color: "#000",
        boxSizing: "border-box",
        lineHeight: "1.4",
      }}
    >
      {/* ── HEADER RESI ── */}
      <div
        style={{
          textAlign: "center",
          borderBottom: logoUrl ? "none" : "2px solid #000",
          paddingBottom: logoUrl ? 0 : "10px",
          marginBottom: "12px",
        }}
      >
        {logoUrl ? (
          // Gambar kop/header custom, selebar area cetak — dianggap
          // sudah lengkap dengan nama, alamat, kontak, dsb di dalam
          // desainnya sendiri, jadi semua teks & garis pembatas bawaan
          // sengaja disembunyikan supaya tidak dobel.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={storeName}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              margin: "0 auto",
            }}
          />
        ) : (
          // Fallback teks: dipakai hanya kalau logo belum diupload,
          // supaya header resi tidak kosong.
          <>
            <h2
              style={{
                fontSize: "20px",
                margin: "0 0 4px 0",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {storeName}
            </h2>
            {storeAddress && (
              <p style={{ margin: "0 0 4px 0", fontSize: "10px" }}>
                {storeAddress}
              </p>
            )}
            {adminPhone && (
              <p style={{ margin: 0, fontSize: "10px", fontWeight: "bold" }}>
                Layanan Pelanggan (WA): {adminPhone}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── INFO TRANSAKSI ── */}
      <table style={{ width: "100%", marginBottom: "12px", fontSize: "12px" }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: "top", width: "50%" }}>
              <p style={{ margin: "0 0 2px 0" }}>
                <strong>No. PO:</strong> {order.po_number}
              </p>
              <p style={{ margin: "0" }}>
                <strong>Tgl:</strong>{" "}
                {new Date(order.created_at).toLocaleDateString("id-ID")}
              </p>
            </td>
            <td
              style={{ verticalAlign: "top", textAlign: "right", width: "50%" }}
            >
              <p style={{ margin: "0 0 4px 0" }}>
                <strong>Status Bayar: </strong>
                <span
                  style={{
                    padding: "2px 6px",
                    border: "1px solid #000",
                    borderRadius: "4px",
                    fontWeight: "bold",
                  }}
                >
                  {PAYMENT_LABEL[order.payment_status] ?? order.payment_status}
                </span>
              </p>
              <p style={{ margin: "0" }}>
                <strong>Metode:</strong> {order.delivery_method}
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── DETAIL PENGIRIMAN ── */}
      <div
        style={{
          border: "2px solid #000",
          borderRadius: "8px",
          padding: "10px",
          marginBottom: "15px",
        }}
      >
        <table style={{ width: "100%", fontSize: "11px" }}>
          <tbody>
            <tr>
              <td
                style={{
                  width: "50%",
                  verticalAlign: "top",
                  paddingRight: "10px",
                  borderRight: isDikirim ? "1px dashed #ccc" : "none",
                }}
              >
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "10px",
                    color: "#555",
                    fontWeight: "bold",
                  }}
                >
                  PENGIRIM:
                </p>
                <p
                  style={{
                    margin: "0 0 2px 0",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                >
                  {storeName}
                </p>
                {storeAddress && (
                  <p style={{ margin: "0 0 2px 0" }}>{storeAddress}</p>
                )}
                {adminPhone && <p style={{ margin: 0 }}>{adminPhone}</p>}
              </td>

              {isDikirim ? (
                <td
                  style={{
                    width: "50%",
                    verticalAlign: "top",
                    paddingLeft: "10px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "10px",
                      color: "#555",
                      fontWeight: "bold",
                    }}
                  >
                    PENERIMA:
                  </p>
                  <p
                    style={{
                      margin: "0 0 2px 0",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                  >
                    {order.customer_name}
                  </p>
                  <p style={{ margin: "0 0 2px 0" }}>{order.customer_wa}</p>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {order.shipping_address}
                  </p>
                </td>
              ) : (
                <td
                  style={{
                    width: "50%",
                    verticalAlign: "top",
                    paddingLeft: "10px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "10px",
                      color: "#555",
                      fontWeight: "bold",
                    }}
                  >
                    PEMESAN (AMBIL DI TOKO):
                  </p>
                  <p
                    style={{
                      margin: "0 0 2px 0",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                  >
                    {order.customer_name}
                  </p>
                  <p style={{ margin: "0" }}>{order.customer_wa}</p>
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── TABEL PESANAN ── */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "12px",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "2px solid #000",
              borderTop: "2px solid #000",
            }}
          >
            <th style={{ textAlign: "left", padding: "6px 0", width: "50%" }}>
              Item
            </th>
            <th style={{ textAlign: "center", padding: "6px 0", width: "15%" }}>
              Qty
            </th>
            <th style={{ textAlign: "right", padding: "6px 0", width: "35%" }}>
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((item, i) => (
            <tr key={i} style={{ borderBottom: "1px dotted #888" }}>
              <td style={{ padding: "6px 0" }}>
                <div style={{ fontWeight: "bold" }}>{item.product_name}</div>
                <div
                  style={{ fontSize: "10px", color: "#444", marginTop: "2px" }}
                >
                  {item.ukuran} | {item.lengan} | {item.warna}
                </div>
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "6px 0",
                  verticalAlign: "top",
                  fontWeight: "bold",
                }}
              >
                {item.qty}
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "6px 0",
                  verticalAlign: "top",
                }}
              >
                {formatRupiah(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── RINGKASAN BIAYA ── */}
      <div style={{ width: "100%", textAlign: "right", marginBottom: "15px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ textAlign: "right", padding: "3px 0" }}>
                Total Keseluruhan:
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "3px 0",
                  width: "40%",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                {formatRupiah(order.total_amount)}
              </td>
            </tr>
            {order.payment_status !== "BELUM_BAYAR" && (
              <tr>
                <td style={{ textAlign: "right", padding: "3px 0" }}>
                  Sudah Dibayar:
                </td>
                <td style={{ textAlign: "right", padding: "3px 0" }}>
                  {formatRupiah(order.paid_amount || 0)}
                </td>
              </tr>
            )}
            {sisaTagihan > 0 && (
              <tr>
                <td
                  style={{
                    textAlign: "right",
                    padding: "5px 0",
                    borderTop: "1px solid #ccc",
                    marginTop: "3px",
                  }}
                >
                  <strong>Sisa Tagihan:</strong>
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "5px 0",
                    borderTop: "1px solid #ccc",
                    marginTop: "3px",
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  {formatRupiah(sisaTagihan)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── CATATAN PEMBELI ── */}
      {order.notes && (
        <div
          style={{
            border: "1px dashed #000",
            padding: "8px",
            marginBottom: "15px",
            fontSize: "11px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <strong style={{ display: "block", marginBottom: "2px" }}>
            Catatan Pembeli:
          </strong>
          {order.notes}
        </div>
      )}

      {/* ── FOOTER RESI ── */}
      <div
        style={{
          textAlign: "center",
          fontSize: "10px",
          marginTop: "20px",
          borderTop: "1px dashed #000",
          paddingTop: "12px",
        }}
      >
        <p
          style={{ margin: "0 0 3px 0", fontWeight: "bold", fontSize: "12px" }}
        >
          Terima Kasih!
        </p>
        <p style={{ margin: "0 0 4px 0" }}>
          Pesanan yang sudah diproses tidak dapat ditukar/dikembalikan.
        </p>
        <p style={{ margin: "0", color: "#666", fontSize: "9px" }}>
          Dicetak: {printedAt}
        </p>
      </div>
    </div>
  );
}
