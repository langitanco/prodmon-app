import { NextResponse } from 'next/server';
import { runAllInOneMigration } from '@/scripts/migrate-all'; // Arahkan ke file baru

export async function GET() {
  try {
    await runAllInOneMigration();
    return NextResponse.json({ 
      status: 'success', 
      message: 'Migrasi massal seluruh order berhasil diselesaikan. Silakan cek terminal VS Code.' 
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}