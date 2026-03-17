import React, { useState } from 'react';
import { Issue, IssueStatus, IssuePriority, BulkUpdatePayload } from '../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, Clock, CircleDashed, CheckSquare, Square, UserPlus, ArrowUpCircle, Layout } from 'lucide-react';

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
        <div className="mb-6 bg-tawny-port text-white p-4 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <CheckSquare size={20} />
            </div>
            <div>
              <span className="font-bold text-lg">{selectedIds.length}</span>
              <span className="ml-2 opacity-90">issues selected</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="h-8 w-px bg-white/20 mx-2 hidden md:block"></div>
            
            <div className="flex items-center gap-2 bg-white/10 p-1 rounded-lg">
              <span className="text-xs font-medium uppercase tracking-wider px-2 opacity-70">Status</span>
              {(['todo', 'in_progress', 'blocked', 'done'] as IssueStatus[]).map(status => (
                <button
                  key={status}
                  disabled={isUpdating}
                  onClick={() => handleBulkAction({ status })}
                  className="px-3 py-1 text-xs font-bold rounded-md hover:bg-white/20 transition-colors capitalize disabled:opacity-50"
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white/10 p-1 rounded-lg">
              <span className="text-xs font-medium uppercase tracking-wider px-2 opacity-70">Priority</span>
              {(['low', 'medium', 'high', 'critical'] as IssuePriority[]).map(priority => (
                <button
                  key={priority}
                  disabled={isUpdating}
                  onClick={() => handleBulkAction({ priority })}
                  className="px-3 py-1 text-xs font-bold rounded-md hover:bg-white/20 transition-colors capitalize disabled:opacity-50"
                >
                  {priority}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium">
              <th className="px-6 py-4 w-12">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-tawny-port transition-colors">
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
          <tbody className="divide-y divide-slate-200">
            {issues.map(issue => (
              <tr 
                key={issue.id} 
                className={clsx(
                  "hover:bg-slate-50 cursor-pointer transition-colors",
                  selectedIds.includes(issue.id) && "bg-slate-50"
                )}
                onClick={() => onEditIssue(issue)}
              >
                <td className="px-6 py-4" onClick={(e) => toggleSelect(issue.id, e)}>
                  <button className="text-slate-400 hover:text-tawny-port transition-colors">
                    {selectedIds.includes(issue.id) ? <CheckSquare size={20} className="text-tawny-port" /> : <Square size={20} />}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-erp-black">{issue.title}</div>
                  {issue.delay_cause && issue.status === 'blocked' && (
                    <div className="text-xs text-tawny-port mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {issue.delay_cause}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "text-xs font-medium px-2 py-1 rounded-md uppercase tracking-wider",
                    issue.type === 'bug' ? 'bg-tawny-port/10 text-tawny-port' :
                    issue.type === 'task' ? 'bg-peru-tan/10 text-peru-tan' :
                    'bg-erp-black/10 text-erp-black'
                  )}>
                    {issue.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {issue.status === 'todo' && <CircleDashed size={16} className="text-slate-500" />}
                    {issue.status === 'in_progress' && <Clock size={16} className="text-peru-tan" />}
                    {issue.status === 'blocked' && <AlertCircle size={16} className="text-tawny-port" />}
                    {issue.status === 'done' && <CheckCircle2 size={16} className="text-emerald-500" />}
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className={clsx(
                    "text-xs font-medium px-2 py-1 rounded-md",
                    issue.priority === 'critical' ? 'bg-red-100 text-red-700' :
                    issue.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-700'
                  )}>
                    {issue.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {issue.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {issue.assignee.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-700">{issue.assignee}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-700">{issue.reporter || 'N/A'}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
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
