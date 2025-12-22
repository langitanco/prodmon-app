// app/(auth)/login/page.tsx (atau lokasi file LoginScreen Anda)
'use client';

import React, { useState } from 'react';
import { ClipboardList, Eye, EyeOff } from 'lucide-react';
// PERBAIKAN: Menggunakan library baru @supabase/ssr
import { createBrowserClient } from '@supabase/ssr';

export default function LoginScreen() {
  // PERBAIKAN: Inisiasi Client Supabase dengan cara baru
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // State untuk Input & UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login ke Supabase Auth
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (loginError) {
        throw loginError;
      }

      // Refresh halaman agar middleware mendeteksi cookie baru
      window.location.reload();

    } catch (err: any) {
      setError('Login Gagal. Cek Email & Password Anda.');
      console.error('Login Error:', err.message);
      setLoading(false);
    }
  };

  return (
    // FIX: Background adaptif (Light: slate-100, Dark: slate-950)
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 transition-colors duration-300">
      
      {/* FIX: Card Background (Light: white, Dark: slate-800 + Border halus) */}
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl dark:shadow-black/50 overflow-hidden flex flex-col md:flex-row border border-transparent dark:border-slate-700 transition-all duration-300">
        <div className="p-8 w-full">
            <div className="text-center mb-8">
              {/* Icon Box tetap biru agar branding konsisten */}
              <div className="bg-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <ClipboardList className="w-8 h-8 text-white"/>
              </div>
              
              {/* FIX: Text Color Adaptif */}
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white transition-colors">
                Login Langitan.co
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium transition-colors">
                Masuk Sistem Produksi
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                {/* FIX: Label Color */}
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 tracking-wide transition-colors">
                  Email
                </label>
                {/* FIX: Input Styles (Dark Mode: bg-slate-900, text-white, border-slate-700) */}
                <input 
                  type="email" 
                  autoCapitalize="none"
                  autoComplete="email"
                  className="w-full p-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-transparent dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="masukkan email..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 tracking-wide transition-colors">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="w-full p-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-transparent dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 pr-12"
                    placeholder="masukkan password..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {error && (
                // FIX: Error Box Dark Mode (Red background with transparency)
                <div className="text-red-600 dark:text-red-400 text-sm text-center font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800/50 animate-pulse transition-colors">
                    {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg active:scale-[0.98] transform disabled:bg-slate-400 disabled:transform-none"
              >
                {loading ? 'Memproses...' : 'Login'}
              </button>
            </form>

            {/* FIX: Footer Note Dark Mode */}
            <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
              Pastikan akun Anda sudah terdaftar untuk bisa melanjutkan.
            </div>
        </div>
      </div>
    </div>
  );
}