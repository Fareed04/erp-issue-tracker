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
import { Issue, CreateIssuePayload, IssueStatus } from './types';
import * as api from './services/api';
import { Plus } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'board' | 'list'>('dashboard');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIssues();
  }, []);

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

  const handleSaveIssue = async (payload: CreateIssuePayload) => {
    try {
      if (editingIssue) {
        const updated = await api.updateIssue(editingIssue.id, payload);
        setIssues(issues.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await api.createIssue(payload);
        setIssues([created, ...issues]);
      }
      setIsModalOpen(false);
      setEditingIssue(null);
    } catch (error) {
      console.error('Failed to save issue', error);
      alert('Failed to save issue. Please try again.');
    }
  };

  const handleDeleteIssue = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    try {
      await api.deleteIssue(id);
      setIssues(issues.filter(i => i.id !== id));
      setIsModalOpen(false);
      setEditingIssue(null);
    } catch (error) {
      console.error('Failed to delete issue', error);
      alert('Failed to delete issue. Please try again.');
    }
  };

  const handleUpdateStatus = async (id: string, status: IssueStatus) => {
    try {
      const updated = await api.updateIssue(id, { status });
      setIssues(issues.map(i => i.id === updated.id ? updated : i));
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update status. Please try again.');
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
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 capitalize">
              {currentView === 'board' ? 'Kanban Board' : currentView}
            </h1>
          </div>
          <button
            onClick={openNewIssueModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            New Issue
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && <Dashboard issues={issues} />}
              {currentView === 'board' && (
                <Board 
                  issues={issues} 
                  onUpdateStatus={handleUpdateStatus} 
                  onEditIssue={openEditIssueModal} 
                />
              )}
              {currentView === 'list' && (
                <IssueList 
                  issues={issues} 
                  onEditIssue={openEditIssueModal} 
                />
              )}
            </>
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
