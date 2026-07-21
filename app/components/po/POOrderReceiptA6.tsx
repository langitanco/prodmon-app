"use client";

import { POOrder } from "@/types/po";

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

  const isDikirim = order.delivery_method === "Dikirim";

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

  return (
    <div
      style={{
        width: "100%",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        color: "#000",
        boxSizing: "border-box",
        lineHeight: "1.35",
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
                fontSize: "16px",
                margin: "0 0 4px 0",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {storeName}
            </h2>
            {storeAddress && (
              <p style={{ margin: "0 0 4px 0", fontSize: "9px" }}>
                {storeAddress}
              </p>
            )}
            {adminPhone && (
              <p style={{ margin: 0, fontSize: "9px", fontWeight: "bold" }}>
                Layanan Pelanggan (WA): {adminPhone}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── INFO TRANSAKSI ── */}
      <table style={{ width: "100%", marginBottom: "10px", fontSize: "10px" }}>
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
          padding: "8px",
          marginBottom: "12px",
        }}
      >
        <table style={{ width: "100%", fontSize: "9px" }}>
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
                    fontSize: "8px",
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
                    fontSize: "10px",
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
                      fontSize: "8px",
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
                      fontSize: "10px",
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
                      fontSize: "8px",
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
                      fontSize: "10px",
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
          marginBottom: "10px",
          fontSize: "9px",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "2px solid #000",
              borderTop: "2px solid #000",
            }}
          >
            <th style={{ textAlign: "left", padding: "5px 0", width: "80%" }}>
              Item
            </th>
            <th style={{ textAlign: "center", padding: "5px 0", width: "20%" }}>
              Qty
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, i) => (
            <tr key={i} style={{ borderBottom: "1px dotted #888" }}>
              <td style={{ padding: "5px 0" }}>
                <span style={{ fontWeight: "bold" }}>{item.product_name}</span>
                <span style={{ fontSize: "8px", color: "#444" }}>
                  {" "}
                  — {item.ukuran} | {item.lengan} | {item.warna}
                </span>
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "5px 0",
                  verticalAlign: "top",
                  fontWeight: "bold",
                }}
              >
                {item.qty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── CATATAN PEMBELI ── */}
      {order.notes && (
        <div
          style={{
            border: "1px dashed #000",
            padding: "6px",
            marginBottom: "12px",
            fontSize: "9px",
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
          fontSize: "9px",
          marginTop: "16px",
          borderTop: "1px dashed #000",
          paddingTop: "10px",
        }}
      >
        <p
          style={{ margin: "0 0 3px 0", fontWeight: "bold", fontSize: "10px" }}
        >
          Terima Kasih!
        </p>
        <p style={{ margin: "0 0 4px 0" }}>
          Harap melakukan video unboxing disaat membuka paket.
        </p>
        <p style={{ margin: "0", color: "#666", fontSize: "8px" }}>
          Dicetak: {printedAt}
        </p>
      </div>
    </div>
  );
}
