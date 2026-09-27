import { RoadCase, InAppNotification, CaseStatus, CaseTimelineEntry, ResolutionVerification } from '@/types';
import { isServerSupabaseConfigured } from './supabase/server';

// Pure runtime memory cache for active requests (starts completely empty, no fake/demo data)
let memoryCases: RoadCase[] = [];
let memoryNotifications: InAppNotification[] = [];

const STORAGE_KEY_CASES = 'kizuna_live_cases';
const STORAGE_KEY_NOTIFS = 'kizuna_live_notifications';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function loadFromLocalStorage(): void {
  if (!isBrowser()) return;
  try {
    const rawCases = localStorage.getItem(STORAGE_KEY_CASES);
    if (rawCases) {
      const parsed: RoadCase[] = JSON.parse(rawCases);
      // Filter out any legacy demo cases if present in browser storage
      memoryCases = parsed.filter(c => !c.id.startsWith('KZ-DEMO-'));
    }

    const rawNotifs = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (rawNotifs) {
      const parsedNotifs: InAppNotification[] = JSON.parse(rawNotifs);
      memoryNotifications = parsedNotifs.filter(n => !n.caseId.startsWith('KZ-DEMO-'));
    }
  } catch (err) {
    console.warn('Could not read from localStorage, using memory storage:', err);
  }
}

function syncToLocalStorage(): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(memoryCases));
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(memoryNotifications));
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }
}

export function getAllCases(): RoadCase[] {
  if (isBrowser()) {
    loadFromLocalStorage();
  }
  return memoryCases;
}

export function getCaseById(id: string): RoadCase | undefined {
  if (isBrowser()) {
    loadFromLocalStorage();
  }
  return memoryCases.find(c => c.id.toLowerCase() === id.toLowerCase());
}

/**
 * Async fetcher that queries Supabase PostgreSQL as primary source of truth.
 * Returns only real reports from Supabase.
 */
export async function fetchCasesAsync(filters?: {
  status?: string;
  priority?: string;
  authorityId?: string;
}): Promise<RoadCase[]> {
  try {
    const { fetchReportsFromSupabase } = await import('./supabase/reports');
    const supabaseReports = await fetchReportsFromSupabase(filters);

    if (supabaseReports !== null) {
      // Supabase is the source of truth
      memoryCases = supabaseReports;
      syncToLocalStorage();
      return memoryCases;
    }
  } catch (err) {
    console.warn('Supabase fetch notice, using fallback cache:', err);
  }

  let cases = getAllCases();
  if (filters?.status) {
    cases = cases.filter(c => c.status.toLowerCase() === filters.status!.toLowerCase());
  }
  if (filters?.priority) {
    cases = cases.filter(c => c.priorityAssessment.priority.toLowerCase() === filters.priority!.toLowerCase());
  }
  if (filters?.authorityId) {
    cases = cases.filter(c => c.authorityRouting.authorityId === filters.authorityId);
  }
  return cases;
}

/**
 * Async fetcher for a single case by ID from Supabase.
 */
export async function fetchCaseByIdAsync(id: string): Promise<RoadCase | undefined> {
  try {
    const { fetchReportByIdFromSupabase } = await import('./supabase/reports');
    const fromSupabase = await fetchReportByIdFromSupabase(id);
    if (fromSupabase) {
      const idx = memoryCases.findIndex(c => c.id.toLowerCase() === id.toLowerCase());
      if (idx !== -1) {
        memoryCases[idx] = fromSupabase;
      } else {
        memoryCases.unshift(fromSupabase);
      }
      syncToLocalStorage();
      return fromSupabase;
    }
  } catch (err) {
    console.warn(`Supabase fetch notice for case ${id}:`, err);
  }

  return getCaseById(id);
}

