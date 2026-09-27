/**
 * Supabase Data Access Layer for KIZUNA Reports.
 * Provides unified, typed persistence for Web, Mobile, and Authority clients.
 * Reads from and writes to Supabase PostgreSQL as the central source of truth.
 */

import { getServerSupabase } from './server';
import { uploadImageToSupabaseStorage } from './storage';
import { RoadCase, CaseStatus, PriorityLevel, HazardType, CaseTimelineEntry, AccidentEvent, ResolutionVerification } from '@/types';

interface DatabaseReportRow {
  id: string;
  citizen_id: string;
  image_url: string;
  storage_path: string | null;
  latitude: number;
  longitude: number;
  formatted_address: string;
  locality: string;
  district: string;
  state: string;
  road_name: string;
  road_place_id: string;
  road_category: string;
  pincode: string | null;
  gps_accuracy: number | null;
  location_source: string;
  hazard_type: string;
  severity: string;
  confidence: number;
  description: string;
  requires_attention: boolean;
  visible_road_clues: string[] | null;
  additional_hazards: string[] | null;
  authority_id: string;
  authority_name: string;
  authority_department: string;
  authority_jurisdiction: string;
  routing_confidence: number;
  routing_reason: string;
  priority: string;
  priority_confidence: number;
  priority_explanation: string | null;
  priority_factors: string[] | null;
  status: string;
  citizen_report_count: number;
  assigned_officer_name: string | null;
  assigned_officer_badge: string | null;
  assigned_officer_division: string | null;
  resolution_notes: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  acknowledged_at: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
}

interface DatabaseTimelineRow {
  id: string;
  report_id: string;
  status: string;
  title: string;
  comment: string;
  actor: string;
  actor_role: string;
  created_at: string;
}

interface DatabaseIncidentRow {
  id: string;
  report_id: string;
  title: string;
  source: string;
  url: string;
  published_at: string | null;
  event_date: string | null;
  location_text: string;
  event_type: string;
  severity: string;
  relevance: string;
  relevance_reason: string | null;
  snippet: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
  casualties: number;
  created_at: string;
}

interface DatabaseVerificationRow {
  id: string;
  report_id: string;
  before_image_url: string;
  after_image_url: string;
  hazard_before: string;
  hazard_visible_after: boolean;
  visual_resolution_confidence: number;
  explanation: string;
  verified_at: string;
}

/**
 * Maps PostgreSQL relational records into the application's unified RoadCase domain object.
 */
