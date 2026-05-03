// app/api/delete-user/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function DELETE(req: NextRequest) {
  const { userId } = await req.json();
  console.log('Delete user request:', userId);

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  // Jika user tidak ditemukan di auth, anggap sukses
  // (user dibuat manual tanpa Supabase Auth)
  if (error && error.code !== 'user_not_found') {
    console.error('Auth delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}