/**
 * Geographic Distance Utilities for KIZUNA (Open Mapping Stack).
 * Pure local calculation using the Haversine formula (no external API calls).
 */

export const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the great-circle distance between two GPS coordinates in kilometers.
 * Uses the Haversine formula:
 *   a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
 *   c = 2 * atan2(√a, √(1−a))
 *   d = R * c
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  // Round to 1 decimal place (e.g., 14.2 km)
  return Math.round(distance * 10) / 10;
}

/**
 * Checks if a target coordinate is within a given radius in kilometers.
 */
export function isWithinRadiusKm(
  originLat: number,
  originLon: number,
  targetLat: number,
  targetLon: number,
  radiusKm: number = 100
): boolean {
  return calculateDistanceKm(originLat, originLon, targetLat, targetLon) <= radiusKm;
}

/**
 * Computes bounding box coordinates for a given center point and radius in km.
 * Useful for spatial pre-filtering.
 */
export function getBoundingBox(
  lat: number,
  lon: number,
  radiusKm: number = 100
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const dLat = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const dLon = (radiusKm / (EARTH_RADIUS_KM * Math.cos(toRadians(lat)))) * (180 / Math.PI);

  return {
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLon: lon - dLon,
    maxLon: lon + dLon,
  };
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
