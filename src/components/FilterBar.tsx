import React from 'react';
import { FilterOptions } from '../types';
import { Search, Filter, Calendar, X } from 'lucide-react';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onClearFilters }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search issues..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-tawny-port focus:border-tawny-port outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none bg-white text-sm"
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
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none bg-white text-sm"
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
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none bg-white text-sm"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-tawny-port transition-colors px-2 py-1"
        >
          <X size={14} />
          Clear
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assignee:</span>
            <input
              type="text"
              name="assignee"
              value={filters.assignee}
              onChange={handleChange}
              placeholder="Filter by assignee..."
              className="px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reporter:</span>
            <input
              type="text"
              name="reporter"
              value={filters.reporter}
              onChange={handleChange}
              placeholder="Filter by reporter..."
              className="px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Calendar size={16} className="text-slate-400" />
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="px-2 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="px-2 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-tawny-port outline-none text-sm"
          />
        </div>
      </div>
    </div>
  );
};
