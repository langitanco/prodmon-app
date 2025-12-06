import React, { useState } from 'react';
import { formatDate, getStatusColor, openWA } from '@/lib/utils';
import { Order, UserData, KendalaNote } from '@/types';
import { 
  AlertTriangle, Camera, CheckCircle, ChevronRight, Eye, MessageSquare, 
  Package, Pencil, Phone, Trash2, Upload, X 
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
  
  // --- LOGIKA HAK AKSES BARU (BY PERMISSIONS) ---
  const role = currentUser.role as string;
  const userName = currentUser.name; 
  
  // Ambil izin spesifik dari object permissions
  const orderPerms = currentUser.permissions?.orders;

  // 1. Cek Permission Global (Supervisor selalu sakti)
  const isSupervisor = role === 'supervisor';
  const hasEditAccess = isSupervisor || orderPerms?.edit === true;
  const hasDeleteAccess = isSupervisor || orderPerms?.delete === true;

  // 2. Mapping ke Akses Per-Step
  // Step 1: Approval & Tombol Edit Utama (Admin/Supervisor/Editor)
  const canEditApproval = hasEditAccess; 

  // Step 2: Produksi (Tim Produksi OR Admin/Supervisor)
  const canEditProduction = role === 'produksi' || hasEditAccess;

  // Step 3: QC (Tim QC OR Admin/Supervisor)
  const canEditQC = role === 'qc' || hasEditAccess;

  // Step 4: Shipping (Admin/Supervisor)
  const canEditShipping = hasEditAccess;

  // ---------------------------------------------

  const currentSteps = order.jenis_produksi === 'manual' ? order.steps_manual : order.steps_dtf;

  const handleStatusStep = (stepId: string) => {
    const updated = JSON.parse(JSON.stringify(order));
    const steps = updated.jenis_produksi === 'manual' ? updated.steps_manual : updated.steps_dtf;
    const idx = steps.findIndex((s: any) => s.id === stepId);
    if (idx >= 0) { 
      steps[idx].isCompleted = true; 
      steps[idx].uploadedBy = userName; 
      steps[idx].timestamp = new Date().toLocaleString(); 
    }
    onUpdateOrder(updated);
  };

  const handleQC = (pass: boolean) => {
    const updated = JSON.parse(JSON.stringify(order));
    updated.finishing_qc = { 
      isPassed: pass, 
      notes: pass ? 'Lolos QC' : qcNote, 
      checkedBy: userName, 
      timestamp: new Date().toLocaleString() 
    };
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
    const updated = JSON.parse(JSON.stringify(order));
    updated.status = 'On Process';
    updated.finishing_qc = { isPassed: false, notes: '' };
    onUpdateOrder(updated);
  };

  const handleAddKendala = () => {
    if (!kendalaNote.trim()) return;
    const updated = JSON.parse(JSON.stringify(order));
    if (!updated.kendala) updated.kendala = [];
    updated.kendala.push({
      id: Date.now().toString(),
      notes: kendalaNote,
      reportedBy: userName,
      timestamp: new Date().toLocaleString(),
      isResolved: false
    });
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
      updated.kendala[idx].resolvedBy = userName;
      updated.kendala[idx].resolvedTimestamp = new Date().toLocaleString();
    }
    onUpdateOrder(updated);
  };

  const handleDeleteKendala = (kendalaId: string) => {
    if (!onConfirm) return;
    onConfirm('Hapus Kendala?', 'Yakin ingin menghapus catatan kendala ini?', () => {
      const updated = JSON.parse(JSON.stringify(order));
      updated.kendala = updated.kendala.filter((k: KendalaNote) => k.id !== kendalaId);
      onUpdateOrder(updated);
    });
  };

  const handleFileDelete = (field: string, isStep = false, stepId?: string) => {
      if (!onConfirm) return;
      onConfirm('Hapus File/Bukti?', 'File yang sudah dihapus tidak bisa dikembalikan.', () => {
        const updated = JSON.parse(JSON.stringify(order));
        if (isStep && stepId) {
          const steps = updated.jenis_produksi === 'manual' ? updated.steps_manual : updated.steps_dtf;
          const idx = steps.findIndex((s: any) => s.id === stepId);
          if(idx>=0) { steps[idx].isCompleted=false; steps[idx].fileUrl=null; }
        } 
        else if (field === 'approval') {
            updated.link_approval = null;
        }
        else if (field === 'packing') { 
          updated.finishing_packing.isPacked=false; 
          updated.finishing_packing.fileUrl=null;
          updated.finishing_packing.packedBy=null;
          updated.finishing_packing.timestamp=null;
        }
        else if (field === 'shipping_kirim') { 
            updated.shipping.bukti_kirim=null; 
            updated.shipping.uploaded_by_kirim=null;
            updated.shipping.timestamp_kirim=null;
        }
        else if (field === 'shipping_terima') { 
            updated.shipping.bukti_terima=null;
            updated.shipping.uploaded_by_terima=null;
            updated.shipping.timestamp_terima=null;
        }
        onUpdateOrder(updated);
      });
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="text-xs md:text-sm text-slate-500 hover:text-blue-600 flex items-center gap-2 font-bold transition p-2 -ml-2 rounded-lg hover:bg-slate-100 w-fit">
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 rotate-180"/> Kembali
        </button>
        <div className="flex gap-2">
          
          {/* TOMBOL EDIT (Muncul jika punya izin Edit atau Supervisor) */}
          {canEditApproval && (
            <button onClick={onEdit} className="bg-blue-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-sm">
              <Pencil className="w-3 h-3 md:w-4 md:h-4"/> Edit
            </button>
          )}

          {/* TOMBOL HAPUS (Muncul jika punya izin Delete atau Supervisor) */}
          {hasDeleteAccess && (
            <button onClick={() => onDelete(order.id)} className="bg-red-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-sm">
              <Trash2 className="w-3 h-3 md:w-4 md:h-4"/> Hapus
            </button>
          )}

        </div>
      </div>
      
      <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div className="flex-1">
            <h1 className="text-lg md:text-2xl font-extrabold text-slate-800 mb-1 md:mb-2">{order.nama_pemesan}</h1>
            <div className="text-xs md:text-sm text-slate-500 font-medium flex flex-wrap gap-2 md:gap-3 items-center">
              <span className="bg-slate-100 px-2 py-0.5 rounded">#{order.kode_produksi}</span>
              <span>{order.jumlah} Pcs</span>
              <span>{formatDate(order.deadline)}</span>
              <button onClick={() => openWA(order.no_hp)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
                <Phone className="w-3 h-3"/> WA
              </button>
            </div>
        </div>
        <div className={`px-2 py-1 md:px-4 md:py-2 rounded-lg font-extrabold text-[10px] md:text-sm border uppercase tracking-wide whitespace-nowrap ${getStatusColor(order.status)}`}>{order.status}</div>
      </div>

      {order.status === 'Revisi' && order.finishing_qc.notes && (
        <div className="bg-yellow-50 border-2 border-yellow-300 p-3 md:p-5 rounded-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-700"/>
                <h3 className="font-bold text-yellow-900 text-sm md:text-base">Catatan Revisi dari QC</h3>
              </div>
              <p className="text-xs md:text-sm text-yellow-800 bg-white p-2 md:p-3 rounded-lg border border-yellow-200 font-medium">{order.finishing_qc.notes}</p>
              <div className="text-[10px] md:text-xs text-yellow-700 mt-2">Dicek oleh: {order.finishing_qc.checkedBy} | {order.finishing_qc.timestamp}</div>
            </div>
          </div>
          {canEditProduction && (
            <button onClick={handleRevisiSelesai} className="mt-3 md:mt-4 bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-sm font-bold hover:bg-blue-700 transition shadow-lg w-full sm:w-auto">
              Revisi Selesai - Lanjut Produksi
            </button>
          )}
        </div>
      )}

      {/* STEP 1: APPROVAL */}
      <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-lg"><div className="bg-slate-100 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">1</div> Approval Desain</h3>
          
          {order.link_approval && order.link_approval.link ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-green-50 p-3 md:p-4 rounded-xl border border-green-200 gap-2 md:gap-3">
              <div className="flex-1">
                  <div className="flex items-center gap-2 md:gap-3 text-green-800 font-medium text-xs md:text-sm mb-1">
                    <Eye className="w-4 h-4 md:w-5 md:h-5"/> <a href={order.link_approval.link} target="_blank" className="underline hover:text-green-900">Lihat File Approval</a>
                  </div>
                  {order.link_approval.by ? (
                      <div className="text-[10px] text-green-700">Oleh: <span className="font-bold">{order.link_approval.by}</span> | {order.link_approval.timestamp}</div>
                  ) : (
                      <div className="text-[10px] text-slate-400 italic">Data lama (tanpa nama)</div>
                  )}
              </div>
              {canEditApproval && <button onClick={() => handleFileDelete('approval')} className="text-red-500 bg-white border border-red-200 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold hover:bg-red-50 mt-2 sm:mt-0">Hapus</button>}
            </div>
          ) : (
            (canEditApproval) ? <button onClick={() => onTriggerUpload('approval')} className="w-full border-2 border-dashed border-blue-200 p-4 md:p-6 text-xs md:text-sm text-blue-600 rounded-xl bg-blue-50 hover:bg-blue-100 transition font-bold flex flex-col items-center gap-2"><Upload className="w-5 h-5 md:w-6 md:h-6"/> Upload File Approval</button> : <div className="text-xs md:text-sm italic text-slate-400 text-center py-4 bg-slate-50 rounded-xl">Menunggu Admin upload approval...</div>
          )}
      </div>

      {/* STEP 2: PRODUKSI */}
      <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-lg">
              <div className="bg-slate-100 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">2</div> 
              Produksi ({order.jenis_produksi})
            </h3>
            {canEditProduction && (order.status === 'On Process' || order.status === 'Revisi' || order.status === 'Ada Kendala') && (
              <button onClick={() => setShowKendalaForm(!showKendalaForm)} className="text-[10px] md:text-xs bg-orange-600 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-lg font-bold hover:bg-orange-700 transition flex items-center gap-1.5 shadow-sm">
                <MessageSquare className="w-3 h-3 md:w-3.5 md:h-3.5"/> Lapor Kendala
              </button>
            )}
          </div>

          {showKendalaForm && (
            <div className="mb-4 p-3 md:p-4 bg-orange-50 border-2 border-orange-300 rounded-xl">
              <label className="block text-[10px] md:text-xs font-bold text-orange-800 uppercase mb-1 md:mb-2">Catatan Kendala</label>
              <textarea placeholder="Jelaskan kendala yang sedang dialami..." className="w-full text-xs md:text-sm p-2 md:p-3 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 placeholder-slate-400" value={kendalaNote} onChange={e => setKendalaNote(e.target.value)} rows={3} />
              <div className="flex gap-2 mt-2 md:mt-3">
                <button onClick={handleAddKendala} disabled={!kendalaNote.trim()} className="bg-orange-600 text-white text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Kirim Laporan</button>
                <button onClick={() => { setShowKendalaForm(false); setKendalaNote(''); }} className="border-2 border-slate-200 text-slate-600 text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold hover:bg-slate-50">Batal</button>
              </div>
            </div>
          )}

          {order.kendala && order.kendala.length > 0 && (
            <div className="mb-4 md:mb-5 space-y-2">
              <div className="text-[10px] md:text-xs font-bold uppercase text-slate-500 mb-2 md:mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-orange-600"/> Catatan Kendala ({order.kendala.filter((k) => !k.isResolved).length} belum selesai / {order.kendala.length} total)
              </div>
              {order.kendala.map((k) => (
                <div key={k.id} className={`border-2 p-3 md:p-4 rounded-xl ${k.isResolved ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-300'}`}>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-xs md:text-sm font-medium ${k.isResolved ? 'text-gray-600 line-through' : 'text-orange-900'}`}>{k.notes}</p>
                        {k.isResolved && <span className="bg-green-100 text-green-700 text-[8px] md:text-[10px] px-2 py-0.5 rounded-full font-bold">SELESAI</span>}
                      </div>
                      <div className="text-[10px] md:text-xs text-orange-700">Dilaporkan: <span className="font-bold">{k.reportedBy}</span> | {k.timestamp}</div>
                      {k.isResolved && k.resolvedBy && <div className="text-[10px] md:text-xs text-green-700 mt-1">Diselesaikan: <span className="font-bold">{k.resolvedBy}</span> | {k.resolvedTimestamp}</div>}
                      {k.buktiFile && <a href={k.buktiFile} target="_blank" className="text-[10px] md:text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mt-1"><Eye className="w-3 h-3"/> Lihat Bukti Penanganan</a>}
                    </div>
                    <div className="flex gap-1">
                      {!k.isResolved && (canEditProduction) && (
                        <>
                          <button onClick={() => onTriggerUpload('kendala_bukti', undefined, k.id)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition" title="Upload Bukti"><Upload className="w-3 h-3 md:w-4 md:h-4"/></button>
                          <button onClick={() => handleResolveKendala(k.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition" title="Tandai Selesai"><CheckCircle className="w-3 h-3 md:w-4 md:h-4"/></button>
                        </>
                      )}
                      {(canEditProduction || k.reportedBy === userName) && (
                        <button onClick={() => handleDeleteKendala(k.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="Hapus"><Trash2 className="w-3 h-3 md:w-4 md:h-4"/></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 md:space-y-4">
            {currentSteps.map((step) => (
              <div key={step.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 md:pb-4 last:border-0 gap-2 md:gap-3">
                  <div>
                    <div className={`font-bold text-xs md:text-base ${step.isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.name}</div>
                    {step.isCompleted && <div className="text-[10px] text-slate-500">Oleh: <span className="font-bold">{step.uploadedBy}</span> | {step.timestamp}</div>}
                    {step.fileUrl && <a href={step.fileUrl} target="_blank" className="text-[10px] md:text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mt-0.5"><Eye className="w-3 h-3"/> Lihat Bukti</a>}
                  </div>
                  {step.isCompleted ? (
                    <div className="flex items-center gap-2 md:gap-3 bg-green-50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-green-100 self-start sm:self-auto">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600"/>
                      <span className="text-[10px] md:text-xs font-bold text-green-700">Selesai</span>
                      {canEditProduction && <button onClick={() => handleFileDelete('step', true, step.id)} className="text-red-400 hover:text-red-600 ml-1 md:ml-2"><Trash2 className="w-3 h-3 md:w-4 md:h-4"/></button>}
                    </div>
                  ) : (
                    (canEditProduction && (order.status === 'On Process' || order.status === 'Revisi' || order.status === 'Ada Kendala')) && (
                      step.type === 'status_update' 
                      ? <button onClick={() => handleStatusStep(step.id)} className="bg-blue-600 text-white text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold hover:bg-blue-700 transition w-full sm:w-auto">Tandai Selesai</button>
                      : <button onClick={() => onTriggerUpload('step', step.id)} className="border-2 border-slate-200 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold text-slate-600 hover:bg-slate-50 transition w-full sm:w-auto flex items-center justify-center gap-2"><Camera className="w-3 h-3 md:w-4 md:h-4"/> Upload Bukti</button>
                    )
                  )}
              </div>
            ))}
          </div>
      </div>

       {/* STEP 3: QC & PACKING */}
       <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm">
         <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-lg"><div className="bg-slate-100 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">3</div> QC & Packing</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
           {/* QC */}
           <div className="border border-slate-200 p-3 md:p-4 rounded-xl bg-slate-50/50">
             <div className="text-[10px] md:text-xs font-bold mb-2 md:mb-3 uppercase text-slate-500 tracking-wide">Quality Control</div>
             {order.finishing_qc.isPassed || (order.finishing_qc.notes && !order.finishing_qc.isPassed) ? (
                 <div className={`text-xs md:text-sm font-bold flex flex-col gap-2 p-2 md:p-3 rounded-lg border ${order.finishing_qc.isPassed ? 'bg-green-100 border-green-200 text-green-700' : 'bg-red-100 border-red-200 text-red-700'}`}>
                     <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2">
                             {order.finishing_qc.isPassed ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5"/> : <X className="w-4 h-4 md:w-5 md:h-5"/>}
                             {order.finishing_qc.isPassed ? 'Lolos QC' : 'Revisi QC'}
                         </div>
                         {canEditQC && (
                           <button onClick={handleDeleteQC} className="bg-white/50 hover:bg-white p-1 rounded text-red-600 hover:text-red-800 transition"><Trash2 className="w-3 h-3 md:w-4 md:h-4"/></button>
                         )}
                      </div>
                      <div className="text-[10px] font-normal opacity-80">
                          Oleh: <span className="font-bold">{order.finishing_qc.checkedBy}</span> | {order.finishing_qc.timestamp}
                      </div>
                      {!order.finishing_qc.isPassed && <div className="text-[10px] italic">"{order.finishing_qc.notes}"</div>}
                  </div>
                ) : (
                (canEditQC && order.status === 'Finishing' ? (
                  <div className="space-y-2 md:space-y-3">
                    <textarea placeholder="Catatan revisi (wajib diisi jika revisi)..." className="w-full text-xs md:text-sm p-2 md:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 placeholder-slate-400" value={qcNote} onChange={e=>setQcNote(e.target.value)} rows={3}/>
                    <div className="flex gap-2">
                        <button onClick={()=>handleQC(true)} className="bg-green-600 text-white text-[10px] md:text-xs px-3 py-2 md:px-4 md:py-2.5 rounded-lg flex-1 font-bold hover:bg-green-700 shadow-sm">Lolos</button>
                        <button onClick={()=>handleQC(false)} disabled={!qcNote.trim()} className="bg-red-600 text-white text-[10px] md:text-xs px-3 py-2 md:px-4 md:py-2.5 rounded-lg flex-1 font-bold hover:bg-red-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Revisi</button>
                    </div>
                  </div>
                ) : <div className="text-[10px] md:text-xs text-slate-400 italic py-2">Menunggu proses sebelumnya...</div>)
              )}
            </div>
            
            {/* PACKING */}
            <div className="border border-slate-200 p-3 md:p-4 rounded-xl bg-slate-50/50">
              <div className="text-[10px] md:text-xs font-bold mb-2 md:mb-3 uppercase text-slate-500 tracking-wide">Packing</div>
              {order.finishing_packing.isPacked ? (
                <div className="text-green-700 text-xs md:text-sm font-bold flex flex-col gap-2 bg-green-100 p-2 md:p-3 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Package className="w-4 h-4 md:w-5 md:h-5"/> Sudah Dipacking
                        </div>
                        {canEditQC && (
                            <button onClick={() => handleFileDelete('packing')} className="bg-white/50 hover:bg-white p-1 rounded text-red-600 hover:text-red-800 transition"><Trash2 className="w-3 h-3 md:w-4 md:h-4"/></button>
                        )}
                    </div>
                    {order.finishing_packing.packedBy && (
                        <div className="text-[10px] font-normal opacity-80 text-green-800">
                            Oleh: <span className="font-bold">{order.finishing_packing.packedBy}</span> | {order.finishing_packing.timestamp}
                        </div>
                    )}
                    {order.finishing_packing.fileUrl && (
                        <a href={order.finishing_packing.fileUrl} target="_blank" className="text-[10px] text-green-800 hover:underline flex items-center gap-1"><Eye className="w-3 h-3"/> Lihat Foto Packing</a>
                    )}
                </div>
               ) : (
                (canEditQC && order.status === 'Finishing' && order.finishing_qc.isPassed ? <button onClick={()=>onTriggerUpload('packing')} className="bg-purple-600 text-white text-xs md:text-sm w-full py-2 md:py-3 rounded-xl font-bold hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg"><Camera className="w-3 h-3 md:w-4 md:h-4"/> Foto Packing</button> : <div className="text-[10px] md:text-xs text-slate-400 italic py-2">Menunggu QC Lolos...</div>)
              )}
            </div>
         </div>
       </div>

       {/* STEP 4: PENGIRIMAN */}
       <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm">
         <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-lg"><div className="bg-slate-100 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm">4</div> Pengiriman</h3>
         <div className="space-y-2 md:space-y-3">
           {/* Resi Kirim */}
           <div className="flex flex-col gap-2 border border-slate-200 p-3 md:p-4 rounded-xl bg-slate-50/50">
             <div className="flex justify-between items-center text-xs md:text-sm">
                 <span className="font-bold text-slate-700">Resi Kirim</span>
                 {order.shipping.bukti_kirim ? (
                     <div className="flex items-center gap-2">
                        <a href={order.shipping.bukti_kirim} target="_blank" className="text-green-600 font-bold underline hover:text-green-800">Lihat Bukti</a>
                        {canEditShipping && (
                            <button onClick={() => handleFileDelete('shipping_kirim')} className="bg-red-50 text-red-500 p-1 rounded hover:bg-red-100 border border-red-200 ml-2"><Trash2 className="w-3 h-3"/></button>
                        )}
                     </div>
                 ) : (
                     (canEditShipping && (order.status === 'Kirim' || order.status === 'Selesai') ? <button onClick={()=>onTriggerUpload('shipping_kirim')} className="text-[10px] md:text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm">Upload</button> : <span className="text-slate-300 font-bold">-</span>)
                 )}
             </div>
             {order.shipping.uploaded_by_kirim && (
                 <div className="text-[10px] text-slate-500">Oleh: <span className="font-bold">{order.shipping.uploaded_by_kirim}</span> | {order.shipping.timestamp_kirim}</div>
             )}
           </div>
           
           {/* Bukti Terima */}
           <div className="flex flex-col gap-2 border border-slate-200 p-3 md:p-4 rounded-xl bg-slate-50/50">
             <div className="flex justify-between items-center text-xs md:text-sm">
                 <span className="font-bold text-slate-700">Bukti Terima</span>
                 {order.shipping.bukti_terima ? (
                     <div className="flex items-center gap-2">
                        <a href={order.shipping.bukti_terima} target="_blank" className="text-green-600 font-bold underline hover:text-green-800">Lihat Bukti</a>
                        {canEditShipping && (
                            <button onClick={() => handleFileDelete('shipping_terima')} className="bg-red-50 text-red-500 p-1 rounded hover:bg-red-100 border border-red-200 ml-2"><Trash2 className="w-3 h-3"/></button>
                        )}
                     </div>
                 ) : (
                     (canEditShipping && (order.status === 'Kirim' || order.status === 'Selesai') ? <button onClick={()=>onTriggerUpload('shipping_terima')} className="text-[10px] md:text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-orange-700 shadow-sm">Upload</button> : <span className="text-slate-300 font-bold">-</span>)
                 )}
             </div>
             {order.shipping.uploaded_by_terima && (
                 <div className="text-[10px] text-slate-500">Oleh: <span className="font-bold">{order.shipping.uploaded_by_terima}</span> | {order.shipping.timestamp_terima}</div>
             )}
           </div>
         </div>
       </div>

    </div>
  );
}