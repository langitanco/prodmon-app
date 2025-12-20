// app/components/ui/ProfileModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserData } from '@/types';
import { X, Save, Camera, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import imageCompression from 'browser-image-compression'; // Import library kompresi

interface Props {
  user: UserData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function ProfileModal({ user, isOpen, onClose, onSave }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    dob: '',
    role: '',
    avatar_url: ''
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        address: user.address || '',
        dob: user.dob || '',
        role: user.role || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [isOpen, user]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // --- LOGIKA KOMPRESI ---
      // Kita kompres foto profil menjadi maksimal 200KB (sudah sangat cukup untuk avatar)
      const options = {
        maxSizeMB: 0.2, // Maksimal 200KB
        maxWidthOrHeight: 500, // Dimensi maksimal 500x500px
        useWebWorker: true,
      };

      console.log('Ukuran asli:', file.size / 1024, 'KB');
      file = await imageCompression(file, options);
      console.log('Ukuran setelah kompresi:', file.size / 1024, 'KB');

      // --- PROSES UPLOAD ---
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('production-proofs') // Gunakan bucket yang sudah ada atau buat baru
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('production-proofs')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
    } catch (error) {
      console.error('Error uploading/compressing image:', error);
      alert('Gagal memproses gambar');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-bold text-xl text-slate-800 tracking-tight">Edit Profil</h3>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">
             <X className="w-5 h-5"/>
           </button>
        </div>

        <div className="flex flex-col items-center mb-6">
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
           <div 
             onClick={!isUploading ? handleUploadClick : undefined}
             className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center relative group cursor-pointer overflow-hidden transition hover:scale-105 active:scale-95"
           >
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-slate-300 uppercase">{formData.name.charAt(0)}</span>
              )}
              
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                 {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-white"/> : <Camera className="w-6 h-6 text-white"/>}
              </div>
           </div>
           <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
             {isUploading ? 'Mengompres & Mengunggah...' : 'Klik foto untuk ganti'}
           </p>
        </div>

        <div className="space-y-4">
           <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 block">Nama Lengkap</label>
              <input 
                className="w-full border border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 block">Tgl Lahir</label>
                 <input type="date" className="w-full border border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                   value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
              </div>
              <div>
                 <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 block">Role</label>
                 <input disabled className="w-full border border-slate-200 bg-slate-100 rounded-2xl p-3.5 text-sm font-bold text-slate-400 uppercase"
                   value={formData.role} readOnly />
              </div>
           </div>

           <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 block">Alamat</label>
              <textarea className="w-full border border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none transition"
                value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
           </div>
        </div>

        <button 
          onClick={() => onSave(formData)} 
          disabled={isUploading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl mt-8 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50 active:scale-95"
        >
           {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 
           Simpan Perubahan
        </button>
      </div>
    </div>
  );
}