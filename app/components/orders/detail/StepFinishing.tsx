// app/components/orders/detail/StepFinishing.tsx
import React from 'react';
import { Order, UserData } from '@/types';
import { AlertTriangle, Camera, CheckCircle, Eye, Package, Trash2 } from 'lucide-react';
import ProductionNotes from './ProductionNotes';

interface StepFinishingProps {
  order: Order;
  currentUser: UserData;
  isRevisi: boolean;
  canCheckQC: boolean;
  canUpdatePacking: boolean;
  canUpdateShipping: boolean;
  canResetQC: boolean;
  canDeleteFinishingFile: boolean;
  qcNote: string;
  setQcNote: (v: string) => void;
  onQC: (pass: boolean) => void;
  onDeleteQC: () => void;
  onRevisiSelesai: () => void;
  onTriggerUpload: (type: string) => void;
  onFileDelete: (field: string) => void;
}

export default function StepFinishing({
  order, currentUser, isRevisi,
  canCheckQC, canUpdatePacking, canUpdateShipping,
  canResetQC, canDeleteFinishingFile,
  qcNote, setQcNote,
  onQC, onDeleteQC, onRevisiSelesai,
  onTriggerUpload, onFileDelete,
}: StepFinishingProps) {
  return (
    <>
      {/* --- STEP 3: QC & PACKING --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* KIRI: QC */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="bg-slate-100 dark:bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-xs text-slate-600 dark:text-slate-400 font-bold">3a</div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">Quality Control</h3>
          </div>

          {isRevisi && order.finishing_qc.notes && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl mb-4">
              <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Alasan Revisi:
              </p>
              <p className="text-xs text-red-900 dark:text-red-200 font-medium italic">"{order.finishing_qc.notes}"</p>
            </div>
          )}

          {isRevisi && canCheckQC && (
            <button
              onClick={onRevisiSelesai}
              className="w-full bg-white dark:bg-slate-800 border-2 border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 py-3 rounded-xl font-bold text-xs uppercase hover:bg-red-50 transition mb-4"
            >
              ✓ Konfirmasi Revisi Selesai
            </button>
          )}

          {order.finishing_qc.isPassed ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl border-2 border-dashed border-green-200 dark:border-green-800 text-center min-h-[160px]">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-2">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-bold text-green-800 dark:text-green-400">Lolos QC</h4>
              <p className="text-[10px] text-green-600 dark:text-green-500 mt-1">Oleh: {order.finishing_qc.checkedBy}</p>
              {canResetQC && (
                <button onClick={onDeleteQC} className="text-red-500 dark:text-red-400 text-[10px] mt-4 hover:underline">
                  Reset
                </button>
              )}
            </div>
          ) : (
            canCheckQC ? (
              <div className="flex-1 flex flex-col">
                <textarea
                  placeholder="Catatan QC (Wajib jika revisi)..."
                  className="w-full text-sm p-3 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none transition mb-3 resize-none h-32"
                  value={qcNote}
                  onChange={e => setQcNote(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button
                    onClick={() => onQC(false)}
                    disabled={!qcNote.trim()}
                    className="bg-white dark:bg-slate-800 border-2 border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 py-2.5 rounded-xl font-bold text-xs hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    REVISI
                  </button>
                  <button
                    onClick={() => onQC(true)}
                    className="bg-blue-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 shadow-md transition"
                  >
                    LOLOS QC
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/50 min-h-[160px]">
                <span className="text-xs text-slate-400 dark:text-slate-600 font-medium italic">
                  {!isRevisi ? 'Menunggu produksi selesai...' : 'Sedang Revisi'}
                </span>
              </div>
            )
          )}

          {/* Catatan QC & Finishing */}
          <ProductionNotes
            orderId={order.id}
            kodeProduksi={order.kode_produksi}
            namaPemesan={order.nama_pemesan}
            section="finishing"
            currentUser={currentUser}
          />
        </div>

        {/* KANAN: PACKING */}
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border dark:border-slate-800 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="bg-slate-100 dark:bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-xs text-slate-600 dark:text-slate-400 font-bold">3b</div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">Packing</h3>
          </div>

          {order.finishing_packing.isPacked ? (
            <div className="flex-1 flex flex-col p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group min-h-[160px]">
              {order.finishing_packing.fileUrl ? (
                <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700">
                  <img src={order.finishing_packing.fileUrl} alt="Packing" className="w-full h-full object-cover" />
                  <a
                    href={order.finishing_packing.fileUrl}
                    target="_blank"
                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-300 font-bold text-xs"
                  >
                    <Eye className="w-4 h-4 mr-1" /> Lihat
                  </a>
                </div>
              ) : (
                <div className="flex justify-center mb-3">
                  <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold text-sm bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-100 dark:border-green-800">
                  <CheckCircle className="w-4 h-4" /> Selesai
                </div>
                {canDeleteFinishingFile && (
                  <button
                    onClick={() => onFileDelete('packing')}
                    className="flex items-center gap-1 text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 px-2 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus
                  </button>
                )}
              </div>
              {order.finishing_packing.packedBy && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                  Di-pack oleh:{' '}
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {order.finishing_packing.packedBy}
                  </span>
                  {order.finishing_packing.timestamp && (
                    <> · {new Date(order.finishing_packing.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}</>
                  )}
                </p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {canUpdatePacking ? (
                <button
                  onClick={() => onTriggerUpload('packing')}
                  className="bg-purple-600 text-white w-full py-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 shadow-md hover:bg-purple-700 transition duration-200"
                >
                  <Camera className="w-6 h-6" />
                  <span>UPLOAD FOTO</span>
                </button>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl w-full min-h-[160px] flex flex-col justify-center items-center">
                  <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs text-slate-400 dark:text-slate-600 italic">Menunggu QC Lolos</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- STEP 4: PENGIRIMAN --- */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 text-sm md:text-lg">
          <div className="bg-slate-100 dark:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</div>
          Pengiriman
        </h3>
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 space-y-4">
          {/* Bukti Kirim */}
          <div className="flex justify-between items-center">
            <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">Bukti Kirim (Resi)</span>
            {order.shipping.bukti_kirim ? (
              <div className="flex gap-2 items-center">
                <a href={order.shipping.bukti_kirim} target="_blank" className="text-green-600 dark:text-green-400 font-bold underline text-xs">LIHAT RESI</a>
                {canDeleteFinishingFile && (
                  <button onClick={() => onFileDelete('shipping_kirim')} className="text-red-500 dark:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              canUpdateShipping
                ? <button onClick={() => onTriggerUpload('shipping_kirim')} className="text-[10px] md:text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold shadow-md">UPLOAD RESI</button>
                : <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">Menunggu pengerjaan & packing selesai...</span>
            )}
          </div>

          {/* Bukti Terima */}
          <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-4">
            <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">Bukti Terima (User)</span>
            {order.shipping.bukti_terima ? (
              <div className="flex gap-2 items-center">
                <a href={order.shipping.bukti_terima} target="_blank" className="text-orange-600 dark:text-orange-400 font-bold underline text-xs">LIHAT BUKTI</a>
                {canDeleteFinishingFile && (
                  <button onClick={() => onFileDelete('shipping_terima')} className="text-red-500 dark:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              canUpdateShipping && order.shipping.bukti_kirim
                ? <button onClick={() => onTriggerUpload('shipping_terima')} className="text-[10px] md:text-xs bg-orange-600 text-white px-3 py-2 rounded-lg font-bold shadow-md">UPLOAD TERIMA</button>
                : <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">-</span>
            )}
          </div>
        </div>

        {/* Catatan Pengiriman */}
        <ProductionNotes
          orderId={order.id}
          kodeProduksi={order.kode_produksi}
          namaPemesan={order.nama_pemesan}
          section="pengiriman"
          currentUser={currentUser}
        />
      </div>
    </>
  );
}