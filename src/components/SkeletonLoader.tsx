import React from 'react';

export const SkeletonLoader: React.FC<{ view: string }> = ({ view }) => {
  if (view === 'dashboard') {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-32 animate-pulse">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
              <div className="h-10 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-80 animate-pulse"></div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-80 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (view === 'board') {
    return (
      <div className="p-4 lg:p-8 h-full flex flex-col">
        <div className="flex gap-6 overflow-x-auto h-full pb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[320px] w-80 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 flex flex-col gap-4 animate-pulse">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              {[1, 2, 3].map(j => (
                <div key={j} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 h-32">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                  <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="p-4 lg:p-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="col-span-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="col-span-2 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="col-span-2 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="col-span-2 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="col-span-2 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-700 animate-pulse">
              <div className="col-span-4 h-5 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="col-span-2 h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
              <div className="col-span-2 h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
              <div className="col-span-2 h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="col-span-2 h-5 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-24 animate-pulse"></div>
      ))}
    </div>
  );
};