function mapToRoadCase(
  r: DatabaseReportRow,
  timeline: DatabaseTimelineRow[] = [],
  incidents: DatabaseIncidentRow[] = [],
  verification?: DatabaseVerificationRow | null
): RoadCase {
  const events: AccidentEvent[] = incidents.map(inc => ({
    id: inc.id,
    title: inc.title,
    source: inc.source,
    url: inc.url,
    date: inc.event_date || (inc.published_at ? inc.published_at.substring(0, 10) : null),
    location: inc.location_text,
    eventType: (inc.event_type as AccidentEvent['eventType']) || 'unknown',
    severity: (inc.severity as AccidentEvent['severity']) || 'moderate',
    relevance: (inc.relevance as AccidentEvent['relevance']) || 'MEDIUM',
    relevanceReason: inc.relevance_reason || undefined,
    snippet: inc.snippet || undefined,
    latitude: inc.latitude ?? undefined,
    longitude: inc.longitude ?? undefined,
    distanceKm: inc.distance_km ?? undefined,
    casualties: inc.casualties,
  }));

  const timelineEntries: CaseTimelineEntry[] = timeline.map(t => ({
    id: t.id,
    status: t.status as CaseStatus,
    title: t.title,
    comment: t.comment,
    timestamp: t.created_at,
    actor: t.actor,
    actorRole: t.actor_role as CaseTimelineEntry['actorRole'],
  }));

  // Build assigned officer object if present
  const assignedOfficer = r.assigned_officer_name
    ? {
        name: r.assigned_officer_name,
        badgeId: r.assigned_officer_badge || '',
        division: r.assigned_officer_division || '',
      }
    : undefined;

  // Build resolution evidence if present
  let resolutionEvidence: RoadCase['resolutionEvidence'] = undefined;
  if (verification || r.resolution_notes) {
    resolutionEvidence = {
      afterImageUrl: verification?.after_image_url || '',
      notes: r.resolution_notes || '',
      verification: verification
        ? {
            hazardBefore: verification.hazard_before,
            hazardVisibleAfter: verification.hazard_visible_after,
            visualResolutionConfidence: verification.visual_resolution_confidence,
            explanation: verification.explanation,
            verifiedAt: verification.verified_at,
            afterImageUrl: verification.after_image_url,
          }
        : undefined,
    };
  }

  return {
    id: r.id,
    citizenId: r.citizen_id,
    imageUrl: r.image_url,
    location: {
      latitude: r.latitude,
      longitude: r.longitude,
      formattedAddress: r.formatted_address,
      locality: r.locality,
      district: r.district,
      state: r.state,
      roadName: r.road_name,
      roadPlaceId: r.road_place_id,
      roadCategory: r.road_category as RoadCase['location']['roadCategory'],
      pincode: r.pincode || undefined,
      gpsAccuracy: r.gps_accuracy ?? undefined,
      source: (r.location_source as RoadCase['location']['source']) || 'gps',
    },
    hazardAnalysis: {
      hazardType: r.hazard_type as HazardType,
      severity: r.severity as RoadCase['hazardAnalysis']['severity'],
      confidence: r.confidence,
      description: r.description,
      requiresAttention: r.requires_attention,
      visibleRoadClues: r.visible_road_clues || [],
      additionalHazards: r.additional_hazards || [],
    },
    accidentIntelligence: {
      events,
      totalFound: events.length,
      highRelevanceCount: events.filter(e => e.relevance === 'HIGH').length,
      summary: `${events.length} incident report(s) extracted within corridor.`,
    },
    authorityRouting: {
      authorityId: r.authority_id,
      authorityName: r.authority_name,
      department: r.authority_department,
      jurisdiction: r.authority_jurisdiction,
      routingConfidence: r.routing_confidence,
      reason: r.routing_reason,
      isDemo: r.is_demo,
    },
    priorityAssessment: {
      priority: r.priority as PriorityLevel,
      confidence: r.priority_confidence,
      explanation: r.priority_explanation || '',
      factors: r.priority_factors || [],
    },
    status: r.status as CaseStatus,
    citizenReportCount: r.citizen_report_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    acknowledgedAt: r.acknowledged_at || undefined,
    assignedAt: r.assigned_at || undefined,
    assignedOfficer,
    resolvedAt: r.resolved_at || undefined,
    resolutionNotes: r.resolution_notes || undefined,
    resolutionEvidence,
    timeline: timelineEntries,
    isDemo: r.is_demo,
    realityMetadata: {
      photoSource: r.is_demo ? 'DEMO_SAMPLE' : 'USER_UPLOAD',
      locationSource: r.location_source === 'gps' ? 'BROWSER_GPS' : 'MANUAL_COORDINATES',
      gpsAccuracyMeters: r.gps_accuracy ?? undefined,
      geocodingProvider: r.road_place_id?.startsWith('osm_') ? 'OPENSTREETMAP_NOMINATIM' : 'GOOGLE_ROADS_GEOCODING',
      accidentRadiusKm: 100,
      accidentIntelligenceCount: events.length,
      authorityRoutingMethod: 'DETERMINISTIC_REGISTRY',
      persistenceBackend: 'SUPABASE_POSTGRESQL',
    },
  };
}

/**
 * Retrieves all reports from Supabase with optional filters.
 */
