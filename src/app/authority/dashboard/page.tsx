'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RoadCase } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { MapView, MapMarker } from '@/components/MapView';
import { DEMO_AUTHORITY_REGISTRY } from '@/lib/authority/registry';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Flame,
  ArrowRight,
  Landmark,
  Building,
  Inbox,
  PlusCircle,
} from 'lucide-react';

export default function AuthorityDashboardPage() {
  const [cases, setCases] = useState<RoadCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/cases')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.cases)) {
          setCases(data.cases);
        }
      })
      .catch(err => console.warn('Authority cases sync notice:', err))
      .finally(() => setLoading(false));
  }, []);

  const activeCasesList = cases
    .filter(c => {
      const matchesAuth =
        selectedAuthorityId === 'ALL' || c.authorityRouting.authorityId === selectedAuthorityId;
      return matchesAuth;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Metrics directly from live operational data
  const totalActive = activeCasesList.filter(c => c.status !== 'RESOLVED').length;
  const criticalCount = activeCasesList.filter(c => c.priorityAssessment.priority === 'CRITICAL' && c.status !== 'RESOLVED').length;
  const highCount = activeCasesList.filter(c => c.priorityAssessment.priority === 'HIGH' && c.status !== 'RESOLVED').length;
  const awaitingAck = activeCasesList.filter(c => c.status === 'REPORTED' || c.status === 'SUBMITTED').length;
  const resolvedCount = activeCasesList.filter(c => c.status === 'RESOLVED').length;
  const slaAlerts = activeCasesList.filter(c => c.priorityAssessment.priority === 'CRITICAL' && c.status !== 'RESOLVED').length;

  // Geographic Map Markers
  const mapMarkers: MapMarker[] = activeCasesList.map(c => ({
    id: c.id,
    latitude: c.location.latitude,
    longitude: c.location.longitude,
    title: c.location.roadName,
    roadName: c.location.roadName,
    locality: c.location.locality,
    priority: c.priorityAssessment.priority,
    status: c.status,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Top Command Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Landmark className="w-4 h-4" /> Authority Command Center • Digital Service Delivery
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Departmental Road Safety Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time incident response, statutory authority routing, work order dispatch, and field repair verification.
          </p>
        </div>

        {/* Authority Division Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-xs">
            <Building className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Division:</span>
            <select
              value={selectedAuthorityId}
              onChange={e => setSelectedAuthorityId(e.target.value)}
              className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-hidden"
            >
              <option value="ALL">All Statutory Jurisdictions</option>
              {DEMO_AUTHORITY_REGISTRY.map(a => (
                <option key={a.id} value={a.id}>
                  {a.authorityName} ({a.level})
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/authority/cases"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <span>Manage All Cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Command Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Docket
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {totalActive}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {cases.length} Total Registered
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Critical Tier
          </span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">
            {criticalCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Immediate hazard risk</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            High Severity
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {highCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Urgent repair queue</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
            Awaiting Ack
          </span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">
            {awaitingAck}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Pending officer review</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {resolvedCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">AI-verified remediation</span>
        </div>

        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> SLA Critical
          </span>
          <span className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1 block">
            {slaAlerts}
          </span>
          <span className="text-[10px] text-rose-600 dark:text-rose-500 mt-0.5 block">Priority escalation</span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mx-auto" />
            <div className="text-xs">Loading operational authority docket from Supabase...</div>
          </div>
        </div>
      ) : cases.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <Inbox className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No live reports yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              All departmental dockets are clear. Reports submitted by citizens with real road photos and GPS coordinates will appear here for review and dispatch.
            </p>
          </div>
          <div>
            <Link
              href="/citizen/report"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit a Real Hazard Report</span>
            </Link>
          </div>
        </div>
      ) : (
        /* GIS Command Map + Urgent Action Queue */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: GIS Interactive Map */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Territorial Road Safety GIS Command Map
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live operational incidents color-coded by priority tier.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {activeCasesList.length} Active On Map
                </span>
              </div>

              <MapView
                markers={mapMarkers}
                centerLat={mapMarkers[0]?.latitude || 21.2514}
                centerLng={mapMarkers[0]?.longitude || 81.6296}
                zoom={13}
                height="380px"
              />
            </div>
          </div>

          {/* Right Col: Urgent Priority Queue */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Immediate Priority Queue
                  </h3>
                </div>
                <Link
                  href="/authority/cases"
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Full Docket
                </Link>
              </div>

              <div className="space-y-3">
                {activeCasesList
                  .filter(c => c.status !== 'RESOLVED')
                  .slice(0, 5)
                  .map(c => (
                    <Link
                      key={c.id}
                      href={`/authority/cases/${c.id}`}
                      className="block p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/40 transition group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100">
                          {c.id}
                        </span>
                        <PriorityBadge priority={c.priorityAssessment.priority} size="sm" />
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition truncate">
                        {c.location.roadName}
                      </h4>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {c.location.locality} • {c.hazardAnalysis.hazardType.replace('_', ' ')}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                        <StatusBadge status={c.status} size="sm" />
                        <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                          Action Docket <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Link
                href="/authority/cases"
                className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold text-center block transition"
              >
                Open Complete Department Docket
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
