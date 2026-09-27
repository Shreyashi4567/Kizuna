'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AccidentEvent } from '@/types';
import { DEFAULT_MAP_PROVIDER } from '@/lib/geo/map-provider';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle, Radio, ShieldAlert } from 'lucide-react';

export interface KizunaMapProps {
  center: [number, number];
  zoom?: number;
  userAccuracyMeters?: number;
  incidents?: AccidentEvent[];
  className?: string;
  showRadius?: boolean;
  selectedIncidentId?: string | null;
  onSelectIncident?: (incident: AccidentEvent | null) => void;
  height?: string;
}

export const KizunaMap: React.FC<KizunaMapProps> = ({
  center,
  zoom = 10,
  userAccuracyMeters,
  incidents = [],
  className = '',
  showRadius = true,
  selectedIncidentId = null,
  onSelectIncident,
  height = '440px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const [lat, lng] = center;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Clean up previous map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom,
        zoomControl: false,
        attributionControl: false,
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
        // Tile error notice
        console.warn('OpenStreetMap tile loading notice.');
      });

      // Layer group for dynamic markers and shapes
      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Invalidate size after layout settles
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      return () => {
        map.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      };
    } catch (err) {
      console.error('Failed to initialize Leaflet OpenStreetMap:', err);
      setTimeout(() => {
        setMapError('Map unavailable. Location and incident results are still available.');
      }, 0);
    }
  }, [lat, lng, zoom]);

  // Update Markers, 100km Radius Circle, and Popups
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. User Location Pin (Custom Blue Beacon)
    const userIcon = L.divIcon({
      className: 'kizuna-user-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: rgba(59, 130, 246, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 20px; height: 20px; border-radius: 9999px; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);"></div>
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
        <span style="color: #475569;">Reported GPS Location</span>
        <div style="margin-top: 4px; font-size: 11px; color: #64748b;">
          Lat: ${lat.toFixed(5)}<br/>Lng: ${lng.toFixed(5)}
          ${userAccuracyMeters ? `<br/><span style="color: #059669; font-weight: 600;">Accuracy: ±${userAccuracyMeters}m</span>` : ''}
        </div>
      </div>
    `);

    // 2. 100 KM Radius Circle (100,000 meters)
    if (showRadius) {
      const radiusCircle = L.circle([lat, lng], {
        radius: 100000, // 100 km in meters
        color: '#3b82f6',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#3b82f6',
        fillOpacity: 0.05,
      }).addTo(layerGroup);

      radiusCircle.bindTooltip('100 KM Incident Intelligence Perimeter', {
        permanent: false,
        direction: 'top',
        className: 'kizuna-radar-tooltip',
      });
    }

    // 3. Accident Markers (Strictly <= 100 km)
    const validIncidents = incidents.filter(
      inc => typeof inc.latitude === 'number' && typeof inc.longitude === 'number'
    );

    validIncidents.forEach(inc => {
      const isSelected = selectedIncidentId === inc.id;
      const isFatal = inc.severity === 'fatal' || (inc.casualties && inc.casualties > 0);

      const markerColor = isFatal ? '#e11d48' : '#d97706';
      const markerBorder = isSelected ? '#ffffff' : '#ffffff';

      const incidentIcon = L.divIcon({
        className: `kizuna-incident-pin-${inc.id}`,
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; cursor: pointer;">
            ${isSelected ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(225, 29, 72, 0.35); animation: pulse 1.5s infinite;"></div>` : ''}
            <div style="width: 22px; height: 22px; border-radius: 9999px; background: ${markerColor}; border: 2px solid ${markerBorder}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
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
        if (onSelectIncident) {
          onSelectIncident(inc);
        }
      });
    });

    // Auto-fit bounds to show user and incidents within the 100km radius
    if (validIncidents.length > 0) {
      const bounds = L.latLngBounds([[lat, lng]]);
      validIncidents.forEach(inc => {
        bounds.extend([inc.latitude!, inc.longitude!]);
      });
      // Pad bounds slightly
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [lat, lng, incidents, showRadius, userAccuracyMeters, selectedIncidentId, onSelectIncident]);

  if (mapError) {
    return (
      <div
        className={`w-full rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center ${className}`}
        style={{ height }}
      >
        <ShieldAlert className="w-8 h-8 text-amber-500 mb-2" />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Map View Notice
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md">
          {mapError}
        </p>
        <div className="mt-3 text-xs bg-white dark:bg-slate-900 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
          Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)} • {incidents.length} incident(s) cataloged
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Map Overlay Controls / HUD */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span>OpenStreetMap Live Ground Truth</span>
        </div>

        {showRadius && (
          <div className="bg-blue-50/90 dark:bg-blue-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900 text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>100 KM Active Perimeter</span>
          </div>
        )}
      </div>

      {/* Incident Count Badge */}
      <div className="absolute top-3 right-3 z-[400]">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>{incidents.length} verified within 100km</span>
        </div>
      </div>

      {/* Map Footer Attribution */}
      <div className="absolute bottom-1 left-2 z-[400] text-[10px] text-slate-500 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none">
        OpenStreetMap • Leaflet No-Billing Engine
      </div>
    </div>
  );
};

export default KizunaMap;