export function createCase(
  newCase: Omit<RoadCase, 'id' | 'createdAt' | 'updatedAt' | 'timeline'> & { id?: string }
): RoadCase {
  if (isBrowser()) {
    loadFromLocalStorage();
  }

  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const caseId = newCase.id || `KZ-${year}-${randomSuffix}`;
  const now = new Date().toISOString();

  const initialTimeline: CaseTimelineEntry[] = [
    {
      id: `tl-${Date.now()}-1`,
      status: 'REPORTED',
      title: 'Road Hazard Reported',
      comment: 'Citizen submitted photographic evidence with browser GPS coordinates.',
      timestamp: now,
      actor: 'Reporting Citizen',
      actorRole: 'CITIZEN',
    },
    {
      id: `tl-${Date.now()}-2`,
      status: 'AI_ANALYZED',
      title: 'Groq Vision Analysis Complete',
      comment: `Vision AI detected ${newCase.hazardAnalysis.severity} severity ${newCase.hazardAnalysis.hazardType.replace('_', ' ')}. Cross-referenced with news precedents within 100 km radius.`,
      timestamp: now,
      actor: 'Groq Vision AI',
      actorRole: 'SYSTEM_AI',
    },
    {
      id: `tl-${Date.now()}-3`,
      status: 'AUTHORITY_IDENTIFIED',
      title: 'Jurisdiction Mapped',
      comment: `Routed to ${newCase.authorityRouting.authorityName} (${newCase.authorityRouting.department}) based on ${newCase.location.roadCategory?.replace('_', ' ') || 'road'} statutory jurisdiction.`,
      timestamp: now,
      actor: 'Authority Routing Engine',
      actorRole: 'SYSTEM_AI',
    }
  ];

  const fullCase: RoadCase = {
    ...newCase,
    id: caseId,
    isDemo: false,
    createdAt: now,
    updatedAt: now,
    timeline: initialTimeline,
    realityMetadata: newCase.realityMetadata || {
      photoSource: 'USER_UPLOAD',
      locationSource: newCase.location.source === 'gps' ? 'BROWSER_GPS' : 'MANUAL_COORDINATES',
      gpsAccuracyMeters: newCase.location.gpsAccuracy,
      geocodingProvider: newCase.location.roadPlaceId?.startsWith('osm_') ? 'OPENSTREETMAP_NOMINATIM' : 'GOOGLE_ROADS_GEOCODING',
      accidentRadiusKm: 100,
      accidentIntelligenceCount: newCase.accidentIntelligence.events.length,
      authorityRoutingMethod: 'DETERMINISTIC_REGISTRY',
      persistenceBackend: isServerSupabaseConfigured ? 'SUPABASE_POSTGRESQL' : 'BROWSER_LOCALSTORAGE_RUNTIME',
    },
  };

  // Prepend live cases to the top
  memoryCases.unshift(fullCase);

  // In-app notifications
  const authNotification: InAppNotification = {
    id: `notif-${Date.now()}-auth`,
    userId: newCase.authorityRouting.authorityId,
    userRole: 'authority',
    caseId: caseId,
    title: `New Case: ${caseId} (${newCase.priorityAssessment.priority} Priority)`,
    message: `${newCase.hazardAnalysis.severity.toUpperCase()} hazard reported at ${newCase.location.roadName}, ${newCase.location.locality}. Requires departmental review.`,
    read: false,
    createdAt: now,
    type: 'CASE_ASSIGNED',
  };

  const citizenNotification: InAppNotification = {
    id: `notif-${Date.now()}-cit`,
    userId: newCase.citizenId,
    userRole: 'citizen',
    caseId: caseId,
    title: `Case ${caseId} Created & Routed`,
    message: `Your report has been successfully forwarded to ${newCase.authorityRouting.authorityName}. You can track progress transparently.`,
    read: false,
    createdAt: now,
    type: 'CASE_ASSIGNED',
  };

  memoryNotifications.unshift(authNotification, citizenNotification);
  syncToLocalStorage();

  return fullCase;
}

