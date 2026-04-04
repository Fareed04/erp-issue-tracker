import React from 'react';
import { Issue, IssueStatus } from '../types';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { AlertCircle, Clock, CheckCircle2, CircleDashed, MoreVertical } from 'lucide-react';
import { Avatar } from './Avatar';

interface BoardProps {
  issues: Issue[];
  onUpdateStatus: (id: string, status: IssueStatus) => void;
  onEditIssue: (issue: Issue) => void;
}

const COLUMNS: { id: IssueStatus; label: string; icon: any; color: string }[] = [
  { id: 'todo', label: 'To Do', icon: CircleDashed, color: 'text-slate-500' },
  { id: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-peru-tan' },
  { id: 'blocked', label: 'Blocked', icon: AlertCircle, color: 'text-tawny-port' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: 'text-emerald-500' },
];

export const Board: React.FC<BoardProps> = ({ issues, onUpdateStatus, onEditIssue }) => {
  return (
    <div className="p-4 lg:p-8 h-full flex flex-col">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-erp-black dark:text-white">Kanban Board</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage tasks and track progress.</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex gap-4 lg:gap-6 min-w-max h-full pb-4">
          {COLUMNS.map(column => {
            const columnIssues = issues.filter(i => i.status === column.id);
            const Icon = column.icon;

            return (
              <div key={column.id} className="w-[280px] lg:w-80 flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className={column.color} />
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">{column.label}</h3>
                  </div>
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium px-2 py-1 rounded-full">
                    {columnIssues.length}
                  </span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {columnIssues.map(issue => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={issue.id}
                      className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow group"
                      onClick={() => onEditIssue(issue)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={clsx(
                          "text-xs font-medium px-2 py-1 rounded-md uppercase tracking-wider",
                          issue.type === 'bug' ? 'bg-tawny-port/10 text-tawny-port dark:bg-tawny-port/20 dark:text-red-400' :
                          issue.type === 'task' ? 'bg-peru-tan/10 text-peru-tan dark:bg-peru-tan/20 dark:text-amber-400' :
                          'bg-erp-black/10 text-erp-black dark:bg-slate-700 dark:text-slate-300'
                        )}>
                          {issue.type}
                        </span>
                        <span className={clsx(
                          "text-xs font-medium px-2 py-1 rounded-md",
                          issue.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          issue.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        )}>
                          {issue.priority}
                        </span>
                      </div>
                      <h4 className="font-medium text-erp-black dark:text-white mb-2 line-clamp-2">{issue.title}</h4>
                      
                      {issue.status === 'blocked' && issue.delay_cause && (
                        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-amber-800 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-start gap-1.5">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{issue.delay_cause}</span>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {issue.assigneeName ? (
                            <Avatar name={issue.assigneeName} src={issue.assigneePhoto} size="sm" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 border-dashed flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs" title="Unassigned">
                              ?
                            </div>
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{issue.assigneeName || 'Unassigned'}</span>
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          {COLUMNS.map(col => {
                            if (col.id === issue.status) return null;
                            return (
                              <button
                                key={col.id}
                                onClick={() => onUpdateStatus(issue.id, col.id)}
                                className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                title={`Move to ${col.label}`}
                              >
                                <col.icon size={14} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
