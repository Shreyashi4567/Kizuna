'use client';

import React, { useState } from 'react';
import { HazardAnalysis, ResolutionVerification } from '@/types';
import { Camera, CheckCircle2, ShieldCheck, Sparkles, AlertCircle, Eye } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

interface EvidencePanelProps {
  imageUrl: string;
  hazardAnalysis: HazardAnalysis;
  resolutionEvidence?: {
    afterImageUrl: string;
    notes: string;
    verification?: ResolutionVerification;
  };
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  imageUrl,
  hazardAnalysis,
  resolutionEvidence,
}) => {
  const [activeView, setActiveView] = useState<'before' | 'after' | 'compare'>('before');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            Photographic Evidence & AI Vision Analysis
          </h3>
        </div>

        {resolutionEvidence && (
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveView('before')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeView === 'before'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Initial Hazard
            </button>
            <button
              type="button"
              onClick={() => setActiveView('after')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeView === 'after'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Post-Repair
            </button>
            <button
              type="button"
              onClick={() => setActiveView('compare')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeView === 'compare'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Side-by-Side
            </button>
          </div>
        )}
      </div>

      {/* Image Preview Canvas */}
      <div className="p-5">
        {activeView === 'compare' && resolutionEvidence ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                BEFORE REPAIR (Citizen Evidence)
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Road hazard prior to remediation"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                AFTER REPAIR (Authority Remediation)
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolutionEvidence.afterImageUrl}
                  alt="Road repair resolution photograph"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative aspect-video max-h-[380px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeView === 'after' && resolutionEvidence ? resolutionEvidence.afterImageUrl : imageUrl}
              alt="Road condition photograph"
              className="w-full h-full object-cover"
            />

            {/* In-photo status HUD */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="bg-black/75 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-md border border-white/20">
                {activeView === 'after' ? 'AFTER REMEDIATION' : 'INITIAL SUBMISSION'}
              </span>
              {activeView === 'before' && (
                <PriorityBadge
                  priority={
                    hazardAnalysis.severity === 'critical'
                      ? 'CRITICAL'
                      : hazardAnalysis.severity === 'high'
                      ? 'HIGH'
                      : hazardAnalysis.severity === 'medium'
                      ? 'MEDIUM'
                      : 'LOW'
                  }
                  size="sm"
                />
              )}
            </div>

            <div className="absolute bottom-3 right-3">
              <span className="bg-black/75 backdrop-blur-md text-slate-300 text-[11px] font-mono px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Confidence: {(hazardAnalysis.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* AI-assisted visual resolution verification Advisory Banner */}
        {resolutionEvidence?.verification && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    AI-assisted visual verification
                  </h4>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded">
                    Confidence: {(resolutionEvidence.verification.visualResolutionConfidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300/90 mt-1 leading-relaxed">
                  {resolutionEvidence.verification.explanation}
                </p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1.5 italic">
                  * Note: Advisory verification based on comparative visual model inspection. Final structural warranty remains with the field authority.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vision AI Structured Details */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Civil Hazard Classification</span>
            </div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
              {hazardAnalysis.hazardType.replace(/_/g, ' ')}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {hazardAnalysis.description}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Visible Road Environmental Clues</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {hazardAnalysis.visibleRoadClues.map((clue, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300"
                >
                  {clue}
                </span>
              ))}
            </div>

            {hazardAnalysis.additionalHazards && hazardAnalysis.additionalHazards.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Secondary Hazards:
                </span>
                <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc list-inside mt-1 space-y-0.5">
                  {hazardAnalysis.additionalHazards.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Resolution Notes if available */}
        {resolutionEvidence?.notes && (
          <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Field Engineer Resolution Notes:
              </span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                {resolutionEvidence.notes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
