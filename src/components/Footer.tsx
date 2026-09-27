import React from 'react';
import Link from 'next/link';
import { Shield, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-black text-slate-900 dark:text-white text-base tracking-tight">
                KIZUNA
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                Sewa Setu 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
              AI-powered Road Safety & Accountability Platform built for the Sewa Setu Innovation Hackathon 2026.
              Connecting hazardous road conditions directly to the responsible government authority with automated tracking and visual resolution verification.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> AI-assisted jurisdiction routing
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Public accident intelligence
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Transparent SLA tracking
              </span>
            </div>
          </div>

          {/* Citizen Portal Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Citizen Portal
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/citizen" className="hover:text-blue-600 transition">
                  Citizen Dashboard
                </Link>
              </li>
              <li>
                <Link href="/citizen/report" className="hover:text-blue-600 transition">
                  Report Road Issue
                </Link>
              </li>
              <li>
                <Link href="/citizen/reports" className="hover:text-blue-600 transition">
                  My Reports Docket
                </Link>
              </li>
              <li>
                <Link href="/citizen/reports/KZ-DEMO-001" className="hover:text-blue-600 transition">
                  Interactive Demo Case (NH-30)
                </Link>
              </li>
            </ul>
          </div>

          {/* Authority Portal Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Authority Portal
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/authority/dashboard" className="hover:text-blue-600 transition">
                  Command Center
                </Link>
              </li>
              <li>
                <Link href="/authority/cases" className="hover:text-blue-600 transition">
                  Department Case Docket
                </Link>
              </li>
              <li>
                <Link href="/authority/map" className="hover:text-blue-600 transition">
                  Territorial GIS Hotspots
                </Link>
              </li>
              <li>
                <Link href="/authority/cases/KZ-DEMO-001" className="hover:text-blue-600 transition">
                  Authority Case Action Desk
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Accountability & Standards Notice */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © 2026 KIZUNA Platform. Innovating Digital Public Service Delivery. Built for Sewa Setu Innovation Hackathon.
          </p>
          <p className="text-center sm:text-right">
            Public-service accountability • Aggregates publicly available accident records from configured sources.
          </p>
        </div>
      </div>
    </footer>
  );
};
