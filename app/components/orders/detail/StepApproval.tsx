// app/components/orders/detail/StepApproval.tsx

import React from 'react';
import { Order } from '@/types';
import { CheckCircle, Eye, Trash2, Upload } from 'lucide-react';

interface StepApprovalProps {
  order: Order;
  canUploadApproval: boolean;
  canDeleteApprovalFile: boolean;
  onTriggerUpload: (type: string) => void;
  onFileDelete: (field: string) => void;
}

export default function StepApproval({
  order, canUploadApproval, canDeleteApprovalFile,
  onTriggerUpload, onFileDelete,
}: StepApprovalProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
      <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-sm md:text-lg">
        <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</div>
        Approval Desain
      </h3>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 gap-3">
        <div>
          {order.link_approval?.link ? (
            <>
              <div className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-200">File Desain Terupload</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Oleh: {order.link_approval.by} | {order.link_approval.timestamp}
              </div>
              <a
                href={order.link_approval.link}
                target="_blank"
                className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 mt-1 hover:underline"
              >
                <Eye className="w-3.5 h-3.5" /> Lihat File
              </a>
            </>
          ) : (
            <>
              <div className="font-bold text-sm md:text-base text-slate-400 dark:text-slate-600">File Desain</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-600 italic">Belum ada file yang diupload...</div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {order.link_approval?.link ? (
            <>
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-900/40">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase">SELESAI</span>
              </div>
              {canDeleteApprovalFile && (
                <button onClick={() => onFileDelete('approval')} className="text-red-400 hover:text-red-600 transition ml-1 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            canUploadApproval && (
              <button
                onClick={() => onTriggerUpload('approval')}
                className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition w-full sm:w-auto"
              >
                <Upload className="w-4 h-4" /> Upload File
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}