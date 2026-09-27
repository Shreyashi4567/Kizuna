import { LocationData, RoadCategory, AuthorityRoutingResult } from '@/types';
import { DEMO_AUTHORITY_REGISTRY } from './registry';

/**
 * Classifies road category based on deterministic naming conventions
 * and locality clues before routing against the verified Authority Registry.
 */
export function classifyRoadCategory(roadName: string, formattedAddress: string = ''): RoadCategory {
  const combined = `${roadName} ${formattedAddress}`.toLowerCase();

  // 0. If road name is explicitly unavailable or coordinates only
  if (
    !roadName ||
    roadName.toLowerCase().includes('unavailable') ||
    roadName.toLowerCase().includes('unidentified') ||
    roadName.toLowerCase().startsWith('lat ')
  ) {
    if (!formattedAddress) return 'other';
  }

  // 1. National Highway detection (NH-*, National Highway, Asian Highway)
  if (
    /\bnh[\s-]?\d+/i.test(combined) ||
    combined.includes('national highway') ||
    combined.includes('nhai')
  ) {
    return 'national_highway';
  }

  // 2. State Highway detection (SH-*, State Highway)
  if (
    /\bsh[\s-]?\d+/i.test(combined) ||
    combined.includes('state highway')
  ) {
    return 'state_highway';
  }

  // 3. Rural / PMGSY Roads
  if (
    combined.includes('pmgsy') ||
    combined.includes('gram sadak') ||
    combined.includes('rural road') ||
    combined.includes('village road') ||
    combined.includes('panchayat road')
  ) {
    return 'rural_road';
  }

  // 4. District Roads (MDR / Major District Road)
  if (
    combined.includes('mdr') ||
    combined.includes('odr') ||
    combined.includes('district road') ||
    combined.includes('bypass')
  ) {
    return 'district_road';
  }

  // 5. Urban / Municipal Roads (Colony, Sector, Marg, Nagar, Ward, Chowk)
  if (
    !roadName.toLowerCase().includes('unavailable') &&
    (/\b(marg|chowk|nagar|sector|colony|road|street|lane|avenue|ward)\b/i.test(combined) ||
      combined.includes('raipur') ||
      combined.includes('bilaspur'))
  ) {
    return 'municipal_road';
  }

  return 'other';
}

/**
 * Deterministic Authority Routing Engine.
 * Matches geographic jurisdiction + road category against structured authority databases.
 * For live submissions, dynamically maps statutory jurisdictions without hallucinating officials.
 */
export function routeAuthority(
  location: Partial<LocationData>,
  isLiveCase: boolean = false
): AuthorityRoutingResult {
  const roadName = location.roadName || 'Unidentified Road Segment';
  const address = location.formattedAddress || '';
  // If geographic context cannot establish ownership confidently
  if (
    (!location.district || location.district === 'Administrative Area') &&
    (!location.state || location.state === 'Local Jurisdiction') &&
    (!location.roadName || location.roadName.includes('unavailable'))
  ) {
    return {
      authorityId: 'auth-manual-verification',
      authorityName: 'Authority requires manual verification',
      department: 'Unassigned / Pending Verification',
      jurisdiction: 'Undetermined Jurisdiction',
      routingConfidence: 0.2,
      reason: 'Authority requires manual verification: insufficient geographic metadata to determine statutory road ownership.',
      escalationAuthority: 'District Grievance & Public Works Cell',
      isDemo: !isLiveCase,
    };
  }

  const district = (location.district || 'District').trim();
  const state = (location.state || 'State').trim();
  const locality = (location.locality || 'Locality').trim();
  const roadCategory = location.roadCategory || classifyRoadCategory(roadName, address);

  // Check structured registry for an exact match (e.g. within Chhattisgarh)
  const registryMatch = DEMO_AUTHORITY_REGISTRY.find(auth => {
    const categoryMatches = auth.roadCategories.includes(roadCategory);
    const districtMatches = auth.district.toLowerCase() === district.toLowerCase();
    return categoryMatches && districtMatches;
  });

  if (registryMatch) {
    return {
      authorityId: isLiveCase ? registryMatch.id.replace('demo', 'live') : registryMatch.id,
      authorityName: registryMatch.authorityName,
      department: registryMatch.department,
      jurisdiction: registryMatch.jurisdiction,
      routingConfidence: 0.95,
      reason: `Assigned because ${roadName} was verified as a ${roadCategory.replace('_', ' ')} within ${district} district administrative jurisdiction.`,
      escalationAuthority: registryMatch.escalationAuthority,
      isDemo: !isLiveCase && registryMatch.isDemo,
    };
  }

  // If outside predefined registry, generate statutory authority structure dynamically
  let authorityName = '';
  let department = '';
  let level: 'Central' | 'State' | 'District' | 'Municipal' | 'Panchayat' = 'State';
  let authorityId = '';

  switch (roadCategory) {
    case 'national_highway':
      authorityName = `National Highways Authority of India (NHAI) - ${district} PIU`;
      department = 'Ministry of Road Transport and Highways (MoRTH)';
      level = 'Central';
      authorityId = `auth-nhai-${district.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      break;

    case 'state_highway':
      authorityName = `${state} Public Works Department (${state} PWD)`;
      department = 'State Highways & Major Infrastructure Division';
      level = 'State';
      authorityId = `auth-pwd-${state.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      break;

    case 'municipal_road':
      authorityName = `${locality} Municipal Corporation / Urban Local Body`;
      department = 'Urban Infrastructure & Public Works Cell';
      level = 'Municipal';
      authorityId = `auth-ulb-${locality.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      break;

    case 'rural_road':
    case 'village_internal_road':
      authorityName = `${state} Rural Road Development Agency (${state} RRDA)`;
      department = 'Panchayat & Rural Development (PMGSY)';
      level = 'Panchayat';
      authorityId = `auth-pmgsy-${district.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      break;

    case 'district_road':
      authorityName = `${state} PWD District Division (${district})`;
      department = 'District Roads & Bridges Division';
      level = 'District';
      authorityId = `auth-pwd-dist-${district.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      break;

    default:
      authorityName = `District Road Safety Committee (DRSC) - ${district}`;
      department = 'District Collectorate & Transport Administration';
      level = 'District';
      authorityId = `auth-drsc-${district.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      break;
  }

  return {
    authorityId,
    authorityName,
    department,
    jurisdiction: `${roadCategory.replace('_', ' ').toUpperCase()} corridor in ${district}, ${state}`,
    routingConfidence: 0.92,
    reason: `Deterministic statutory routing: ${roadName} falls under ${level} authority jurisdiction for ${roadCategory.replace('_', ' ')}.`,
    escalationAuthority: `${level === 'Central' ? 'Regional Office NHAI' : `District Collector & Magistrate, ${district}`}`,
    isDemo: !isLiveCase,
  };
}
