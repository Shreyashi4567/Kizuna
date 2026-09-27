/**
 * 100 KM Haversine Distance Filtering for Incidents.
 * Computes exact ground-truth distance from the user's real GPS coordinates.
 * Excludes any incidents > 100 km or lacking verified coordinates.
 */

import { GeocodedIncident } from './incident-geocoding';
import { calculateDistanceKm } from '@/lib/geo/distance';
import { AccidentEvent, AccidentRelevance } from '@/types';

export interface RadiusFilterResult {
  within100KmEvents: AccidentEvent[];
  excludedCount: number;
  unmappedCount: number;
  totalFound: number;
}

/**
 * Filters and ranks incidents strictly based on the 100 km Haversine perimeter.
 */
export function filterIncidentsByRadius(
  incidents: GeocodedIncident[],
  userCoordinates?: { latitude: number; longitude: number }
): RadiusFilterResult {
  const totalFound = incidents.length;
  let excludedCount = 0;
  let unmappedCount = 0;

  const validEvents: AccidentEvent[] = [];

  for (let i = 0; i < incidents.length; i++) {
    const inc = incidents[i];

    // If coordinates are missing or confidence is low, exclude from map radius
    if (
      typeof inc.latitude !== 'number' ||
      typeof inc.longitude !== 'number' ||
      inc.locationConfidence === 'low'
    ) {
      unmappedCount++;
      continue;
    }

    let distanceKm: number | undefined;

    if (userCoordinates) {
      distanceKm = calculateDistanceKm(
        userCoordinates.latitude,
        userCoordinates.longitude,
        inc.latitude,
        inc.longitude
      );

      // Strict 100 km cutoff
      if (distanceKm > 100) {
        excludedCount++;
        continue;
      }
    }

    validEvents.push({
      id: `acc-${Date.now()}-${i}`,
      date: inc.date,
      dateConfidence: inc.dateConfidence,
      location: inc.locationText,
      eventType: inc.eventType,
      severity: inc.severity,
      casualties: inc.casualties,
      source: inc.source,
      url: inc.url,
      title: inc.title,
      snippet: inc.snippet,
      relevance: inc.relevance,
      relevanceReason: inc.relevanceReason,
      latitude: inc.latitude,
      longitude: inc.longitude,
      distanceKm,
    });
  }

  // Sort by:
  // 1. Proximity (closest distance first)
  // 2. Relevance (HIGH > MEDIUM > LOW)
  // 3. Casualties / Severity
  validEvents.sort((a, b) => {
    if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
    }

    const relOrder: Record<AccidentRelevance, number> = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
      NOT_RELEVANT: 0,
    };
    const relDiff = (relOrder[b.relevance] || 0) - (relOrder[a.relevance] || 0);
    if (relDiff !== 0) return relDiff;

    return (b.casualties || 0) - (a.casualties || 0);
  });

  return {
    within100KmEvents: validEvents,
    excludedCount,
    unmappedCount,
    totalFound,
  };
}
