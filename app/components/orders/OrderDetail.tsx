// app/components/orders/OrderDetail.tsx
import React, { useRef, useState } from 'react';
import { Order, UserData } from '@/types';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import LabelPengiriman from './detail/LabelPengiriman';
import OrderDetailHeader from './detail/OrderDetailHeader';
import StepApproval from './detail/StepApproval';
import StepProduksi from './detail/StepProduksi';
import StepFinishing from './detail/StepFinishing';

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

export default function OrderDetail({
  currentUser, order, onBack, onEdit,
  onTriggerUpload, onUpdateOrder, onDelete, onConfirm,
}: OrderDetailProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [isPrintingLabel, setIsPrintingLabel] = useState(false);

  // ─── Hak Akses ───────────────────────────────────────────────────────────
  const isSupervisor = currentUser.role === 'supervisor';
  const isManagement = ['admin', 'manager', 'supervisor'].includes(currentUser.role);
  const perms = currentUser.permissions;
  const jenisProd = order.jenis_produksi?.toLowerCase() || '';
  const isManual = jenisProd === 'manual' || jenisProd === 'sablon';
  const isDTF = jenisProd === 'dtf' || jenisProd === 'digital';
  const prodPerms = isManual ? perms?.prod_manual : (isDTF ? perms?.prod_dtf : null);

  const currentStatus = order.status;
  const currentSteps = isManual ? order.steps_manual : order.steps_dtf;
  const isProductionFinished = currentSteps && currentSteps.length > 0 && currentSteps.every(s => s.isCompleted);
  const isRevisi = currentStatus === 'Revisi';

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

  // ─── Hook ─────────────────────────────────────────────────────────────────
  const {
    qcNote, setQcNote,
    kendalaNote, setKendalaNote,
    showKendalaForm, setShowKendalaForm,
    proofingRevisiNote, setProofingRevisiNote,
    proofingStepId, setProofingStepId,
    handleStatusStep, handleSaveProofingRevisi,
    handleQC, handleDeleteQC, handleRevisiSelesai,
    handleAddKendala, handleResolveKendala, handleDeleteKendala,
    handleFileDelete,
  } = useOrderDetail({ order, currentUser, onUpdateOrder, onConfirm });

  // ─── Print Label ──────────────────────────────────────────────────────────
  const handlePrintLabel = async () => {
    if (!labelRef.current) return;
    setIsPrintingLabel(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      const dataUrl = await toJpeg(labelRef.current, {
        pixelRatio: 2, quality: 0.9, cacheBust: true, backgroundColor: '#ffffff',
      });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [165, 107.5] });
      pdf.addImage(dataUrl, 'JPEG', 0, 0, 165, 107.5);
      const pdfUrl = URL.createObjectURL(pdf.output('blob'));
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Gagal membuat Label PDF:', error);
      alert('Terjadi kesalahan saat mengekspor Label PDF.');
    } finally {
      setIsPrintingLabel(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24 relative">

      <LabelPengiriman order={order} labelRef={labelRef} />

      <OrderDetailHeader
        order={order}
        currentUser={currentUser}
        isPrintingLabel={isPrintingLabel}
        canEditOrderInfo={!!canEditOrderInfo}
        canDeleteOrder={!!canDeleteOrder}
        onBack={onBack}
        onEdit={onEdit}
        onDelete={onDelete}
        onPrintLabel={handlePrintLabel}
      />

      <StepApproval
        order={order}
        canUploadApproval={!!canUploadApproval}
        canDeleteApprovalFile={!!canDeleteApprovalFile}
        onTriggerUpload={onTriggerUpload}
        onFileDelete={handleFileDelete}
      />

      <StepProduksi
        order={order}
        currentUser={currentUser}
        isManual={isManual}
        canUpdateStep={!!canUpdateStep}
        isSupervisor={isSupervisor}
        isManagement={isManagement}
        kendalaNote={kendalaNote}
        setKendalaNote={setKendalaNote}
        showKendalaForm={showKendalaForm}
        setShowKendalaForm={setShowKendalaForm}
        proofingRevisiNote={proofingRevisiNote}
        setProofingRevisiNote={setProofingRevisiNote}
        proofingStepId={proofingStepId}
        setProofingStepId={setProofingStepId}
        onTriggerUpload={onTriggerUpload}
        onStatusStep={handleStatusStep}
        onSaveProofingRevisi={handleSaveProofingRevisi}
        onAddKendala={handleAddKendala}
        onResolveKendala={handleResolveKendala}
        onDeleteKendala={handleDeleteKendala}
        onFileDelete={handleFileDelete}
      />

      <StepFinishing
        order={order}
        isRevisi={isRevisi}
        canCheckQC={!!canCheckQC}
        canUpdatePacking={!!canUpdatePacking}
        canUpdateShipping={!!canUpdateShipping}
        canResetQC={!!canResetQC}
        canDeleteFinishingFile={!!canDeleteFinishingFile}
        qcNote={qcNote}
        setQcNote={setQcNote}
        onQC={handleQC}
        onDeleteQC={handleDeleteQC}
        onRevisiSelesai={handleRevisiSelesai}
        onTriggerUpload={onTriggerUpload}
        onFileDelete={handleFileDelete}
      />

    </div>
  );
}