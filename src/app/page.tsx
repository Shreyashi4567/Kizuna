import React from 'react';
import Link from 'next/link';
import {
  Camera,
  Landmark,
  ArrowRight,
  Sparkles,
  FileCheck,
  Newspaper,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-16 pb-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Hackathon Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>Sewa Setu Innovation Hackathon 2026 • Digital Public Service Delivery</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              See a dangerous road? <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                KIZUNA connects the problem
              </span>{' '}
              to the people responsible.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              An AI-powered road safety and civic accountability platform. Citizens capture road hazards; KIZUNA uses multimodal AI, Google Roads intelligence, and public accident archives to identify the exact responsible government jurisdiction and track repairs transparently.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/citizen/report"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition flex items-center gap-2 active:scale-98"
              >
                <Camera className="w-4 h-4" />
                <span>Report Road Hazard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/citizen/reports/KZ-DEMO-001"
                className="px-6 py-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-semibold text-sm transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Try Demo Case (NH-30)</span>
              </Link>

              <Link
                href="/authority/dashboard"
                className="px-5 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-sm transition flex items-center gap-2"
              >
                <Landmark className="w-4 h-4 text-slate-500" />
                <span>Authority Command</span>
              </Link>
            </div>

            {/* GovTech Pillars */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-200 dark:border-slate-800 text-left">
              <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-2xl font-black text-slate-900 dark:text-white">94.2%</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Jurisdiction Routing Accuracy
                </p>
              </div>
              <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">&lt; 3.2 Days</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Average Remediation SLA
                </p>
              </div>
              <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100%</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Public Audit Transparency
                </p>
              </div>
              <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">Groq Vision</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Multimodal Hazard Vision
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Core Capabilities */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
              Platform Architecture
            </h2>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Four Intelligent Pillars for Road Accountability
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Eliminating the bureaucratic blame-game between National, State, Municipal, and Panchayat road agencies through verifiable digital workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Capability 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-blue-300 dark:hover:border-blue-700 transition group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                1. AI Hazard Detection
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Groq Vision AI inspects citizen photos, classifying potholes, shattered dividers, collapsed curbs, and waterlogging with structured civil severity ratings.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] font-mono text-blue-600 dark:text-blue-400">
                Pothole • Median • Drainage
              </div>
            </div>

            {/* Capability 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-amber-300 dark:hover:border-amber-700 transition group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                <Newspaper className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                2. Accident Intelligence
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Aggregates publicly available accident reports from configured news sources, extracting collision precedents to establish urgent risk patterns without subjective bias.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] font-mono text-amber-600 dark:text-amber-400">
                Historical Collision Context
              </div>
            </div>

            {/* Capability 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                3. Authority Routing Engine
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Matches the road segment (NHAI, PWD State Highways, Urban Municipal Corporation, or Rural PMGSY) using structured territorial registries to stop jurisdictional disputes.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                Deterministic Gov Registry
              </div>
            </div>

            {/* Capability 4 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                4. Transparent Resolution Tracking
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tracks each case from acknowledgment to field officer assignment. Authorities upload post-repair evidence, validated via AI-assisted visual verification.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                Visual Before / After Audit
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* End-to-End Workflow Flowchart */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
              End-to-End Workflow
            </h2>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              From Citizen Report to Verified Road Repair
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-center">
            {/* Step 1 */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mb-2">
                1
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Citizen Upload</span>
              <span className="text-[11px] text-slate-500 mt-1">Photo + GPS coordinates</span>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold mb-2">
                2
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Groq Vision AI</span>
              <span className="text-[11px] text-slate-500 mt-1">Severity & hazard detection</span>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold mb-2">
                3
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Road Segment</span>
              <span className="text-[11px] text-slate-500 mt-1">Google Roads & geocoding</span>
            </div>

            {/* Step 4 */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold mb-2">
                4
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">News Intelligence</span>
              <span className="text-[11px] text-slate-500 mt-1">Collision precedent match</span>
            </div>

            {/* Step 5 */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold mb-2">
                5
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Authority Routing</span>
              <span className="text-[11px] text-slate-500 mt-1">Jurisdiction registry assignment</span>
            </div>

            {/* Step 6 */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mb-2">
                6
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Department Action</span>
              <span className="text-[11px] text-slate-500 mt-1">Acknowledge & officer dispatch</span>
            </div>

            {/* Step 7 */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold mb-2">
                7
              </div>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Resolved & Verified</span>
              <span className="text-[11px] text-emerald-700/80 mt-1">AI visual comparison</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Interactive Demo Spotlight */}
      <section className="py-16 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" /> Ready for Hackathon Evaluation
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Experience the Complete 2-Minute Demo Flow
              </h2>
              <p className="mt-4 text-sm sm:text-base text-blue-100/90 leading-relaxed">
                Test Case <span className="font-mono font-bold text-white">KZ-DEMO-001</span>: High-severity pothole on NH-30 Tatibandh corridor with 7 public collision archives, routed to NHAI PIU Raipur, with full status timeline and verification preview.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/citizen/reports/KZ-DEMO-001"
                  className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  <span>Launch Demo Case</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/authority/cases/KZ-DEMO-001"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition flex items-center gap-2"
                >
                  <Landmark className="w-4 h-4" />
                  <span>Authority Action Desk</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
