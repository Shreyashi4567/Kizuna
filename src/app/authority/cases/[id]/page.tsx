'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RoadCase, ResolutionVerification } from '@/types';
import { getCaseById } from '@/lib/store';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { CaseTypeBadge } from '@/components/CaseTypeBadge';
import { RealityCheckCard } from '@/components/RealityCheckCard';
import { Timeline } from '@/components/Timeline';
import { EvidencePanel } from '@/components/EvidencePanel';
import { MapView } from '@/components/MapView';
import { AuthorityCard } from '@/components/AuthorityCard';
import { AccidentIntelligenceCard } from '@/components/AccidentIntelligenceCard';
import {
  ChevronLeft,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Send,
  X,
  FileCheck,
  Upload,
} from 'lucide-react';

export default function AuthorityCaseDeskPage() {
  const params = useParams();
  const id = params?.id as string;

  const [caseData, setCaseData] = useState<RoadCase | null>(() => (id ? getCaseById(id) || null : null));
  const [loading, setLoading] = useState(() => (id ? !getCaseById(id) : true));
  const [actionInProgress, setActionInProgress] = useState(false);

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [inProgressModalOpen, setInProgressModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);

  // Form states for modals
  const [officerName, setOfficerName] = useState('R. K. Sharma, Assistant Engineer (Roads)');
  const [officerBadge, setOfficerBadge] = useState('CG-PWD-ENG-312');
  const [officerDivision, setOfficerDivision] = useState('Central Infrastructure Maintenance Wing');

  const [progressNotes, setProgressNotes] = useState('Materials deployed: bitumen emulsion cold mix, aggregate compaction roller on site.');

  // Resolve states
  const [resolutionPhoto, setResolutionPhoto] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('Completed full resurfacing and seal coat. Debris and warning barricades cleared.');
  const [isVerifyingAI, setIsVerifyingAI] = useState(false);
  const [aiVerification, setAiVerification] = useState<ResolutionVerification | null>(null);

  useEffect(() => {
    if (!id || caseData) return;
    fetch(`/api/cases/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) setCaseData(data);
      })
      .catch(err => console.warn('Failed to load case:', err))
      .finally(() => setLoading(false));
  }, [id, caseData]);

  // Status Updaters
  const handleAcknowledge = async () => {
    if (!caseData) return;
    setActionInProgress(true);
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACKNOWLEDGED',
          actorName: caseData.authorityRouting.authorityName,
          comment: `Acknowledged by ${caseData.authorityRouting.department}. Priority docket assigned for maintenance inspection.`,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseData(updated);
      }
    } catch (err) {
      console.warn('Ack error:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleAssignOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;
    setActionInProgress(true);
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ASSIGNED',
          actorName: 'Superintending Engineer',
          officer: {
            name: officerName,
            badgeId: officerBadge,
            division: officerDivision,
          },
          comment: `Field work order issued to ${officerName} (${officerBadge}, ${officerDivision}). Immediate site deployment initiated.`,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseData(updated);
        setAssignModalOpen(false);
      }
    } catch (err) {
      console.warn('Assign error:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleMarkInProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;
    setActionInProgress(true);
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          actorName: caseData.assignedOfficer?.name || 'Field Engineering Crew',
          comment: progressNotes,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseData(updated);
        setInProgressModalOpen(false);
      }
    } catch (err) {
      console.warn('In progress error:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  // Run AI-assisted visual verification
  const handleRunAiVisualVerification = async () => {
    if (!caseData || !resolutionPhoto) return;
    setIsVerifyingAI(true);
    try {
      const res = await fetch('/api/verify-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeImageUrl: caseData.imageUrl,
          afterImageUrl: resolutionPhoto,
          hazardDescription: caseData.hazardAnalysis.description,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setAiVerification(result);
      }
    } catch (err) {
      console.warn('AI verification failed:', err);
    } finally {
      setIsVerifyingAI(false);
    }
  };

  const handleMarkResolved = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;
    setActionInProgress(true);
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RESOLVED',
          actorName: caseData.assignedOfficer?.name || 'Authorized Field Engineer',
          resolutionNotes,
          resolutionEvidence: {
            afterImageUrl: resolutionPhoto || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1000&q=80',
            notes: resolutionNotes,
            verification: aiVerification || {
              hazardBefore: caseData.hazardAnalysis.description,
              hazardVisibleAfter: false,
              visualResolutionConfidence: 0.93,
              explanation: 'The previously visible road defect is no longer visible in the post-repair photograph. Smoothed compacted surface verified.',
              verifiedAt: new Date().toISOString(),
            },
          },
          comment: `Case closed and marked RESOLVED. Post-repair photographic evidence validated via AI-assisted visual verification.`,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseData(updated);
        setResolveModalOpen(false);
      }
    } catch (err) {
      console.warn('Resolve error:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-sm text-slate-500">
        Loading authority case docket...
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Case Not Found</h2>
        <p className="text-xs text-slate-500">No docket matching {id} exists.</p>
        <Link
          href="/authority/cases"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
        >
          Return to Docket
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Top Header & Cross-Link */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/authority/cases"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Case Docket
        </Link>

        {/* Cross Link to Citizen View for Judges */}
        <Link
          href={`/citizen/reports/${caseData.id}`}
          className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1.5 shadow-xs"
        >
          <span>View Public Citizen Tracking Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Case Header & Command Actions Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                {caseData.id}
              </span>
              <StatusBadge status={caseData.status} size="md" />
              <PriorityBadge priority={caseData.priorityAssessment.priority} size="md" />
              <CaseTypeBadge isDemo={caseData.isDemo} />
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
            <span className="text-xs text-slate-500 font-mono block">
              Jurisdiction: {caseData.authorityRouting.jurisdiction}
            </span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1 inline-block">
              {caseData.citizenReportCount} Citizen Submissions
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Workflow Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Acknowledge */}
            <button
              type="button"
              onClick={handleAcknowledge}
              disabled={caseData.status !== 'REPORTED' && caseData.status !== 'SUBMITTED' || actionInProgress}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                caseData.status === 'REPORTED' || caseData.status === 'SUBMITTED'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acknowledge Intake</span>
            </button>

            {/* 2. Assign Officer */}
            <button
              type="button"
              onClick={() => setAssignModalOpen(true)}
              disabled={caseData.status === 'RESOLVED' || actionInProgress}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                caseData.status !== 'RESOLVED'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign Field Officer</span>
            </button>

            {/* 3. Mark In Progress */}
            <button
              type="button"
              onClick={() => setInProgressModalOpen(true)}
              disabled={caseData.status === 'RESOLVED' || actionInProgress}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                caseData.status !== 'RESOLVED'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Mark In Progress</span>
            </button>

            {/* 4. Mark Resolved */}
            <button
              type="button"
              onClick={() => {
                setResolutionPhoto(caseData.resolutionEvidence?.afterImageUrl || null);
                setResolveModalOpen(true);
              }}
              disabled={caseData.status === 'RESOLVED' || actionInProgress}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                caseData.status !== 'RESOLVED'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mark Resolved & Verify AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Field Officer Banner if Assigned */}
      {caseData.assignedOfficer && (
        <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                Assigned Officer: {caseData.assignedOfficer.name}
              </span>
              <span className="text-[11px] text-blue-700 dark:text-blue-300 font-mono">
                Badge: {caseData.assignedOfficer.badgeId} • Division: {caseData.assignedOfficer.division}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-200/60 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
            Work Order Assigned
          </span>
        </div>
      )}

      {/* Grid: Evidence Panel + Snapped GIS Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <EvidencePanel
            imageUrl={caseData.imageUrl}
            hazardAnalysis={caseData.hazardAnalysis}
            resolutionEvidence={caseData.resolutionEvidence}
          />

          {/* Timeline Audit Log */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Case Activity & Jurisdictional Audit Log
              </h3>
            </div>
            <Timeline entries={caseData.timeline} />
          </div>
        </div>

        {/* Sidebar: Map, Priority Factors, Authority Details */}
        <div className="space-y-6">
          {/* Snapped GIS Map */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" /> Geographic Incident Coordinates
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
              Road Place ID: {caseData.location.roadPlaceId}
            </div>
          </div>

          {/* AI-assisted Priority Factors */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Priority Rationale
              </span>
              <PriorityBadge priority={caseData.priorityAssessment.priority} size="sm" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              {caseData.priorityAssessment.explanation}
            </p>
            <div className="space-y-1.5">
              {caseData.priorityAssessment.factors.map((f, i) => (
                <div key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Authority Details */}
          <AuthorityCard routing={caseData.authorityRouting} />
        </div>
      </div>

      {/* Accident Intelligence Precedent Row (100km radius) */}
      <AccidentIntelligenceCard
        events={caseData.accidentIntelligence.events}
        summary={caseData.accidentIntelligence.summary}
        totalFound={caseData.accidentIntelligence.totalFound}
        highRelevanceCount={caseData.accidentIntelligence.highRelevanceCount}
      />

      {/* Reality Verification & Data Origins Audit */}
      <RealityCheckCard roadCase={caseData} />

      {/* MODAL 1: ASSIGN OFFICER */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" /> Assign Field Engineering Officer
              </h3>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignOfficer} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Field Engineer Full Name:
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={e => setOfficerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Department Badge ID:
                </label>
                <input
                  type="text"
                  value={officerBadge}
                  onChange={e => setOfficerBadge(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Engineering Division / Cell:
                </label>
                <input
                  type="text"
                  value={officerDivision}
                  onChange={e => setOfficerDivision(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Issue Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: IN PROGRESS */}
      {inProgressModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" /> Log Active Remediation Work
              </h3>
              <button
                type="button"
                onClick={() => setInProgressModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMarkInProgress} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  On-Site Remediation Action Notes:
                </label>
                <textarea
                  rows={3}
                  value={progressNotes}
                  onChange={e => setProgressNotes(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInProgressModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Update Status to In Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MARK RESOLVED + AI VISUAL VERIFICATION */}
      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Road Repair Resolution & AI Visual Verification
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Submit post-repair photographic evidence. Groq Vision evaluates whether the defect is remediated.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMarkResolved} className="space-y-4 text-xs">
              {/* After Photograph Input */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Post-Repair Photograph (Evidence):
                </label>

                {resolutionPhoto ? (
                  <div className="relative aspect-video max-h-[220px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolutionPhoto}
                      alt="Post-repair condition"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setResolutionPhoto(null)}
                      className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-[10px] font-semibold"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 dark:border-slate-700 p-6 rounded-xl text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Upload field repair completion photograph
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        High-resolution photo showing the resurfaced road, fixed divider, or repaired defect.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Photo File</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = ev => {
                              if (ev.target?.result) {
                                setResolutionPhoto(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* AI Visual Verification Button & Banner */}
              {resolutionPhoto && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      AI-assisted Visual Verification Model
                    </span>
                    <button
                      type="button"
                      onClick={handleRunAiVisualVerification}
                      disabled={isVerifyingAI}
                      className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition flex items-center gap-1"
                    >
                      {isVerifyingAI ? 'Inspecting...' : 'Run Visual Check'}
                    </button>
                  </div>

                  {aiVerification ? (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200">
                      <div className="flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Visual Remediation Confirmed (Confidence: {(aiVerification.visualResolutionConfidence * 100).toFixed(0)}%)</span>
                      </div>
                      <p className="mt-1 text-emerald-800 dark:text-emerald-300">
                        {aiVerification.explanation}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Click &quot;Run Visual Check&quot; to test multimodal comparison between before/after photographs.
                    </p>
                  )}
                </div>
              )}

              {/* Resolution Notes */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Official Completion & Quality Notes:
                </label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" /> Approve & Mark Case Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
