import React, { useMemo } from 'react';
import { Issue } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, ListTodo } from 'lucide-react';

interface DashboardProps {
  issues: Issue[];
}

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)'];

export const Dashboard: React.FC<DashboardProps> = ({ issues }) => {
  const stats = useMemo(() => {
    const total = issues.length;
    const blocked = issues.filter(i => i.status === 'blocked').length;
    const done = issues.filter(i => i.status === 'done').length;
    const bugs = issues.filter(i => i.type === 'bug').length;
    return { total, blocked, done, bugs };
  }, [issues]);

  const statusData = useMemo(() => {
    const counts = issues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return [
      { name: 'To Do', value: counts['todo'] || 0 },
      { name: 'In Progress', value: counts['in_progress'] || 0 },
      { name: 'Blocked', value: counts['blocked'] || 0 },
      { name: 'Done', value: counts['done'] || 0 },
    ];
  }, [issues]);

  const typeData = useMemo(() => {
    const counts = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return [
      { name: 'Tasks', value: counts['task'] || 0 },
      { name: 'Bugs', value: counts['bug'] || 0 },
      { name: 'Issues', value: counts['issue'] || 0 },
    ];
  }, [issues]);

  const workloadData = useMemo(() => {
    const counts = issues.reduce((acc, issue) => {
      if (issue.status !== 'done' && issue.assignee) {
        acc[issue.assignee] = (acc[issue.assignee] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts).map(name => ({
      name,
      activeTasks: counts[name]
    })).sort((a, b) => b.activeTasks - a.activeTasks);
  }, [issues]);

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-erp-black dark:text-white">Dashboard Overview</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track your ERP system's health and progress.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Items" value={stats.total} icon={ListTodo} color="bg-erp-black dark:bg-slate-700" />
        <StatCard title="Active Bugs" value={stats.bugs} icon={AlertTriangle} color="bg-tawny-port" />
        <StatCard title="Blocked" value={stats.blocked} icon={Clock} color="bg-peru-tan" />
        <StatCard title="Completed" value={stats.done} icon={CheckCircle2} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-w-0">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Items by Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'currentColor'}} className="text-slate-500 dark:text-slate-400" />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'currentColor'}} width={30} className="text-slate-500 dark:text-slate-400" />
                <Tooltip cursor={{fill: 'var(--color-border)'}} contentStyle={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                <Bar dataKey="value" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-w-0">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Items by Type</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="var(--color-bg)"
                  strokeWidth={2}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 sm:gap-6 mt-4 flex-wrap">
            {typeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm text-slate-600 dark:text-slate-300">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-w-0 lg:col-span-2 xl:col-span-1">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Workload Distribution</h3>
          <div className="h-72">
            {workloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={workloadData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 11 }} className="text-slate-500 dark:text-slate-400" />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: 'currentColor', fontSize: 11 }} className="text-slate-500 dark:text-slate-400" />
                  <Radar name="Active Tasks" dataKey="activeTasks" stroke="var(--color-chart-3)" fill="var(--color-chart-3)" fillOpacity={0.6} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
                No active tasks assigned
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);
