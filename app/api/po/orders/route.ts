// app/api/po/orders/route.ts
import { NextResponse } from 'next/server';

// Route ini bisa Anda gunakan untuk menampung logika API pesanan PO Anda
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Tambahkan logika pemrosesan pesanan Anda di sini
    return NextResponse.json({ success: true, message: "Order processed" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "API Route untuk PO Orders aktif" });
}