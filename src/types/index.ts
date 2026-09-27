export type HazardType =
  | 'pothole'
  | 'road_surface_damage'
  | 'cracked_road'
  | 'damaged_divider'
  | 'broken_streetlight'
  | 'damaged_traffic_sign'
  | 'fallen_obstruction'
  | 'waterlogging'
  | 'exposed_drainage'
  | 'debris'
  | 'damaged_barrier'
  | 'none'
  | 'unclear'
  | 'other';

export type HazardSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface HazardAnalysis {
  hazardType: HazardType | string;
  severity: HazardSeverity;
  confidence: number;
  description: string;
  requiresAttention: boolean;
  visibleRoadClues: string[];
  additionalHazards: string[];
}

export type RoadCategory =
  | 'national_highway'
  | 'state_highway'
  | 'municipal_road'
  | 'rural_road'
  | 'district_road'
  | 'village_internal_road'
  | 'other';

export interface LocationData {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  locality: string;
  district: string;
  state: string;
  roadName: string;
  roadPlaceId: string;
  roadCategory?: RoadCategory;
  pincode?: string;
  gpsAccuracy?: number;
  source?: 'gps' | 'manual' | 'preset';
}

export type AccidentEventType =
  | 'collision'
  | 'crash'
  | 'pedestrian_accident'
  | 'vehicle_accident'
  | 'overturning'
  | 'fatal_accident'
  | 'injury_accident'
  | 'unknown';

export type AccidentRelevance = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_RELEVANT';

export interface AccidentEvent {
  id?: string;
  date: string | null;
  location: string;
  eventType: AccidentEventType;
  severity: 'minor' | 'moderate' | 'serious' | 'fatal' | 'unknown';
  source: string;
  url: string;
  title: string;
  snippet?: string;
  relevance: AccidentRelevance;
  relevanceReason?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  casualties?: number;
  dateConfidence?: 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
}

export interface AuthorityRecord {
  id: string;
  authorityName: string;
  department: string;
  level: 'Central' | 'State' | 'District' | 'Municipal' | 'Panchayat';
  state: string;
  district: string;
  jurisdiction: string;
  roadCategories: RoadCategory[];
  contactEmail: string;
  portalUserId: string;
  escalationAuthority?: string;
  active: boolean;
  isDemo: boolean;
}

export interface AuthorityRoutingResult {
  authorityId: string;
  authorityName: string;
  department: string;
  jurisdiction: string;
  routingConfidence: number;
  reason: string;
  escalationAuthority?: string;
  isDemo: boolean;
}

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PriorityAssessment {
  priority: PriorityLevel;
  factors: string[];
  confidence: number;
  explanation: string;
}

export type CaseStatus =
  | 'REPORTED'
  | 'AI_ANALYZED'
  | 'AUTHORITY_IDENTIFIED'
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED';

export interface CaseTimelineEntry {
  id: string;
  status: CaseStatus;
  title: string;
  comment: string;
  timestamp: string;
  actor: string;
  actorRole: 'CITIZEN' | 'SYSTEM_AI' | 'AUTHORITY';
}

export interface ResolutionVerification {
  hazardBefore: string;
  hazardVisibleAfter: boolean;
  visualResolutionConfidence: number;
  explanation: string;
  verifiedAt: string;
  afterImageUrl?: string;
}

export interface RoadCase {
  id: string; // e.g. KZ-2026-00124 or KZ-DEMO-001
  citizenId: string;
  imageUrl: string;
  location: LocationData;
  hazardAnalysis: HazardAnalysis;
  accidentIntelligence: {
    events: AccidentEvent[];
    totalFound: number;
    highRelevanceCount: number;
    summary: string;
  };
  authorityRouting: AuthorityRoutingResult;
  priorityAssessment: PriorityAssessment;
  status: CaseStatus;
  citizenReportCount: number;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  assignedAt?: string;
  assignedOfficer?: {
    name: string;
    badgeId: string;
    division: string;
  };
  resolvedAt?: string;
  resolutionNotes?: string;
  resolutionEvidence?: {
    afterImageUrl: string;
    notes: string;
    verification?: ResolutionVerification;
  };
  timeline: CaseTimelineEntry[];
  isDemo?: boolean;
  realityMetadata?: {
    photoSource: 'USER_UPLOAD' | 'DEMO_SAMPLE';
    photoFileName?: string;
    locationSource: 'BROWSER_GPS' | 'MANUAL_COORDINATES' | 'PRESET_DEMO';
    gpsAccuracyMeters?: number;
    geocodingProvider: 'GOOGLE_ROADS_GEOCODING' | 'OPENSTREETMAP_NOMINATIM' | 'PRESET';
    accidentRadiusKm: number;
    accidentIntelligenceCount: number;
    authorityRoutingMethod: 'DETERMINISTIC_REGISTRY';
    persistenceBackend: 'SUPABASE_POSTGRESQL' | 'BROWSER_LOCALSTORAGE_RUNTIME';
  };
}

export interface InAppNotification {
  id: string;
  userId: string;
  userRole: 'citizen' | 'authority';
  caseId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'CASE_ASSIGNED' | 'CASE_ACKNOWLEDGED' | 'STATUS_CHANGED' | 'RESOLVED' | 'CRITICAL_ALERT';
}
