import React, { useEffect, useState } from 'react';
import { Bell, X, AlertTriangle, Info, CheckCircle, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { AppNotification } from '../types';
import * as api from '../services/api';

interface NotificationCenterProps {
  userId?: string;
  onIssueClick?: (issueId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, onIssueClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (userId) {
      const unsubscribe = api.subscribeToNotifications(userId, (data) => {
        setNotifications(data);
      });
      return () => unsubscribe();
    } else {
      setNotifications([]);
    }
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleDismiss = async (id: string) => {
    if (userId) {
      await api.markNotificationAsRead(userId, id);
    }
  };

  const handleMarkAllRead = async () => {
    if (userId && unreadCount > 0) {
      await api.markAllNotificationsAsRead(userId);
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read && userId) {
      api.markNotificationAsRead(userId, notif.id);
    }
    if (notif.linkToIssueId && onIssueClick) {
      onIssueClick(notif.linkToIssueId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-tawny-port text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[101] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} New</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-tawny-port hover:text-tawny-port/80 font-medium flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                  <Bell size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={clsx(
                        "p-4 transition-colors group relative cursor-pointer",
                        notif.read ? "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50" : "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      )}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex gap-3">
                        <div className={clsx(
                          "mt-1",
                          notif.type === 'success' && "text-emerald-500",
                          notif.type === 'warning' && "text-amber-500",
                          notif.type === 'error' && "text-red-500",
                          notif.type === 'info' && "text-blue-500"
                        )}>
                          {notif.type === 'warning' ? <AlertTriangle size={16} /> : 
                           notif.type === 'success' ? <CheckCircle size={16} /> : 
                           <Info size={16} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">{notif.title}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-tight">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {new Date(notif.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!notif.read && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(notif.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 dark:text-slate-500 transition-all"
                            title="Mark as read"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
