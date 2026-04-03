import React, { useMemo } from 'react';
import { Issue } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, ListTodo } from 'lucide-react';

interface DashboardProps {
  issues: Issue[];
}

const COLORS = ['#74253A', '#7B5203', '#000000', '#10b981'];

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

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-erp-black">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">Track your ERP system's health and progress.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Items" value={stats.total} icon={ListTodo} color="bg-erp-black" />
        <StatCard title="Active Bugs" value={stats.bugs} icon={AlertTriangle} color="bg-tawny-port" />
        <StatCard title="Blocked" value={stats.blocked} icon={Clock} color="bg-peru-tan" />
        <StatCard title="Completed" value={stats.done} icon={CheckCircle2} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 min-w-0">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Items by Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} width={30} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#74253A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 min-w-0 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Items by Type</h3>
          <div className="h-64 flex-1">
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
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 sm:gap-6 mt-4 flex-wrap shrink-0">
            {typeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm text-slate-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);
