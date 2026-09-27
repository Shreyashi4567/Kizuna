'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RoadCase } from '@/types';
import { getAllCases } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { CaseTypeBadge } from '@/components/CaseTypeBadge';
import {
  FileText,
  Search,
  Filter,
  MapPin,
  ExternalLink,
  PlusCircle,
  Sparkles,
  Radio,
} from 'lucide-react';

export default function MyReportsPage() {
  const [cases, setCases] = useState<RoadCase[]>(() => getAllCases());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LIVE' | 'DEMO'>('ALL');

  useEffect(() => {
    fetch('/api/cases')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.cases)) {
          setCases(data.cases);
        }
      })
      .catch(err => console.warn('Cases sync notice:', err));
  }, []);

  const liveCasesCount = cases.filter(c => !c.isDemo && !c.id.startsWith('KZ-DEMO-')).length;
  const demoCasesCount = cases.filter(c => Boolean(c.isDemo || c.id.startsWith('KZ-DEMO-'))).length;

  const filteredCases = cases
    .filter(c => {
      const isDemo = Boolean(c.isDemo || c.id.startsWith('KZ-DEMO-'));

      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'LIVE' && !isDemo) ||
        (typeFilter === 'DEMO' && isDemo);

      const matchesSearch =
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.roadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.authorityRouting.authorityName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || c.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesPriority =
        priorityFilter === 'ALL' ||
        c.priorityAssessment.priority.toLowerCase() === priorityFilter.toLowerCase();

      return matchesType && matchesSearch && matchesStatus && matchesPriority;
    })
    // Sort: Live cases first, then newest
    .sort((a, b) => {
      const aLive = !a.isDemo && !a.id.startsWith('KZ-DEMO-');
      const bLive = !b.isDemo && !b.id.startsWith('KZ-DEMO-');
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Civic Accountability
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Community Road Reports Docket
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Search, filter, and track verified road hazard submissions across administrative jurisdictions.
          </p>
        </div>

        <Link
          href="/citizen/report"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Hazard Report</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Case ID, road, or locality..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Live vs Demo Segmented Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                typeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All ({cases.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('LIVE')}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                typeFilter === 'LIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>Live Reports ({liveCasesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('DEMO')}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                typeFilter === 'DEMO'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Demo ({demoCasesCount})</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="REPORTED">Reported</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCases.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No matching reports found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or report a new road issue.
            </p>
          </div>
        ) : (
          filteredCases.map(c => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-blue-400 dark:hover:border-blue-700 transition flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-video bg-slate-950 overflow-hidden border-b border-slate-200 dark:border-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imageUrl}
                    alt={c.location.roadName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-white border border-white/20">
                      {c.id}
                    </span>
                    <CaseTypeBadge isDemo={c.isDemo} size="sm" />
                  </div>
                  <div className="absolute bottom-2.5 right-2.5">
                    <PriorityBadge priority={c.priorityAssessment.priority} size="sm" />
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={c.status} size="sm" />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {c.location.roadName}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 line-clamp-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{c.location.locality}, {c.location.district}</span>
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="text-slate-400 block">Assigned Authority:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {c.authorityRouting.authorityName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {c.timeline.length} Status Events
                </span>
                <Link
                  href={`/citizen/reports/${c.id}`}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Track Case</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
