import React from 'react';
import { AuthorityRoutingResult } from '@/types';
import { Landmark, ShieldAlert, CheckCircle, ArrowUpRight } from 'lucide-react';

interface AuthorityCardProps {
  routing: AuthorityRoutingResult;
}

export const AuthorityCard: React.FC<AuthorityCardProps> = ({ routing }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            Responsible Government Authority
          </h3>
        </div>

        {routing.isDemo && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 tracking-wider">
            DEMO / SANDBOX JURISDICTION
          </span>
        )}
      </div>

      <div className="mt-4">
        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {routing.authorityName}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
          {routing.department}
        </p>

        <div className="mt-3 p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/60">
          <div className="flex items-start gap-2 text-xs text-blue-900 dark:text-blue-200">
            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Routing Engine Decision: </span>
              <span>{routing.reason}</span>
              <div className="mt-1 text-[11px] text-blue-700/80 dark:text-blue-300/80">
                Confidence: {(routing.routingConfidence * 100).toFixed(0)}% (Matched road category & geographic boundary)
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 font-medium block">
              Authorized Territorial Scope:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {routing.jurisdiction}
            </span>
          </div>

          {routing.escalationAuthority && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium block flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-slate-400" /> Escalation Tier:
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {routing.escalationAuthority}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <ShieldAlert className="w-3 h-3 text-slate-400 shrink-0" />
          <span>
            Automated notification dispatched to authority docket for SLA tracking.
          </span>
        </div>
      </div>
    </div>
  );
};
