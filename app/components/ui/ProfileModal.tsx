// app/components/ui/ProfileModal.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserData } from '@/types';
import { X, Save, Camera, Loader2, Trash2, Check, ZoomIn, Image as ImageIcon, ChevronRight } from 'lucide-react'; 
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

// --- UTILITY: Fungsi Crop ---
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
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], 'cropped-profile.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg');
  });
}

export default function ProfileModal({ user, isOpen, onClose, onSave }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false); // State untuk menu pilihan

  const [formData, setFormData] = useState({
    name: '', address: '', dob: '', role: '', avatar_url: '' as string | null
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
      setShowDeleteConfirm(false);
      setShowPhotoMenu(false);
    }
  }, [isOpen, user]);

  // Handle klik di luar menu untuk menutup menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPhotoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
        setIsCropping(true);
        setShowPhotoMenu(false);
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
      const compressedFile = await imageCompression(croppedFile, { maxSizeMB: 0.2, maxWidthOrHeight: 500, useWebWorker: true });
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('production-proofs').upload(`avatars/${fileName}`, compressedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('production-proofs').getPublicUrl(`avatars/${fileName}`);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      setIsCropping(false);
      setImageSrc(null);
    } catch (error) {
      alert('Gagal memproses gambar');
    } finally { setIsUploading(false); }
  };

  const confirmDelete = () => {
    setFormData(prev => ({ ...prev, avatar_url: null }));
    setShowDeleteConfirm(false);
    setShowPhotoMenu(false);
  };

  const handleSaveWrapper = () => {
    onSave({ ...formData, dob: formData.dob === '' ? null : formData.dob });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
      
      <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative border dark:border-slate-800">
        
        {/* === POP UP KONFIRMASI HAPUS (Gaya CustomAlert) === */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-[70] bg-white/90 dark:bg-slate-900/90 flex items-center justify-center p-6 animate-in fade-in duration-200">
             <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-3xl p-6 w-full max-w-sm transform scale-100 animate-in zoom-in-95 duration-200 text-center">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                   <Trash2 className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Foto?</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                  Foto profil Anda akan dihapus. Klik simpan untuk menerapkan secara permanen.
                </p>
                <div className="flex gap-3">
                   <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                     Batal
                   </button>
                   <button onClick={confirmDelete} className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition">
                     Ya, Hapus
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
           <h3 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">
             {isCropping ? 'Sesuaikan Foto' : 'Edit Profil'}
           </h3>
           {!isCropping && (
             <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition">
               <X className="w-5 h-5"/>
             </button>
           )}
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto p-6 no-scrollbar">
            {isCropping ? (
                /* --- MODE CROP --- */
                <div className="flex flex-col h-full">
                    <div className="relative w-full h-64 bg-slate-900 rounded-[24px] overflow-hidden mb-4 border dark:border-slate-700">
                        <Cropper image={imageSrc!} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} cropShape="round" showGrid={false} />
                    </div>
                    <div className="flex items-center gap-2 mb-6">
                        <ZoomIn className="w-4 h-4 text-slate-400" />
                        <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { setIsCropping(false); setImageSrc(null); }} className="py-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Batal</button>
                        <button onClick={handleCropAndUpload} disabled={isUploading} className="py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50">
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>} Simpan Foto
                        </button>
                    </div>
                </div>
            ) : (
                /* --- MODE EDIT FORM --- */
                <>
                    <div className="flex flex-col items-center mb-8 pt-2">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        
                        <div className="relative w-32 h-32">
                            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 border-[5px] border-white dark:border-slate-900 shadow-2xl flex items-center justify-center overflow-hidden relative z-10">
                                {formData.avatar_url ? <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-5xl font-black text-slate-300 dark:text-slate-700 uppercase">{formData.name.charAt(0)}</span>}
                            </div>
                            
                            {/* TOMBOL KAMERA SEKARANG SEBAGAI MENU TOGGLE */}
                            <div className="absolute -bottom-1 -right-1 z-20" ref={menuRef}>
                                <button 
                                    onClick={() => setShowPhotoMenu(!showPhotoMenu)} 
                                    className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 border-[3px] border-white dark:border-slate-900 transition active:scale-95" 
                                    title="Opsi Foto"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>

                                {/* MENU PILIHAN (POP-UP KECIL) */}
                                {showPhotoMenu && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                        >
                                            <ImageIcon className="w-4 h-4 text-blue-500" />
                                            <span>Pilih Foto Baru</span>
                                        </button>
                                        
                                        {formData.avatar_url && (
                                            <button 
                                                onClick={() => { setShowDeleteConfirm(true); setShowPhotoMenu(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition border-t border-slate-50 dark:border-slate-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>Hapus Foto</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 mt-5 uppercase tracking-widest">{isUploading ? 'Memproses...' : 'Foto Profil'}</p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Nama Lengkap</label>
                            <input className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Tgl Lahir</label>
                                <input type="date" className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-blue-500 transition [color-scheme:light] dark:[color-scheme:dark]" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2 block">Role</label>
                                <input disabled className="w-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-4 text-sm font-bold text-slate-400 dark:text-slate-600 uppercase" value={formData.role} readOnly />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Alamat</label>
                            <textarea className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none transition" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                    </div>

                    <button onClick={handleSaveWrapper} disabled={isUploading} className="w-full bg-blue-600 text-white font-bold py-5 rounded-3xl mt-8 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-200 dark:shadow-none disabled:opacity-50 active:scale-95">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Simpan Perubahan
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
}