import React, { useEffect, useState } from 'react';
import { Bell, X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onDismiss }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-tawny-port text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-[101] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Notifications</h3>
              <span className="text-xs text-slate-500">{notifications.length} New</span>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map(notif => (
                    <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors group relative">
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
                          <p className="text-sm text-slate-700 leading-tight">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button 
                          onClick={() => onDismiss(notif.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-400 transition-all"
                        >
                          <X size={14} />
                        </button>
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
