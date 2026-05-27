import React, { useState, useMemo } from 'react';
import { Issue, IssueStatus } from '../types';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { AlertCircle, Clock, CheckCircle2, CircleDashed, LayoutGrid } from 'lucide-react';
import { Avatar } from './Avatar';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  defaultDropAnimationSideEffects,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { createPortal } from 'react-dom';

interface BoardProps {
  issues: Issue[];
  onUpdateStatus: (id: string, status: IssueStatus) => void;
  onUpdateIssueField?: (id: string, updates: Partial<Issue>) => void;
  onEditIssue: (issue: Issue) => void;
}

const COLUMNS: { id: IssueStatus; label: string; icon: any; color: string }[] = [
  { id: 'todo', label: 'To Do', icon: CircleDashed, color: 'text-slate-500' },
  { id: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-peru-tan' },
  { id: 'blocked', label: 'Blocked', icon: AlertCircle, color: 'text-tawny-port' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: 'text-emerald-500' },
];

function IssueCard({ issue, onClick, isOverlay }: { issue: Issue; onClick?: () => void; isOverlay?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow group relative",
        isOverlay && "shadow-xl ring-2 ring-peru-tan rotate-2 opacity-90 cursor-grabbing"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={clsx(
          "text-xs font-medium px-2 py-1 rounded-md uppercase tracking-wider",
          issue.type === 'bug' ? 'bg-tawny-port/10 text-tawny-port dark:bg-tawny-port/20 dark:text-red-400' :
          issue.type === 'task' ? 'bg-peru-tan/10 text-peru-tan dark:bg-peru-tan/20 dark:text-amber-400' :
          'bg-erp-black/10 text-erp-black dark:bg-slate-700 dark:text-slate-300'
        )}>
          {issue.type}
        </span>
        <span className={clsx(
          "text-xs font-medium px-2 py-1 rounded-md",
          issue.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          issue.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
          issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
        )}>
          {issue.priority}
        </span>
      </div>
      <h4 className="font-medium text-erp-black dark:text-white mb-2 line-clamp-2">{issue.title}</h4>
      
      {issue.status === 'blocked' && issue.delay_cause && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-amber-800 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-start gap-1.5">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span className="line-clamp-2">{issue.delay_cause}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {issue.assigneeName ? (
            <Avatar name={issue.assigneeName} src={issue.assigneePhoto} size="sm" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 border-dashed flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs" title="Unassigned">
              ?
            </div>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{issue.assigneeName || 'Unassigned'}</span>
        </div>
      </div>
    </div>
  );
}

function DraggableIssue({ issue, onEditIssue }: { issue: Issue, onEditIssue: (i: Issue) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: issue.id,
    data: issue,
  });

  if (isDragging) {
    return (
      <div 
        className="opacity-30 bg-white dark:bg-slate-800 p-4 rounded-lg border border-dashed border-slate-400 dark:border-slate-600 h-[120px]"
        ref={setNodeRef}
      />
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="touch-none"
    >
      <IssueCard issue={issue} onClick={() => onEditIssue(issue)} />
    </motion.div>
  );
}

function DroppableColumn({ id, column, issues, swimlaneBy, swimlaneGroup, onEditIssue }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { status: column.id, swimlaneBy, swimlaneGroupId: swimlaneGroup.id },
  });

  const Icon = column.icon;

  return (
    <div 
      className={clsx(
        "w-[280px] lg:w-80 flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-xl border shrink-0 transition-colors",
        swimlaneBy === 'none' && 'max-h-full',
        isOver ? 'border-peru-tan bg-peru-tan/5 dark:bg-peru-tan/10' : 'border-slate-200 dark:border-slate-700'
      )}
    >
      {swimlaneBy === 'none' && (
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Icon size={18} className={column.color} />
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">{column.label}</h3>
          </div>
          <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium px-2 py-1 rounded-full">
            {issues.length}
          </span>
        </div>
      )}

      <div ref={setNodeRef} className={clsx("p-4 space-y-3", swimlaneBy === 'none' ? 'flex-1 overflow-y-auto' : 'min-h-[120px]')}>
        {issues.map((issue: Issue) => (
          <DraggableIssue key={issue.id} issue={issue} onEditIssue={onEditIssue} />
        ))}
      </div>
    </div>
  );
}

