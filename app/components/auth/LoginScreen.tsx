'use client';

import React, { useState } from 'react';
import { ClipboardList, Eye, EyeOff } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginScreen() {
  // Setup Client Supabase (Otak Baru)
  const supabase = createClientComponentClient();

  // State untuk Input & UI (Wajah Lama)
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
      // --- LOGIKA BARU (SISTEM COOKIES) ---
      // Login ke Supabase Auth
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (loginError) {
        throw loginError;
      }

      // Jika Sukses:
      // Kita pakai window.location.reload() agar halaman utama (page.tsx)
      // memuat ulang dan membaca Cookies sesi yang baru saja dibuat.
      window.location.reload();

    } catch (err: any) {
      // Tampilkan error jika gagal
      setError('Login Gagal. Cek Email & Password Anda.');
      console.error('Login Error:', err.message);
      setLoading(false);
    }
  };

  // --- TAMPILAN LAMA (UI DESIGN) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="p-8 w-full">
            <div className="text-center mb-8">
              <div className="bg-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <ClipboardList className="w-8 h-8 text-white"/>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">Login Langitan.co</h2>
              <p className="text-slate-600 text-sm mt-1 font-medium">Masuk Sistem Produksi</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 tracking-wide">Email</label>
                <input 
                  type="email" 
                  autoCapitalize="none"
                  autoComplete="email"
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-800 placeholder-slate-400"
                  placeholder="masukkan email..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 tracking-wide">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-800 placeholder-slate-400 pr-12"
                    placeholder="masukkan password..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="text-red-600 text-sm text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse">
                    {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg active:scale-[0.98] transform disabled:bg-slate-400 disabled:transform-none"
              >
                {loading ? 'Memproses...' : 'Masuk Sistem'}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              Pastikan akun Anda sudah terdaftar untuk bisa melanjutkan.
            </div>
        </div>
      </div>
    </div>
  );
}