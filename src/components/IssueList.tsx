import React from 'react';
import { Issue } from '../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, Clock, CircleDashed } from 'lucide-react';

interface IssueListProps {
  issues: Issue[];
  onEditIssue: (issue: Issue) => void;
}

export const IssueList: React.FC<IssueListProps> = ({ issues, onEditIssue }) => {
  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Issue List</h2>
          <p className="text-slate-500 mt-1">Detailed view of all tasks, bugs, and issues.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Assignee</th>
              <th className="px-6 py-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {issues.map(issue => (
              <tr 
                key={issue.id} 
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onEditIssue(issue)}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{issue.title}</div>
                  {issue.delay_cause && issue.status === 'blocked' && (
                    <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {issue.delay_cause}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "text-xs font-medium px-2 py-1 rounded-md uppercase tracking-wider",
                    issue.type === 'bug' ? 'bg-red-100 text-red-700' :
                    issue.type === 'task' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  )}>
                    {issue.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {issue.status === 'todo' && <CircleDashed size={16} className="text-slate-500" />}
                    {issue.status === 'in_progress' && <Clock size={16} className="text-blue-500" />}
                    {issue.status === 'blocked' && <AlertCircle size={16} className="text-amber-500" />}
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
