'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ExternalLink, Navigation, Radio, AlertOctagon } from 'lucide-react';
import { PriorityLevel, AccidentEvent } from '@/types';

// Dynamically import Leaflet Map to avoid SSR window errors
const DynamicKizunaMap = dynamic(
  () => import('./maps/KizunaMap').then(mod => mod.KizunaMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
        <span className="w-4 h-4 rounded-full bg-blue-500 animate-ping mb-2" />
        <span className="text-xs">Loading OpenStreetMap Canvas...</span>
      </div>
    ),
  }
);

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  roadName: string;
  locality?: string;
  priority: PriorityLevel;
  status?: string;
  hazardType?: string;
  distanceKm?: number;
}

interface MapViewProps {
  markers?: MapMarker[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  height?: string;
  selectedMarkerId?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  showControls?: boolean;
  accidentEvents?: AccidentEvent[];
  show100KmRadius?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  markers = [],
  centerLat,
  centerLng,
  zoom = 12,
  height = '420px',
  selectedMarkerId,
  onMarkerClick,
  showControls = true,
  accidentEvents = [],
  show100KmRadius = true,
}) => {
  const [activeAccident, setActiveAccident] = useState<AccidentEvent | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'radius_radar'>('map');

  const activeLat = centerLat ?? (markers[0]?.latitude || 21.2514);
  const activeLng = centerLng ?? (markers[0]?.longitude || 81.6296);

  // Filter valid accident events with coordinates or distance <= 100km
  const validAccidents = accidentEvents.filter(
    ev => (ev.distanceKm !== undefined ? ev.distanceKm <= 100 : true)
  );

  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${activeLat}&mlon=${activeLng}#map=${zoom}/${activeLat}/${activeLng}`;

  const priorityColors: Record<PriorityLevel, { bg: string; border: string }> = {
    CRITICAL: { bg: 'bg-rose-500', border: 'border-rose-200' },
    HIGH: { bg: 'bg-amber-500', border: 'border-amber-200' },
    MEDIUM: { bg: 'bg-sky-500', border: 'border-sky-200' },
    LOW: { bg: 'bg-slate-500', border: 'border-slate-200' },
  };

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-sm flex flex-col"
      style={{ height }}
    >
      {/* Top Banner: Geospatial Legend Ribbon */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-md text-[11px] text-white">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-400/50 animate-pulse" />
          <span className="font-semibold text-blue-300">Citizen Hazard</span>
        </div>
        <span className="text-slate-500">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-500/50" />
          <span className="font-semibold text-rose-300">
            Accidents ({validAccidents.length})
          </span>
        </div>
        {show100KmRadius && (
          <>
            <span className="text-slate-500">|</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full border border-dashed border-sky-400" />
              <span className="text-sky-300 font-mono">100km Zone</span>
            </div>
          </>
        )}
      </div>

      {/* Map Content: Interactive Leaflet Map or 100km Concentric Radar */}
      {viewMode === 'map' ? (
        <DynamicKizunaMap
          center={[activeLat, activeLng]}
          zoom={zoom}
          incidents={validAccidents}
          showRadius={show100KmRadius}
          height="100%"
          selectedIncidentId={activeAccident?.id || null}
          onSelectIncident={inc => setActiveAccident(inc)}
        />
      ) : (
        /* 100 KM Radius Geospatial Radar View */
        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Concentric distance rings */}
          <div className="absolute w-[85%] aspect-square rounded-full border border-sky-500/30 flex items-center justify-center">
            <span className="absolute -top-3 text-[10px] font-mono text-sky-400 bg-slate-950 px-1.5">
              100 KM BOUNDARY
            </span>
            <div className="w-[60%] aspect-square rounded-full border border-sky-500/20 flex items-center justify-center">
              <span className="absolute -top-3 text-[9px] font-mono text-sky-500/70 bg-slate-950 px-1">
                60 KM
              </span>
              <div className="w-[50%] aspect-square rounded-full border border-sky-500/15 flex items-center justify-center">
                <span className="absolute -top-3 text-[9px] font-mono text-sky-500/50 bg-slate-950 px-1">
                  30 KM
                </span>
              </div>
            </div>
          </div>

          {/* Center Citizen Hazard Marker (Blue) */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping" />
              <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
                📍
              </div>
            </div>
            <div className="mt-1 px-2 py-0.5 rounded bg-blue-900/90 border border-blue-600 text-blue-200 text-[10px] font-bold shadow-md whitespace-nowrap">
              {markers[0]?.roadName || 'Reported Hazard Location'}
            </div>
          </div>

          {/* Plotted Accidents on Radar (Red) */}
          {validAccidents.map((ev, i) => {
            const dist = ev.distanceKm ?? 10 + ((i * 18) % 80);
            const angle = (i * 73 + 25) * (Math.PI / 180);
            const radiusPercent = (dist / 100) * 40;
            const posX = 50 + radiusPercent * Math.cos(angle);
            const posY = 50 + radiusPercent * Math.sin(angle);

            return (
              <div
                key={ev.id || i}
                onClick={() => setActiveAccident(ev)}
                style={{ left: `${posX}%`, top: `${posY}%` }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white shadow-md group-hover:scale-125 transition" />
                  <span className="absolute -bottom-4 bg-black/80 text-rose-300 font-mono text-[9px] px-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    {dist} km • {ev.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Map Control Buttons */}
      {showControls && (
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-lg shadow-sm border border-slate-700 p-1 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setViewMode(v => (v === 'map' ? 'radius_radar' : 'map'))}
              title={viewMode === 'map' ? 'Switch to 100km Radar View' : 'Switch to Interactive Map'}
              className={`p-1.5 rounded transition ${
                viewMode === 'radius_radar'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Radio className="w-4 h-4" />
            </button>
          </div>

          <a
            href={openStreetMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in OpenStreetMap"
            className="p-2 bg-slate-900/90 backdrop-blur-md text-slate-300 hover:text-blue-400 rounded-lg shadow-sm border border-slate-700 flex items-center justify-center transition"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Selected Accident Floating Detail Drawer */}
      {activeAccident && (
        <div className="absolute top-14 left-3 right-3 sm:right-auto sm:max-w-md z-30 bg-slate-900/95 backdrop-blur-md border border-rose-500/40 rounded-xl p-3.5 shadow-2xl text-white animate-in fade-in duration-150">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>
                Accident Precedent • {activeAccident.distanceKm ? `${activeAccident.distanceKm} km away` : '100 km Radius'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveAccident(null)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
          <h5 className="text-xs font-semibold mt-1 text-slate-100 line-clamp-2 leading-snug">
            {activeAccident.title}
          </h5>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
            <span>Date: {activeAccident.date || 'Recent archive'}</span>
            <span>•</span>
            <span>Source: {activeAccident.source}</span>
          </div>
          {activeAccident.snippet && (
            <p className="text-[11px] text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
              {activeAccident.snippet}
            </p>
          )}
        </div>
      )}

      {/* Bottom HUD: Coordinates & Radius Indicator */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-sm text-xs font-mono text-slate-300">
        <Navigation className="w-3.5 h-3.5 text-blue-400" />
        <span>{activeLat.toFixed(5)}°N, {activeLng.toFixed(5)}°E</span>
        <span className="text-slate-600">|</span>
        <span className="font-sans font-medium text-slate-300 truncate max-w-[180px]">
          {markers[0]?.roadName || 'Road Location'}
        </span>
        {validAccidents.length > 0 && (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-semibold font-sans">
              {validAccidents.length} precedent(s) &le;100km
            </span>
          </>
        )}
      </div>

      {/* Multiple Markers Mini Drawer */}
      {markers.length > 1 && (
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-sm text-xs text-white">
          <span className="text-slate-400 font-medium">Cases:</span>
          {markers.slice(0, 4).map(m => {
            const pColor = priorityColors[m.priority];
            const isSelected = m.id === selectedMarkerId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onMarkerClick?.(m)}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold transition ${
                  isSelected
                    ? 'ring-2 ring-blue-500 bg-blue-900/80 text-blue-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${pColor.bg}`} />
                <span>{m.id.replace('KZ-2026-', '#')}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MapView;
