// app/components/ui/CustomAlert.tsx

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Trash2, X } from 'lucide-react';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'confirm';
  onConfirm?: () => void;
}

interface CustomAlertProps {
  alertState: AlertState;
  closeAlert: () => void;
}

export default function CustomAlert({ alertState, closeAlert }: CustomAlertProps) {
  if (!alertState.isOpen) return null;

  // Pemilihan Icon dan Warna berdasarkan tipe
  const getConfig = () => {
    switch (alertState.type) {
      case 'error':
        return { 
          icon: <AlertCircle className="w-6 h-6" />, 
          colorClass: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
          btnClass: 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none'
        };
      case 'confirm':
        return { 
          icon: <AlertTriangle className="w-6 h-6" />, 
          colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
          btnClass: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
        };
      default:
        return { 
          icon: <CheckCircle className="w-6 h-6" />, 
          colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
          btnClass: 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-none'
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-3xl p-6 w-full max-w-sm transform scale-100 animate-in zoom-in-95 duration-200 text-center relative overflow-hidden">
        
        {/* Tombol Close di Pojok (Opsional) */}
        <button onClick={closeAlert} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
          <X className="w-4 h-4" />
        </button>

        {/* Lingkaran Icon */}
        <div className={`w-14 h-14 ${config.colorClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
           {config.icon}
        </div>

        {/* Judul & Pesan */}
        <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{alertState.title}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          {alertState.message}
        </p>

        {/* Tombol Aksi */}
        <div className="flex gap-3">
           {alertState.type === 'confirm' && (
              <button 
                onClick={closeAlert}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
           )}
           <button 
             onClick={() => {
               if (alertState.type === 'confirm' && alertState.onConfirm) {
                 alertState.onConfirm();
               }
               closeAlert();
             }}
             className={`flex-1 py-3 rounded-2xl text-white font-bold text-sm transition shadow-lg active:scale-95 ${config.btnClass}`}
           >
             {alertState.type === 'confirm' ? 'Ya, Lanjutkan' : 'Mengerti'}
           </button>
        </div>
      </div>
    </div>
  );
}