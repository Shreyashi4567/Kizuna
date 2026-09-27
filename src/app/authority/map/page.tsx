'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RoadCase } from '@/types';
import { MapView, MapMarker } from '@/components/MapView';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import {
  MapPin,
  ExternalLink,
  Landmark,
  Inbox,
  PlusCircle,
} from 'lucide-react';

export default function AuthorityGisMapPage() {
  const [cases, setCases] = useState<RoadCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<RoadCase | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/cases')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.cases)) {
          setCases(data.cases);
          if (data.cases.length > 0) {
            setSelectedCase(data.cases[0]);
          }
        }
      })
      .catch(err => console.warn('GIS cases fetch notice:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredCases = cases.filter(c => {
    if (priorityFilter === 'ALL') return true;
    return c.priorityAssessment.priority.toLowerCase() === priorityFilter.toLowerCase();
  });

  const markers: MapMarker[] = filteredCases.map(c => ({
    id: c.id,
    latitude: c.location.latitude,
    longitude: c.location.longitude,
    title: c.location.roadName,
    roadName: c.location.roadName,
    locality: c.location.locality,
    priority: c.priorityAssessment.priority,
    status: c.status,
    hazardType: c.hazardAnalysis.hazardType,
  }));

  const handleMarkerClick = (m: MapMarker) => {
    const match = cases.find(c => c.id === m.id);
    if (match) setSelectedCase(match);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Landmark className="w-4 h-4" /> Authority GIS Command
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Territorial Hazard &amp; Hotspot GIS Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Geospatial visualization of road conditions color-coded by AI priority assessment across corridors with 100 km radius intelligence.
          </p>
        </div>

        {/* Priority Filter Toolbar */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-xs text-xs">
          <button
            type="button"
            onClick={() => setPriorityFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              priorityFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All ({cases.length})
          </button>
          <button
            type="button"
            onClick={() => setPriorityFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              priorityFilter === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            Critical
          </button>
          <button
            type="button"
            onClick={() => setPriorityFilter('HIGH')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              priorityFilter === 'HIGH'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
            }`}
          >
            High
          </button>
          <button
            type="button"
            onClick={() => setPriorityFilter('MEDIUM')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              priorityFilter === 'MEDIUM'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-sky-600'
            }`}
          >
            Medium
          </button>
        </div>
      </div>

      {/* Main Map + Inspector Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View with 100km radius and accident markers */}
        <div className="lg:col-span-2 space-y-3">
          <MapView
            markers={markers}
            centerLat={selectedCase ? selectedCase.location.latitude : 21.2514}
            centerLng={selectedCase ? selectedCase.location.longitude : 81.6296}
            accidentEvents={selectedCase?.accidentIntelligence?.events}
            show100KmRadius={true}
            zoom={13}
            height="560px"
            selectedMarkerId={selectedCase?.id}
            onMarkerClick={handleMarkerClick}
          />
        </div>

        {/* Selected Incident Quick Inspector Drawer */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          {loading ? (
            <div className="py-24 text-center text-xs text-slate-400 animate-pulse">
              Loading GIS cases from Supabase...
            </div>
          ) : selectedCase ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-1 pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {selectedCase.id}
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={selectedCase.status} size="sm" />
                  <PriorityBadge priority={selectedCase.priorityAssessment.priority} size="sm" />
                </div>
              </div>

              {/* Photo */}
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedCase.imageUrl}
                  alt={selectedCase.location.roadName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedCase.location.roadName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedCase.location.locality}, {selectedCase.location.district}</span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hazard Type:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {selectedCase.hazardAnalysis.hazardType.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Responsible Dept:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                    {selectedCase.authorityRouting.authorityName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Accident Records (100km):</span>
                  <span className="font-semibold text-rose-600">
                    {selectedCase.accidentIntelligence.highRelevanceCount} verified precedents
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {selectedCase.hazardAnalysis.description}
              </p>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <Link
                  href={`/authority/cases/${selectedCase.id}`}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <span>Open Full Operational Docket</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No active hazard pins on map
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Reports submitted by citizens will appear here as geospatial pins with 100km radius intelligence.
              </p>
              <Link
                href="/citizen/report"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Report</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
