// app/components/orders/detail/StepProduksi.tsx

import React from 'react';
import { Order, UserData } from '@/types';
import {
  AlertTriangle, Camera, CheckCircle, Eye, MessageSquare,
  Send, ThumbsDown, ThumbsUp, Trash2, Upload, Clock, User,
} from 'lucide-react';
import ProductionNotes from './ProductionNotes';

interface StepProduksiProps {
  order: Order;
  currentUser: UserData;
  isManual: boolean;
  canUpdateStep: boolean;
  isSupervisor: boolean;
  isManagement: boolean;
  kendalaNote: string;
  setKendalaNote: (v: string) => void;
  showKendalaForm: boolean;
  setShowKendalaForm: (v: boolean) => void;
  proofingRevisiNote: string;
  setProofingRevisiNote: (v: string) => void;
  proofingStepId: string | null;
  setProofingStepId: (v: string | null) => void;
  onTriggerUpload: (type: string, stepId?: string) => void;
  onStatusStep: (stepId: string) => void;
  onSaveProofingRevisi: () => void;
  onAddKendala: () => void;
  onResolveKendala: (id: string) => void;
  onDeleteKendala: (id: string) => void;
  onFileDelete: (field: string, isStep?: boolean, stepId?: string) => void;
}

export default function StepProduksi({
  order, currentUser, isManual,
  canUpdateStep, isSupervisor, isManagement,
  kendalaNote, setKendalaNote,
  showKendalaForm, setShowKendalaForm,
  proofingRevisiNote, setProofingRevisiNote,
  proofingStepId, setProofingStepId,
  onTriggerUpload, onStatusStep, onSaveProofingRevisi,
  onAddKendala, onResolveKendala, onDeleteKendala, onFileDelete,
}: StepProduksiProps) {
  const currentSteps = isManual ? order.steps_manual : order.steps_dtf;

  return (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm md:text-lg">
          <div className="bg-slate-100 dark:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</div>
          Produksi ({order.jenis_produksi})
        </h3>
        {canUpdateStep && (
          <button
            onClick={() => setShowKendalaForm(!showKendalaForm)}
            className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {showKendalaForm ? 'Tutup Laporan' : 'Lapor Kendala'}
          </button>
        )}
      </div>

      {/* Form Kendala */}
      {showKendalaForm && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-2">Form Laporan Kendala</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tulis detail kendala"
              className="flex-1 text-sm px-3 py-2 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 dark:bg-slate-900"
              value={kendalaNote}
              onChange={e => setKendalaNote(e.target.value)}
            />
            <button
              onClick={onAddKendala}
              disabled={!kendalaNote.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-3 h-3" /> Kirim
            </button>
          </div>
        </div>
      )}

      {/* List Kendala Aktif */}
      {order.kendala && order.kendala.some(k => !k.isResolved) && (
        <div className="mb-6 space-y-3">
          {order.kendala.filter(k => !k.isResolved).map((k) => (
            <div key={k.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 md:p-4 shadow-sm flex flex-col sm:flex-row gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{k.notes}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {k.reportedBy}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {k.timestamp}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-700 pt-2 sm:pt-0 mt-1 sm:mt-0">
                {canUpdateStep && (
                  <button
                    onClick={() => onResolveKendala(k.id)}
                    className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-green-100 transition whitespace-nowrap"
                  >
                    ✓ Selesaikan
                  </button>
                )}
                {isSupervisor && (
                  <button onClick={() => onDeleteKendala(k.id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List Steps */}
      <div className="space-y-4">
        {currentSteps?.map((s) => {
          const step = s as any;
          const isProofingStep = step.name.toLowerCase().includes('proofing');
          const hasFileUploaded = !!step.fileUrl;
          const isStepCompleted = step.isCompleted;
          const hasRevisionNote = step.proofing_note;
          const isInRevisionMode = hasRevisionNote && !isStepCompleted;
          const showProofingActions = isProofingStep && hasFileUploaded && !isStepCompleted && isManagement && !isInRevisionMode;
          const isEditingRevisi = proofingStepId === step.id;

          return (
            <div key={step.id} className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className={`font-bold text-sm md:text-base ${step.isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                    {step.name}
                  </div>

                  {hasRevisionNote && !step.isCompleted && (
                    <div className="mt-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/50 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-[10px] uppercase">Catatan Revisi:</span>
                        {step.proofing_note}
                      </div>
                    </div>
                  )}

                  {step.isCompleted && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Oleh: {step.uploadedBy} | {step.timestamp}
                    </div>
                  )}

                  {step.fileUrl && (
                    <a href={step.fileUrl} target="_blank" className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 mt-1 hover:underline">
                      <Eye className="w-3.5 h-3.5" /> Lihat Bukti
                    </a>
                  )}
                </div>

                {step.isCompleted ? (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-900/40">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase">SELESAI</span>
                    {canUpdateStep && (
                      <button onClick={() => onFileDelete('step', true, step.id)} className="text-red-400 hover:text-red-600 transition ml-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {isProofingStep && isInRevisionMode && canUpdateStep ? (
                      <button
                        onClick={() => onTriggerUpload('step', step.id)}
                        className="bg-orange-600 text-white border-2 border-orange-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-orange-700 shadow-md transition w-full sm:w-auto animate-pulse"
                      >
                        <Upload className="w-4 h-4" /> Upload Ulang (Revisi)
                      </button>
                    ) : (
                      canUpdateStep && (
                        showProofingActions ? (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => setProofingStepId(isEditingRevisi ? null : step.id)}
                              className="flex-1 sm:flex-none bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center justify-center gap-1.5"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" /> Revisi
                            </button>
                            <button
                              onClick={() => onStatusStep(step.id)}
                              className="flex-1 sm:flex-none bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition flex items-center justify-center gap-1.5"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" /> Siap Produksi
                            </button>
                          </div>
                        ) : (
                          step.type === 'status_update' ? (
                            <button
                              onClick={() => onStatusStep(step.id)}
                              className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm transition w-full sm:w-auto"
                            >
                              Tandai Selesai
                            </button>
                          ) : (
                            <button
                              onClick={() => onTriggerUpload('step', step.id)}
                              className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition w-full sm:w-auto"
                            >
                              <Camera className="w-4 h-4" /> {step.fileUrl ? 'Ganti Foto' : 'Upload Foto'}
                            </button>
                          )
                        )
                      )
                    )}
                  </>
                )}
              </div>

              {/* Form Revisi Proofing */}
              {isEditingRevisi && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                    Catatan Revisi untuk Tim Produksi:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Misal: Warna kurang terang, sablon miring..."
                      className="flex-1 text-sm px-3 py-2 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:border-red-500 dark:bg-slate-900"
                      value={proofingRevisiNote}
                      onChange={(e) => setProofingRevisiNote(e.target.value)}
                    />
                    <button
                      onClick={onSaveProofingRevisi}
                      disabled={!proofingRevisiNote.trim()}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-700 disabled:opacity-50"
                    >
                      Kirim
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Catatan Produksi ─────────────────────────────────────────────── */}
      <ProductionNotes
        orderId={order.id}
        kodeProduksi={order.kode_produksi}
        namaPemesan={order.nama_pemesan}
        section="produksi"
        currentUser={currentUser}
      />
    </div>
  );
}