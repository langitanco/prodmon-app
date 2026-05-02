// app/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// ─── Hooks ───────────────────────────────────────────────────────────────────
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useOrders } from '@/hooks/useOrders';
import { useUpload } from '@/hooks/useUpload';
import { useUsers } from '@/hooks/useUsers';

// ─── Layout & UI ─────────────────────────────────────────────────────────────
import Sidebar from '@/app/components/layout/Sidebar';
import Header from '@/app/components/layout/Header';
import CustomAlert from '@/app/components/ui/CustomAlert';
import LoginScreen from '@/app/components/auth/LoginScreen';
import ProfileModal from '@/app/components/ui/ProfileModal';

// ─── Lazy Load: Dashboard ────────────────────────────────────────────────────
import dynamic from 'next/dynamic';
const Dashboard = dynamic(() => import('@/app/components/dashboard/Dashboard'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
  ssr: false,
});

// ─── Lazy Load: Apps & Config ────────────────────────────────────────────────
const CalculatorView  = dynamic(() => import('@/app/components/apps/CalculatorView'));
const ConfigPriceView = dynamic(() => import('@/app/components/apps/ConfigPriceView'));
const ActivityLogView = dynamic(() => import('@/app/components/apps/ActivityLogView'));
const AboutView       = dynamic(() => import('@/app/components/misc/AboutView'));
const CalendarView    = dynamic(() => import('@/app/components/apps/CalendarView'));
const SalaryView      = dynamic(() => import('@/app/components/apps/SalaryView'));
const NotaView        = dynamic(() => import('@/app/components/apps/NotaView'));

// ─── Lazy Load: Orders ───────────────────────────────────────────────────────
const OrderList       = dynamic(() => import('@/app/components/orders/OrderList'));
const CreateOrder     = dynamic(() => import('@/app/components/orders/CreateOrder'));
const EditOrder       = dynamic(() => import('@/app/components/orders/EditOrder'));
const OrderDetail     = dynamic(() => import('@/app/components/orders/OrderDetail'));
const CompletedOrders = dynamic(() => import('@/app/components/orders/CompletedOrders'));
const TrashView       = dynamic(() => import('@/app/components/orders/TrashView'));

// ─── Lazy Load: Settings ─────────────────────────────────────────────────────
const SettingsPage = dynamic(() => import('@/app/components/settings/SettingsPage'));

// ─── Types ───────────────────────────────────────────────────────────────────
import { Order } from '@/types';
import { Loader2 } from 'lucide-react';

type ActiveTab =
  | 'dashboard' | 'orders' | 'calendar' | 'logs'
  | 'completed_orders' | 'settings' | 'trash'
  | 'kalkulator' | 'config_harga' | 'about'
  | 'salary' | 'nota';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

// ─── Komponen Utama ───────────────────────────────────────────────────────────

