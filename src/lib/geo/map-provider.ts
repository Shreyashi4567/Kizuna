/**
 * OpenStreetMap Tile and Layer Provider Configuration for KIZUNA.
 * Pure open mapping stack — no Google Cloud or billing dependencies.
 */

export interface MapProviderConfig {
  name: string;
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  minZoom: number;
  subdomains: string[];
}

export const OPEN_STREET_MAP_PROVIDER: MapProviderConfig = {
  name: 'OpenStreetMap Standard',
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  maxZoom: 19,
  minZoom: 4,
  subdomains: ['a', 'b', 'c'],
};

export const OSM_HOT_PROVIDER: MapProviderConfig = {
  name: 'Humanitarian OSM (High Contrast)',
  tileUrl: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by Humanitarian OpenStreetMap Team',
  maxZoom: 19,
  minZoom: 4,
  subdomains: ['a', 'b', 'c'],
};

export const DEFAULT_MAP_PROVIDER = OPEN_STREET_MAP_PROVIDER;
