import React, { useState, useEffect } from 'react';
import { FilterOptions, UserProfile } from '../types';
import { Search, Filter, Calendar, X } from 'lucide-react';
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
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 space-y-4">
      <div className="flex flex-col lg:flex-row flex-wrap gap-4 items-start lg:items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search issues..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={18} className="text-slate-400 dark:text-slate-500 hidden sm:block" />
          <select
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm min-w-[110px]"
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
            className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm min-w-[110px]"
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
            className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm min-w-[110px]"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-tawny-port ml-2 transition-colors px-2 py-1"
          >
            <X size={14} />
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-wrap gap-6 items-start lg:items-center">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignee:</span>
            <select
              name="assignee"
              value={filters.assignee}
              onChange={handleChange}
              className="w-full sm:w-auto px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Assignees</option>
              {users.map(u => (
                <option key={u.uid} value={u.displayName}>{u.displayName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reporter:</span>
            <select
              name="reporter"
              value={filters.reporter}
              onChange={handleChange}
              className="w-full sm:w-auto px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Reporters</option>
              {users.map(u => (
                <option key={u.uid} value={u.displayName}>{u.displayName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <Calendar size={16} className="text-slate-400 dark:text-slate-500 hidden sm:block" />
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="flex-1 sm:flex-none px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm min-w-[120px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
          <span className="text-slate-400 dark:text-slate-500 text-sm">to</span>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="flex-1 sm:flex-none px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm min-w-[120px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>
    </div>
  );
};
