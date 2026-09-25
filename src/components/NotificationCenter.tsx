import React, { useEffect, useState } from 'react';
import { Bell, X, AlertTriangle, Info, CheckCircle, Check, Mail, ExternalLink, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { AppNotification, EmailLogEntry } from '../types';
import * as api from '../services/api';

interface NotificationCenterProps {
  userId?: string;
  onIssueClick?: (issueId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, onIssueClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'emails'>('alerts');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);

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

  const loadEmails = async () => {
    setLoadingEmails(true);
    try {
      const logs = await api.fetchEmailLogs();
      setEmailLogs(logs);
    } catch (err) {
      console.error('Failed to load email logs:', err);
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'emails') {
      loadEmails();
    }
  }, [isOpen, activeTab]);

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
        title="Notifications & Emails"
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
          <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[101] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            
            {/* Header & Tabs */}
            <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Activity & Alerts</h3>
                {activeTab === 'alerts' && unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-tawny-port hover:text-tawny-port/80 font-medium flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
                {activeTab === 'emails' && (
                  <button 
                    onClick={loadEmails}
                    disabled={loadingEmails}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                    title="Refresh emails"
                  >
                    <RefreshCw size={12} className={loadingEmails ? 'animate-spin' : ''} /> Refresh
                  </button>
                )}
              </div>

              {/* Tab Selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className={clsx(
                    "flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                    activeTab === 'alerts' 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                >
                  <Bell size={13} />
                  <span>In-App Alerts</span>
                  {unreadCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-tawny-port text-white text-[10px] rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('emails')}
                  className={clsx(
                    "flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                    activeTab === 'emails' 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                >
                  <Mail size={13} />
                  <span>Email Outbox</span>
                  {emailLogs.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-[10px] rounded-full font-medium">
                      {emailLogs.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
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
            )}

            {/* Email Logs Tab */}
            {activeTab === 'emails' && (
              <div className="max-h-96 overflow-y-auto">
                {loadingEmails ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    Loading dispatched emails...
                  </div>
                ) : emailLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <Mail size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No emails dispatched yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Emails sent when tasks are assigned or updated will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {emailLogs.map(log => (
                      <div key={log.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={clsx(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                            log.type === 'assignment' ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" :
                            log.type === 'status_change' ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                            log.type === 'comment' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                            log.type === 'deadline' ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                            "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                          )}>
                            {log.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.sentAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1">
                          {log.subject}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="truncate max-w-[200px]" title={log.to}>
                            To: <strong className="text-slate-700 dark:text-slate-300">{log.to}</strong>
                          </span>
                          {log.previewUrl ? (
                            <a
                              href={log.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-tawny-port hover:underline font-semibold"
                            >
                              <ExternalLink size={11} />
                              Preview
                            </a>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                              Dispatched
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
};
