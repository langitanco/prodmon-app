// app/hooks/useNotifications.ts

import { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  orderId?: string;
  type?: 'warning' | 'info' | 'success';
}

interface UseNotificationsProps {
  currentUserId: string | null;
  supabase: SupabaseClient;
}

export function useNotifications({ currentUserId, supabase }: UseNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(
          data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }),
            isRead: n.is_read,
            orderId: n.order_id,
            type: n.type ?? 'info',
          }))
        );
      }
    } catch (error) {
      console.error('Err fetch notifications:', error);
    }
  }, [currentUserId, supabase]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Err mark as read:', error);
    }
  }, [supabase]);

  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUserId)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Err mark all as read:', error);
    }
  }, [currentUserId, supabase]);

  return {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}