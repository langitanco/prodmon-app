// app/components/ui/ProfileModal.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserData } from '@/types';
import { X, Save, Camera, Loader2, Trash2, Check, ZoomIn, AlertCircle } from 'lucide-react'; // Tambah AlertCircle
import { createBrowserClient } from '@supabase/ssr';
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop'; 
import { Point, Area } from 'react-easy-crop';

interface Props {
  user: UserData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

// --- UTILITY: Fungsi Crop (Sama seperti sebelumnya) ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      const file = new File([blob], 'cropped-profile.jpg', { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg');
  });
}
// -------------------------------------------------------

export default function ProfileModal({ user, isOpen, onClose, onSave }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // State Cropping
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // State Konfirmasi Hapus (BARU)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    dob: '',
    role: '',
    avatar_url: '' as string | null
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
        avatar_url: user.avatar_url || null
      });
      setShowDeleteConfirm(false); // Reset state dialog saat modal dibuka
    }
  }, [isOpen, user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropAndUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(croppedFile, options);
      const fileExt = 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('production-proofs')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('production-proofs')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      setIsCropping(false);
      setImageSrc(null);
      
    } catch (error) {
      console.error('Gagal:', error);
      alert('Gagal memproses gambar');
    } finally {
      setIsUploading(false);
    }
  };

  // LOGIKA HAPUS BARU
  const handleDeleteRequest = () => {
    setShowDeleteConfirm(true); // Tampilkan pop up
  };

  const confirmDelete = () => {
    setFormData(prev => ({ ...prev, avatar_url: null }));
    setShowDeleteConfirm(false); // Tutup pop up
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false); // Tutup pop up
  };

  const handleSaveWrapper = () => {
    const cleanedData = {
        ...formData,
        dob: formData.dob === '' ? null : formData.dob
    };
    onSave(cleanedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Modal Utama */}
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        
        {/* === POP UP KONFIRMASI HAPUS (OVERLAY DI DALAM MODAL) === */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
             <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl p-6 w-full max-w-sm transform scale-100 animate-in zoom-in-95 duration-200 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                   <Trash2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Hapus Foto Profil?</h4>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Foto profil anda akan dihapus sementara. Perubahan akan disimpan permanen setelah anda klik tombol "Simpan Perubahan".
                </p>
                <div className="flex gap-3">
                   <button 
                     onClick={cancelDelete}
                     className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition"
                   >
                     Batal
                   </button>
                   <button 
                     onClick={confirmDelete}
                     className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition"
                   >
                     Ya, Hapus
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
           <h3 className="font-bold text-xl text-slate-800 tracking-tight">
             {isCropping ? 'Sesuaikan Foto' : 'Edit Profil'}
           </h3>
           {!isCropping && (
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">
               <X className="w-5 h-5"/>
             </button>
           )}
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto p-6 no-scrollbar relative">
            
            {/* --- MODE CROP --- */}
            {isCropping ? (
                <div className="flex flex-col h-full">
                    <div className="relative w-full h-64 bg-slate-900 rounded-xl overflow-hidden mb-4">
                        <Cropper
                            image={imageSrc!}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            cropShape="round"
                            showGrid={false}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-6">
                        <ZoomIn className="w-4 h-4 text-slate-400" />
                        <input
                          type="range"
                          value={zoom}
                          min={1}
                          max={3}
                          step={0.1}
                          onChange={(e) => setZoom(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => { setIsCropping(false); setImageSrc(null); fileInputRef.current!.value = ''; }}
                            className="py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={handleCropAndUpload}
                            disabled={isUploading}
                            className="py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                            Simpan Foto
                        </button>
                    </div>
                </div>
            ) : (
            
            /* --- MODE EDIT FORM --- */
            <>
                <div className="flex flex-col items-center mb-8 pt-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    
                    <div className="relative w-32 h-32 group">
                        
                        {/* TOMBOL HAPUS (Gunakan handleDeleteRequest) */}
                        {formData.avatar_url && (
                            <button 
                                onClick={handleDeleteRequest} // <-- Menggunakan handler baru
                                className="absolute -top-1 -right-1 z-20 p-1.5 bg-white text-red-500 rounded-full shadow-sm border border-slate-100 hover:bg-red-50 transition active:scale-90"
                                title="Hapus Foto Saat Ini"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}

                        <div className="w-full h-full rounded-full bg-slate-100 border-[5px] border-white shadow-2xl flex items-center justify-center overflow-hidden relative z-10">
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-5xl font-black text-slate-300 uppercase">{formData.name.charAt(0)}</span>
                            )}
                        </div>

                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 z-20 p-2.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 border-[3px] border-white transition active:scale-95"
                            title="Ganti Foto"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <p className="text-[10px] font-bold text-slate-400 mt-5 uppercase tracking-widest">
                        {isUploading ? 'Memproses...' : (formData.avatar_url ? 'Foto Profil Anda' : 'Belum ada foto')}
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
                            <input 
                                type="date" 
                                className="w-full border border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                                value={formData.dob} 
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })} 
                            />
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
                    onClick={handleSaveWrapper} 
                    disabled={isUploading}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl mt-8 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50 active:scale-95"
                >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 
                    Simpan Perubahan
                </button>
            </>
            )}
        </div>
      </div>
    </div>
  );
}