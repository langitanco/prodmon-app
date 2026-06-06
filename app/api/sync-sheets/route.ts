// app/api/sync-sheets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID    = process.env.GOOGLE_SHEET_ID!;
const SHEET_RANGE = 'Pesanan!A:J';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  if (!value || value === 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function formatDateID(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAuthClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key:  privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const order = await req.json();

    const {
      kode_produksi,
      tanggal_masuk,
      nama_pemesan,
      jenis_produksi,
      jumlah,
      harga_per_pcs    = 0,
      total_harga      = 0,
      dp_masuk         = 0,
      status_pembayaran = 'Belum DP',
    } = order;

    const sisaTagihan = Math.max(0, total_harga - dp_masuk);

    // Row format:
    // [A] No. Invoice | [B] Tgl Masuk | [C] Klien | [D] Detail | [E] Qty
    // [F] Harga/Pcs  | [G] Total Harga | [H] DP Masuk | [I] Sisa Tagihan | [J] Status
    const rowData = [
      kode_produksi,
      formatDateID(tanggal_masuk),
      nama_pemesan,
      jenis_produksi,
      jumlah,
      harga_per_pcs > 0 ? formatRupiah(harga_per_pcs) : '-',
      total_harga   > 0 ? formatRupiah(total_harga)   : '-',
      dp_masuk      > 0 ? formatRupiah(dp_masuk)      : '-',
      sisaTagihan   > 0 ? formatRupiah(sisaTagihan)   : 'LUNAS',
      status_pembayaran,
    ];

    const auth    = await getAuthClient();
    const sheets  = google.sheets({ version: 'v4', auth });

    // ── Fetch existing rows ──
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows       = getRes.data.values || [];
    const existingIdx = rows.findIndex(row => row[0] === kode_produksi);

    if (existingIdx !== -1) {
      // ── UPDATE existing row ──
      const rowNumber = existingIdx + 1; // 1-based
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range:         `Pesanan!A${rowNumber}:J${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowData] },
      });
    } else {
      // ── APPEND new row ──
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range:         SHEET_RANGE,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [rowData] },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[sync-sheets] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}