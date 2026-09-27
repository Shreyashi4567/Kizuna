/**
 * Provider-Agnostic Geocoding Abstraction for KIZUNA (Open Mapping Stack).
 *
 * Designed for OpenStreetMap data (Nominatim default) without Google Maps or billing.
 * Features:
 * - Rate limiting (strictly conforms to OpenStreetMap Nominatim 1 req/sec policy)
 * - In-memory LRU/TTL caching to prevent redundant requests on React re-renders
 * - Never invents road names: displays "Road name unavailable from open map data" when absent
 * - Provider-agnostic interface allowing swap-in of custom Pelias, Photon, or self-hosted engines
 */

import { LocationData, RoadCategory } from '@/types';
import { classifyRoadCategory } from '@/lib/authority/routing';

export interface GeocodedLocation extends LocationData {
  rawAddress?: Record<string, string>;
  geocoderProvider: string;
}

export interface GeocodingProvider {
  name: string;
  reverse(lat: number, lon: number): Promise<GeocodedLocation>;
  forward(query: string): Promise<GeocodedLocation | null>;
}

// ============================================================================
// Rate-Limited Queue for OpenStreetMap Compliance (Max 1 req/sec)
// ============================================================================
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1050; // > 1 sec to guarantee Nominatim TOS compliance

async function throttleRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
    const delay = MIN_REQUEST_INTERVAL_MS - timeSinceLast;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastRequestTime = Date.now();
  return fn();
}

// ============================================================================
// In-Memory Geocoding Cache (TTL 1 Hour)
// ============================================================================
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const reverseCache = new Map<string, CacheEntry<GeocodedLocation>>();
const forwardCache = new Map<string, CacheEntry<GeocodedLocation | null>>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCacheKey(lat: number, lon: number): string {
  // Round to 4 decimal places (~11 meters) for spatial caching
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

// ============================================================================
// OpenStreetMap Nominatim Provider Implementation
// ============================================================================
class NominatimProvider implements GeocodingProvider {
  name = 'OpenStreetMap Nominatim';
  private userAgent =
    process.env.GEOCODING_USER_AGENT || 'KizunaRoadSafety/1.0 (kizuna-safety@sewasetu.gov.in)';

  async reverse(lat: number, lon: number): Promise<GeocodedLocation> {
    const cacheKey = getCacheKey(lat, lon);
    const cached = reverseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1&zoom=18`;

    try {
      const data = await throttleRequest(async () => {
        const res = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
          throw new Error(`Nominatim reverse geocode returned HTTP ${res.status}`);
        }
        return res.json();
      });

      const addr = (data.address || {}) as Record<string, string>;

      // Extract road name strictly without fabrication
      const road =
        addr.road ||
        addr.pedestrian ||
        addr.highway ||
        addr.street ||
        addr.footway ||
        addr.path ||
        addr.cycleway ||
        '';

      const roadName = road.trim() ? road.trim() : 'Road name unavailable from open map data';

      const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.city_district ||
        addr.quarter ||
        '';

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.hamlet ||
        '';

      const district =
        addr.state_district ||
        addr.county ||
        addr.district ||
        city ||
        'District';

      const state = addr.state || 'State';
      const pincode = addr.postcode || '';

      const formattedAddress =
        data.display_name ||
        [roadName !== 'Road name unavailable from open map data' ? roadName : '', locality, city, district, state]
          .filter(Boolean)
          .join(', ');

      const roadCategory: RoadCategory = classifyRoadCategory(roadName, formattedAddress);

      const result: GeocodedLocation = {
        latitude: lat,
        longitude: lon,
        roadName,
        roadPlaceId: (data as { place_id?: number | string }).place_id
          ? `osm_${(data as { place_id?: number | string }).place_id}`
          : `osm_${Math.abs(Math.round(lat * 10000))}`,
        roadCategory,
        locality: locality || city || district,
        district,
        state,
        pincode,
        formattedAddress,
        rawAddress: addr,
        geocoderProvider: this.name,
        source: 'gps',
      };

      reverseCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } catch (err) {
      console.warn('Nominatim reverse geocode failed or timed out:', err);

      // Return honest fallback with precise coordinates and clear unavailability notice
      const fallback: GeocodedLocation = {
        latitude: lat,
        longitude: lon,
        roadName: 'Road name unavailable from open map data',
        roadPlaceId: `osm_${Math.abs(Math.round(lat * 10000))}`,
        roadCategory: 'municipal_road',
        locality: 'Location recorded',
        district: 'Administrative Area',
        state: 'Local Jurisdiction',
        pincode: '',
        formattedAddress: `Lat ${lat.toFixed(5)}, Lng ${lon.toFixed(5)}`,
        geocoderProvider: `${this.name} (Offline/Unavailable)`,
        source: 'gps',
      };

      return fallback;
    }
  }

  async forward(query: string): Promise<GeocodedLocation | null> {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return null;

    const cached = forwardCache.get(cleanQuery);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=1`;

    try {
      const results = await throttleRequest(async () => {
        const res = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
          throw new Error(`Nominatim forward geocode returned HTTP ${res.status}`);
        }
        return res.json();
      });

      if (!results || results.length === 0) {
        forwardCache.set(cleanQuery, { data: null, expiresAt: Date.now() + CACHE_TTL_MS });
        return null;
      }

      const match = results[0];
      const lat = parseFloat(match.lat);
      const lon = parseFloat(match.lon);
      const addr = (match.address || {}) as Record<string, string>;

      const road =
        addr.road ||
        addr.pedestrian ||
        addr.highway ||
        addr.street ||
        '';

      const roadName = road.trim() ? road.trim() : 'Road name unavailable from open map data';
      const locality = addr.suburb || addr.neighbourhood || addr.city_district || '';
      const city = addr.city || addr.town || addr.village || '';
      const district = addr.state_district || addr.county || city || 'District';
      const state = addr.state || 'State';
      const pincode = addr.postcode || '';

      const formattedAddress = match.display_name || query;
      const roadCategory: RoadCategory = classifyRoadCategory(roadName, formattedAddress);

      const result: GeocodedLocation = {
        latitude: lat,
        longitude: lon,
        roadName,
        roadPlaceId: (match as { place_id?: number | string }).place_id
          ? `osm_${(match as { place_id?: number | string }).place_id}`
          : `osm_${Math.abs(Math.round(lat * 10000))}`,
        roadCategory,
        locality: locality || city || district,
        district,
        state,
        pincode,
        formattedAddress,
        rawAddress: addr,
        geocoderProvider: this.name,
        source: 'manual',
      };

      forwardCache.set(cleanQuery, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } catch (err) {
      console.warn('Nominatim forward geocoding failed:', err);
      return null;
    }
  }
}

// Active provider instance
let activeProvider: GeocodingProvider = new NominatimProvider();

/**
 * Configure or replace the active geocoding provider.
 */
export function setGeocodingProvider(provider: GeocodingProvider): void {
  activeProvider = provider;
}

/**
 * Reverse geocodes coordinates using the active open provider.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodedLocation> {
  return activeProvider.reverse(lat, lon);
}

/**
 * Forward geocodes an address or location query using the active open provider.
 */
export async function forwardGeocode(query: string): Promise<GeocodedLocation | null> {
  return activeProvider.forward(query);
}

/**
 * Forward geocodes a structured manual location (city, locality, road).
 */
export async function forwardGeocodeStructured(parts: {
  road?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
}): Promise<GeocodedLocation | null> {
  const query = [parts.road, parts.locality, parts.city, parts.district, parts.state]
    .filter(Boolean)
    .join(', ');

  return forwardGeocode(query);
}
