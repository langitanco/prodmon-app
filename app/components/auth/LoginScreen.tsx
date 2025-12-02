'use client';

import React, { useState } from 'react';
import { ClipboardList, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Catatan: Interface LoginScreenProps, usersList, dan onLogin dihapus karena tidak lagi relevan
// Sistem akan menggunakan Supabase Auth

export default function LoginScreen() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState(''); // Supabase menggunakan Email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Otentikasi Supabase
    const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    
    setLoading(false);

    if (loginError) {
        // Tampilkan error umum untuk keamanan
        setError('Login Gagal. Pastikan email dan password Anda benar.');
        console.error('Supabase Login Error:', loginError.message);
    } else {
        // Login berhasil, refresh session dan pindah ke dashboard
        router.refresh();
        router.push('/dashboard'); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="p-8 w-full">
            <div className="text-center mb-8">
              <div className="bg-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <ClipboardList className="w-8 h-8 text-white"/>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">Login Langitan.co</h2>
              <p className="text-slate-600 text-sm mt-1 font-medium">Masuk menggunakan email dan password Supabase</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 tracking-wide">Email</label>
                <input 
                  type="email" // Tipe input harus email
                  autoCapitalize="none"
                  autoComplete="email"
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-800 placeholder-slate-400"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 tracking-wide">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-800 placeholder-slate-400 pr-12"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
              
              {error && <div className="text-red-600 text-sm text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg active:scale-[0.98] transform disabled:bg-slate-400"
              >
                {loading ? 'Memproses...' : 'Login System'}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              Gunakan akun yang sudah terdaftar di Supabase Auth.
            </div>
        </div>
      </div>
    </div>
  );
}