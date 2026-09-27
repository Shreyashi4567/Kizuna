/**
 * Incident Location Geocoding Engine.
 * Resolves extracted location text to real coordinates using the open geocoding abstraction.
 * Strictly adheres to rule: If location cannot be reliably geocoded, mark locationConfidence="low"
 * and NEVER invent coordinates.
 */

import { ExtractedIncident } from './incident-extraction';
import { forwardGeocode } from '@/lib/geo/geocoding';

export interface GeocodedIncident extends ExtractedIncident {
  latitude?: number;
  longitude?: number;
  resolvedAddress?: string;
}

/**
 * Geocodes a list of extracted incidents using the provider-agnostic geocoder.
 */
export async function geocodeIncidents(
  incidents: ExtractedIncident[],
  context: { district?: string; state?: string }
): Promise<GeocodedIncident[]> {
  const { district = '', state = '' } = context;

  const results: GeocodedIncident[] = [];

  for (const inc of incidents) {
    if (!inc.locationText || inc.locationConfidence === 'low') {
      results.push({
        ...inc,
        locationConfidence: 'low',
        latitude: undefined,
        longitude: undefined,
      });
      continue;
    }

    // Build specific query incorporating administrative context
    const specificQuery = [inc.locationText, district, state]
      .filter(Boolean)
      .join(', ');

    try {
      const geoResult = await forwardGeocode(specificQuery);

      if (geoResult && typeof geoResult.latitude === 'number' && typeof geoResult.longitude === 'number') {
        results.push({
          ...inc,
          latitude: geoResult.latitude,
          longitude: geoResult.longitude,
          resolvedAddress: geoResult.formattedAddress,
          locationConfidence: 'high',
        });
      } else {
        // Try fallback to just locationText if specific combined query failed
        const fallbackGeo = await forwardGeocode(inc.locationText);
        if (fallbackGeo && typeof fallbackGeo.latitude === 'number' && typeof fallbackGeo.longitude === 'number') {
          results.push({
            ...inc,
            latitude: fallbackGeo.latitude,
            longitude: fallbackGeo.longitude,
            resolvedAddress: fallbackGeo.formattedAddress,
            locationConfidence: 'medium',
          });
        } else {
          // Could not geocode reliably — NEVER invent coordinates
          results.push({
            ...inc,
            latitude: undefined,
            longitude: undefined,
            locationConfidence: 'low',
          });
        }
      }
    } catch (err) {
      console.warn(`Failed to geocode incident location "${inc.locationText}":`, err);
      results.push({
        ...inc,
        latitude: undefined,
        longitude: undefined,
        locationConfidence: 'low',
      });
    }
  }

  return results;
}
