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
import { NotificationCenter, Notification } from './components/NotificationCenter';

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
  const [currentView, setCurrentView] = useState<'dashboard' | 'board' | 'list'>('dashboard');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIssues();
  }, []);

  useEffect(() => {
    if (issues.length > 0) {
      const pendingIssues = issues.filter(i => i.status === 'todo' || i.status === 'blocked');
      if (pendingIssues.length > 0) {
        const newNotif: Notification = {
          id: Date.now().toString(),
          message: `You have ${pendingIssues.length} pending issues that need attention.`,
          type: 'warning',
          timestamp: Date.now(),
        };
        setNotifications(prev => {
          // Avoid duplicate notifications for the same count
          if (prev.length > 0 && prev[0].message === newNotif.message) return prev;
          return [newNotif, ...prev].slice(0, 10);
        });
      }
    }
  }, [issues]);

  const loadIssues = async () => {
    try {
      setIsLoading(true);
      const data = await api.fetchIssues();
      setIssues(data);
    } catch (error) {
      console.error('Failed to load issues', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNotification = (message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now(),
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      (issue.description?.toLowerCase().includes(filters.search.toLowerCase()) ?? false);
    
    const matchesAssignee = !filters.assignee || 
      (issue.assignee?.toLowerCase().includes(filters.assignee.toLowerCase()) ?? false);
    
    const matchesReporter = !filters.reporter || 
      (issue.reporter?.toLowerCase().includes(filters.reporter.toLowerCase()) ?? false);
    
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
      Assignee: issue.assignee || 'Unassigned',
      Reporter: issue.reporter || 'N/A',
      'Delay Cause': issue.delay_cause || 'N/A',
      'Created At': new Date(issue.created_at).toLocaleString(),
      'Updated At': new Date(issue.updated_at).toLocaleString(),
      Description: issue.description || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Issues");
    
    // Generate buffer and download
    XLSX.writeFile(workbook, `ERP_Issues_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    addNotification('Issues exported to Excel successfully.', 'success');
  };

  const handleSaveIssue = async (payload: CreateIssuePayload) => {
    try {
      if (editingIssue) {
        const updated = await api.updateIssue(editingIssue.id, payload);
        setIssues(issues.map(i => i.id === updated.id ? updated : i));
        addNotification(`Issue "${updated.title}" updated.`, 'success');
      } else {
        const created = await api.createIssue(payload);
        setIssues([created, ...issues]);
        addNotification(`New issue "${created.title}" created.`, 'success');
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
      setIssues(issues.filter(i => i.id !== id));
      setIsModalOpen(false);
      setEditingIssue(null);
      addNotification('Issue deleted successfully.', 'info');
    } catch (error) {
      console.error('Failed to delete issue', error);
      addNotification('Failed to delete issue.', 'error');
    }
  };

  const handleUpdateStatus = async (id: string, status: IssueStatus) => {
    try {
      const updated = await api.updateIssue(id, { status });
      setIssues(issues.map(i => i.id === updated.id ? updated : i));
      addNotification(`Status updated to ${status.replace('_', ' ')}.`, 'info');
    } catch (error) {
      console.error('Failed to update status', error);
      addNotification('Failed to update status.', 'error');
    }
  };

  const handleBulkUpdate = async (payload: BulkUpdatePayload) => {
    try {
      await api.bulkUpdateIssues(payload);
      // Refresh issues to get updated data
      await loadIssues();
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

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-erp-black overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg lg:text-xl font-bold text-erp-black capitalize truncate">
              {currentView === 'board' ? 'Kanban Board' : currentView}
            </h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <NotificationCenter 
              notifications={notifications} 
              onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
            />
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors shadow-sm"
              title="Export to Excel"
            >
              <Download size={18} />
              <span className="hidden md:inline">Export</span>
            </button>
            <button
              onClick={openNewIssueModal}
              className="flex items-center gap-2 bg-tawny-port hover:bg-tawny-port/90 text-white px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Issue</span>
              <span className="sm:hidden">New</span>
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


