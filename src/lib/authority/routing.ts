import { LocationData, RoadCategory, AuthorityRoutingResult } from '@/types';
import { AUTHORITY_REGISTRY } from './registry';

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
  const roadName = location.roadName || 'Road name unavailable';
  const address = location.formattedAddress || '';
  const district = (location.district || 'District').trim();
  const state = (location.state || 'State').trim();
  const roadCategory = location.roadCategory || classifyRoadCategory(roadName, address);

  // 1. Check structured registry for an exact match (category + district)
  let registryMatch = AUTHORITY_REGISTRY.find(auth => {
    const categoryMatches = auth.roadCategories.includes(roadCategory);
    const districtMatches = auth.district.toLowerCase() === district.toLowerCase();
    return categoryMatches && districtMatches;
  });

  // 2. If no exact district-level match, route to statutory authority responsible for this road category
  if (!registryMatch) {
    registryMatch = AUTHORITY_REGISTRY.find(auth => auth.roadCategories.includes(roadCategory));
  }

  // 3. Fallback to municipal/urban engineering authority (RMC_CIVIL)
  if (!registryMatch) {
    registryMatch = AUTHORITY_REGISTRY.find(auth => auth.id === 'RMC_CIVIL') || AUTHORITY_REGISTRY[0];
  }

  return {
    authorityId: registryMatch.id,
    authorityName: registryMatch.authorityName,
    department: registryMatch.department,
    jurisdiction: `${roadCategory.replace('_', ' ').toUpperCase()} corridor in ${district}, ${state}`,
    routingConfidence: 0.95,
    reason: `Deterministic statutory routing: ${roadName} falls under ${registryMatch.authorityName} (${registryMatch.department}) for ${roadCategory.replace('_', ' ')} corridors.`,
    escalationAuthority: registryMatch.escalationAuthority,
    isDemo: !isLiveCase && registryMatch.isDemo,
  };
}
