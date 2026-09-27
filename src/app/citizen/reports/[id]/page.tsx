'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RoadCase, CaseStatus } from '@/types';
import { getCaseById } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { CaseTypeBadge } from '@/components/CaseTypeBadge';
import { RealityCheckCard } from '@/components/RealityCheckCard';
import { Timeline } from '@/components/Timeline';
import { EvidencePanel } from '@/components/EvidencePanel';
import { MapView } from '@/components/MapView';
import { AuthorityCard } from '@/components/AuthorityCard';
import {
  ChevronLeft,
  MapPin,
  Clock,
  Landmark,
} from 'lucide-react';

export default function CitizenCaseTrackingPage() {
  const params = useParams();
  const id = params?.id as string;

  const [caseData, setCaseData] = useState<RoadCase | null>(() => (id ? getCaseById(id) || null : null));
  const [loading, setLoading] = useState(() => (id ? !getCaseById(id) : true));

  useEffect(() => {
    if (!id) return;
    fetch(`/api/cases/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) setCaseData(data);
      })
      .catch(err => console.warn('Fetch error:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-sm text-slate-500">
        Loading case tracking timeline...
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Case Not Found</h2>
        <p className="text-xs text-slate-500">No docket matching {id} exists.</p>
        <Link
          href="/citizen/reports"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
        >
          Return to My Reports
        </Link>
      </div>
    );
  }

  // Progress Bar Stages
  const stages: { label: string; key: CaseStatus }[] = [
    { label: 'Reported', key: 'REPORTED' },
    { label: 'Acknowledged', key: 'ACKNOWLEDGED' },
    { label: 'Assigned', key: 'ASSIGNED' },
    { label: 'In Progress', key: 'IN_PROGRESS' },
    { label: 'Resolved & Verified', key: 'RESOLVED' },
  ];

  const getStageIndex = (st: CaseStatus) => {
    switch (st) {
      case 'REPORTED':
      case 'AI_ANALYZED':
      case 'AUTHORITY_IDENTIFIED':
      case 'SUBMITTED':
        return 0;
      case 'ACKNOWLEDGED':
        return 1;
      case 'ASSIGNED':
        return 2;
      case 'IN_PROGRESS':
        return 3;
      case 'RESOLVED':
        return 4;
    }
  };

  const currentStageIdx = getStageIndex(caseData.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/citizen/reports"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Reports
        </Link>

        {/* Portal Cross-Link for Hackathon Evaluator Experience */}
        <div className="flex items-center gap-2.5">
          <Link
            href={`/citizen/report/${caseData.id}`}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
          >
            Detailed AI Dossier
          </Link>

          <Link
            href={`/authority/cases/${caseData.id}`}
            className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5 shadow-xs"
          >
            <Landmark className="w-3.5 h-3.5 text-purple-600" />
            <span>Switch to Authority Portal View</span>
          </Link>
        </div>
      </div>

      {/* Case Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                {caseData.id}
              </span>
              <CaseTypeBadge isDemo={caseData.isDemo} />
              <StatusBadge status={caseData.status} size="md" />
              <PriorityBadge priority={caseData.priorityAssessment.priority} size="md" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {caseData.location.roadName}
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 font-sans">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{caseData.location.formattedAddress}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-mono block">
              Created: {new Date(caseData.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 inline-block">
              Assigned to: {caseData.authorityRouting.authorityName}
            </span>
          </div>
        </div>

        {/* Linear Stage Progress Meter */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-5 gap-2 text-center">
            {stages.map((st, i) => {
              const isPastOrCurrent = i <= currentStageIdx;
              const isCurrent = i === currentStageIdx;

              return (
                <div key={st.key} className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      isPastOrCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-blue-100 dark:ring-blue-900/50' : ''}`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-[11px] mt-2 font-medium ${
                      isPastOrCurrent
                        ? 'text-slate-900 dark:text-white font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Column Layout: Evidence & Map on Left, Timeline & Authority on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Photographic Evidence & Visual Resolution */}
          <EvidencePanel
            imageUrl={caseData.imageUrl}
            hazardAnalysis={caseData.hazardAnalysis}
            resolutionEvidence={caseData.resolutionEvidence}
          />

          {/* Detailed Status Timeline Audit Trail */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Transparent Resolution Timeline &amp; Audit Log
              </h3>
            </div>
            <Timeline entries={caseData.timeline} />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Snapped Road Map with 100km radius and red accident markers */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" /> Hazard Coordinates &amp; 100km Perimeter
            </h4>
            <MapView
              markers={[
                {
                  id: caseData.id,
                  latitude: caseData.location.latitude,
                  longitude: caseData.location.longitude,
                  title: caseData.id,
                  roadName: caseData.location.roadName,
                  priority: caseData.priorityAssessment.priority,
                },
              ]}
              centerLat={caseData.location.latitude}
              centerLng={caseData.location.longitude}
              accidentEvents={caseData.accidentIntelligence.events}
              show100KmRadius={true}
              height="260px"
            />
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              {caseData.location.latitude.toFixed(5)}°N, {caseData.location.longitude.toFixed(5)}°E
            </div>
          </div>

          {/* Assigned Government Authority */}
          <AuthorityCard routing={caseData.authorityRouting} />
        </div>
      </div>

      {/* Reality Verification & Data Origins Audit */}
      <RealityCheckCard roadCase={caseData} />
    </div>
  );
}
