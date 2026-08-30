import React, { useState, useEffect } from 'react';
import { FilterOptions, UserProfile } from '../types';
import { Search, Calendar, X } from 'lucide-react';
import * as api from '../services/api';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onClearFilters }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const profiles = await api.getAllUserProfiles();
        setUsers(profiles);
      } catch (err) {
        console.error('Failed to load users for filters', err);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 lg:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 w-full flex flex-col gap-4 overflow-hidden">
      
      {/* Top Row: Search & Core Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        {/* Search */}
        <div className="md:col-span-3 lg:col-span-2 xl:col-span-2 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            id="search-issues-input"
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search issues..."
            className="w-full pl-10 pr-4 h-10 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none transition-all bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-500"
          />
        </div>
        
        <select
          name="type"
          value={filters.type}
          onChange={handleChange}
          className="w-full px-3 h-10 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm"
        >
          <option value="">All Types</option>
          <option value="task">Task</option>
          <option value="bug">Bug</option>
          <option value="issue">Issue</option>
        </select>
        
        <select
          name="status"
          value={filters.status}
          onChange={handleChange}
          className="w-full px-3 h-10 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </select>

        <select
          name="priority"
          value={filters.priority}
          onChange={handleChange}
          className="w-full px-3 h-10 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        {/* Clear Button */}
        <button
          onClick={onClearFilters}
          className="flex items-center justify-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-tawny-port dark:hover:text-tawny-port h-10 px-4 w-full bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <X size={16} />
          <span>Clear</span>
        </button>
      </div>

      {/* Bottom Row: Additional Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full border-t border-slate-100 dark:border-slate-700 pt-4">
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[65px] shrink-0">Assignee</span>
          <select
            name="assignee"
            value={filters.assignee}
            onChange={handleChange}
            className="w-full px-3 h-9 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100"
          >
            <option value="">All Assignees</option>
            {users.map(u => (
              <option key={u.uid} value={u.displayName}>{u.displayName}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[65px] shrink-0">Reporter</span>
          <select
            name="reporter"
            value={filters.reporter}
            onChange={handleChange}
            className="w-full px-3 h-9 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100"
          >
            <option value="">All Reporters</option>
            {users.map(u => (
              <option key={u.uid} value={u.displayName}>{u.displayName}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 flex items-center justify-start lg:justify-end gap-2 w-full">
          <Calendar size={16} className="text-slate-400 dark:text-slate-500 hidden sm:block shrink-0" />
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="flex-1 sm:flex-none px-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm w-full max-w-[150px] bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100"
          />
          <span className="text-slate-400 dark:text-slate-500 text-sm shrink-0">to</span>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="flex-1 sm:flex-none px-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm w-full max-w-[150px] bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>
    </div>
  );
};
