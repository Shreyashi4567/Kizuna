import { RoadCase, InAppNotification, CaseStatus, CaseTimelineEntry, ResolutionVerification } from '@/types';
import { DEMO_CASES, DEMO_NOTIFICATIONS } from './demo-data';
import { getServerSupabase, isServerSupabaseConfigured } from './supabase/server';

// In-memory runtime cache for server-side operations and client fallback
let memoryCases: RoadCase[] = [...DEMO_CASES];
let memoryNotifications: InAppNotification[] = [...DEMO_NOTIFICATIONS];

const STORAGE_KEY_CASES = 'kizuna_cases_v2';
const STORAGE_KEY_NOTIFS = 'kizuna_notifications_v2';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function loadFromLocalStorage(): void {
  if (!isBrowser()) return;
  try {
    const rawCases = localStorage.getItem(STORAGE_KEY_CASES);
    if (rawCases) {
      const parsed: RoadCase[] = JSON.parse(rawCases);
      // Ensure demo cases are present alongside any user-submitted live cases
      const userCases = parsed.filter(c => !c.id.startsWith('KZ-DEMO-'));
      memoryCases = [...userCases, ...DEMO_CASES];
    } else {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(DEMO_CASES));
      memoryCases = [...DEMO_CASES];
    }

    const rawNotifs = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (rawNotifs) {
      memoryNotifications = JSON.parse(rawNotifs);
    } else {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(DEMO_NOTIFICATIONS));
      memoryNotifications = [...DEMO_NOTIFICATIONS];
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

export function createCase(
  newCase: Omit<RoadCase, 'id' | 'createdAt' | 'updatedAt' | 'timeline'> & { id?: string }
): RoadCase {
  if (isBrowser()) {
    loadFromLocalStorage();
  }

  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const isDemo = Boolean(newCase.isDemo ?? (newCase.id?.startsWith('KZ-DEMO-')));
  const caseId = newCase.id || (isDemo ? `KZ-DEMO-${randomSuffix}` : `KZ-${year}-${randomSuffix}`);
  const now = new Date().toISOString();

  const initialTimeline: CaseTimelineEntry[] = [
    {
      id: `tl-${Date.now()}-1`,
      status: 'REPORTED',
      title: 'Road Hazard Reported',
      comment: isDemo
        ? 'Pre-configured benchmark incident loaded into verification docket.'
        : 'Citizen submitted photographic evidence with browser GPS coordinates.',
      timestamp: now,
      actor: 'Reporting Citizen',
      actorRole: 'CITIZEN',
    },
    {
      id: `tl-${Date.now()}-2`,
      status: 'AI_ANALYZED',
      title: 'AI Vision & 100km Precedent Analysis Complete',
      comment: `Vision AI detected ${newCase.hazardAnalysis.severity} severity ${newCase.hazardAnalysis.hazardType.replace('_', ' ')}. Cross-referenced with news precedents within 100 km radius.`,
      timestamp: now,
      actor: 'KIZUNA AI Core',
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
    isDemo,
    createdAt: now,
    updatedAt: now,
    timeline: initialTimeline,
    realityMetadata: newCase.realityMetadata || {
      photoSource: isDemo ? 'DEMO_SAMPLE' : 'USER_UPLOAD',
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

  // Async Cloud Persistence via Supabase if configured
  if (isServerSupabaseConfigured) {
    try {
      const supabase = getServerSupabase();
      if (supabase) {
        supabase
          .from('cases')
          .insert({
            id: fullCase.id,
            citizen_id: fullCase.citizenId,
            authority_id: fullCase.authorityRouting.authorityId,
            image_url: fullCase.imageUrl,
            location_data: fullCase.location,
            hazard_analysis: fullCase.hazardAnalysis,
            accident_intelligence: fullCase.accidentIntelligence,
            authority_routing: fullCase.authorityRouting,
            priority_assessment: fullCase.priorityAssessment,
            priority: fullCase.priorityAssessment.priority,
            status: fullCase.status,
            citizen_report_count: fullCase.citizenReportCount,
            is_demo: Boolean(fullCase.isDemo),
            created_at: fullCase.createdAt,
            updated_at: fullCase.updatedAt,
          })
          .then(
            ({ error }) => {
              if (error) console.warn('Supabase case insertion notice:', error.message);
            },
            (err: unknown) => {
              console.warn('Supabase sync notice:', err);
            }
          );
      }
    } catch (err) {
      console.warn('Supabase persistence attempt caught error:', err);
    }
  }

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

  // Notify citizen about status change
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

  // Async Cloud Persistence via Supabase if configured
  if (isServerSupabaseConfigured) {
    try {
      const supabase = getServerSupabase();
      if (supabase) {
        supabase
          .from('cases')
          .update({
            status,
            updated_at: now,
            acknowledged_at: target.acknowledgedAt,
            assigned_at: target.assignedAt,
            resolved_at: target.resolvedAt,
            assigned_officer: target.assignedOfficer,
            resolution_notes: target.resolutionNotes,
            resolution_evidence: target.resolutionEvidence,
          })
          .eq('id', target.id)
          .then(
            ({ error }) => {
              if (error) console.warn('Supabase status update notice:', error.message);
            },
            (err: unknown) => {
              console.warn('Supabase update notice:', err);
            }
          );
      }
    } catch (err) {
      console.warn('Supabase status update caught error:', err);
    }
  }

  return target;
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

export function resetToDemoData(): void {
  memoryCases = [...DEMO_CASES];
  memoryNotifications = [...DEMO_NOTIFICATIONS];
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(DEMO_CASES));
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(DEMO_NOTIFICATIONS));
  }
}
