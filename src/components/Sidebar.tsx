import React from 'react';
import { LayoutDashboard, KanbanSquare, List, X, Users } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  currentView: 'dashboard' | 'board' | 'list' | 'users';
  onViewChange: (view: 'dashboard' | 'board' | 'list' | 'users') => void;
  isOpen: boolean;
  onClose: () => void;
  userProfile?: import('../types').UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, onClose, userProfile }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'board', label: 'Kanban Board', icon: KanbanSquare },
    { id: 'list', label: 'Issue List', icon: List },
  ] as const;
  
  const adminNavItems = [
    { id: 'users', label: 'Manage Users', icon: Users },
  ] as const;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        "fixed inset-y-0 left-0 w-64 bg-erp-black text-slate-300 flex flex-col h-full z-50 transition-transform duration-300 lg:relative lg:translate-x-0 shrink-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-tawny-port rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">ERP</span>
            </div>
            Tracker
          </h1>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  onClose();
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                  isActive ? "bg-tawny-port text-white shadow-lg shadow-tawny-port/20" : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
          
          {userProfile?.role === 'Admin' && (
            <>
              <div className="pt-4 pb-2">
                <span className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</span>
              </div>
              {adminNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      onClose();
                    }}
                    className={clsx(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                      isActive ? "bg-tawny-port text-white shadow-lg shadow-tawny-port/20" : "hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

