import React from 'react';
import { Sparkles } from 'lucide-react';

interface CaseTypeBadgeProps {
  isDemo?: boolean;
  size?: 'sm' | 'md';
}

export const CaseTypeBadge: React.FC<CaseTypeBadgeProps> = ({ isDemo = false, size = 'md' }) => {
  if (isDemo) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold uppercase ${
          size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
        }`}
      >
        <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span>Demo Benchmark</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold uppercase ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>Live Citizen Report</span>
    </span>
  );
};