export default function ProductionApp() {
  // UI State
  const [activeTab, setActiveTab]         = useState<ActiveTab>('dashboard');
  const [view, setView]                   = useState<ViewMode>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [alertState, setAlertState] = useState<{
    isOpen: boolean; title: string; message: string;
    type: 'success' | 'error' | 'confirm'; onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'success' });

  // Alert helpers
  const showAlert = useCallback((title: string, message: string, type: 'success' | 'error' = 'success') => {
    setAlertState({ isOpen: true, title, message, type, onConfirm: undefined });
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setAlertState({ isOpen: true, title, message, type: 'confirm', onConfirm });
  }, []);

  const closeAlert = useCallback(() => setAlertState(prev => ({ ...prev, isOpen: false })), []);

  // Supabase singleton
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // ─── Hooks ─────────────────────────────────────────────────────────────────

  const { currentUser, loadingUser, handleLogout, handleUpdateProfile } = useAuth({
    supabase, showAlert, showConfirm,
  });

  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotifications({
    currentUserId: currentUser?.id ?? null, supabase,
  });

  const {
    orders, activeOrders, fetchOrders, writeLog,
    checkAutoStatus, handleCreateOrder, handleEditOrder,
    handleDeleteOrder, handleRestoreOrder, handlePermanentDelete,
  } = useOrders({
    supabase, currentUser, fetchNotifications, showAlert, showConfirm, setView,
  });

  const { fileInputRef, isUploading, triggerUpload, handleFileChange } = useUpload({
    supabase, currentUser, orders, selectedOrderId, checkAutoStatus, writeLog, showAlert,
  });

  const {
    usersList, productionTypes,
    fetchUsers, fetchProductionTypes,
    handleSaveUser, handleDeleteUser,
    handleSaveType, handleDeleteType,
  } = useUsers({ supabase, showAlert, showConfirm });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleNotificationClick = useCallback(async (notificationId: string, orderId: string) => {
    await markAsRead(notificationId);
    setActiveTab('orders');
    setView('detail');
    setSelectedOrderId(orderId);
    setSidebarOpen(false);
  }, [markAsRead]);

  const handleSelectOrder = useCallback((id: string, tab: ActiveTab = 'orders') => {
    setSelectedOrderId(id);
    setView('detail');
    setActiveTab(tab);
  }, []);

  // ─── Effects ───────────────────────────────────────────────────────────────

  // Load data setelah user tersedia
  useEffect(() => {
    if (!currentUser) return;
    Promise.all([fetchOrders(), fetchUsers(), fetchProductionTypes(), fetchNotifications()]);
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [currentUser, fetchOrders, fetchUsers, fetchProductionTypes, fetchNotifications]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard'); setView('list'); setSelectedOrderId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    if (activeTab !== 'dashboard') window.history.pushState({ tab: activeTab }, '', `?tab=${activeTab}`);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  // ─── Render Guards ─────────────────────────────────────────────────────────

  if (loadingUser) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!currentUser) return <LoginScreen />;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen overflow-hidden bg-gray-100 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 relative">

      {/* File input tersembunyi untuk upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />

      {/* Upload overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-[9999] bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <Loader2 className="w-12 h-12 animate-spin mb-3 text-blue-400" />
          <p className="font-bold">Mengupload File...</p>
          <p className="text-xs text-gray-300 mt-1">Mohon tunggu, jangan tutup aplikasi</p>
        </div>
      )}

      <CustomAlert alertState={alertState} closeAlert={closeAlert} />

      <ProfileModal
        user={currentUser}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={(data) => handleUpdateProfile(data, () => setShowProfileModal(false))}
      />

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentUser={currentUser}
        activeTab={activeTab}
        handleNav={(tab: any) => { setActiveTab(tab); setView('list'); setSidebarOpen(false); }}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Main area */}
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

        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-2 md:py-3 pb-32 relative bg-gray-100 dark:bg-slate-950 no-scrollbar">
          <div className="max-w-7xl mx-auto h-full">

            {/* Dashboard */}
            {activeTab === 'dashboard' && currentUser.permissions?.pages?.dashboard && (
              <Dashboard
                role={currentUser.role}
                orders={activeOrders}
                onSelectOrder={(id) => handleSelectOrder(id)}
              />
            )}

            {/* Orders */}
            {activeTab === 'orders' && currentUser.permissions?.pages?.orders && (
              <>
                {view === 'list' && (
                  <OrderList
                    role={currentUser.role}
                    orders={activeOrders}
                    productionTypes={productionTypes}
                    onSelectOrder={(id) => { setSelectedOrderId(id); setView('detail'); }}
                    onNewOrder={() => setView('create')}
                    onDeleteOrder={handleDeleteOrder}
                    currentUser={currentUser}
                  />
                )}
                {view === 'create' && (
                  <CreateOrder
                    users={usersList}
                    productionTypes={productionTypes}
                    onCancel={() => setView('list')}
                    onSubmit={handleCreateOrder}
                  />
                )}
                {view === 'edit' && selectedOrderId && (
                  <EditOrder
                    users={usersList}
                    order={orders.find((o: Order) => o.id === selectedOrderId)!}
                    productionTypes={productionTypes}
                    onCancel={() => setView('detail')}
                    onSubmit={(d) => handleEditOrder(d, selectedOrderId)}
                  />
                )}
                {view === 'detail' && selectedOrderId && (
                  <OrderDetail
                    currentUser={currentUser}
                    order={orders.find((o: Order) => o.id === selectedOrderId)!}
                    onBack={() => { setSelectedOrderId(null); setView('list'); }}
                    onEdit={() => setView('edit')}
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

            {/* Completed Orders */}
            {activeTab === 'completed_orders' && currentUser.permissions?.pages?.completed_orders && (
              <CompletedOrders
                orders={activeOrders}
                onSelectOrder={(id) => handleSelectOrder(id)}
              />
            )}

            {/* Calendar */}
            {activeTab === 'calendar' && (
              <CalendarView
                orders={activeOrders}
                onSelectOrder={(id) => handleSelectOrder(id)}
              />
            )}

            {/* Salary */}
            {activeTab === 'salary' && currentUser.permissions?.pages?.salary && (
              <SalaryView users={usersList} orders={orders} />
            )}

            {/* Nota */}
            {activeTab === 'nota' && (currentUser.permissions?.pages as any)?.nota && (
              <NotaView />
            )}

            {/* Activity Log */}
            {activeTab === 'logs' && currentUser.permissions?.pages?.activity_logs && (
              <ActivityLogView />
            )}

            {/* Trash */}
            {activeTab === 'trash' && (
              <TrashView
                orders={orders.filter((o: Order) => o.deleted_at)}
                onRestore={handleRestoreOrder}
                onPermanentDelete={handlePermanentDelete}
              />
            )}

            {/* Settings */}
            {activeTab === 'settings' && (
              <SettingsPage
                users={usersList}
                productionTypes={productionTypes}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
                onSaveProductionType={handleSaveType}
                onDeleteProductionType={handleDeleteType}
              />
            )}

            {activeTab === 'kalkulator'   && <CalculatorView />}
            {activeTab === 'config_harga' && <ConfigPriceView />}
            {activeTab === 'about'        && <AboutView />}

          </div>
        </main>
      </div>
    </div>
  );
}