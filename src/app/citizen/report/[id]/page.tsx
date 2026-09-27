'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RoadCase } from '@/types';
import { getCaseById } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { CaseTypeBadge } from '@/components/CaseTypeBadge';
import { RealityCheckCard } from '@/components/RealityCheckCard';
import { EvidencePanel } from '@/components/EvidencePanel';
import { AccidentIntelligenceCard } from '@/components/AccidentIntelligenceCard';
import { AuthorityCard } from '@/components/AuthorityCard';
import { MapView } from '@/components/MapView';
import {
  MapPin,
  Landmark,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';

export default function DetailedReportPage() {
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
        Loading detailed case analysis...
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Case Not Found</h2>
        <p className="text-xs text-slate-500">The requested report ID {id} could not be located.</p>
        <Link
          href="/citizen"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/citizen"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={`/authority/cases/${caseData.id}`}
            className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition flex items-center gap-1.5"
            title="Inspect in Authority Command View"
          >
            <Landmark className="w-3.5 h-3.5 text-purple-600" />
            <span>Open in Authority Portal</span>
          </Link>

          <Link
            href={`/citizen/reports/${caseData.id}`}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            <span>Live Case Tracking</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Case Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                {caseData.id}
              </span>
              <CaseTypeBadge isDemo={caseData.isDemo} />
              <StatusBadge status={caseData.status} />
              <PriorityBadge priority={caseData.priorityAssessment.priority} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {(!caseData.location.roadName || caseData.location.roadName.includes('unavailable'))
                ? 'Road name unavailable'
                : caseData.location.roadName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 font-sans">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{caseData.location.formattedAddress}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-mono block">
              Reported: {new Date(caseData.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 inline-block">
              {caseData.citizenReportCount} Community Submission(s)
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Evidence Panel + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EvidencePanel
            imageUrl={caseData.imageUrl}
            hazardAnalysis={caseData.hazardAnalysis}
            resolutionEvidence={caseData.resolutionEvidence}
          />
        </div>

        <div className="space-y-6">
          {/* Geographic GIS Map with 100km radius and accident markers */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" /> Snapped Road Segment &amp; 100km Perimeter
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
            <div className="mt-3 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Road Category:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  {caseData.location.roadCategory?.replace('_', ' ') || 'Classified Corridor'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>District Jurisdiction:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {caseData.location.district}, {caseData.location.state}
                </span>
              </div>
            </div>
          </div>

          {/* Priority Risk Assessment Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                AI-assisted Priority Indicator
              </span>
              <PriorityBadge priority={caseData.priorityAssessment.priority} size="sm" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              {caseData.priorityAssessment.explanation}
            </p>
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Contributing Risk Factors:
              </span>
              {caseData.priorityAssessment.factors.map((f, i) => (
                <div key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Responsible Authority & Accident Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AuthorityCard routing={caseData.authorityRouting} />
        <AccidentIntelligenceCard
          events={caseData.accidentIntelligence.events}
          summary={caseData.accidentIntelligence.summary}
          totalFound={caseData.accidentIntelligence.totalFound}
          highRelevanceCount={caseData.accidentIntelligence.highRelevanceCount}
        />
      </div>

      {/* Data Source & System Reality Verification Card */}
      <RealityCheckCard roadCase={caseData} />
    </div>
  );
}
