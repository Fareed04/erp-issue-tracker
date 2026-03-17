import React, { useState, useEffect } from 'react';
import { Issue, CreateIssuePayload, IssueType, IssueStatus, IssuePriority } from '../types';
import { X, Save, Trash2 } from 'lucide-react';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateIssuePayload) => void;
  onDelete?: (id: string) => void;
  issue?: Issue | null;
}

export const IssueModal: React.FC<IssueModalProps> = ({ isOpen, onClose, onSave, onDelete, issue }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<CreateIssuePayload>({
    title: '',
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    assignee: '',
    reporter: '',
    delay_cause: '',
  });

  useEffect(() => {
    if (issue) {
      setFormData({
        title: issue.title,
        description: issue.description || '',
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        assignee: issue.assignee || '',
        reporter: issue.reporter || '',
        delay_cause: issue.delay_cause || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'task',
        status: 'todo',
        priority: 'medium',
        assignee: '',
        reporter: '',
        delay_cause: '',
      });
    }
    setShowDeleteConfirm(false);
  }, [issue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleDelete = () => {
    if (issue && onDelete) {
      onDelete(issue.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-[60] flex items-center justify-center p-8 text-center">
            <div className="max-w-sm">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Issue?</h3>
              <p className="text-slate-600 mb-8">
                Are you sure you want to delete <span className="font-semibold text-slate-900">"{issue?.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {issue ? 'Edit Issue' : 'Create New Issue'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="issue-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all"
                placeholder="Brief summary of the issue..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all resize-none"
                placeholder="Detailed description, steps to reproduce, etc..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as IssueType })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white"
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="issue">Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as IssueStatus })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as IssuePriority })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                <input
                  type="text"
                  value={formData.assignee || ''}
                  onChange={e => setFormData({ ...formData, assignee: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reporter</label>
                <input
                  type="text"
                  value={formData.reporter || ''}
                  onChange={e => setFormData({ ...formData, reporter: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all"
                  placeholder="e.g. Jane Smith"
                />
              </div>
            </div>

            {formData.status === 'blocked' && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <label className="block text-sm font-medium text-amber-900 mb-1">Delay Cause / Blocker Reason *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.delay_cause || ''}
                  onChange={e => setFormData({ ...formData, delay_cause: e.target.value })}
                  className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-peru-tan focus:border-peru-tan outline-none transition-all resize-none bg-white"
                  placeholder="Why is this blocked?"
                />
              </div>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          {issue && onDelete ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <Trash2 size={18} />
              Delete
            </button>
          ) : (
            <div></div>
          )}
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="issue-form"
              className="flex items-center gap-2 px-6 py-2 bg-tawny-port hover:bg-tawny-port/90 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </div>


      </div>
    </div>
  );
};
