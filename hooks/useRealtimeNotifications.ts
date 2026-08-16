'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  type: 'new_job' | 'application_update' | 'assignment_update';
  title: string;
  message: string;
  link?: string;
  timestamp: Date;
  read: boolean;
}

const MAX_NOTIFICATIONS = 20;

export function useRealtimeNotifications(testerId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toast, setToast] = useState<Notification | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notif: Notification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));
    setToast(notif);
    setTimeout(() => setToast(null), 6000);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    const jobChannel = supabase
      .channel('dashboard-jobs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'uat_jobs', filter: 'status=eq.open' },
        (payload: any) => {
          const job = payload.new;
          addNotification({
            type: 'new_job',
            title: 'New Testing Job',
            message: job.title || 'A new job has been posted',
            link: `/uat/jobs/${job.id}`,
          });
        }
      )
      .subscribe();

    let appChannel: any = null;
    if (testerId) {
      appChannel = supabase
        .channel('dashboard-apps')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'uat_tester_applications', filter: `user_id=eq.${testerId}` },
          (payload: any) => {
            const newStatus = payload.new?.status;
            const oldStatus = payload.old?.status;
            if (oldStatus && oldStatus === newStatus) return;

            const statusLabels: Record<string, string> = {
              submitted: 'Submitted',
              under_review: 'Under Review',
              approved: 'Approved',
              declined: 'Declined',
              waitlisted: 'Waitlisted',
              more_information_required: 'More Info Needed',
              closed: 'Closed',
            };

            addNotification({
              type: 'application_update',
              title: 'Application Status Updated',
              message: `Your application is now "${statusLabels[newStatus] || newStatus || 'Updated'}"`,
              link: '/uat-testing/apply',
            });
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(jobChannel);
      if (appChannel) supabase.removeChannel(appChannel);
    };
  }, [testerId, addNotification]);

  return { notifications, toast, unreadCount, markAllRead, markRead, clearAll };
}