// app/api/send-notification/route.ts

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

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

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userTokens, error } = await supabaseAdmin
      .from('user_fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (error || !userTokens || userTokens.length === 0) {
      return NextResponse.json({ error: 'User token not found' }, { status: 404 });
    }

    const tokens = userTokens.map((t) => t.token);
    const uniqueTokens = [...new Set(tokens)];

    // Susun pesan yang efisien untuk mencegah duplikat
    const message = {
      notification: {
        title: title,
        body: body,
      },
      webpush: {
        headers: {
          image: "https://langitanco-superapp.vercel.app/logo.png", // Pastikan URL logo ini publik dan benar
        },
        notification: {
          title: title,
          body: body,
          icon: "https://langitanco-superapp.vercel.app/logo.png", // URL ikon absolut
          badge: "https://langitanco-superapp.vercel.app/logo.png",
          click_action: "https://langitanco-superapp.vercel.app/",
        },
      },
      tokens: uniqueTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message as any);

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