export async function fetchReportsFromSupabase(filters?: {
  status?: string;
  priority?: string;
  authorityId?: string;
}): Promise<RoadCase[] | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  try {
    let query = supabase.from('reports').select('*').order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status.toUpperCase());
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority.toUpperCase());
    }
    if (filters?.authorityId) {
      query = query.eq('authority_id', filters.authorityId);
    }

    const { data: reportsData, error: reportsError } = await query;
    if (reportsError) {
      console.warn('Supabase fetch reports notice:', reportsError.message);
      return null;
    }
    if (!reportsData || reportsData.length === 0) {
      return [];
    }

    const reportIds = reportsData.map(r => r.id);

    // Fetch timeline entries for these reports
    const { data: timelineData } = await supabase
      .from('report_status_history')
      .select('*')
      .in('report_id', reportIds)
      .order('created_at', { ascending: true });

    // Fetch incidents for these reports
    const { data: incidentData } = await supabase
      .from('incidents')
      .select('*')
      .in('report_id', reportIds);

    // Group timeline and incidents by report_id
    const timelineByReport = new Map<string, DatabaseTimelineRow[]>();
    (timelineData || []).forEach((t: DatabaseTimelineRow) => {
      const list = timelineByReport.get(t.report_id) || [];
      list.push(t);
      timelineByReport.set(t.report_id, list);
    });

    const incidentsByReport = new Map<string, DatabaseIncidentRow[]>();
    (incidentData || []).forEach((inc: DatabaseIncidentRow) => {
      const list = incidentsByReport.get(inc.report_id) || [];
      list.push(inc);
      incidentsByReport.set(inc.report_id, list);
    });

    return reportsData.map((r: DatabaseReportRow) =>
      mapToRoadCase(r, timelineByReport.get(r.id) || [], incidentsByReport.get(r.id) || [])
    );
  } catch (err) {
    console.warn('Failed to fetch reports from Supabase:', err);
    return null;
  }
}

/**
 * Retrieves a single report by ID from Supabase.
 */
