'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { InAppNotification } from '@/types';
import Link from 'next/link';

import { getNotifications } from '@/lib/store';

interface NotificationDropdownProps {
  currentRole?: 'citizen' | 'authority';
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ currentRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>(() =>
    getNotifications(currentRole)
  );

  useEffect(() => {
    let ignore = false;
    const url = currentRole ? `/api/notifications?role=${currentRole}` : '/api/notifications';
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (!ignore && data.notifications) {
          setNotifications(data.notifications);
        }
      })
      .catch(err => console.warn('Failed to fetch notifications:', err));

    return () => {
      ignore = true;
    };
  }, [currentRole]);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Notifications
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium">
                {unreadCount} new
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Close
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No notifications yet.</div>
            ) : (
              notifications.map(n => {
                const targetLink = n.userRole === 'authority'
                  ? `/authority/cases/${n.caseId}`
                  : `/citizen/reports/${n.caseId}`;

                return (
                  <div
                    key={n.id}
                    className={`p-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      !n.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          )}
                          <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {n.title}
                          </h5>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className="flex items-center gap-2">
                            {!n.read && (
                              <button
                                type="button"
                                onClick={() => markAsRead(n.id)}
                                className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-0.5"
                                title="Mark read"
                              >
                                <Check className="w-3 h-3" /> Mark read
                              </button>
                            )}
                            <Link
                              href={targetLink}
                              onClick={() => {
                                markAsRead(n.id);
                                setIsOpen(false);
                              }}
                              className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-0.5"
                            >
                              View Case <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
