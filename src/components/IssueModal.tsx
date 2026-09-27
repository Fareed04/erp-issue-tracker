import React, { useState, useEffect } from 'react';
import { Issue, CreateIssuePayload, IssueType, IssueStatus, IssuePriority, UserProfile, ActivityLog } from '../types';
import { X, Save, Trash2, User, Clock, Edit3, Mic, Link2, Lock, ArrowRight, CheckCircle2, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import * as api from '../services/api';
import { Avatar } from './Avatar';
import { AudioRecorder } from './AudioRecorder';
import { AudioPlayer } from './AudioPlayer';
import { formatDistanceToNow } from 'date-fns';
import { auth } from '../firebase';
import { resolveDependencies } from '../utils/dependencies';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateIssuePayload) => void;
  onDelete?: (id: string) => void;
  onSelectIssue?: (issue: Issue) => void;
  issue?: Issue | null;
  userProfile?: UserProfile | null;
  allIssues?: Issue[];
  defaultType?: IssueType;
}

export const IssueModal: React.FC<IssueModalProps> = ({ isOpen, onClose, onSave, onDelete, onSelectIssue, issue, userProfile, allIssues = [], defaultType }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'comments'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef<any>(null);
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
    links: [],
    voiceNoteUrl: '',
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
        links: issue.links || [],
        voiceNoteUrl: issue.voiceNoteUrl || '',
      });
      setIsEditing(false);
    } else {
      setFormData({
        title: '',
        description: '',
        type: defaultType || 'task',
        status: 'todo',
        priority: 'medium',
        assigneeUid: '',
        assigneeName: '',
        assigneePhoto: '',
        delay_cause: '',
        dueDate: '',
        links: [],
        voiceNoteUrl: '',
      });
      setActiveTab('details');
      setIsEditing(true);
    }
    setShowDeleteConfirm(false);
  }, [issue, isOpen, defaultType]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setFormData((prev: any) => ({ 
          ...prev, 
          description: prev.description ? prev.description + ' ' + finalTranscript.trim() : finalTranscript.trim() 
        }));
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
    recognitionRef.current = recognition;
  };

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
    const payload = {
      ...formData,
      links: formData.links ? formData.links.filter((l: any) => l.targetIssueId) : []
    };
    onSave(payload);
  };

  const handleSaveDraft = () => {
    const form = document.getElementById('issue-form') as HTMLFormElement;
    if (form && form.checkValidity()) {
      const payload = {
        ...formData,
        status: 'draft',
        links: formData.links ? formData.links.filter((l: any) => l.targetIssueId) : []
      };
      onSave(payload);
    } else if (form) {
      form.reportValidity();
    }
  };

  const handleDelete = () => {
    if (issue && onDelete) {
      onDelete(issue.id);
    }
  };

  const canDelete = userProfile?.role === 'Admin';
  const canEdit = !issue || 
    userProfile?.role === 'Admin' || 
    userProfile?.role === 'Manager' || 
    (issue && (userProfile?.uid === issue.assigneeUid || userProfile?.uid === issue.reporterUid));

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
            {issue ? (isEditing ? 'Edit Issue' : 'Issue Details') : 'Create New Issue'}
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
            !isEditing && issue ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Title</h3>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{issue.title}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Description</h3>
                  {issue.description ? (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-sm">
                      {issue.description}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-500 italic text-sm">No description provided.</p>
                  )}
                  {issue.voiceNoteUrl && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Voice Note</h3>
                      <AudioPlayer src={issue.voiceNoteUrl} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Type</span>
                    <span className="capitalize font-medium text-slate-900 dark:text-slate-100">{issue.type}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</span>
                    <span className="capitalize font-medium text-slate-900 dark:text-slate-100">{issue.status.replace('_', ' ')}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Priority</span>
                    <span className="capitalize font-medium text-slate-900 dark:text-slate-100">{issue.priority}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Due Date</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'None'}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Assignee</h3>
                  {issue.assigneeUid ? (
                    <div className="flex items-center gap-3">
                      <Avatar src={issue.assigneePhoto || null} name={issue.assigneeName || 'Unknown'} size="sm" />
                      <span className="font-medium text-slate-900 dark:text-slate-100">{issue.assigneeName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                        <User size={14} />
                      </div>
                      <span className="italic text-sm">Unassigned</span>
                    </div>
                  )}
                </div>

                {issue.status === 'blocked' && issue.delay_cause && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 mt-6">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">Delay Cause / Blocker</h3>
                    <p className="text-amber-800 dark:text-amber-200 text-sm">{issue.delay_cause}</p>
                  </div>
                )}

                {(() => {
                  if (!issue) return null;
                  const deps = resolveDependencies(issue, allIssues);

                  return (
                    <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Link2 size={16} className="text-slate-500" />
                          Dependencies & Relationships
                          {deps.all.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                              {deps.all.length}
                            </span>
                          )}
                        </h3>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="text-xs text-tawny-port dark:text-red-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <Edit3 size={12} />
                            Manage Dependencies
                          </button>
                        )}
                      </div>

                      {/* Active Blocker Alert Banner */}
                      {deps.activeBlockersCount > 0 && (
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3 rounded-lg flex items-start gap-2.5">
                          <Lock size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-red-900 dark:text-red-300">
                              Work is blocked by {deps.activeBlockersCount} unresolved {deps.activeBlockersCount === 1 ? 'task' : 'tasks'}
                            </span>
                            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                              The blocking issue(s) listed below must be completed before progress can continue.
                            </p>
                          </div>
                        </div>
                      )}

                      {deps.hasBlockersResolved && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-2.5 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                          <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>All prerequisite blockers have been resolved!</span>
                        </div>
                      )}

                      {deps.all.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700/60 rounded-lg p-4 text-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">No dependencies or related issues linked yet.</p>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => setIsEditing(true)}
                              className="text-xs text-tawny-port hover:text-peru-tan font-medium inline-flex items-center gap-1 transition-colors"
                            >
                              <Plus size={12} /> Add Dependency
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Blocked By */}
                          {deps.blockedBy.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                <Lock size={13} className="text-red-500" />
                                <span>Blocked By ({deps.blockedBy.length})</span>
                              </div>
                              <div className="space-y-2">
                                {deps.blockedBy.map(dep => {
                                  const target = dep.targetIssue;
                                  const isDone = target.status === 'done';
                                  return (
                                    <div
                                      key={dep.id}
                                      onClick={() => onSelectIssue && onSelectIssue(target)}
                                      className={clsx(
                                        "flex items-center justify-between p-2.5 rounded-lg border text-sm transition-all",
                                        onSelectIssue && "cursor-pointer hover:border-slate-400 dark:hover:border-slate-500",
                                        isDone
                                          ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-80"
                                          : "bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
                                      )}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={clsx(
                                          "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider shrink-0",
                                          isDone
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                        )}>
                                          {isDone ? '✓ Resolved' : 'Active Blocker'}
                                        </span>
                                        <span className={clsx(
                                          "font-medium text-slate-800 dark:text-slate-200 truncate text-xs sm:text-sm",
                                          isDone && "line-through text-slate-500"
                                        )}>
                                          {target.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                          {target.status.replace('_', ' ')}
                                        </span>
                                        {target.assigneeName && (
                                          <Avatar src={target.assigneePhoto} name={target.assigneeName} size="sm" className="w-5 h-5 text-[10px]" />
                                        )}
                                        {onSelectIssue && <ArrowRight size={13} className="text-slate-400" />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Blocks */}
                          {deps.blocks.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                <ArrowRight size={13} className="text-amber-500" />
                                <span>Blocks ({deps.blocks.length})</span>
                              </div>
                              <div className="space-y-2">
                                {deps.blocks.map(dep => {
                                  const target = dep.targetIssue;
                                  return (
                                    <div
                                      key={dep.id}
                                      onClick={() => onSelectIssue && onSelectIssue(target)}
                                      className={clsx(
                                        "flex items-center justify-between p-2.5 rounded-lg border text-sm transition-all bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40",
                                        onSelectIssue && "cursor-pointer hover:border-amber-400"
                                      )}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 shrink-0">
                                          Blocks
                                        </span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate text-xs sm:text-sm">
                                          {target.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                          {target.status.replace('_', ' ')}
                                        </span>
                                        {target.assigneeName && (
                                          <Avatar src={target.assigneePhoto} name={target.assigneeName} size="sm" className="w-5 h-5 text-[10px]" />
                                        )}
                                        {onSelectIssue && <ArrowRight size={13} className="text-slate-400" />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Relates To */}
                          {deps.relatesTo.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                <Link2 size={13} className="text-blue-500" />
                                <span>Relates To ({deps.relatesTo.length})</span>
                              </div>
                              <div className="space-y-2">
                                {deps.relatesTo.map(dep => {
                                  const target = dep.targetIssue;
                                  return (
                                    <div
                                      key={dep.id}
                                      onClick={() => onSelectIssue && onSelectIssue(target)}
                                      className={clsx(
                                        "flex items-center justify-between p-2.5 rounded-lg border text-sm transition-all bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40",
                                        onSelectIssue && "cursor-pointer hover:border-blue-400"
                                      )}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">
                                          Related
                                        </span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate text-xs sm:text-sm">
                                          {target.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                          {target.status.replace('_', ' ')}
                                        </span>
                                        {target.assigneeName && (
                                          <Avatar src={target.assigneePhoto} name={target.assigneeName} size="sm" className="w-5 h-5 text-[10px]" />
                                        )}
                                        {onSelectIssue && <ArrowRight size={13} className="text-slate-400" />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    Recent History
                  </h3>
                  {activities.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No history available.</p>
                  ) : (
                    <div className="space-y-4">
                      {activities.slice(0, 3).map((activity) => (
                        <div key={activity.id} className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar src={activity.userPhoto || null} name={activity.userName} size="sm" className="w-5 h-5 text-[10px]" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{activity.userName}</span>
                            <span className="text-slate-500 text-xs">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 pl-7 text-xs">{activity.details}</p>
                        </div>
                      ))}
                      {activities.length > 3 && (
                        <button 
                          onClick={() => setActiveTab('activity')}
                          className="text-xs text-tawny-port hover:text-tawny-port/80 font-medium pl-7 mt-2"
                        >
                          View all history
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
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

              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      isListening 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Mic size={14} />
                    {isListening ? 'Listening...' : 'Voice to Text'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  placeholder="Detailed description, steps to reproduce, etc..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Voice Note (Optional)</label>
                <AudioRecorder 
                  issueId={issue?.id}
                  existingAudioUrl={formData.voiceNoteUrl}
                  onUploadComplete={(url) => setFormData({ ...formData, voiceNoteUrl: url })}
                  onRemoveAudio={() => setFormData({ ...formData, voiceNoteUrl: '' })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    id="issue-type-select"
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
                    id="issue-status-select"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as IssueStatus })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="draft">Draft</option>
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

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Dependencies & Relationships
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Link related tasks to track what blocks this work or what is blocked by it.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      links: [...(formData.links || []), { id: Date.now().toString(), type: 'blocked_by', targetIssueId: '' }] 
                    })}
                    className="text-xs text-tawny-port hover:text-rose-700 dark:text-rose-400 font-semibold inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-tawny-port/10 hover:bg-tawny-port/20 dark:bg-rose-950/40 transition-colors"
                  >
                    <Plus size={14} /> Add Dependency
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {formData.links && formData.links.length > 0 ? (
                    formData.links.map((link: any, index: number) => {
                      const selectedTarget = allIssues.find(i => i.id === link.targetIssueId);
                      return (
                        <div key={link.id || index} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                            <select
                              value={link.type === 'is_blocked_by' ? 'blocked_by' : link.type}
                              onChange={(e) => {
                                const newLinks = [...formData.links];
                                newLinks[index].type = e.target.value;
                                setFormData({ ...formData, links: newLinks });
                              }}
                              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-800 text-sm font-medium sm:w-48 text-slate-800 dark:text-slate-200"
                            >
                              <option value="blocked_by">🔒 Blocked By</option>
                              <option value="blocks">⛔ Blocks</option>
                              <option value="relates_to">🔗 Relates To</option>
                            </select>

                            <select
                              value={link.targetIssueId}
                              onChange={(e) => {
                                const newLinks = [...formData.links];
                                newLinks[index].targetIssueId = e.target.value;
                                setFormData({ ...formData, links: newLinks });
                              }}
                              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-800 flex-1 text-sm text-slate-800 dark:text-slate-200"
                            >
                              <option value="">Select an issue...</option>
                              {allIssues
                                .filter(i => i.id !== issue?.id)
                                .map(i => (
                                  <option key={i.id} value={i.id}>
                                    [{i.status.toUpperCase().replace('_', ' ')}] {i.title} {i.assigneeName ? `(${i.assigneeName})` : ''}
                                  </option>
                                ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                const newLinks = formData.links.filter((_: any, i: number) => i !== index);
                                setFormData({ ...formData, links: newLinks });
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors self-end sm:self-center"
                              title="Remove dependency"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {selectedTarget && (
                            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-600 dark:text-slate-300">Status:</span>
                              <span className={clsx(
                                "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
                                selectedTarget.status === 'done'
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              )}>
                                {selectedTarget.status.replace('_', ' ')}
                              </span>
                              <span className="font-medium text-slate-600 dark:text-slate-300 ml-2">Priority:</span>
                              <span className="capitalize">{selectedTarget.priority}</span>
                              {selectedTarget.assigneeName && (
                                <>
                                  <span className="font-medium text-slate-600 dark:text-slate-300 ml-2">Assignee:</span>
                                  <span>{selectedTarget.assigneeName}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60">
                      <p className="text-xs text-slate-400 dark:text-slate-500">No dependencies added yet.</p>
                    </div>
                  )}
                </div>
              </div>

            </form>
            )
          ) : activeTab === 'activity' ? (
            <div className="space-y-6">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Clock className="mx-auto h-12 w-12 opacity-20 mb-3" />
                  <p>No activity recorded yet.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative pl-6">
                      <div className="absolute -left-3 top-0">
                        <Avatar 
                          src={activity.userPhoto || null} 
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
                        src={comment.userPhoto || null} 
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
          {issue && onDelete && activeTab === 'details' && isEditing && canDelete ? (
            <button
              id="delete-issue-btn"
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
              onClick={() => {
                if (isEditing && issue) setIsEditing(false);
                else onClose();
              }}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
            >
              {activeTab === 'details' && isEditing ? 'Cancel' : 'Close'}
            </button>
            {activeTab === 'details' && isEditing && canEdit && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors font-medium shadow-sm"
                >
                  Save as Draft
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
            )}
            {activeTab === 'details' && !isEditing && issue && canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-2 bg-tawny-port hover:bg-tawny-port/90 text-white rounded-lg transition-colors font-medium shadow-sm"
              >
                <Edit3 size={18} />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