export async function fetchReportByIdFromSupabase(id: string): Promise<RoadCase | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  try {
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !report) {
      return null;
    }

    const [timelineRes, incidentsRes, verificationRes] = await Promise.all([
      supabase
        .from('report_status_history')
        .select('*')
        .eq('report_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('incidents')
        .select('*')
        .eq('report_id', id),
      supabase
        .from('resolution_verifications')
        .select('*')
        .eq('report_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return mapToRoadCase(
      report as DatabaseReportRow,
      (timelineRes.data || []) as DatabaseTimelineRow[],
      (incidentsRes.data || []) as DatabaseIncidentRow[],
      verificationRes.data as DatabaseVerificationRow | null
    );
  } catch (err) {
    console.warn(`Failed to fetch report ${id} from Supabase:`, err);
    return null;
  }
}

/**
 * Persists a new citizen report into Supabase Storage and PostgreSQL tables.
 */
export async function insertReportToSupabase(newCase: Omit<RoadCase, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>): Promise<RoadCase | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const caseId = `KZ-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date().toISOString();
  const isDemo = Boolean(newCase.isDemo);

  try {
    // 1. Upload photograph to Supabase Storage ('report-images' bucket)
    let persistentImageUrl = newCase.imageUrl;
    let storagePath: string | null = null;

    if (newCase.imageUrl && newCase.imageUrl.startsWith('data:')) {
      const uploadResult = await uploadImageToSupabaseStorage(
        newCase.imageUrl,
        'report-images',
        caseId,
        'hazard_photo'
      );
      persistentImageUrl = uploadResult.publicUrl;
      storagePath = uploadResult.storagePath;
    }

    // 2. Safe Road Name and Authority ID Validation
    const userOrOsmRoad = newCase.location.roadName?.trim();
    const safeRoadName = (userOrOsmRoad && !userOrOsmRoad.includes('unavailable from open map data'))
      ? userOrOsmRoad
      : 'Road name unavailable';

    const validAuthorityIds = ['NHAI_RO_CG', 'CG_PWD_DIV1', 'RMC_CIVIL', 'CG_RRDA_PMGSY'];
    let safeAuthorityId = newCase.authorityRouting?.authorityId;
    if (!validAuthorityIds.includes(safeAuthorityId)) {
      if (newCase.location.roadCategory === 'national_highway') {
        safeAuthorityId = 'NHAI_RO_CG';
      } else if (newCase.location.roadCategory === 'state_highway' || newCase.location.roadCategory === 'district_road') {
        safeAuthorityId = 'CG_PWD_DIV1';
      } else if (newCase.location.roadCategory === 'rural_road' || newCase.location.roadCategory === 'village_internal_road') {
        safeAuthorityId = 'CG_RRDA_PMGSY';
      } else {
        safeAuthorityId = 'RMC_CIVIL';
      }
    }

    // Insert master report row
    const { error: insertError } = await supabase.from('reports').insert({
      id: caseId,
      citizen_id: newCase.citizenId || 'cit-anon-001',
      image_url: persistentImageUrl,
      storage_path: storagePath,
      latitude: newCase.location.latitude,
      longitude: newCase.location.longitude,
      formatted_address: newCase.location.formattedAddress || 'Location unverified',
      locality: newCase.location.locality || 'Corridor',
      district: newCase.location.district || 'District',
      state: newCase.location.state || 'State',
      road_name: safeRoadName,
      road_place_id: newCase.location.roadPlaceId || 'osm_unverified',
      road_category: newCase.location.roadCategory || 'other',
      pincode: newCase.location.pincode || null,
      gps_accuracy: newCase.location.gpsAccuracy ?? null,
      location_source: newCase.location.source || 'gps',
      hazard_type: newCase.hazardAnalysis.hazardType,
      severity: newCase.hazardAnalysis.severity,
      confidence: newCase.hazardAnalysis.confidence,
      description: newCase.hazardAnalysis.description,
      requires_attention: newCase.hazardAnalysis.requiresAttention,
      visible_road_clues: newCase.hazardAnalysis.visibleRoadClues,
      additional_hazards: newCase.hazardAnalysis.additionalHazards,
      authority_id: safeAuthorityId,
      authority_name: newCase.authorityRouting.authorityName,
      authority_department: newCase.authorityRouting.department,
      authority_jurisdiction: newCase.authorityRouting.jurisdiction,
      routing_confidence: newCase.authorityRouting.routingConfidence,
      routing_reason: newCase.authorityRouting.reason,
      priority: newCase.priorityAssessment.priority,
      priority_confidence: newCase.priorityAssessment.confidence,
      priority_explanation: newCase.priorityAssessment.explanation,
      priority_factors: newCase.priorityAssessment.factors,
      status: 'REPORTED',
      citizen_report_count: 1,
      is_demo: isDemo,
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      console.error('Supabase report insertion failed:', insertError);
      return null;
    }

    // 3. Insert initial status history entries
    const initialTimeline: Array<{
      report_id: string;
      status: string;
      title: string;
      comment: string;
      actor: string;
      actor_role: string;
      created_at: string;
    }> = [
      {
        report_id: caseId,
        status: 'REPORTED',
        title: 'Report Submitted',
        comment: 'Citizen uploaded road hazard photograph and GPS location.',
        actor: 'Citizen',
        actor_role: 'CITIZEN',
        created_at: now,
      },
      {
        report_id: caseId,
        status: 'AI_ANALYZED',
        title: 'Groq Vision Analysis Completed',
        comment: `Detected ${newCase.hazardAnalysis.hazardType.replace(/_/g, ' ')} with ${Math.round(newCase.hazardAnalysis.confidence * 100)}% visual certainty.`,
        actor: 'KIZUNA AI Engine',
        actor_role: 'SYSTEM_AI',
        created_at: now,
      },
      {
        report_id: caseId,
        status: 'AUTHORITY_IDENTIFIED',
        title: 'Jurisdiction Mapped',
        comment: `Routed to ${newCase.authorityRouting.authorityName} (${newCase.authorityRouting.department}) based on ${newCase.location.roadCategory?.replace('_', ' ') || 'road'} statutory jurisdiction.`,
        actor: 'Authority Routing Engine',
        actor_role: 'SYSTEM_AI',
        created_at: now,
      },
    ];

    await supabase.from('report_status_history').insert(initialTimeline);

    // 4. Insert accident intelligence incidents
    if (newCase.accidentIntelligence?.events && newCase.accidentIntelligence.events.length > 0) {
      const incidentRows = newCase.accidentIntelligence.events.map(ev => ({
        report_id: caseId,
        title: ev.title,
        source: ev.source,
        url: ev.url,
        published_at: ev.date ? `${ev.date}T00:00:00Z` : null,
        event_date: ev.date || null,
        location_text: ev.location,
        event_type: ev.eventType,
        severity: ev.severity,
        relevance: ev.relevance,
        relevance_reason: ev.relevanceReason || null,
        snippet: ev.snippet || null,
        latitude: ev.latitude ?? null,
        longitude: ev.longitude ?? null,
        distance_km: ev.distanceKm ?? null,
        casualties: ev.casualties || 0,
        created_at: now,
      }));

      await supabase.from('incidents').insert(incidentRows);
    }

    // 5. Return assembled RoadCase
    return await fetchReportByIdFromSupabase(caseId);
  } catch (err) {
    console.warn('Failed to insert report into Supabase:', err);
    return null;
  }
}

/**
 * Updates a report's status and lifecycle actions in Supabase.
 */
export async function updateReportStatusInSupabase(
  id: string,
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
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const now = new Date().toISOString();

  try {
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: now,
    };

    let timelineTitle = 'Case Updated';
    let defaultComment = `Status updated to ${status}.`;

    if (status === 'ACKNOWLEDGED') {
      updatePayload.acknowledged_at = now;
      timelineTitle = 'Authority Acknowledged';
      defaultComment = 'Department official acknowledged receipt of the road hazard case.';
    } else if (status === 'ASSIGNED') {
      updatePayload.assigned_at = now;
      if (options?.officer) {
        updatePayload.assigned_officer_name = options.officer.name;
        updatePayload.assigned_officer_badge = options.officer.badgeId;
        updatePayload.assigned_officer_division = options.officer.division;
      }
      timelineTitle = 'Officer Assigned';
      defaultComment = options?.officer
        ? `Assigned to field officer ${options.officer.name} (${options.officer.division}).`
        : 'Assigned to field engineering unit.';
    } else if (status === 'IN_PROGRESS') {
      timelineTitle = 'Action In Progress';
      defaultComment = 'Remediation materials deployed and active road repairs initiated.';
    } else if (status === 'RESOLVED') {
      updatePayload.resolved_at = now;
      if (options?.resolutionNotes) {
        updatePayload.resolution_notes = options.resolutionNotes;
      }
      timelineTitle = 'Road Hazard Resolved';
      defaultComment = options?.resolutionNotes || 'Road repair completed and visually verified.';

      // Handle resolution evidence image upload
      if (options?.resolutionEvidence?.afterImageUrl) {
        let afterUrl = options.resolutionEvidence.afterImageUrl;
        let storagePath: string | null = null;

        if (afterUrl.startsWith('data:')) {
          const uploadRes = await uploadImageToSupabaseStorage(
            afterUrl,
            'resolution-images',
            id,
            'resolution_photo'
          );
          afterUrl = uploadRes.publicUrl;
          storagePath = uploadRes.storagePath;
        }

        // Insert into resolution_verifications
        const ver = options.resolutionEvidence.verification;
        await supabase.from('resolution_verifications').insert({
          report_id: id,
          before_image_url: '', // will be referenced from report
          after_image_url: afterUrl,
          after_storage_path: storagePath,
          hazard_before: ver?.hazardBefore || 'Reported hazard',
          hazard_visible_after: ver ? ver.hazardVisibleAfter : false,
          visual_resolution_confidence: ver ? ver.visualResolutionConfidence : 0.9,
          explanation: ver ? ver.explanation : (options.resolutionNotes || 'Repair verified'),
          verified_at: ver?.verifiedAt || now,
          created_at: now,
        });
      }
    }

    // Update master report
    const { error: updateError } = await supabase
      .from('reports')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) {
      console.warn(`Supabase update error on report ${id}:`, updateError.message);
      return null;
    }

    // Insert timeline history entry
    await supabase.from('report_status_history').insert({
      report_id: id,
      status,
      title: timelineTitle,
      comment: options?.comment || defaultComment,
      actor: options?.actorName || 'Authority Representative',
      actor_role: 'AUTHORITY',
      created_at: now,
    });

    return await fetchReportByIdFromSupabase(id);
  } catch (err) {
    console.warn(`Failed to update report ${id} in Supabase:`, err);
    return null;
  }
}
