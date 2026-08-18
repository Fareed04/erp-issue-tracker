import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'n', description: 'Create a new issue' },
    { key: '/', description: 'Focus search input' },
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'esc', description: 'Close modals or menus' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Keyboard className="text-slate-500 dark:text-slate-400" size={20} />
            </div>
            <h2 id="shortcuts-title" className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <ul className="space-y-4">
            {shortcuts.map((shortcut) => (
              <li key={shortcut.key} className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {shortcut.description}
                </span>
                <kbd className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-sm">
                  {shortcut.key}
                </kbd>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
