// app/hooks/useOrderDetail.ts

import { useState, useCallback } from 'react';
import { Order, UserData, KendalaNote } from '@/types';

interface UseOrderDetailProps {
  order: Order;
  currentUser: UserData;
  onUpdateOrder: (updatedOrder: Order) => void;
  onConfirm: (title: string, msg: string, action: () => void) => void;
}

export function useOrderDetail({ order, currentUser, onUpdateOrder, onConfirm }: UseOrderDetailProps) {
  const [qcNote, setQcNote] = useState(order.finishing_qc.notes || '');
  const [kendalaNote, setKendalaNote] = useState('');
  const [showKendalaForm, setShowKendalaForm] = useState(false);
  const [proofingRevisiNote, setProofingRevisiNote] = useState('');
  const [proofingStepId, setProofingStepId] = useState<string | null>(null);

  const jenisProd = order.jenis_produksi?.toLowerCase() || '';
  const isManual = jenisProd === 'manual' || jenisProd === 'sablon';

  // ─── Step Handlers ────────────────────────────────────────────────────────

  const handleStatusStep = useCallback((stepId: string) => {
    const updated = JSON.parse(JSON.stringify(order));
    const steps = (isManual ? updated.steps_manual : updated.steps_dtf) as any[];
    const idx = steps.findIndex((s: any) => s.id === stepId);
    if (idx >= 0) {
      steps[idx].isCompleted = true;
      steps[idx].uploadedBy = currentUser.name;
      steps[idx].timestamp = new Date().toLocaleString();
      if (steps[idx].proofing_note) delete steps[idx].proofing_note;
    }
    const allDone = steps.every((s: any) => s.isCompleted);
    if (allDone && updated.status === 'On Process') updated.status = 'Finishing';
    onUpdateOrder(updated);
  }, [order, isManual, currentUser.name, onUpdateOrder]);

  const handleSaveProofingRevisi = useCallback(() => {
    if (!proofingRevisiNote.trim() || !proofingStepId) return;
    const updated = JSON.parse(JSON.stringify(order));
    const steps = (isManual ? updated.steps_manual : updated.steps_dtf) as any[];
    const idx = steps.findIndex((s: any) => s.id === proofingStepId);
    if (idx >= 0) {
      steps[idx].proofing_note = proofingRevisiNote;
      steps[idx].isCompleted = false;
    }
    onUpdateOrder(updated);
    setProofingRevisiNote('');
    setProofingStepId(null);
  }, [order, isManual, proofingRevisiNote, proofingStepId, onUpdateOrder]);

  // ─── QC Handlers ─────────────────────────────────────────────────────────

  const handleQC = useCallback((pass: boolean) => {
    const updated = JSON.parse(JSON.stringify(order));
    updated.finishing_qc = {
      isPassed: pass,
      notes: pass ? 'Lolos QC' : qcNote,
      checkedBy: currentUser.name,
      timestamp: new Date().toLocaleString(),
    };
    if (!pass) updated.status = 'Revisi';
    onUpdateOrder(updated);
  }, [order, qcNote, currentUser.name, onUpdateOrder]);

  const handleDeleteQC = useCallback(() => {
    onConfirm('Reset Status QC?', 'Status QC akan dikembalikan ke belum dicek.', () => {
      const updated = JSON.parse(JSON.stringify(order));
      updated.finishing_qc = { isPassed: false, notes: '', checkedBy: '', timestamp: '' };
      onUpdateOrder(updated);
    });
  }, [order, onConfirm, onUpdateOrder]);

  const handleRevisiSelesai = useCallback(() => {
    onConfirm('Selesaikan Revisi?', 'Status akan kembali ke On Process.', () => {
      const updated = JSON.parse(JSON.stringify(order));
      updated.status = 'On Process';
      updated.finishing_qc.isPassed = false;
      onUpdateOrder(updated);
    });
  }, [order, onConfirm, onUpdateOrder]);

  // ─── Kendala Handlers ─────────────────────────────────────────────────────

  const handleAddKendala = useCallback(() => {
    if (!kendalaNote.trim()) return;
    const updated = JSON.parse(JSON.stringify(order));
    if (!updated.kendala) updated.kendala = [];
    updated.kendala.push({
      id: Date.now().toString(),
      notes: kendalaNote,
      reportedBy: currentUser.name,
      timestamp: new Date().toLocaleString(),
      isResolved: false,
    });
    updated.status = 'Ada Kendala';
    onUpdateOrder(updated);
    setKendalaNote('');
    setShowKendalaForm(false);
  }, [order, kendalaNote, currentUser.name, onUpdateOrder]);

  const handleResolveKendala = useCallback((kendalaId: string) => {
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
      const allStepsDone = steps && steps.every((s: any) => s.isCompleted);
      updated.status = allStepsDone ? 'Finishing' : 'On Process';
    }
    onUpdateOrder(updated);
  }, [order, isManual, currentUser.name, onUpdateOrder]);

  const handleDeleteKendala = useCallback((kendalaId: string) => {
    onConfirm('Hapus Laporan?', 'Laporan kendala ini akan dihapus permanen.', () => {
      const updated = JSON.parse(JSON.stringify(order));
      updated.kendala = updated.kendala.filter((k: KendalaNote) => k.id !== kendalaId);
      const allResolved = updated.kendala.length === 0 || updated.kendala.every((k: any) => k.isResolved);
      if (allResolved && updated.status === 'Ada Kendala') {
        const steps = isManual ? updated.steps_manual : updated.steps_dtf;
        const allStepsDone = steps && steps.every((s: any) => s.isCompleted);
        updated.status = allStepsDone ? 'Finishing' : 'On Process';
      }
      onUpdateOrder(updated);
    });
  }, [order, isManual, onConfirm, onUpdateOrder]);

  // ─── File Delete Handler ──────────────────────────────────────────────────

  const handleFileDelete = useCallback((field: string, isStep = false, stepId?: string) => {
    onConfirm('Hapus File/Bukti?', 'File tidak bisa dikembalikan.', () => {
      const updated = JSON.parse(JSON.stringify(order));
      if (isStep && stepId) {
        const steps = isManual ? updated.steps_manual : updated.steps_dtf;
        const idx = steps.findIndex((s: any) => s.id === stepId);
        if (idx >= 0) { steps[idx].isCompleted = false; steps[idx].fileUrl = null; }
      } else if (field === 'approval') {
        updated.link_approval = null;
      } else if (field === 'packing') {
        updated.finishing_packing.isPacked = false;
        updated.finishing_packing.fileUrl = null;
      } else if (field === 'shipping_kirim') {
        updated.shipping.bukti_kirim = null;
      } else if (field === 'shipping_terima') {
        updated.shipping.bukti_terima = null;
      }
      onUpdateOrder(updated);
    });
  }, [order, isManual, onConfirm, onUpdateOrder]);

  return {
    // State
    qcNote, setQcNote,
    kendalaNote, setKendalaNote,
    showKendalaForm, setShowKendalaForm,
    proofingRevisiNote, setProofingRevisiNote,
    proofingStepId, setProofingStepId,
    // Handlers
    handleStatusStep,
    handleSaveProofingRevisi,
    handleQC,
    handleDeleteQC,
    handleRevisiSelesai,
    handleAddKendala,
    handleResolveKendala,
    handleDeleteKendala,
    handleFileDelete,
  };
}