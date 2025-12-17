// app/components/orders/OrderDetail.tsx

import React, { useState } from 'react';
import { formatDate, getStatusColor, openWA, getDeadlineStatus } from '@/lib/utils';
import { Order, UserData, KendalaNote } from '@/types';
import { 
  AlertTriangle, Camera, CheckCircle, ChevronRight, Eye, MessageSquare, 
  Package, Pencil, Phone, Trash2, Upload, X, Clock, User, Send
} from 'lucide-react';

interface OrderDetailProps {
  currentUser: UserData;
  order: Order;
  onBack: () => void;
  onEdit: () => void;
  onTriggerUpload: (type: string, stepId?: string, kendalaId?: string) => void;
  onUpdateOrder: (updatedOrder: Order) => void;
  onDelete: (id: string) => void;
  onConfirm: (title: string, msg: string, action: () => void) => void;
}

export default function OrderDetail({ currentUser, order, onBack, onEdit, onTriggerUpload, onUpdateOrder, onDelete, onConfirm }: OrderDetailProps) {
  const [qcNote, setQcNote] = useState(order.finishing_qc.notes || '');
  const [kendalaNote, setKendalaNote] = useState('');
  const [showKendalaForm, setShowKendalaForm] = useState(false);
  
  // --- LOGIKA HAK AKSES ---
  const isSupervisor = currentUser.role === 'supervisor';
  const perms = currentUser.permissions;

  const jenisProd = order.jenis_produksi?.toLowerCase() || '';
  const isManual = jenisProd === 'manual' || jenisProd === 'sablon';
  const isDTF = jenisProd === 'dtf' || jenisProd === 'digital';
  const prodPerms = isManual ? perms?.prod_manual : (isDTF ? perms?.prod_dtf : null);

  // --- LOGIKA STATUS & KONDISI ---
  const currentStatus = order.status;
  const isLate = getDeadlineStatus(order.deadline, order.status) === 'overdue';
  const isRevisi = currentStatus === 'Revisi';
  
  const currentSteps = isManual ? order.steps_manual : order.steps_dtf;
  const isProductionFinished = currentSteps && currentSteps.length > 0 && currentSteps.every(s => s.isCompleted);

  // --- IZIN TOMBOL ---
  const canUpdateStep = isSupervisor || (prodPerms?.step_process && (currentStatus === 'On Process' || currentStatus === 'Revisi' || currentStatus === 'Ada Kendala'));
  const canCheckQC = isSupervisor || (perms?.finishing?.qc_check && (currentStatus === 'Finishing' || isProductionFinished));
  const canUpdatePacking = isSupervisor || (perms?.finishing?.packing_update && order.finishing_qc.isPassed);
  const canUpdateShipping = isSupervisor || (perms?.finishing?.shipping_update && (currentStatus === 'Kirim' || currentStatus === 'Selesai'));

  const canEditOrderInfo = isSupervisor || perms?.orders?.edit;
  const canDeleteOrder = isSupervisor || perms?.orders?.delete;
  const canUploadApproval = isSupervisor || perms?.orders?.edit;
  const canDeleteApprovalFile = isSupervisor || prodPerms?.delete_files;
  const canDeleteStepFile = isSupervisor || prodPerms?.delete_files;
  const canResetQC = isSupervisor || perms?.finishing?.qc_reset;
  const canDeleteFinishingFile = isSupervisor || perms?.finishing?.delete_files;

  // --- HANDLERS ---
  const handleStatusStep = (stepId: string) => {
    const updated = JSON.parse(JSON.stringify(order));
    const steps = isManual ? updated.steps_manual : updated.steps_dtf;
    const idx = steps.findIndex((s: any) => s.id === stepId);
    if (idx >= 0) { 
      steps[idx].isCompleted = true; 
      steps[idx].uploadedBy = currentUser.name; 
      steps[idx].timestamp = new Date().toLocaleString(); 
    }
    const allDone = steps.every((s: any) => s.isCompleted);
    if (allDone && updated.status === 'On Process') { updated.status = 'Finishing'; }
    onUpdateOrder(updated);
  };

  const handleQC = (pass: boolean) => {
    const updated = JSON.parse(JSON.stringify(order));
    updated.finishing_qc = { isPassed: pass, notes: pass ? 'Lolos QC' : qcNote, checkedBy: currentUser.name, timestamp: new Date().toLocaleString() };
    if (!pass) updated.status = 'Revisi';
    onUpdateOrder(updated); 
  };

  const handleDeleteQC = () => {
    if (!onConfirm) return;
    onConfirm('Reset Status QC?', 'Status QC akan dikembalikan ke belum dicek.', () => {
      const updated = JSON.parse(JSON.stringify(order));
      updated.finishing_qc = { isPassed: false, notes: '', checkedBy: '', timestamp: '' };
      onUpdateOrder(updated);
    });
  };

  const handleRevisiSelesai = () => {
    if (!onConfirm) return;
    onConfirm('Selesaikan Revisi?', 'Status akan kembali ke On Process.', () => {
        const updated = JSON.parse(JSON.stringify(order));
        updated.status = 'On Process'; 
        updated.finishing_qc.isPassed = false; 
        onUpdateOrder(updated);
    });
  };

  const handleAddKendala = () => {
    if (!kendalaNote.trim()) return;
    const updated = JSON.parse(JSON.stringify(order));
    if (!updated.kendala) updated.kendala = [];
    updated.kendala.push({ id: Date.now().toString(), notes: kendalaNote, reportedBy: currentUser.name, timestamp: new Date().toLocaleString(), isResolved: false });
    updated.status = 'Ada Kendala'; 
    onUpdateOrder(updated);
    setKendalaNote('');
    setShowKendalaForm(false);
  };

  const handleResolveKendala = (kendalaId: string) => {
    const updated = JSON.parse(JSON.stringify(order));
    const idx = updated.kendala.findIndex((k: KendalaNote) => k.id === kendalaId);
    if (idx >= 0) {
      updated.kendala[idx].isResolved = true;
      updated.kendala[idx].resolvedBy = currentUser.name;
      updated.kendala[idx].resolvedTimestamp = new Date().toLocaleString();
    }
    const stillHasKendala = updated.kendala.some((k: any) => !k.isResolved);
    if (!stillHasKendala) {
        const steps = isManual ? updated.steps_manual : updated.steps_dtf;
        const allStepsDone = steps && steps.every((s:any) => s.isCompleted);
        updated.status = allStepsDone ? 'Finishing' : 'On Process';
    }
    onUpdateOrder(updated);
  };

  const handleDeleteKendala = (kendalaId: string) => {
      if (!onConfirm) return;
      onConfirm('Hapus Laporan?', 'Laporan kendala ini akan dihapus permanen.', () => {
        const updated = JSON.parse(JSON.stringify(order));
        updated.kendala = updated.kendala.filter((k: KendalaNote) => k.id !== kendalaId);
        if (updated.kendala.length === 0 || updated.kendala.every((k:any) => k.isResolved)) {
            if (updated.status === 'Ada Kendala') {
                 const steps = isManual ? updated.steps_manual : updated.steps_dtf;
                 const allStepsDone = steps && steps.every((s:any) => s.isCompleted);
                 updated.status = allStepsDone ? 'Finishing' : 'On Process';
            }
        }
        onUpdateOrder(updated);
      });
  };

  const handleFileDelete = (field: string, isStep = false, stepId?: string) => {
      if (!onConfirm) return;
      onConfirm('Hapus File/Bukti?', 'File tidak bisa dikembalikan.', () => {
        const updated = JSON.parse(JSON.stringify(order));
        if (isStep && stepId) {
          const steps = isManual ? updated.steps_manual : updated.steps_dtf;
          const idx = steps.findIndex((s: any) => s.id === stepId);
          if(idx>=0) { steps[idx].isCompleted=false; steps[idx].fileUrl=null; }
        } 
        else if (field === 'approval') updated.link_approval = null;
        else if (field === 'packing') { updated.finishing_packing.isPacked=false; updated.finishing_packing.fileUrl=null; }
        else if (field === 'shipping_kirim') updated.shipping.bukti_kirim=null; 
        else if (field === 'shipping_terima') updated.shipping.bukti_terima=null;
        onUpdateOrder(updated);
      });
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24">
      {/* HEADER ACTIONS */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="text-xs md:text-sm text-slate-500 hover:text-blue-600 flex items-center gap-2 font-bold p-2 -ml-2 rounded-lg hover:bg-slate-100 transition">
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 rotate-180"/> Kembali
        </button>
        <div className="flex gap-2">
          {canEditOrderInfo && <button onClick={onEdit} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm transition"> <Pencil className="w-3 h-3"/> Edit </button>}
          {canDeleteOrder && <button onClick={() => onDelete(order.id)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-red-700 shadow-sm transition"> <Trash2 className="w-3 h-3"/> Hapus </button>}
        </div>
      </div>
      
      {/* HEADER INFO & STATUS */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-1">{order.nama_pemesan}</h1>
            <div className="text-xs md:text-sm text-slate-500 font-medium flex flex-wrap gap-2 md:gap-3 items-center">
              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">#{order.kode_produksi}</span>
              <span>{order.jumlah} Pcs</span>
              <span className={isLate ? 'text-red-600 font-bold' : ''}>{formatDate(order.deadline)}</span>
              <button onClick={() => openWA(order.no_hp)} className="bg-green-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1"> <Phone className="w-3 h-3"/> WA </button>
            </div>
        </div>

        <div className="flex flex-col gap-2 items-end w-full md:w-auto">
            <div className={`px-4 py-2 rounded-xl font-black text-xs md:text-sm border uppercase tracking-wider text-center w-full md:w-auto shadow-sm ${getStatusColor(order.status)}`}>
               {order.status}
            </div>
            {isLate && (
               <div className="px-4 py-2 rounded-xl font-black text-xs md:text-sm border border-red-200 bg-red-100 text-red-700 uppercase tracking-wider text-center w-full md:w-auto">
                  TELAT DEADLINE
               </div>
            )}
        </div>
      </div>

      {/* --- STEP 1: APPROVAL DESAIN (Redesain: Menyamakan dengan Step Produksi) --- */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm md:text-lg"> 
            <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</div> Approval Desain
          </h3>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 last:border-0 gap-3">
              {/* BAGIAN KIRI: Info & Link */}
              <div>
                 {order.link_approval?.link ? (
                    <>
                       <div className="font-bold text-sm md:text-base text-slate-800">File Desain Terupload</div>
                       <div className="text-[10px] text-slate-500">Oleh: {order.link_approval.by} | {order.link_approval.timestamp}</div>
                       <a href={order.link_approval.link} target="_blank" className="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-1 hover:underline">
                          <Eye className="w-3.5 h-3.5"/> Lihat File
                       </a>
                    </>
                 ) : (
                    <>
                       <div className="font-bold text-sm md:text-base text-slate-400">File Desain</div>
                       <div className="text-[10px] text-slate-400 italic">Belum ada file yang diupload...</div>
                    </>
                 )}
              </div>

              {/* BAGIAN KANAN: Tombol Aksi */}
              <div className="flex items-center gap-2">
                 {order.link_approval?.link ? (
                    // KONDISI: SUDAH ADA FILE (Tampil Badge Selesai + Hapus)
                    <>
                       <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                          <CheckCircle className="w-4 h-4 text-green-600"/> 
                          <span className="text-[10px] font-bold text-green-700 uppercase">SELESAI</span>
                       </div>
                       {canDeleteApprovalFile && (
                          <button 
                             onClick={() => handleFileDelete('approval')} 
                             className="text-red-400 hover:text-red-600 transition ml-1 p-1"
                             title="Hapus File"
                          >
                             <Trash2 className="w-4 h-4"/>
                          </button>
                       )}
                    </>
                 ) : (
                    // KONDISI: BELUM ADA FILE (Tampil Tombol Upload)
                    canUploadApproval && (
                       <button 
                          onClick={() => onTriggerUpload('approval')} 
                          className="bg-white border-2 border-slate-200 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 transition w-full sm:w-auto"
                       >
                          <Upload className="w-4 h-4"/> Upload File
                       </button>
                    )
                 )}
              </div>
          </div>
      </div>

      {/* --- STEP 2: PRODUKSI --- */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-lg"> <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</div> Produksi ({order.jenis_produksi}) </h3>
            {canUpdateStep && (
              <button onClick={() => setShowKendalaForm(!showKendalaForm)} className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-slate-200 transition"> <MessageSquare className="w-3.5 h-3.5"/> {showKendalaForm ? 'Tutup Laporan' : 'Lapor Kendala'} </button>
            )}
          </div>

          {/* FORM LAPOR KENDALA */}
          {showKendalaForm && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Form Laporan Kendala</h4>
              <div className="flex gap-2">
                 <input 
                    type="text" 
                    placeholder="Tulis detail kendala (misal: Mesin macet, bahan habis)..." 
                    className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" 
                    value={kendalaNote} 
                    onChange={e => setKendalaNote(e.target.value)} 
                 />
                 <button onClick={handleAddKendala} disabled={!kendalaNote.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    <Send className="w-3 h-3"/> Kirim
                 </button>
              </div>
            </div>
          )}

          {/* DAFTAR KENDALA */}
          {order.kendala && order.kendala.some(k => !k.isResolved) && (
             <div className="mb-6 space-y-3">
                {order.kendala.filter(k => !k.isResolved).map((k) => (
                   <div key={k.id} className="bg-white border border-slate-200 rounded-xl p-3 md:p-4 shadow-sm flex flex-col sm:flex-row gap-3">
                      
                      {/* WRAPPER KONTEN (ATAS DI HP, KIRI DI LAPTOP) */}
                      <div className="flex items-start gap-3 flex-1">
                          <div className="bg-orange-100 p-2 rounded-full flex-shrink-0">
                             <AlertTriangle className="w-4 h-4 text-orange-600"/>
                          </div>
                          <div>
                             <p className="font-bold text-slate-800 text-sm mb-1">{k.notes}</p>
                             <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1"><User className="w-3 h-3"/> {k.reportedBy}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {k.timestamp}</span>
                             </div>
                          </div>
                      </div>

                      {/* WRAPPER TOMBOL (BAWAH DI HP, KANAN DI LAPTOP) */}
                      <div className="flex items-center justify-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 mt-1 sm:mt-0">
                         {canUpdateStep && (
                            <button onClick={() => handleResolveKendala(k.id)} className="bg-green-50 text-green-700 border border-green-200 text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-green-100 transition whitespace-nowrap">
                                ✓ Selesaikan
                            </button>
                         )}
                         {isSupervisor && (
                            <button 
                                onClick={() => handleDeleteKendala(k.id)} 
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                                title="Hapus Kendala"
                            >
                                <Trash2 className="w-4 h-4"/>
                            </button>
                         )}
                      </div>
                   </div>
                ))}
             </div>
          )}

          {/* LIST LANGKAH PRODUKSI */}
          <div className="space-y-4">
            {currentSteps?.map((step) => (
              <div key={step.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 last:border-0 gap-3">
                  <div>
                    <div className={`font-bold text-sm md:text-base ${step.isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.name}</div>
                    {step.isCompleted && <div className="text-[10px] text-slate-500">Oleh: {step.uploadedBy} | {step.timestamp}</div>}
                    {step.fileUrl && <a href={step.fileUrl} target="_blank" className="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-1 hover:underline"><Eye className="w-3.5 h-3.5"/> Lihat Bukti</a>}
                  </div>
                  {step.isCompleted ? (
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                      <CheckCircle className="w-4 h-4 text-green-600"/> <span className="text-[10px] font-bold text-green-700 uppercase">SELESAI</span>
                      {canDeleteStepFile && <button onClick={() => handleFileDelete('step', true, step.id)} className="text-red-400 hover:text-red-600 transition ml-2"><Trash2 className="w-3.5 h-3.5"/></button>}
                    </div>
                  ) : (
                    canUpdateStep && (
                      step.type === 'status_update' 
                      ? <button onClick={() => handleStatusStep(step.id)} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm transition w-full sm:w-auto">Tandai Selesai</button>
                      : <button onClick={() => onTriggerUpload('step', step.id)} className="bg-white border-2 border-slate-200 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 transition w-full sm:w-auto"><Camera className="w-4 h-4"/> Upload Foto</button>
                    )
                  )}
              </div>
            ))}
          </div>
      </div>

       {/* --- STEP 3: QC & PACKING --- */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* KIRI: AREA QC */}
           <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex flex-col h-full">
             <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center text-xs text-slate-600 font-bold">3a</div>
                <h3 className="font-bold text-slate-800 text-sm md:text-base">Quality Control</h3>
             </div>

             {isRevisi && order.finishing_qc.notes && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
                  <p className="text-[10px] font-bold text-red-700 uppercase mb-1 flex items-center gap-1"> <AlertTriangle className="w-3 h-3"/> Alasan Revisi:</p>
                  <p className="text-xs text-red-900 font-medium italic">"{order.finishing_qc.notes}"</p>
                </div>
             )}
             
             {isRevisi && canUpdateStep && (
                 <button onClick={handleRevisiSelesai} className="w-full bg-white border-2 border-red-100 text-red-600 py-3 rounded-xl font-bold text-xs uppercase hover:bg-red-50 transition mb-4 shadow-sm">
                    ✓ Konfirmasi Revisi Selesai
                 </button>
             )}

             {order.finishing_qc.isPassed ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-green-50 rounded-2xl border-2 border-dashed border-green-200 text-center min-h-[160px]">
                    <div className="bg-green-100 p-3 rounded-full mb-2"><CheckCircle className="w-8 h-8 text-green-600"/></div>
                    <h4 className="font-bold text-green-800">Lolos QC</h4>
                    <p className="text-[10px] text-green-600 mt-1">Oleh: {order.finishing_qc.checkedBy}</p>
                    {canResetQC && <button onClick={handleDeleteQC} className="text-red-500 text-[10px] mt-4 hover:underline">Reset</button>}
                </div>
             ) : (
                canCheckQC ? (
                  <div className="flex-1 flex flex-col">
                     <textarea placeholder="Catatan QC (Wajib jika revisi)..." className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition mb-3 resize-none h-32" value={qcNote} onChange={e=>setQcNote(e.target.value)}/>
                     <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button onClick={()=>handleQC(false)} disabled={!qcNote.trim()} className="bg-white border-2 border-red-100 text-red-600 py-2.5 rounded-xl font-bold text-xs hover:bg-red-50 disabled:opacity-50 transition">
                           REVISI
                        </button>
                        <button onClick={()=>handleQC(true)} className="bg-blue-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 shadow-md transition">
                           LOLOS QC
                        </button>
                     </div>
                  </div>
                ) : (
                   <div className="flex-1 flex items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 min-h-[160px]">
                      <span className="text-xs text-slate-400 font-medium italic">{!isRevisi ? 'Menunggu produksi selesai...' : 'Sedang Revisi'}</span>
                   </div>
                )
             )}
           </div>

           {/* KANAN: AREA PACKING */}
           <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex flex-col h-full">
             <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center text-xs text-slate-600 font-bold">3b</div>
                <h3 className="font-bold text-slate-800 text-sm md:text-base">Packing</h3>
             </div>

             {order.finishing_packing.isPacked ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 text-center shadow-sm relative overflow-hidden group min-h-[160px]">
                     {order.finishing_packing.fileUrl ? (
                        <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden border border-slate-100">
                           <img src={order.finishing_packing.fileUrl} alt="Packing" className="w-full h-full object-cover"/>
                           <a href={order.finishing_packing.fileUrl} target="_blank" className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-300 font-bold text-xs">
                              <Eye className="w-4 h-4 mr-1"/> Lihat
                           </a>
                        </div>
                     ) : <Package className="w-10 h-10 text-slate-300 mb-2"/>}
                     
                     <div className="flex items-center gap-2 text-green-700 font-bold text-sm bg-green-50 px-3 py-1 rounded-full border border-green-100">
                        <CheckCircle className="w-4 h-4"/> Selesai
                     </div>
                     
                     {canDeleteFinishingFile && <button onClick={() => handleFileDelete('packing')} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>}
                 </div>
             ) : (
                <div className="flex-1 flex items-center justify-center">
                   {canUpdatePacking ? (
                      <button onClick={()=>onTriggerUpload('packing')} className="bg-purple-600 text-white w-full py-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-2 shadow-md hover:bg-purple-700 hover:scale-[1.02] transition duration-200">
                          <Camera className="w-6 h-6"/>
                          <span>UPLOAD FOTO</span>
                      </button>
                   ) : (
                      <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl w-full min-h-[160px] flex flex-col justify-center items-center">
                         <Package className="w-8 h-8 text-slate-300 mb-2"/>
                         <p className="text-xs text-slate-400 italic">Menunggu QC Lolos</p>
                      </div>
                   )}
                </div>
             )}
           </div>
       </div>

       {/* --- STEP 4: PENGIRIMAN --- */}
       <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm">
         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm md:text-lg"> <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</div> Pengiriman</h3>
         <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm font-bold text-slate-700">Bukti Kirim (Resi)</span>
              {order.shipping.bukti_kirim ? (
                <div className="flex gap-2 items-center">
                   <a href={order.shipping.bukti_kirim} target="_blank" className="text-green-600 font-bold underline text-xs">LIHAT RESI</a>
                   {canDeleteFinishingFile && <button onClick={() => handleFileDelete('shipping_kirim')} className="text-red-500"><Trash2 className="w-4 h-4"/></button>}
                </div>
              ) : (canUpdateShipping ? <button onClick={()=>onTriggerUpload('shipping_kirim')} className="text-[10px] md:text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold shadow-md">UPLOAD RESI</button> : <span className="text-[10px] text-slate-300 italic">Menunggu pengerjaan & packing selesai...</span>)}
            </div>
            
            <div className="flex justify-between items-center border-t border-slate-200 pt-4">
              <span className="text-xs md:text-sm font-bold text-slate-700">Bukti Terima (User)</span>
              {order.shipping.bukti_terima ? (
                <div className="flex gap-2 items-center">
                   <a href={order.shipping.bukti_terima} target="_blank" className="text-orange-600 font-bold underline text-xs">LIHAT BUKTI</a>
                   {canDeleteFinishingFile && <button onClick={() => handleFileDelete('shipping_terima')} className="text-red-500"><Trash2 className="w-4 h-4"/></button>}
                </div>
              ) : (canUpdateShipping && order.shipping.bukti_kirim ? <button onClick={()=>onTriggerUpload('shipping_terima')} className="text-[10px] md:text-xs bg-orange-600 text-white px-3 py-2 rounded-lg font-bold shadow-md">UPLOAD TERIMA</button> : <span className="text-[10px] text-slate-300 italic">-</span>)}
            </div>
         </div>
       </div>

    </div>
  );
}