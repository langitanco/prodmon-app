// app/orders/[id]/layout.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import Sidebar from "@/app/components/layout/Sidebar";
import Header from "@/app/components/layout/Header";
import CustomAlert from "@/app/components/ui/CustomAlert";
import ProfileModal from "@/app/components/ui/ProfileModal";
import LoginScreen from "@/app/components/auth/LoginScreen";

import { useNotifications } from "@/hooks/useNotifications";
import { UserData, DEFAULT_PERMISSIONS } from "@/types";

interface CurrentUser extends UserData {
  id: string;
}

export default function OrderDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
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

  // ─── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
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
    init();
  }, [supabase]);

  // ─── Notifications ────────────────────────────────────────────────────────
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } =
    useNotifications({
      currentUserId: currentUser?.id ?? null,
      supabase,
    });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleNav = useCallback(
    (tab: string) => {
      setSidebarOpen(false);
      router.push(`/?tab=${tab}`);
    },
    [router],
  );

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  }, [supabase]);

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
        setCurrentUser((prev) => (prev ? { ...prev, ...newData } : prev));
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
      router.push(`/orders/${orderId}`);
      setSidebarOpen(false);
    },
    [markAsRead, router],
  );

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (loadingUser)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="h-screen overflow-hidden bg-gray-100 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 relative">
      <CustomAlert alertState={alertState} closeAlert={closeAlert} />

      <ProfileModal
        user={currentUser}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleUpdateProfile}
      />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentUser={currentUser}
        activeTab="orders"
        handleNav={handleNav}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          currentUser={currentUser}
          onToggleSidebar={() => setSidebarOpen(true)}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          currentPage="orders"
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={markAllAsRead}
        />

        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 pb-32 bg-gray-100 dark:bg-slate-950 no-scrollbar">
          <div className="max-w-4xl mx-auto">
            {/* currentUser dipass via context agar page.tsx bisa pakai */}
            <CurrentUserContext.Provider value={currentUser}>
              {children}
            </CurrentUserContext.Provider>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Context untuk share currentUser ke page.tsx ──────────────────────────────
import { createContext, useContext } from "react";

export const CurrentUserContext = createContext<CurrentUser | null>(null);
export const useCurrentUser = () => useContext(CurrentUserContext);
