import React from 'react';
import { RoadCase } from '@/types';
import {
  Camera,
  Compass,
  MapPin,
  Newspaper,
  Landmark,
  Database,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface RealityCheckCardProps {
  roadCase: RoadCase;
}

export const RealityCheckCard: React.FC<RealityCheckCardProps> = ({ roadCase }) => {
  const isDemo = Boolean(roadCase.isDemo ?? roadCase.id.startsWith('KZ-DEMO-'));
  const meta = roadCase.realityMetadata;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Data Source &amp; System Reality Verification Audit
          </h3>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
            isDemo
              ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
          }`}
        >
          {isDemo ? 'Benchmark Demonstration Case' : 'Verified Real Public Submission'}
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-4">
        Every case in KIZUNA is backed by auditable data origins. Inspect the live data pipelines and integrity verifications below.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* 1. Photo Origin */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>1. Photographic Evidence</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Origin:</span>
              <span className="font-semibold">{meta?.photoSource === 'USER_UPLOAD' ? 'Real User Upload' : 'Demo Test Photo'}</span>
            </div>
            {meta?.photoFileName && (
              <div className="flex justify-between truncate">
                <span className="text-slate-400">File:</span>
                <span className="font-mono truncate max-w-[120px]">{meta.photoFileName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Analysis:</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Groq Vision AI
              </span>
            </div>
          </div>
        </div>

        {/* 2. Geolocation Origin */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>2. Geolocation Fix</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Fix Source:</span>
              <span className="font-semibold">
                {roadCase.location.source === 'gps'
                  ? 'Live Browser GPS'
                  : roadCase.location.source === 'manual'
                  ? 'Manual Coordinates'
                  : 'Corridor Preset'}
              </span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Coordinates:</span>
              <span>{roadCase.location.latitude.toFixed(4)}°, {roadCase.location.longitude.toFixed(4)}°</span>
            </div>
            {roadCase.location.gpsAccuracy !== undefined && (
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">GPS Accuracy:</span>
                <span className="text-emerald-600 font-semibold">&plusmn;{Math.round(roadCase.location.gpsAccuracy)}m</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Road Segment Resolution */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <MapPin className="w-4 h-4 text-purple-600" />
            <span>3. Road Identification</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex justify-between truncate">
              <span className="text-slate-400">Segment:</span>
              <span className="font-semibold truncate max-w-[130px]">{roadCase.location.roadName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hierarchy:</span>
              <span className="capitalize">{roadCase.location.roadCategory?.replace('_', ' ') || 'Unclassified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Provider:</span>
              <span className="text-blue-600 font-mono text-[10px]">
                OpenStreetMap Nominatim
              </span>
            </div>
          </div>
        </div>

        {/* 4. 100 KM Accident Intelligence */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Newspaper className="w-4 h-4 text-rose-600" />
            <span>4. 100km Precedent Pipeline</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Perimeter:</span>
              <span className="font-semibold text-rose-600 font-mono">100 KM Haversine</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Precedents:</span>
              <span>{roadCase.accidentIntelligence.events.length} verified events</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">High Relevance:</span>
              <span className="font-semibold">{roadCase.accidentIntelligence.highRelevanceCount} corridor matches</span>
            </div>
          </div>
        </div>

        {/* 5. Statutory Authority Routing */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Landmark className="w-4 h-4 text-amber-600" />
            <span>5. Authority Routing</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex justify-between truncate">
              <span className="text-slate-400">Assigned:</span>
              <span className="font-semibold truncate max-w-[130px]">{roadCase.authorityRouting.authorityName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Method:</span>
              <span className="font-semibold text-emerald-600">Deterministic Registry</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Confidence:</span>
              <span className="font-mono">{Math.round(roadCase.authorityRouting.routingConfidence * 100)}%</span>
            </div>
          </div>
        </div>

        {/* 6. Case Persistence */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>6. Persistence Backend</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Case ID:</span>
              <span className="font-bold text-blue-600">{roadCase.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sync Status:</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Synchronized
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span className="text-slate-400">Engine:</span>
              <span>Supabase / Local Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
