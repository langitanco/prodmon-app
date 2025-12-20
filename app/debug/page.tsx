// app/debug/page.tsx
'use client';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [authData, setAuthData] = useState<any>(null);
  const [dbUserData, setDbUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const check = async () => {
      // 1. Cek Siapa yang Login (Auth System)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setAuthData(session.user);

        // 2. Cek Data di Tabel Users (Public Table) berdasarkan ID Login
        const { data: userTable, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id); // Kita cari apakah ID login ada di tabel users?
        
        setDbUserData({ data: userTable, error });
      }
      setLoading(false);
    };
    check();
  }, []);

  if (loading) return <div className="p-10">Checking IDs...</div>;

  return (
    <div className="p-10 font-mono text-sm space-y-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-red-600">DEBUG MODE: ID CHECKER</h1>
      
      <div className="bg-white p-6 text-slate-800 border-2 border-blue-500 rounded-xl">
        <h2 className="font-bold text-slate-800 text-blue-600 text-lg mb-2">1. DATA LOGIN (AUTH SYSTEM)</h2>
        <p><strong>Status:</strong> {authData ? '✅ Terlogin' : '❌ Belum Login'}</p>
        {authData && (
          <>
            <p><strong>Email:</strong> {authData.email}</p>
            <p className="bg-yellow-100 p-2 mt-2 rounded"><strong>AUTH UUID (KTP Asli):</strong><br/> {authData.id}</p>
          </>
        )}
      </div>

      <div className="bg-white p-6 text-slate-800 border-2 border-green-500 rounded-xl">
        <h2 className="font-bold text-slate-800 text-green-600 text-lg mb-2">2. DATA DI TABEL 'USERS'</h2>
        <p>Mencari di tabel users dengan ID di atas...</p>
        
        {dbUserData?.error ? (
          <p className="text-red-500 font-bold">Error Fetching: {dbUserData.error.message}</p>
        ) : (
          dbUserData?.data?.length > 0 ? (
            <div className="space-y-2">
              <p className="text-green-600 font-bold">✅ DATA DITEMUKAN!</p>
              <p><strong>Nama:</strong> {dbUserData.data[0].name}</p>
              <p><strong>Role:</strong> {dbUserData.data[0].role}</p>
              <p className="bg-yellow-100 p-2 rounded"><strong>TABLE ID:</strong><br/> {dbUserData.data[0].id}</p>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-red-600 text-slate-800 font-bold text-lg">❌ DATA TIDAK DITEMUKAN / ID MISMATCH</p>
              <p className="mt-2">
                Artinya: Kamu login sebagai UUID <strong>{authData?.id}</strong>, <br/>
                TAPI di tabel `users` tidak ada baris dengan ID tersebut.
              </p>
              <p className="mt-4 text-slate-700">
                <strong>Penyebab:</strong> Kemungkinan kamu membuat user manual di database ("Insert Row"), sehingga ID-nya digenerate acak baru, BUKAN menggunakan ID dari login yang asli.
              </p>
            </div>
          )
        )}
      </div>
      
      <div className="bg-slate-800 text-white p-6 rounded-xl">
        <h2 className="font-bold text-yellow-400 mb-2">KESIMPULAN SEMENTARA</h2>
        <p>
          Supaya RLS jalan, <strong>AUTH UUID</strong> harus SAMA PERSIS dengan <strong>TABLE ID</strong>.
          <br/>Jika berbeda, Database menganggap kamu orang asing.
        </p>
      </div>
    </div>
  );
}