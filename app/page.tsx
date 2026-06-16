// app/page.tsx
"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createBrowserClient } from "@supabase/ssr";

// ─── Hooks ───────────────────────────────────────────────────────────────────
import { useNotifications } from "@/hooks/useNotifications";
import { useOrders } from "@/hooks/useOrders";
import { useUpload } from "@/hooks/useUpload";
import { useUsers } from "@/hooks/useUsers";

// ─── Layout & UI ─────────────────────────────────────────────────────────────
import Sidebar from "@/app/components/layout/Sidebar";
import Header from "@/app/components/layout/Header";
import CustomAlert from "@/app/components/ui/CustomAlert";
import LoginScreen from "@/app/components/auth/LoginScreen";
import ProfileModal from "@/app/components/ui/ProfileModal";

// ─── Lazy Load ───────────────────────────────────────────────────────────────
import dynamic from "next/dynamic";

const Dashboard = dynamic(
  () => import("@/app/components/dashboard/Dashboard"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
    ssr: false,
  },
);
const CalculatorView = dynamic(
  () => import("@/app/components/apps/CalculatorView"),
);
const ConfigPriceView = dynamic(
  () => import("@/app/components/apps/ConfigPriceView"),
);
const ActivityLogView = dynamic(
  () => import("@/app/components/apps/ActivityLogView"),
);
const AboutView = dynamic(() => import("@/app/components/misc/AboutView"));
const CalendarView = dynamic(
  () => import("@/app/components/apps/CalendarView"),
);
const SalaryView = dynamic(() => import("@/app/components/apps/SalaryView"));
const NotaView = dynamic(() => import("@/app/components/apps/NotaView"));
const OrderList = dynamic(() => import("@/app/components/orders/OrderList"));
const CreateOrder = dynamic(
  () => import("@/app/components/orders/CreateOrder"),
);
const EditOrder = dynamic(() => import("@/app/components/orders/EditOrder"));
const OrderDetail = dynamic(
  () => import("@/app/components/orders/OrderDetail"),
);
const CompletedOrders = dynamic(
  () => import("@/app/components/orders/CompletedOrders"),
);
const TrashView = dynamic(() => import("@/app/components/orders/TrashView"));
const SettingsPage = dynamic(
  () => import("@/app/components/settings/SettingsPage"),
);
const WeeklyNotesView = dynamic(
  () => import("@/app/components/apps/WeeklyNotesView"),
);
const FinanceView = dynamic(
  () => import("@/app/components/finance/FinanceView"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
    ssr: false,
  },
);
import POManagementView from "@/app/components/po/POManagementView";

// ─── Types ───────────────────────────────────────────────────────────────────
import {
  UserData,
  Order,
  ProductionTypeData,
  DEFAULT_PERMISSIONS,
  OrderStatus,
} from "@/types";
import { DEFAULT_PRODUCTION_TYPES } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ActiveTab =
  | "dashboard"
  | "orders"
  | "calendar"
  | "logs"
  | "completed_orders"
  | "settings"
  | "trash"
  | "kalkulator"
  | "config_harga"
  | "about"
  | "salary"
  | "nota"
  | "weekly_notes"
  | "finance"
  | "po_management";

interface CurrentUser extends UserData {
  id: string;
}

