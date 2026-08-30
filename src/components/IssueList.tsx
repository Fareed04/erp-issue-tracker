import React, { useState } from 'react';
import { Issue, IssueStatus, IssuePriority, BulkUpdatePayload } from '../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, Clock, CircleDashed, CheckSquare, Square } from 'lucide-react';
import { Avatar } from './Avatar';

interface IssueListProps {
  issues: Issue[];
  onEditIssue: (issue: Issue) => void;
  onBulkUpdate: (payload: BulkUpdatePayload) => Promise<void>;
}

export const IssueList: React.FC<IssueListProps> = ({ issues, onEditIssue, onBulkUpdate }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === issues.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(issues.map(i => i.id));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async (action: Partial<BulkUpdatePayload>) => {
    if (selectedIds.length === 0) return;
    setIsUpdating(true);
    try {
      await onBulkUpdate({ ids: selectedIds, ...action });
      setSelectedIds([]);
    } catch (error) {
      console.error('Bulk update failed', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      {selectedIds.length > 0 && (
        <div className="mb-6 bg-tawny-port text-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <CheckSquare size={20} />
            </div>
            <div>
              <span className="font-bold text-lg">{selectedIds.length}</span>
              <span className="ml-2 opacity-90">issues selected</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 w-full sm:w-auto">
            <div className="h-8 w-px bg-white/20 mx-2 hidden md:block"></div>
            
            <div className="flex flex-wrap items-center gap-2 bg-white/10 p-1 rounded-lg w-full sm:w-auto">
              <span className="text-xs font-medium uppercase tracking-wider px-2 opacity-70 w-full sm:w-auto">Status</span>
              {(['todo', 'in_progress', 'blocked', 'done'] as IssueStatus[]).map(status => (
                <button
                  key={status}
                  disabled={isUpdating}
                  onClick={() => handleBulkAction({ status })}
                  className="px-3 py-1 text-xs font-bold rounded-md hover:bg-white/20 transition-colors capitalize disabled:opacity-50 flex-1 sm:flex-none"
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white/10 p-1 rounded-lg w-full sm:w-auto">
              <span className="text-xs font-medium uppercase tracking-wider px-2 opacity-70 w-full sm:w-auto">Priority</span>
              {(['low', 'medium', 'high', 'critical'] as IssuePriority[]).map(priority => (
                <button
                  key={priority}
                  disabled={isUpdating}
                  onClick={() => handleBulkAction({ priority })}
                  className="px-3 py-1 text-xs font-bold rounded-md hover:bg-white/20 transition-colors capitalize disabled:opacity-50 flex-1 sm:flex-none"
                >
                  {priority}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors w-full sm:w-auto text-center mt-2 sm:mt-0"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-medium">
              <th className="px-6 py-4 w-12">
                <button onClick={toggleSelectAll} className="text-slate-400 dark:text-slate-500 hover:text-tawny-port dark:hover:text-tawny-port transition-colors">
                  {selectedIds.length === issues.length && issues.length > 0 ? <CheckSquare size={20} className="text-tawny-port" /> : <Square size={20} />}
                </button>
              </th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Assignee</th>
              <th className="px-6 py-4">Reporter</th>
              <th className="px-6 py-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {issues.map(issue => (
              <tr 
                key={issue.id} 
                className={clsx(
                  "hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors",
                  selectedIds.includes(issue.id) && "bg-slate-50 dark:bg-slate-700/50"
                )}
                onClick={() => onEditIssue(issue)}
              >
                <td className="px-6 py-4" onClick={(e) => toggleSelect(issue.id, e)}>
                  <button className="text-slate-400 dark:text-slate-500 hover:text-tawny-port dark:hover:text-tawny-port transition-colors">
                    {selectedIds.includes(issue.id) ? <CheckSquare size={20} className="text-tawny-port" /> : <Square size={20} />}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-erp-black dark:text-white">{issue.title}</div>
                  {issue.delay_cause && issue.status === 'blocked' && (
                    <div className="text-xs text-tawny-port dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {issue.delay_cause}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "text-xs font-medium px-2 py-1 rounded-md uppercase tracking-wider",
                    issue.type === 'bug' ? 'bg-tawny-port/10 text-tawny-port dark:bg-tawny-port/20 dark:text-red-400' :
                    issue.type === 'task' ? 'bg-peru-tan/10 text-peru-tan dark:bg-peru-tan/20 dark:text-amber-400' :
                    'bg-erp-black/10 text-erp-black dark:bg-slate-700 dark:text-slate-300'
                  )}>
                    {issue.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {issue.status === 'todo' && <CircleDashed size={16} className="text-slate-500 dark:text-slate-400" />}
                    {issue.status === 'in_progress' && <Clock size={16} className="text-peru-tan dark:text-amber-500" />}
                    {issue.status === 'blocked' && <AlertCircle size={16} className="text-tawny-port dark:text-red-500" />}
                    {issue.status === 'done' && <CheckCircle2 size={16} className="text-emerald-500" />}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className={clsx(
                    "text-xs font-medium px-2 py-1 rounded-md",
                    issue.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    issue.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  )}>
                    {issue.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {issue.assigneeName ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={issue.assigneeName} src={issue.assigneePhoto} size="sm" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{issue.assigneeName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {issue.reporterName ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={issue.reporterName} src={issue.reporterPhoto} size="sm" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{issue.reporterName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-700 dark:text-slate-300">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                  {format(new Date(issue.created_at), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
