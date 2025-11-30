import React, { useState } from 'react';
import { ClipboardList, Eye, EyeOff } from 'lucide-react';
import { UserData } from '@/types';

interface LoginScreenProps {
  usersList: UserData[];
  onLogin: (user: UserData) => void;
}

export default function LoginScreen({ usersList, onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = usersList.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Username atau Password salah!');
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
              <h2 className="text-2xl font-extrabold text-slate-800">Selamat Datang</h2>
              <p className="text-slate-600 text-sm mt-1 font-medium">Silakan login untuk melanjutkan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 tracking-wide">Username</label>
                <input 
                  type="text" 
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-800 placeholder-slate-400"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
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

              <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg active:scale-[0.98] transform">
                Login System
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <strong>Default Login:</strong><br/>
              supervisor/123, admin/123, prod/123, qc/123, manager/123
            </div>
        </div>
      </div>
    </div>
  );
}