export default function ProductionApp() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [view, setView] = useState<"list" | "detail" | "create" | "edit">(
    "list",
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "confirm";
    onConfirm?: () => void;
  }>({ isOpen: false, title: "", message: "", type: "success" });

  // ─── Ref untuk scroll container utama ──────────────────────────────────────
  const mainRef = useRef<HTMLDivElement>(null);

  const showAlert = useCallback(
    (title: string, message: string, type: "success" | "error" = "success") => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type,
        onConfirm: undefined,
      });
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

  // ─── Hooks ─────────────────────────────────────────────────────────────────

  const { notifications, fetchNotifications, markAsRead, markAllAsRead } =
    useNotifications({
      currentUserId: currentUser?.id ?? null,
      supabase,
    });

  const {
    orders,
    activeOrders,
    fetchOrders,
    writeLog,
    checkAutoStatus,
    handleCreateOrder,
    handleEditOrder,
    handleDeleteOrder,
    handleRestoreOrder,
    handlePermanentDelete,
    handleUpdatePayment,
  } = useOrders({
    supabase,
    currentUser,
    fetchNotifications,
    showAlert,
    showConfirm,
    setView,
  });

  const { fileInputRef, isUploading, triggerUpload, handleFileChange } =
    useUpload({
      supabase,
      currentUser,
      orders,
      selectedOrderId,
      checkAutoStatus,
      writeLog,
      showAlert,
    });

  const {
    usersList,
    productionTypes,
    fetchUsers,
    fetchProductionTypes,
    handleSaveUser,
    handleDeleteUser,
    handleSaveType,
    handleDeleteType,
  } = useUsers({ supabase, showAlert, showConfirm });

  // ─── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const initSession = async () => {
      setLoadingUser(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (userData) {
          setCurrentUser({
            id: session.user.id,
            username: userData.username || "",
            name: userData.name || "User",
            role: userData.role || "produksi",
            password: "",
            permissions: userData.permissions || DEFAULT_PERMISSIONS,
            address: userData.address,
            dob: userData.dob,
            avatar_url: userData.avatar_url,
          });
        }
      }
      setLoadingUser(false);
    };
    initSession();
  }, [supabase]);

  // ─── Load Data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([fetchOrders(), fetchUsers(), fetchProductionTypes()]);
  }, [currentUser, fetchOrders, fetchUsers, fetchProductionTypes]);

  // ─── Navigation ────────────────────────────────────────────────────────────

  useEffect(() => {
    const handlePopState = () => {
      if (activeTab !== "dashboard") {
        setActiveTab("dashboard");
        setView("list");
        setSelectedOrderId(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    if (activeTab !== "dashboard")
      window.history.pushState({ tab: activeTab }, "", `?tab=${activeTab}`);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeTab]);

  // ─── Scroll to top saat view atau tab berubah ───────────────────────────────
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [view, selectedOrderId, activeTab]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    showConfirm("Logout", "Keluar aplikasi?", async () => {
      await supabase.auth.signOut();
      window.history.replaceState({}, "", "/");
      window.location.reload();
    });
  }, [showConfirm, supabase]);

  const handleUpdateProfile = useCallback(
    async (newData: any) => {
      if (!currentUser) return;
      const { error } = await supabase
        .from("users")
        .update({
          name: newData.name,
          address: newData.address,
          dob: newData.dob,
          avatar_url: newData.avatar_url,
        })
        .eq("id", currentUser.id);
      if (!error) {
        setCurrentUser({ ...currentUser, ...newData });
        setShowProfileModal(false);
        showAlert("Sukses", "Profil diperbarui");
      } else {
        showAlert("Gagal", error.message, "error");
      }
    },
    [currentUser, supabase, showAlert],
  );

  const handleNotificationClick = useCallback(
    async (notificationId: string, orderId: string) => {
      await markAsRead(notificationId);
      setActiveTab("orders");
      setView("detail");
      setSelectedOrderId(orderId);
      setSidebarOpen(false);
    },
    [markAsRead],
  );

  // ─── Guards ────────────────────────────────────────────────────────────────

  if (loadingUser)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!currentUser) return <LoginScreen />;

  const p = currentUser.permissions;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen overflow-hidden bg-gray-100 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />

      {isUploading && (
        <div className="absolute inset-0 z-[9999] bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <Loader2 className="w-12 h-12 animate-spin mb-3 text-blue-400" />
          <p className="font-bold">Mengupload File...</p>
          <p className="text-xs text-gray-300 mt-1">
            Mohon tunggu, jangan tutup aplikasi
          </p>
        </div>
      )}

      <CustomAlert alertState={alertState} closeAlert={closeAlert} />

      {currentUser && (
        <ProfileModal
          user={currentUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSave={handleUpdateProfile}
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentUser={currentUser}
        activeTab={activeTab}
        handleNav={(tab: any) => {
          setActiveTab(tab);
          setView("list");
          setSidebarOpen(false);
        }}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          currentUser={currentUser}
          onToggleSidebar={() => setSidebarOpen(true)}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          currentPage={activeTab}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={markAllAsRead}
        />

        {/* ref ditambahkan di sini agar scroll bisa dikontrol secara programatik */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-2 md:py-3 pb-32 relative bg-gray-100 dark:bg-slate-950 no-scrollbar"
        >
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === "dashboard" && p?.dashboard?.view && (
              <Dashboard
                role={currentUser.role}
                orders={activeOrders}
                onSelectOrder={(id) => {
                  setSelectedOrderId(id);
                  setView("detail");
                  setActiveTab("orders");
                }}
              />
            )}

            {activeTab === "orders" && p?.orders?.view && (
              <>
                {view === "list" && (
                  <OrderList
                    role={currentUser.role}
                    orders={activeOrders}
                    productionTypes={productionTypes}
                    onSelectOrder={(id) => {
                      setSelectedOrderId(id);
                      setView("detail");
                    }}
                    onNewOrder={() => setView("create")}
                    onDeleteOrder={handleDeleteOrder}
                    currentUser={currentUser}
                  />
                )}
                {view === "create" && (
                  <CreateOrder
                    users={usersList}
                    productionTypes={productionTypes}
                    onCancel={() => setView("list")}
                    onSubmit={handleCreateOrder}
                  />
                )}
                {view === "edit" && selectedOrderId && (
                  <EditOrder
                    users={usersList}
                    order={orders.find((o: Order) => o.id === selectedOrderId)!}
                    productionTypes={productionTypes}
                    onCancel={() => setView("detail")}
                    onSubmit={(d) => handleEditOrder(d, selectedOrderId)}
                  />
                )}
                {view === "detail" && selectedOrderId && (
                  <OrderDetail
                    currentUser={currentUser}
                    order={orders.find((o: Order) => o.id === selectedOrderId)!}
                    onBack={() => {
                      setSelectedOrderId(null);
                      setView("list");
                    }}
                    onEdit={() => setView("edit")}
                    onTriggerUpload={triggerUpload}
                    onUpdateOrder={checkAutoStatus}
                    onDelete={handleDeleteOrder}
                    onConfirm={showConfirm}
                    // @ts-ignore
                    onLogActivity={writeLog}
                  />
                )}
              </>
            )}

            {activeTab === "completed_orders" && p?.orders?.view && (
              <CompletedOrders
                orders={activeOrders}
                onSelectOrder={(id) => {
                  setSelectedOrderId(id);
                  setView("detail");
                  setActiveTab("orders");
                }}
              />
            )}

            {activeTab === "calendar" && (
              <CalendarView
                orders={activeOrders}
                onSelectOrder={(id) => {
                  setSelectedOrderId(id);
                  setView("detail");
                  setActiveTab("orders");
                }}
              />
            )}

            {activeTab === "salary" && p?.salary?.view && (
              <SalaryView users={usersList} orders={orders} />
            )}
            {activeTab === "nota" && p?.nota?.view && <NotaView />}
            {activeTab === "logs" && p?.logs?.view && <ActivityLogView />}
            {activeTab === "weekly_notes" && p?.logs?.view && (
              <WeeklyNotesView />
            )}
            {activeTab === "finance" && (p?.keuangan?.view ?? true) && (
              <FinanceView
                orders={activeOrders}
                currentUser={currentUser}
                onUpdatePayment={handleUpdatePayment}
              />
            )}
            {activeTab === "po_management" && <POManagementView />}
            {activeTab === "kalkulator" && p?.kalkulator?.view && (
              <CalculatorView />
            )}
            {activeTab === "config_harga" && p?.config_harga?.view && (
              <ConfigPriceView />
            )}
            {activeTab === "about" && <AboutView />}

            {activeTab === "trash" && p?.trash?.view && (
              <TrashView
                orders={orders.filter((o: Order) => o.deleted_at)}
                onRestore={handleRestoreOrder}
                onPermanentDelete={handlePermanentDelete}
              />
            )}

            {activeTab === "settings" && p?.settings?.view && (
              <SettingsPage
                currentUser={currentUser}
                users={usersList}
                productionTypes={productionTypes}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
                onSaveProductionType={handleSaveType}
                onDeleteProductionType={handleDeleteType}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
