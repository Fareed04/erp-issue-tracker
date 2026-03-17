import React from 'react';
import { LayoutDashboard, KanbanSquare, List } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  currentView: 'dashboard' | 'board' | 'list';
  onViewChange: (view: 'dashboard' | 'board' | 'list') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'board', label: 'Kanban Board', icon: KanbanSquare },
    { id: 'list', label: 'Issue List', icon: List },
  ] as const;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">ERP</span>
          </div>
          Tracker
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                isActive ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
