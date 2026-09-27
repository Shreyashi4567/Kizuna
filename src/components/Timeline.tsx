import React from 'react';
import { CaseTimelineEntry } from '@/types';
import { StatusBadge } from './StatusBadge';
import { User, Cpu, ShieldCheck } from 'lucide-react';

interface TimelineProps {
  entries: CaseTimelineEntry[];
}

export const Timeline: React.FC<TimelineProps> = ({ entries }) => {
  const getActorBadge = (role: CaseTimelineEntry['actorRole']) => {
    switch (role) {
      case 'CITIZEN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
            <User className="w-3 h-3" /> Citizen
          </span>
        );
      case 'SYSTEM_AI':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
            <Cpu className="w-3 h-3" /> KIZUNA AI
          </span>
        );
      case 'AUTHORITY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3" /> Authority
          </span>
        );
    }
  };

  return (
    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
      {entries.map((entry, idx) => {
        const isLatest = idx === entries.length - 1;
        const formattedDate = new Date(entry.timestamp).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        return (
          <div key={entry.id || idx} className="relative group">
            {/* Timeline node */}
            <div
              className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 transition ${
                isLatest
                  ? 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/40'
                  : 'bg-slate-400 dark:bg-slate-600'
              }`}
            />

            <div className="bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.status} size="sm" />
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {entry.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  {getActorBadge(entry.actorRole)}
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {formattedDate}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {entry.comment}
              </p>

              <div className="mt-2.5 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 font-sans">
                <span>Logged by:</span>
                <span className="font-medium text-slate-600 dark:text-slate-400">{entry.actor}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
