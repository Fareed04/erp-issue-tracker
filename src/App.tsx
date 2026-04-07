/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Board } from './components/Board';
import { IssueList } from './components/IssueList';
import { IssueModal } from './components/IssueModal';
import { Issue, CreateIssuePayload, IssueStatus, FilterOptions, BulkUpdatePayload } from './types';
import * as api from './services/api';
import { Plus, Menu, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { FilterBar } from './components/FilterBar';
import { NotificationCenter } from './components/NotificationCenter';
import { ThemeToggle } from './components/ThemeToggle';

import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Auth } from './components/Auth';

const initialFilters: FilterOptions = {
  search: '',
  assignee: '',
  reporter: '',
  status: '',
  priority: '',
  type: '',
  startDate: '',
  endDate: '',
};

export default function App() {
  const [user, authLoading] = useAuthState(auth);
  const [currentView, setCurrentView] = useState<'dashboard' | 'board' | 'list'>('dashboard');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success'|'error'|'info'|'warning'}[]>([]);

  useEffect(() => {
    if (user) {
      const unsubscribe = api.subscribeToIssues((data) => {
        setIssues(data);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIssues([]);
      setIsLoading(false);
    }
  }, [user]);

  // Deadline checker
  useEffect(() => {
    if (!user) return;
    
    const checkDeadlines = async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const profile = await api.getUserProfile(user.uid);
      if (profile?.preferences?.notifyOnDeadline === false) return;

      issues.forEach(async (issue) => {
        if (issue.assigneeUid === user.uid && issue.dueDate && !issue.deadlineNotified && issue.status !== 'done') {
          const dueDate = new Date(issue.dueDate);
          if (dueDate <= tomorrow && dueDate >= now) {
            await api.createNotification(user.uid, {
              title: 'Approaching Deadline',
              message: `Task "${issue.title}" is due soon (${dueDate.toLocaleDateString()})`,
              type: 'warning',
              linkToIssueId: issue.id,
            });
            // Mark as notified
            await api.updateIssue(issue.id, { deadlineNotified: true }, null);
          }
        }
      });
    };

    checkDeadlines();
    // Check every hour
    const interval = setInterval(checkDeadlines, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [issues, user]);

  const addNotification = (message: string, type: 'success'|'error'|'info'|'warning') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      (issue.description?.toLowerCase().includes(filters.search.toLowerCase()) ?? false);
    
    const matchesAssignee = !filters.assignee || 
      (issue.assigneeName?.toLowerCase().includes(filters.assignee.toLowerCase()) ?? false);
    
    const matchesReporter = !filters.reporter || 
      (issue.reporterName?.toLowerCase().includes(filters.reporter.toLowerCase()) ?? false);
    
    const matchesStatus = !filters.status || issue.status === filters.status;
    const matchesPriority = !filters.priority || issue.priority === filters.priority;
    const matchesType = !filters.type || issue.type === filters.type;
    
    const issueDate = new Date(issue.created_at).getTime();
    const matchesStartDate = !filters.startDate || issueDate >= new Date(filters.startDate).getTime();
    const matchesEndDate = !filters.endDate || issueDate <= new Date(filters.endDate).setHours(23, 59, 59, 999);
    
    return matchesSearch && matchesAssignee && matchesReporter && matchesStatus && matchesPriority && matchesType && matchesStartDate && matchesEndDate;
  });

  const handleExportToExcel = () => {
    const exportData = filteredIssues.map(issue => ({
      ID: issue.id,
      Title: issue.title,
      Type: issue.type,
      Status: issue.status.replace('_', ' '),
      Priority: issue.priority,
      Assignee: issue.assigneeName || 'Unassigned',
      Reporter: issue.reporterName || 'N/A',
      'Delay Cause': issue.delay_cause || 'N/A',
      'Created At': new Date(issue.created_at).toLocaleString(),
      'Updated At': new Date(issue.updated_at).toLocaleString(),
      Description: issue.description || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Issues");
    XLSX.writeFile(workbook, `ERP_Issues_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    addNotification('Issues exported to Excel successfully.', 'success');
  };

  const handleSaveIssue = async (payload: CreateIssuePayload) => {
    if (!user) return;
    try {
      if (editingIssue) {
        await api.updateIssue(editingIssue.id, payload, user);
        addNotification(`Issue updated.`, 'success');
      } else {
        const fullPayload = {
          ...payload,
          reporterUid: user.uid,
          reporterName: user.displayName || 'Anonymous',
          reporterPhoto: user.photoURL,
        };
        await api.createIssue(fullPayload as any, user);
        addNotification(`New issue created.`, 'success');
      }
      setIsModalOpen(false);
      setEditingIssue(null);
    } catch (error) {
      console.error('Failed to save issue', error);
      addNotification('Failed to save issue.', 'error');
    }
  };

  const handleDeleteIssue = async (id: string) => {
    try {
      await api.deleteIssue(id);
      setIsModalOpen(false);
      setEditingIssue(null);
      addNotification('Issue deleted successfully.', 'info');
    } catch (error) {
      console.error('Failed to delete issue', error);
      addNotification('Failed to delete issue.', 'error');
    }
  };

  const handleUpdateStatus = async (id: string, status: IssueStatus) => {
    if (!user) return;
    try {
      await api.updateIssue(id, { status }, user);
      addNotification(`Status updated to ${status.replace('_', ' ')}.`, 'info');
    } catch (error) {
      console.error('Failed to update status', error);
      addNotification('Failed to update status.', 'error');
    }
  };

  const handleBulkUpdate = async (payload: BulkUpdatePayload) => {
    if (!user) return;
    try {
      await api.bulkUpdateIssues(payload, user);
      addNotification(`Successfully updated ${payload.ids.length} issues.`, 'success');
    } catch (error) {
      console.error('Bulk update failed', error);
      addNotification('Bulk update failed.', 'error');
    }
  };

  const openNewIssueModal = () => {
    setEditingIssue(null);
    setIsModalOpen(true);
  };

  const openEditIssueModal = (issue: Issue) => {
    setEditingIssue(issue);
    setIsModalOpen(true);
  };

  const handleIssueClickFromNotification = (issueId: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (issue) {
      openEditIssueModal(issue);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tawny-port"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-tawny-port rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-tawny-port/20">
            <span className="text-white font-bold text-2xl">ERP</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to ERP Tracker</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Please sign in to manage and track system issues.</p>
          <div className="flex justify-center">
            <Auth />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-erp-black dark:text-slate-100 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg lg:text-xl font-bold text-erp-black dark:text-white capitalize truncate">
              {currentView === 'board' ? 'Kanban Board' : currentView}
            </h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <Auth />
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
            <ThemeToggle />
            <NotificationCenter 
              userId={user?.uid} 
              onIssueClick={handleIssueClickFromNotification}
            />
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
            <button
              onClick={handleExportToExcel}
              className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 w-10 h-10 sm:w-auto sm:px-3 lg:px-4 sm:py-2 rounded-lg text-sm lg:text-base font-medium transition-colors shadow-sm shrink-0"
              title="Export to Excel"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={openNewIssueModal}
              className="flex items-center justify-center gap-2 bg-tawny-port hover:bg-tawny-port/90 text-white w-10 h-10 sm:w-auto sm:px-3 lg:px-4 sm:py-2 rounded-lg text-sm lg:text-base font-medium transition-colors shadow-sm shrink-0"
              title="New Issue"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Issue</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tawny-port"></div>
            </div>
          ) : (
            <div className="max-w-[1600px] mx-auto">
              {(currentView === 'list' || currentView === 'dashboard') && (
                <div className="px-4 lg:px-8 pt-6">
                  <FilterBar
                    filters={filters}
                    onFilterChange={setFilters}
                    onClearFilters={() => setFilters(initialFilters)}
                  />
                </div>
              )}
              
              {currentView === 'dashboard' && <Dashboard issues={filteredIssues} />}
              {currentView === 'board' && (
                <Board 
                  issues={filteredIssues} 
                  onUpdateStatus={handleUpdateStatus} 
                  onEditIssue={openEditIssueModal} 
                />
              )}
              {currentView === 'list' && (
                <IssueList 
                  issues={filteredIssues} 
                  onEditIssue={openEditIssueModal} 
                  onBulkUpdate={handleBulkUpdate}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <IssueModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIssue(null);
        }}
        onSave={handleSaveIssue}
        onDelete={handleDeleteIssue}
        issue={editingIssue}
      />
    </div>
  );
}


