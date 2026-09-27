'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AccidentEvent, PriorityLevel } from '@/types';
import { DEFAULT_MAP_PROVIDER } from '@/lib/geo/map-provider';
import L from 'leaflet';
import { AlertTriangle, Radio, ShieldAlert } from 'lucide-react';

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

export interface KizunaMapProps {
  center: [number, number];
  zoom?: number;
  userAccuracyMeters?: number;
  markers?: MapMarker[];
  incidents?: AccidentEvent[];
  className?: string;
  showRadius?: boolean;
  selectedMarkerId?: string | null;
  onMarkerClick?: (marker: MapMarker) => void;
  selectedIncidentId?: string | null;
  onSelectIncident?: (incident: AccidentEvent | null) => void;
  height?: string;
}

const PRIORITY_PIN_COLORS: Record<PriorityLevel, { bg: string; text: string }> = {
  CRITICAL: { bg: '#e11d48', text: '#ffffff' }, // Rose-600
  HIGH: { bg: '#d97706', text: '#ffffff' },     // Amber-600
  MEDIUM: { bg: '#0284c7', text: '#ffffff' },   // Sky-600
  LOW: { bg: '#64748b', text: '#ffffff' },      // Slate-500
};

export const KizunaMap: React.FC<KizunaMapProps> = ({
  center,
  zoom = 12,
  userAccuracyMeters,
  markers = [],
  incidents = [],
  className = '',
  showRadius = true,
  selectedMarkerId = null,
  onMarkerClick,
  selectedIncidentId = null,
  onSelectIncident,
  height = '100%',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const [lat, lng] = center;

  // 1. Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Guard against multiple initializations on the same DOM element
    if (mapInstanceRef.current) return;
    if ((container as unknown as { _leaflet_id?: number })._leaflet_id) {
      delete (container as unknown as { _leaflet_id?: number })._leaflet_id;
    }

    let map: L.Map | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const timers: NodeJS.Timeout[] = [];

    try {
      map = L.map(container, {
        center: [lat, lng],
        zoom,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
        zoomAnimation: true,
      });

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add OpenStreetMap Tile Layer
      const tileLayer = L.tileLayer(DEFAULT_MAP_PROVIDER.tileUrl, {
        attribution: DEFAULT_MAP_PROVIDER.attribution,
        maxZoom: DEFAULT_MAP_PROVIDER.maxZoom,
        minZoom: DEFAULT_MAP_PROVIDER.minZoom,
        subdomains: DEFAULT_MAP_PROVIDER.subdomains,
      }).addTo(map);

      tileLayer.on('tileerror', () => {
        console.warn('OpenStreetMap tile notice: fallback active.');
      });

      // Layer group for dynamic markers and 100km radius circle
      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Robust ResizeObserver: Invalidate size immediately when container dimensions change
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            requestAnimationFrame(() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize({ pan: false });
              }
            });
          }
        }
      });
      resizeObserver.observe(container);

      // Ensure layout invalidation across initial animation and layout frames
      requestAnimationFrame(() => {
        map?.invalidateSize({ pan: false });
      });

      timers.push(setTimeout(() => map?.invalidateSize({ pan: false }), 100));
      timers.push(setTimeout(() => map?.invalidateSize({ pan: false }), 300));
      timers.push(setTimeout(() => map?.invalidateSize({ pan: false }), 600));
      timers.push(setTimeout(() => map?.invalidateSize({ pan: false }), 1200));

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ pan: false });
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      const handleWindowResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ pan: false });
        }
      };
      window.addEventListener('resize', handleWindowResize);

      return () => {
        timers.forEach(clearTimeout);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('resize', handleWindowResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
          resizeObserver = null;
        }
        if (map) {
          map.remove();
          mapInstanceRef.current = null;
          layerGroupRef.current = null;
        }
      };
    } catch (err) {
      console.error('Failed to initialize Leaflet OpenStreetMap:', err);
      setTimeout(() => {
        setMapError('Map canvas temporarily unavailable. Location data remains active.');
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE on mount

  // 2. Pan / Zoom view gracefully when center or zoom changes (without rebuilding map)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      const cur = map.getCenter();
      if (Math.abs(cur.lat - lat) > 0.0001 || Math.abs(cur.lng - lng) > 0.0001) {
        map.setView([lat, lng], zoom, { animate: true });
      }
    } catch {
      // Safe fallback
    }
  }, [lat, lng, zoom]);

  // 3. Render Markers, 100km Radius Boundary, and Precedents
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 3.1 100 KM Radius Boundary
    if (showRadius) {
      const radiusCircle = L.circle([lat, lng], {
        radius: 100000, // 100 km in meters
        color: '#38bdf8', // sky-400
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#0284c7',
        fillOpacity: 0.05,
      }).addTo(layerGroup);

      radiusCircle.bindTooltip('100 KM Statutory Incident Intelligence Perimeter', {
        permanent: false,
        direction: 'top',
        className: 'kizuna-radar-tooltip',
      });
    }

    // 3.2 Plotted Case Markers (if provided)
    if (markers.length > 0) {
      markers.forEach(m => {
        const isSelected = selectedMarkerId === m.id;
        const colorConfig = PRIORITY_PIN_COLORS[m.priority] || PRIORITY_PIN_COLORS.MEDIUM;

        const pinIcon = L.divIcon({
          className: `kizuna-case-pin-${m.id}`,
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; cursor: pointer;">
              ${isSelected ? `<div style="position: absolute; width: 38px; height: 38px; border-radius: 9999px; background: rgba(59, 130, 246, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
              <div style="position: absolute; width: 22px; height: 22px; border-radius: 9999px; background: ${colorConfig.bg}; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: ${colorConfig.text}; font-size: 10px; font-weight: 800;">
                📍
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([m.latitude, m.longitude], { icon: pinIcon, zIndexOffset: isSelected ? 1000 : 500 }).addTo(layerGroup);

        const popupHtml = `
          <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 3px; max-width: 220px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 3px;">
              <span style="font-family: monospace; font-weight: 700; color: #0f172a; font-size: 11px;">${m.id}</span>
              <span style="background: ${colorConfig.bg}; color: #ffffff; font-size: 9px; font-weight: 700; padding: 1.5px 5px; border-radius: 4px; text-transform: uppercase;">
                ${m.priority}
              </span>
            </div>
            <strong style="color: #0f172a; font-size: 12px; display: block; margin-bottom: 2px;">${m.roadName}</strong>
            ${m.locality ? `<div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">${m.locality}</div>` : ''}
            ${m.status ? `<div style="color: #2563eb; font-size: 10px; font-weight: 600; text-transform: uppercase;">Status: ${m.status.replace('_', ' ')}</div>` : ''}
          </div>
        `;
        marker.bindPopup(popupHtml);

        marker.on('click', () => {
          onMarkerClick?.(m);
        });
      });
    } else {
      // 3.3 Default User Location Beacon (Blue Pin)
      const userIcon = L.divIcon({
        className: 'kizuna-user-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: rgba(59, 130, 246, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 20px; height: 20px; border-radius: 9999px; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25);"></div>
            <div style="position: absolute; width: 6px; height: 6px; border-radius: 9999px; background: #ffffff;"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(layerGroup);
      userMarker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 2px;">
          <strong style="color: #1e3a8a; font-size: 13px; display: block; margin-bottom: 2px;">📍 Citizen Hazard Report</strong>
          <span style="color: #475569;">GPS Coordinates: ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E</span>
          ${userAccuracyMeters ? `<div style="color: #059669; font-weight: 600; font-size: 10px; margin-top: 2px;">Accuracy: ±${userAccuracyMeters}m</div>` : ''}
        </div>
      `);
    }

    // 3.4 Accident Precedents (<= 100km)
    const validIncidents = incidents.filter(
      inc => typeof inc.latitude === 'number' && typeof inc.longitude === 'number'
    );

    validIncidents.forEach(inc => {
      const isSelected = selectedIncidentId === inc.id;
      const isFatal = inc.severity === 'fatal' || (inc.casualties && inc.casualties > 0);
      const markerColor = isFatal ? '#e11d48' : '#d97706';

      const incidentIcon = L.divIcon({
        className: `kizuna-incident-pin-${inc.id}`,
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; cursor: pointer;">
            ${isSelected ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(225, 29, 72, 0.35); animation: pulse 1.5s infinite;"></div>` : ''}
            <div style="width: 20px; height: 20px; border-radius: 9999px; background: ${markerColor}; border: 2px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 800;">
              !
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([inc.latitude!, inc.longitude!], { icon: incidentIcon }).addTo(layerGroup);

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; max-width: 240px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="background: ${isFatal ? '#ffe4e6' : '#fef3c7'}; color: ${isFatal ? '#9f1239' : '#92400e'}; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${inc.severity || 'INCIDENT'}
            </span>
            ${inc.distanceKm !== undefined ? `<span style="color: #2563eb; font-weight: 700; font-size: 11px;">📍 ${inc.distanceKm} km away</span>` : ''}
          </div>
          <strong style="color: #0f172a; font-size: 12px; display: block; margin-bottom: 4px; line-height: 1.3;">
            ${inc.title || 'Public Accident Report'}
          </strong>
          <div style="color: #475569; font-size: 11px; margin-bottom: 4px;">
            <strong>Location:</strong> ${inc.location || 'Reported corridor'}
          </div>
          ${inc.date ? `<div style="color: #64748b; font-size: 10px; margin-bottom: 4px;">📅 Date: ${inc.date}</div>` : ''}
          ${inc.casualties ? `<div style="color: #dc2626; font-size: 11px; font-weight: 600; margin-bottom: 4px;">⚠️ ${inc.casualties} Reported Casualty/Injury</div>` : ''}
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
            <span>Source: ${inc.source || 'Public News'}</span>
            ${inc.url && inc.url !== '#' ? `<a href="${inc.url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">Article</a>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectIncident?.(inc);
      });
    });

    // 3.5 Auto-fit bounds if multiple markers or incidents are present
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else if (validIncidents.length > 0) {
      const bounds = L.latLngBounds([[lat, lng]]);
      validIncidents.forEach(inc => {
        bounds.extend([inc.latitude!, inc.longitude!]);
      });
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }

    // Force size recomputation after adding layers
    requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
    });
  }, [lat, lng, markers, incidents, showRadius, userAccuracyMeters, selectedMarkerId, onMarkerClick, selectedIncidentId, onSelectIncident]);

  if (mapError) {
    return (
      <div
        className={`w-full h-full min-h-full rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-300 ${className}`}
        style={{ height: '100%', minHeight: '100%' }}
      >
        <ShieldAlert className="w-8 h-8 text-amber-500 mb-2" />
        <h4 className="text-sm font-semibold text-white">Map View Notice</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md">{mapError}</p>
        <div className="mt-3 text-xs bg-slate-800 px-3 py-1.5 rounded border border-slate-700 font-mono text-slate-300">
          Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full min-h-full overflow-hidden ${className}`}
      style={{ height, minHeight: '100%', width: '100%' }}
    >
      {/* Actual Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-full"
        style={{ height: '100%', minHeight: '100%', width: '100%' }}
      />

      {/* Map Overlay Controls / HUD */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-md text-xs font-medium text-white flex items-center gap-2 pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span>OpenStreetMap Live Ground Truth</span>
        </div>

        {showRadius && (
          <div className="bg-sky-950/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-sky-800 text-[11px] font-semibold text-sky-300 flex items-center gap-1.5 pointer-events-auto">
            <Radio className="w-3 h-3 text-sky-400" />
            <span>100 KM Active Perimeter</span>
          </div>
        )}
      </div>

      {/* Incident / Markers Count Badge */}
      <div className="absolute top-3 right-12 z-[400] pointer-events-none">
        {incidents.length > 0 && (
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-rose-900/80 shadow-md text-xs font-semibold text-rose-300 flex items-center gap-1.5 pointer-events-auto">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>{incidents.length} precedent(s)</span>
          </div>
        )}
      </div>

      {/* Map Footer Attribution */}
      <div className="absolute bottom-1 left-2 z-[400] text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none">
        OpenStreetMap • Leaflet No-Billing Engine
      </div>
    </div>
  );
};

export default KizunaMap;
