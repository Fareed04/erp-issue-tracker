import React, { useState, useEffect, useMemo } from 'react';
import { FilterOptions, UserProfile } from '../types';
import { 
  Search, 
  Calendar, 
  X, 
  RotateCcw, 
  ChevronDown, 
  User, 
  UserCheck, 
  Tag, 
  Activity, 
  AlertCircle,
  Filter,
  ArrowRight
} from 'lucide-react';
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

  // Keyboard shortcut listener for focusing search with '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' && 
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        document.getElementById('search-issues-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleClearSingleFilter = (key: keyof FilterOptions) => {
    onFilterChange({ ...filters, [key]: '' });
  };

  const handleClearDateRange = () => {
    onFilterChange({ ...filters, startDate: '', endDate: '' });
  };

  // Count active filters
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.search?.trim()) count++;
    if (filters.type) count++;
    if (filters.status) count++;
    if (filters.priority) count++;
    if (filters.assignee) count++;
    if (filters.reporter) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeCount > 0;

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 mb-6 p-4 sm:p-5 flex flex-col gap-3.5 transition-all">
      
      {/* Primary Toolbar: Search & Core Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full">
        
        {/* Search Input with quick key indicator and clear icon */}
        <div className="relative flex-1 min-w-[220px]">
          <Search 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" 
            size={16} 
          />
          <input
            id="search-issues-input"
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search issues, summaries, tags..."
            className="w-full pl-9 pr-14 h-10 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-tawny-port/20 focus:border-tawny-port outline-none transition-all bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-900/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-normal"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {filters.search ? (
              <button
                type="button"
                onClick={() => handleClearSingleFilter('search')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                title="Clear search"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd 
                className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800 border border-slate-300/50 dark:border-slate-700/80 rounded select-none pointer-events-none"
                title="Press '/' to search"
              >
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Dropdowns group */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:flex items-center gap-2.5">
          {/* Type Dropdown */}
          <div className="relative flex-1 xl:w-36">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <select
              name="type"
              value={filters.type}
              onChange={handleChange}
              className={`w-full pl-8 pr-7 h-10 border rounded-xl outline-none transition-all appearance-none text-xs sm:text-sm font-medium cursor-pointer ${
                filters.type 
                  ? 'border-tawny-port/50 bg-tawny-port/[0.04] text-tawny-port dark:text-rose-300 dark:border-tawny-port/60 dark:bg-tawny-port/15 ring-1 ring-tawny-port/30' 
                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 focus:border-tawny-port focus:ring-2 focus:ring-tawny-port/20'
              }`}
            >
              <option value="">All Types</option>
              <option value="task">Tasks</option>
              <option value="bug">Bugs</option>
              <option value="issue">Issues</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative flex-1 xl:w-38">
            <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
              className={`w-full pl-8 pr-7 h-10 border rounded-xl outline-none transition-all appearance-none text-xs sm:text-sm font-medium cursor-pointer ${
                filters.status 
                  ? 'border-tawny-port/50 bg-tawny-port/[0.04] text-tawny-port dark:text-rose-300 dark:border-tawny-port/60 dark:bg-tawny-port/15 ring-1 ring-tawny-port/30' 
                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 focus:border-tawny-port focus:ring-2 focus:ring-tawny-port/20'
              }`}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          {/* Priority Dropdown */}
          <div className="relative flex-1 xl:w-36 col-span-2 sm:col-span-1">
            <AlertCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <select
              name="priority"
              value={filters.priority}
              onChange={handleChange}
              className={`w-full pl-8 pr-7 h-10 border rounded-xl outline-none transition-all appearance-none text-xs sm:text-sm font-medium cursor-pointer ${
                filters.priority 
                  ? 'border-tawny-port/50 bg-tawny-port/[0.04] text-tawny-port dark:text-rose-300 dark:border-tawny-port/60 dark:bg-tawny-port/15 ring-1 ring-tawny-port/30' 
                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 focus:border-tawny-port focus:ring-2 focus:ring-tawny-port/20'
              }`}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          {/* Clear / Reset Filters Action Button */}
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            title={hasActiveFilters ? `Reset ${activeCount} active filter${activeCount > 1 ? 's' : ''}` : 'No active filters'}
            className={`h-10 px-3.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              hasActiveFilters
                ? 'bg-rose-50/80 dark:bg-rose-950/30 text-tawny-port dark:text-rose-300 border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 shadow-2xs cursor-pointer'
                : 'bg-slate-100/60 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200/50 dark:border-slate-700/50 opacity-50 cursor-not-allowed'
            }`}
          >
            <RotateCcw size={14} className={hasActiveFilters ? 'text-tawny-port dark:text-rose-300' : ''} />
            <span>Reset</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-tawny-port text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Secondary Row: People Filters & Date Range */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
        
        {/* Assignee & Reporter Selectors */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 max-w-2xl">
          {/* Assignee */}
          <div className="relative w-full sm:flex-1">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <select
              name="assignee"
              value={filters.assignee}
              onChange={handleChange}
              className={`w-full pl-8 pr-7 h-9 border rounded-xl outline-none transition-all appearance-none text-xs font-medium cursor-pointer ${
                filters.assignee 
                  ? 'border-tawny-port/50 bg-tawny-port/[0.04] text-tawny-port dark:text-rose-300 dark:border-tawny-port/60 dark:bg-tawny-port/15 ring-1 ring-tawny-port/30' 
                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 focus:border-tawny-port focus:ring-2 focus:ring-tawny-port/20'
              }`}
            >
              <option value="">Assignee: All</option>
              {users.map(u => (
                <option key={u.uid} value={u.displayName}>
                  Assignee: {u.displayName}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          {/* Reporter */}
          <div className="relative w-full sm:flex-1">
            <UserCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <select
              name="reporter"
              value={filters.reporter}
              onChange={handleChange}
              className={`w-full pl-8 pr-7 h-9 border rounded-xl outline-none transition-all appearance-none text-xs font-medium cursor-pointer ${
                filters.reporter 
                  ? 'border-tawny-port/50 bg-tawny-port/[0.04] text-tawny-port dark:text-rose-300 dark:border-tawny-port/60 dark:bg-tawny-port/15 ring-1 ring-tawny-port/30' 
                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 focus:border-tawny-port focus:ring-2 focus:ring-tawny-port/20'
              }`}
            >
              <option value="">Reporter: All</option>
              {users.map(u => (
                <option key={u.uid} value={u.displayName}>
                  Reporter: {u.displayName}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Cohesive Date Range Capsule */}
        <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto">
          <div className={`flex items-center gap-2 h-9 px-3 border rounded-xl transition-all w-full md:w-auto ${
            filters.startDate || filters.endDate
              ? 'border-tawny-port/50 bg-tawny-port/[0.04] dark:border-tawny-port/60 dark:bg-tawny-port/15 ring-1 ring-tawny-port/30'
              : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 focus-within:border-tawny-port focus-within:ring-2 focus-within:ring-tawny-port/20'
          }`}>
            <Calendar size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleChange}
                title="Start date"
                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 font-medium outline-none cursor-pointer"
              />
              <ArrowRight size={11} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleChange}
                title="End date"
                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 font-medium outline-none cursor-pointer"
              />
            </div>

            {(filters.startDate || filters.endDate) && (
              <button
                type="button"
                onClick={handleClearDateRange}
                className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-1"
                title="Clear date range"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Active Filter Badges Strip (Visible only when filters are active) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100/80 dark:border-slate-700/40 text-xs animate-in fade-in duration-200">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
            <Filter size={11} />
            Filters:
          </span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 font-medium">
              <span>Query: "{filters.search}"</span>
              <button onClick={() => handleClearSingleFilter('search')} className="hover:text-tawny-port"><X size={11} /></button>
            </span>
          )}

          {filters.type && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 font-medium capitalize">
              <span>Type: {filters.type}</span>
              <button onClick={() => handleClearSingleFilter('type')} className="hover:text-tawny-port"><X size={11} /></button>
            </span>
          )}

          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 font-medium capitalize">
              <span>Status: {filters.status.replace('_', ' ')}</span>
              <button onClick={() => handleClearSingleFilter('status')} className="hover:text-tawny-port"><X size={11} /></button>
            </span>
          )}

          {filters.priority && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 font-medium capitalize">
              <span>Priority: {filters.priority}</span>
              <button onClick={() => handleClearSingleFilter('priority')} className="hover:text-tawny-port"><X size={11} /></button>
            </span>
          )}

          {filters.assignee && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 font-medium">
              <span>Assignee: {filters.assignee}</span>
              <button onClick={() => handleClearSingleFilter('assignee')} className="hover:text-tawny-port"><X size={11} /></button>
            </span>
          )}

          {filters.reporter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 font-medium">
              <span>Reporter: {filters.reporter}</span>
              <button onClick={() => handleClearSingleFilter('reporter')} className="hover:text-tawny-port"><X size={11} /></button>
            </span>
          )}

          {(filters.startDate || filters.endDate) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 font-medium">
              <span>Dates: {filters.startDate || 'Any'} → {filters.endDate || 'Any'}</span>
              <button onClick={handleClearDateRange} className="hover:text-tawny-port"><X size={11} /></button>
            </span>
          )}

          <button
            onClick={onClearFilters}
            className="text-[11px] font-semibold text-tawny-port dark:text-rose-300 hover:underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

    </div>
  );
};

