// app/api/send-notification/route.ts

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js'; // ⚠️ Pakai library core, bukan @supabase/ssr

// 1. Inisialisasi Firebase Admin (Singleton Pattern)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const { userId, title, body } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing userId, title, or body' }, { status: 400 });
    }

    // 2. Inisialisasi Supabase ADMIN Client (Bypass RLS)
    // Kita gunakan Service Role Key disini
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 3. Ambil Token FCM milik User (Sekarang pasti bisa terbaca)
    const { data: userTokens, error } = await supabaseAdmin
      .from('user_fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!userTokens || userTokens.length === 0) {
      return NextResponse.json({ error: 'User token not found in DB' }, { status: 404 });
    }

    // 4. Kirim Notifikasi
    const tokens = userTokens.map((t) => t.token);
    const uniqueTokens = [...new Set(tokens)];

    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: uniqueTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log('Successfully sent message:', response);

    return NextResponse.json({ 
      success: true, 
      sent_count: response.successCount, 
      failure_count: response.failureCount 
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 });
  }
}