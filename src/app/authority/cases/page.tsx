'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RoadCase } from '@/types';
import { getAllCases } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { CaseTypeBadge } from '@/components/CaseTypeBadge';
import { DEMO_AUTHORITY_REGISTRY } from '@/lib/authority/registry';
import {
  Search,
  Filter,
  ExternalLink,
  Landmark,
  Sparkles,
  Building,
  Radio,
} from 'lucide-react';

export default function AuthorityCasesPage() {
  const [cases, setCases] = useState<RoadCase[]>(() => getAllCases());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [authorityFilter, setAuthorityFilter] = useState('ALL');
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
        c.hazardAnalysis.hazardType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || c.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesPriority =
        priorityFilter === 'ALL' ||
        c.priorityAssessment.priority.toLowerCase() === priorityFilter.toLowerCase();

      const matchesAuth =
        authorityFilter === 'ALL' || c.authorityRouting.authorityId === authorityFilter;

      return matchesType && matchesSearch && matchesStatus && matchesPriority && matchesAuth;
    })
    // Sort: Live citizen cases first, then newest
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
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Landmark className="w-4 h-4" /> Authority Docket
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Department Case Management Docket
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage intake, acknowledge citizen reports, dispatch field officers, and log AI-verified resolutions.
          </p>
        </div>

        <Link
          href="/authority/cases/KZ-DEMO-001"
          className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Launch Demo Case Desk (NH-30)</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-center gap-4 justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Case ID, road, or hazard..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
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
              <span>Live ({liveCasesCount})</span>
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

          {/* Authority Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Dept:</span>
            <select
              value={authorityFilter}
              onChange={e => setAuthorityFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium max-w-[200px] truncate"
            >
              <option value="ALL">All Departments</option>
              {DEMO_AUTHORITY_REGISTRY.map(a => (
                <option key={a.id} value={a.id}>
                  {a.authorityName}
                </option>
              ))}
            </select>
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

      {/* Cases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Case ID</th>
              <th className="py-3.5 px-4">Origin</th>
              <th className="py-3.5 px-4">Hazard &amp; Road Segment</th>
              <th className="py-3.5 px-4">Assigned Authority</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Logged</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                  No cases found matching your filters.
                </td>
              </tr>
            ) : (
              filteredCases.map(c => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    <span>{c.id}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <CaseTypeBadge isDemo={c.isDemo} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                      {c.location.roadName}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {c.hazardAnalysis.hazardType.replace('_', ' ')} • {c.location.locality}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-[200px] truncate">
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                      {c.authorityRouting.authorityName}
                    </span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {c.location.roadCategory?.replace('_', ' ') || 'Corridor'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={c.priorityAssessment.priority} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/authority/cases/${c.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold inline-flex items-center gap-1 shadow-2xs transition"
                    >
                      <span>Manage</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
