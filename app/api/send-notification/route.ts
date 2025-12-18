// app/api/send-notification/route.ts

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// 1. Inisialisasi Firebase Admin (Aman untuk Vercel/Build)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, title, body } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing userId, title, or body' }, { status: 400 });
    }

    // 2. Inisialisasi Supabase ADMIN Client (Bypass RLS)
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

    // 3. Ambil Token FCM milik User
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

    const tokens = userTokens.map((t) => t.token);
    const uniqueTokens = [...new Set(tokens)];

    // 4. Susun Pesan dengan Branding Langitan.co
    const message = {
      notification: {
        title: title,
        body: body,
      },
      // Webpush config memastikan icon muncul di browser Desktop & Mobile
      webpush: {
        notification: {
          icon: '/logo.png',
          badge: '/logo.png',
          click_action: '/', // Kembali ke dashboard saat diklik
        },
        fcm_options: {
            link: '/'
        }
      },
      tokens: uniqueTokens,
    };

    // 5. Kirim ke Firebase
    const response = await admin.messaging().sendEachForMulticast(message as any);

    console.log('Successfully sent message:', response);

    return NextResponse.json({ 
      success: true, 
      sent_count: response.successCount, 
      failure_count: response.failureCount 
    });

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}