// app/orders/[id]/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2 } from "lucide-react";

import { useOrders } from "@/hooks/useOrders";
import { useUpload } from "@/hooks/useUpload";
import OrderDetail from "@/app/components/orders/OrderDetail";
import EditOrder from "@/app/components/orders/EditOrder";
import CustomAlert from "@/app/components/ui/CustomAlert";
import { useCurrentUser } from "./layout";

import { Order, ProductionTypeData, UserData } from "@/types";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  // Ambil currentUser dari layout via context
  const currentUser = useCurrentUser();

  const [isEditing, setIsEditing] = useState(false);

  // ── Data master untuk EditOrder ──────────────────────────────────────────
  const [productionTypes, setProductionTypes] = useState<ProductionTypeData[]>(
    [],
  );
  const [users, setUsers] = useState<UserData[]>([]);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "confirm";
    onConfirm?: () => void;
  }>({ isOpen: false, title: "", message: "", type: "success" });

  const showAlert = useCallback(
    (title: string, message: string, type: "success" | "error" = "success") => {
      setAlertState({ isOpen: true, title, message, type });
    },
    [],
  );

  const showConfirm = useCallback(
    (title: string, message: string, onConfirm: () => void) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type: "confirm",
        onConfirm,
      });
    },
    [],
  );

  const closeAlert = useCallback(
    () => setAlertState((prev) => ({ ...prev, isOpen: false })),
    [],
  );

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const setView = useCallback(() => {}, []);

  const {
    orders,
    fetchOrders,
    writeLog,
    checkAutoStatus,
    handleDeleteOrder,
    handleEditOrder,
  } = useOrders({
    supabase,
    currentUser,
    fetchNotifications: async () => {},
    showAlert,
    showConfirm,
    setView,
  });

  const { fileInputRef, isUploading, triggerUpload, handleFileChange } =
    useUpload({
      supabase,
      currentUser,
      orders,
      selectedOrderId: orderId,
      checkAutoStatus,
      writeLog,
      showAlert,
    });

  // ── Fetch orders ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    fetchOrders();
  }, [currentUser, fetchOrders]);

  // ── Fetch data master (users & productionTypes) ──────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const fetchMasterData = async () => {
      // Fetch users
      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .order("name", { ascending: true });

      if (usersData) setUsers(usersData);

      // Fetch production types
      const { data: typesData } = await supabase
        .from("production_types")
        .select("*")
        .order("name", { ascending: true });

      if (typesData) setProductionTypes(typesData);
    };

    fetchMasterData();
  }, [currentUser, supabase]);

  const order = orders.find((o: Order) => o.id === orderId);

  // ── Handler submit edit ───────────────────────────────────────────────────
  const handleEditSubmit = useCallback(
    async (formData: any) => {
      await handleEditOrder(formData, orderId);
      setIsEditing(false);
    },
    [handleEditOrder, orderId],
  );

  // ── Loading: currentUser belum siap atau orders belum di-fetch ────────────
  if (!currentUser || (!order && orders.length === 0))
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );

  // ── Order tidak ditemukan setelah fetch selesai ───────────────────────────
  if (!order)
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-500 dark:text-slate-400">
        <p className="text-lg font-semibold">Pesanan tidak ditemukan</p>
        <button
          onClick={() => router.push("/?tab=orders")}
          className="text-sm font-bold text-blue-600 hover:underline"
        >
          ← Kembali ke Daftar Pesanan
        </button>
      </div>
    );

  // ── Tampilkan EditOrder jika sedang mode edit ─────────────────────────────
  if (isEditing) {
    return (
      <>
        <CustomAlert alertState={alertState} closeAlert={closeAlert} />
        <EditOrder
          order={order}
          productionTypes={productionTypes}
          users={users}
          onCancel={() => setIsEditing(false)}
          onSubmit={handleEditSubmit}
        />
      </>
    );
  }

  // ── Tampilan normal OrderDetail ───────────────────────────────────────────
  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />

      {isUploading && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <Loader2 className="w-12 h-12 animate-spin mb-3 text-blue-400" />
          <p className="font-bold">Mengupload File...</p>
          <p className="text-xs text-gray-300 mt-1">
            Mohon tunggu, jangan tutup aplikasi
          </p>
        </div>
      )}

      <CustomAlert alertState={alertState} closeAlert={closeAlert} />

      <OrderDetail
        currentUser={currentUser}
        order={order}
        onBack={() => router.push("/?tab=orders")}
        onEdit={() => setIsEditing(true)} // ← tidak lagi redirect ke dashboard
        onTriggerUpload={triggerUpload}
        onUpdateOrder={checkAutoStatus}
        onDelete={async (id) => {
          await handleDeleteOrder(id);
          router.push("/?tab=orders");
        }}
        onConfirm={showConfirm}
        // @ts-ignore
        onLogActivity={writeLog}
      />
    </>
  );
}
