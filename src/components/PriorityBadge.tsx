import React from 'react';
import { PriorityLevel } from '@/types';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showIcon = true,
}) => {
  const configs: Record<
    PriorityLevel,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    CRITICAL: {
      label: 'CRITICAL PRIORITY',
      bg: 'bg-rose-50 dark:bg-rose-950/70',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
    },
    HIGH: {
      label: 'HIGH PRIORITY',
      bg: 'bg-amber-50 dark:bg-amber-950/70',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
    },
    MEDIUM: {
      label: 'MEDIUM PRIORITY',
      bg: 'bg-sky-50 dark:bg-sky-950/70',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800',
      icon: <AlertCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />,
    },
    LOW: {
      label: 'LOW PRIORITY',
      bg: 'bg-slate-50 dark:bg-slate-900',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-800',
      icon: <Info className="w-3.5 h-3.5 text-slate-500" />,
    },
  };

  const cfg = configs[priority] || configs.LOW;

  const sizeClasses = {
    sm: 'text-[10px] font-bold px-2 py-0.5 tracking-wider',
    md: 'text-xs font-bold px-2.5 py-1 tracking-wider',
    lg: 'text-sm font-bold px-3 py-1.5 tracking-wide',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}
    >
      {showIcon && cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
};
