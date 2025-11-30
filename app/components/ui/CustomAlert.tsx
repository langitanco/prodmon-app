import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
          <div className={`p-4 flex items-center gap-3 ${alertState.type === 'error' ? 'bg-red-50' : alertState.type === 'confirm' ? 'bg-blue-50' : 'bg-green-50'}`}>
            {alertState.type === 'error' ? <AlertCircle className="w-6 h-6 text-red-600"/> : 
             alertState.type === 'confirm' ? <AlertTriangle className="w-6 h-6 text-blue-600"/> : 
             <CheckCircle className="w-6 h-6 text-green-600"/>}
            <h3 className={`font-bold text-lg ${alertState.type === 'error' ? 'text-red-800' : alertState.type === 'confirm' ? 'text-blue-800' : 'text-green-800'}`}>
              {alertState.title}
            </h3>
          </div>
          <div className="p-6">
            <p className="text-slate-600 font-medium">{alertState.message}</p>
          </div>
          <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
            {alertState.type === 'confirm' && (
              <button 
                onClick={closeAlert}
                className="px-4 py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 transition"
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
              className={`px-6 py-2 rounded-lg text-white font-bold text-sm shadow-lg transition transform active:scale-95 ${alertState.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {alertState.type === 'confirm' ? 'Ya, Lanjutkan' : 'OK'}
            </button>
          </div>
      </div>
    </div>
  );
}