export function updateCaseStatus(
  caseId: string,
  status: CaseStatus,
  options?: {
    actorName?: string;
    comment?: string;
    officer?: { name: string; badgeId: string; division: string };
    resolutionNotes?: string;
    resolutionEvidence?: {
      afterImageUrl: string;
      notes: string;
      verification?: ResolutionVerification;
    };
  }
): RoadCase | null {
  if (isBrowser()) {
    loadFromLocalStorage();
  }

  const index = memoryCases.findIndex(c => c.id.toLowerCase() === caseId.toLowerCase());
  if (index === -1) return null;

  const target = memoryCases[index];
  const now = new Date().toISOString();

  target.status = status;
  target.updatedAt = now;

  let timelineTitle = 'Case Updated';
  let defaultComment = `Status updated to ${status}.`;

  if (status === 'ACKNOWLEDGED') {
    target.acknowledgedAt = now;
    timelineTitle = 'Authority Acknowledged';
    defaultComment = 'Department official acknowledged receipt of the road hazard case.';
  } else if (status === 'ASSIGNED') {
    target.assignedAt = now;
    if (options?.officer) {
      target.assignedOfficer = options.officer;
    }
    timelineTitle = 'Officer Assigned';
    defaultComment = options?.officer
      ? `Assigned to field officer ${options.officer.name} (${options.officer.division}).`
      : 'Assigned to field engineering unit.';
  } else if (status === 'IN_PROGRESS') {
    timelineTitle = 'Action In Progress';
    defaultComment = 'Remediation materials deployed and active road repairs initiated.';
  } else if (status === 'RESOLVED') {
    target.resolvedAt = now;
    if (options?.resolutionNotes) {
      target.resolutionNotes = options.resolutionNotes;
    }
    if (options?.resolutionEvidence) {
      target.resolutionEvidence = options.resolutionEvidence;
    }
    timelineTitle = 'Road Hazard Resolved';
    defaultComment = options?.resolutionNotes || 'Road repair completed and visually verified.';
  }

  target.timeline.push({
    id: `tl-${Date.now()}`,
    status,
    title: timelineTitle,
    comment: options?.comment || defaultComment,
    timestamp: now,
    actor: options?.actorName || 'Authority Representative',
    actorRole: 'AUTHORITY',
  });

  const notif: InAppNotification = {
    id: `notif-${Date.now()}`,
    userId: target.citizenId,
    userRole: 'citizen',
    caseId: target.id,
    title: `Case ${target.id}: ${timelineTitle}`,
    message: options?.comment || defaultComment,
    read: false,
    createdAt: now,
    type: status === 'RESOLVED' ? 'RESOLVED' : 'STATUS_CHANGED',
  };
  memoryNotifications.unshift(notif);

  syncToLocalStorage();
  return target;
}

/**
 * Creates a new report with primary persistence in Supabase PostgreSQL & Storage.
 */
export async function createCaseAsync(
  newCase: Omit<RoadCase, 'id' | 'createdAt' | 'updatedAt' | 'timeline'> & { id?: string }
): Promise<RoadCase> {
  try {
    const { insertReportToSupabase } = await import('./supabase/reports');
    const createdInSupabase = await insertReportToSupabase(newCase);
    if (createdInSupabase) {
      memoryCases.unshift(createdInSupabase);
      syncToLocalStorage();
      return createdInSupabase;
    }
  } catch (err) {
    console.warn('Supabase createReport notice, falling back to local store:', err);
  }

  return createCase(newCase);
}

/**
 * Updates a report status with primary persistence in Supabase PostgreSQL & Storage.
 */
export async function updateCaseStatusAsync(
  caseId: string,
  status: CaseStatus,
  options?: {
    actorName?: string;
    comment?: string;
    officer?: { name: string; badgeId: string; division: string };
    resolutionNotes?: string;
    resolutionEvidence?: {
      afterImageUrl: string;
      notes: string;
      verification?: ResolutionVerification;
    };
  }
): Promise<RoadCase | null> {
  try {
    const { updateReportStatusInSupabase } = await import('./supabase/reports');
    const updatedInSupabase = await updateReportStatusInSupabase(caseId, status, options);
    if (updatedInSupabase) {
      const idx = memoryCases.findIndex(c => c.id.toLowerCase() === caseId.toLowerCase());
      if (idx !== -1) {
        memoryCases[idx] = updatedInSupabase;
      } else {
        memoryCases.unshift(updatedInSupabase);
      }
      syncToLocalStorage();
      return updatedInSupabase;
    }
  } catch (err) {
    console.warn('Supabase updateStatus notice, falling back to local store:', err);
  }

  return updateCaseStatus(caseId, status, options);
}

export function getNotifications(userRole?: 'citizen' | 'authority'): InAppNotification[] {
  if (isBrowser()) {
    loadFromLocalStorage();
  }
  if (!userRole) return memoryNotifications;
  return memoryNotifications.filter(n => n.userRole === userRole);
}

export function markNotificationAsRead(id: string): void {
  if (isBrowser()) {
    loadFromLocalStorage();
  }
  const notif = memoryNotifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    syncToLocalStorage();
  }
}