export const Board: React.FC<BoardProps> = ({ issues, onUpdateStatus, onUpdateIssueField, onEditIssue }) => {
  const [swimlaneBy, setSwimlaneBy] = useState<'none' | 'assignee' | 'priority'>('none');

  const groupedIssues = useMemo(() => {
    if (swimlaneBy === 'none') {
      return [{ id: 'all', title: 'All Issues', issues }];
    }
    if (swimlaneBy === 'assignee') {
      const unassigned = issues.filter(i => !i.assigneeUid);
      const assignees = new Map<string, { id: string; title: string; issues: Issue[] }>();
      issues.forEach(i => {
        if (i.assigneeUid) {
          if (!assignees.has(i.assigneeUid)) {
            assignees.set(i.assigneeUid, { id: i.assigneeUid, title: i.assigneeName || 'Unknown', issues: [] });
          }
          assignees.get(i.assigneeUid)!.issues.push(i);
        }
      });
      const result = Array.from(assignees.values());
      if (unassigned.length > 0) result.push({ id: 'unassigned', title: 'Unassigned', issues: unassigned });
      return result;
    }
    if (swimlaneBy === 'priority') {
      const priorities = ['critical', 'high', 'medium', 'low'];
      return priorities.map(p => ({
        id: p,
        title: p.charAt(0).toUpperCase() + p.slice(1),
        issues: issues.filter(i => i.priority === p)
      })).filter(group => group.issues.length > 0);
    }
    return [];
  }, [issues, swimlaneBy]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const issue = issues.find(i => i.id === active.id);
    if (issue) setActiveIssue(issue);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over) return;

    const issueId = active.id as string;
    const dropData = over.data.current as { status: IssueStatus; swimlaneBy: string; swimlaneGroupId: string } | undefined;
    
    if (!dropData) return;

    const updates: Partial<Issue> = {};
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    if (issue.status !== dropData.status) {
      if (onUpdateIssueField) {
        updates.status = dropData.status;
      } else {
        onUpdateStatus(issueId, dropData.status);
      }
    }

    if (dropData.swimlaneBy === 'assignee' && onUpdateIssueField) {
      const newAssigneeUid = dropData.swimlaneGroupId === 'unassigned' ? null : dropData.swimlaneGroupId;
      if (issue.assigneeUid !== newAssigneeUid) {
        updates.assigneeUid = newAssigneeUid;
      }
    } else if (dropData.swimlaneBy === 'priority' && onUpdateIssueField) {
      if (issue.priority !== dropData.swimlaneGroupId) {
        updates.priority = dropData.swimlaneGroupId as any;
      }
    }

    if (Object.keys(updates).length > 0 && onUpdateIssueField) {
      onUpdateIssueField(issueId, updates);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4 lg:p-8 h-full flex flex-col">
        <div className="mb-4 lg:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-erp-black dark:text-white">Kanban Board</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage tasks and track progress.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <LayoutGrid size={16} className="text-slate-400" />
              Group by:
            </label>
            <select 
              value={swimlaneBy}
              onChange={(e) => setSwimlaneBy(e.target.value as 'none' | 'assignee' | 'priority')}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg focus:ring-peru-tan focus:border-peru-tan block p-2 outline-none"
            >
              <option value="none">None</option>
              <option value="assignee">Assignee</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        <div className={clsx("flex-1 overflow-auto -mx-4 px-4 lg:mx-0 lg:px-0", swimlaneBy !== 'none' && "pb-8")}>
          <div className={clsx("min-w-max flex flex-col pb-4 gap-6", swimlaneBy === 'none' ? 'h-full' : 'min-h-full')}>
            
            {swimlaneBy !== 'none' && (
              <div className="flex gap-4 lg:gap-6 sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur pt-2 pb-2 -mt-2">
                {COLUMNS.map(column => {
                  const Icon = column.icon;
                  return (
                    <div key={column.id} className="w-[280px] lg:w-80 flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Icon size={18} className={column.color} />
                      <h3 className="font-semibold text-slate-700 dark:text-slate-200">{column.label}</h3>
                    </div>
                  );
                })}
              </div>
            )}

            {groupedIssues.map((group, index) => (
              <div key={group.id} className={clsx("flex flex-col gap-4", swimlaneBy === 'none' ? 'h-full' : 'shrink-0')}>
                {swimlaneBy !== 'none' && (
                  <div className="sticky left-0 w-max pb-2 border-b-2 border-slate-200 dark:border-slate-700 mt-2 z-10">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 px-1 uppercase tracking-wide">{group.title}</h3>
                  </div>
                )}
                
                <div className={clsx("flex gap-4 lg:gap-6", swimlaneBy === 'none' ? 'h-full' : 'shrink-0')}>
                  {COLUMNS.map(column => {
                    const columnIssues = group.issues.filter(i => i.status === column.id);
                    return (
                      <DroppableColumn
                        key={`${group.id}-${column.id}`}
                        id={`${group.id}-${column.id}`}
                        column={column}
                        issues={columnIssues}
                        swimlaneBy={swimlaneBy}
                        swimlaneGroup={group}
                        onEditIssue={onEditIssue}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {createPortal(
        <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ sideEffects: ['styles'] })}>
          {activeIssue ? <IssueCard issue={activeIssue} isOverlay={true} /> : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};
