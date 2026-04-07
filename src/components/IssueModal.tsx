import React, { useState, useEffect } from 'react';
import { Issue, CreateIssuePayload, IssueType, IssueStatus, IssuePriority, UserProfile, ActivityLog } from '../types';
import { X, Save, Trash2, User, Clock } from 'lucide-react';
import * as api from '../services/api';
import { Avatar } from './Avatar';
import { formatDistanceToNow } from 'date-fns';
import { auth } from '../firebase';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateIssuePayload) => void;
  onDelete?: (id: string) => void;
  issue?: Issue | null;
}

export const IssueModal: React.FC<IssueModalProps> = ({ isOpen, onClose, onSave, onDelete, issue }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'comments'>('details');
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    assigneeUid: '',
    assigneeName: '',
    assigneePhoto: '',
    delay_cause: '',
    dueDate: '',
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const profiles = await api.getAllUserProfiles();
        setUsers(profiles);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };
    if (isOpen) loadUsers();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && issue) {
      const unsubscribeActivities = api.subscribeToIssueActivities(issue.id, (data) => {
        setActivities(data);
      });
      const unsubscribeComments = api.subscribeToComments(issue.id, (data) => {
        setComments(data);
      });
      return () => {
        unsubscribeActivities();
        unsubscribeComments();
      };
    } else {
      setActivities([]);
      setComments([]);
    }
  }, [isOpen, issue]);

  useEffect(() => {
    if (issue) {
      setFormData({
        title: issue.title,
        description: issue.description || '',
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        assigneeUid: issue.assigneeUid || '',
        assigneeName: issue.assigneeName || '',
        assigneePhoto: issue.assigneePhoto || '',
        delay_cause: issue.delay_cause || '',
        dueDate: issue.dueDate || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'task',
        status: 'todo',
        priority: 'medium',
        assigneeUid: '',
        assigneeName: '',
        assigneePhoto: '',
        delay_cause: '',
        dueDate: '',
      });
      setActiveTab('details');
    }
    setShowDeleteConfirm(false);
  }, [issue, isOpen]);

  if (!isOpen) return null;

  const handleAssigneeChange = (uid: string) => {
    const selectedUser = users.find(u => u.uid === uid);
    if (selectedUser) {
      setFormData({
        ...formData,
        assigneeUid: selectedUser.uid,
        assigneeName: selectedUser.displayName,
        assigneePhoto: selectedUser.photoURL,
      });
    } else {
      setFormData({
        ...formData,
        assigneeUid: '',
        assigneeName: '',
        assigneePhoto: '',
      });
    }
  };

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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm z-[60] flex items-center justify-center p-8 text-center">
            <div className="max-w-sm">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Issue?</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{issue?.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
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

        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {issue ? 'Edit Issue' : 'Create New Issue'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {issue && (
          <div className="flex border-b border-slate-200 dark:border-slate-700 px-6 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-tawny-port text-tawny-port dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'comments'
                  ? 'border-tawny-port text-tawny-port dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'activity'
                  ? 'border-tawny-port text-tawny-port dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <Clock size={16} />
              Activity Log
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'details' ? (
            <form id="issue-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  placeholder="Brief summary of the issue..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  placeholder="Detailed description, steps to reproduce, etc..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as IssueType })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="task">Task</option>
                    <option value="bug">Bug</option>
                    <option value="issue">Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as IssueStatus })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as IssuePriority })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assignee</label>
                  <select
                    value={formData.assigneeUid}
                    onChange={e => handleAssigneeChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.uid} value={u.uid}>{u.displayName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {formData.status === 'blocked' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50">
                  <label className="block text-sm font-medium text-amber-900 dark:text-amber-400 mb-1">Delay Cause / Blocker Reason *</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.delay_cause || ''}
                    onChange={e => setFormData({ ...formData, delay_cause: e.target.value })}
                    className="w-full px-4 py-2 border border-amber-300 dark:border-amber-700/50 rounded-lg focus:ring-2 focus:ring-peru-tan focus:border-peru-tan outline-none transition-all resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    placeholder="Why is this blocked?"
                  />
                </div>
              )}
            </form>
          ) : activeTab === 'activity' ? (
            <div className="space-y-6">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Clock className="mx-auto h-12 w-12 opacity-20 mb-3" />
                  <p>No activity recorded yet.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="relative pl-6">
                      <div className="absolute -left-3 top-0">
                        <Avatar 
                          src={activity.userPhoto || undefined} 
                          name={activity.userName} 
                          size="sm" 
                          className="ring-4 ring-white dark:ring-slate-800"
                        />
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                            {activity.userName}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400" title={new Date(activity.timestamp).toLocaleString()}>
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {activity.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar 
                        src={comment.userPhoto || undefined} 
                        name={comment.userName} 
                        size="sm" 
                        className="shrink-0 mt-1"
                      />
                      <div className="flex-1">
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg rounded-tl-none p-3 border border-slate-100 dark:border-slate-700/50">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                              {comment.userName}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400" title={new Date(comment.timestamp).toLocaleString()}>
                              {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-auto shrink-0">
                <div className="flex gap-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    disabled={!newComment.trim()}
                    onClick={async () => {
                      if (issue && newComment.trim()) {
                        const currentUser = auth.currentUser;
                        if (currentUser) {
                          await api.addComment(issue.id, currentUser, newComment.trim());
                          setNewComment('');
                        }
                      }
                    }}
                    className="px-4 py-2 bg-tawny-port hover:bg-tawny-port/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          {issue && onDelete && activeTab === 'details' ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
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
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
            >
              {activeTab === 'details' ? 'Cancel' : 'Close'}
            </button>
            {activeTab === 'details' && (
              <button
                type="submit"
                form="issue-form"
                className="flex items-center gap-2 px-6 py-2 bg-tawny-port hover:bg-tawny-port/90 text-white rounded-lg transition-colors font-medium shadow-sm"
              >
                <Save size={18} />
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
