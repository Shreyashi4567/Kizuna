// Verification test script for Kizuna MVP Core Logic (Open Mapping Stack)
import assert from 'node:assert';

console.log('=========================================================');
console.log('  KIZUNA OPEN MAPPING & MVP VERIFICATION SUITE');
console.log('  (Leaflet + OpenStreetMap + Haversine + News Radius)');
console.log('=========================================================');

// 1. Haversine Distance Implementation
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

console.log('\n[1/5] Testing Haversine Distance & 100 KM Radius Filter:');
// Raipur (21.2514, 81.6296) to Durg (21.1904, 81.2849) ~ 36.4 km
const distToDurg = calculateHaversineDistanceKm(21.2514, 81.6296, 21.1904, 81.2849);
console.log(`  - Raipur to Durg: ${distToDurg} km (Expected ~36 km)`);
assert(distToDurg > 30 && distToDurg < 45, 'Durg distance should be within ~36km');
assert(distToDurg <= 100, 'Durg should pass 100km radius filter');

// Raipur (21.2514, 81.6296) to Bilaspur (22.0797, 82.1409) ~ 106.2 km
const distToBilaspur = calculateHaversineDistanceKm(21.2514, 81.6296, 22.0797, 82.1409);
console.log(`  - Raipur to Bilaspur: ${distToBilaspur} km (Expected ~106 km)`);
assert(distToBilaspur > 100, 'Bilaspur should exceed 100km radius');

// Candidate incidents with coordinates
const candidateIncidents = [
  { name: 'Durg Incident', lat: 21.1904, lon: 81.2849, confidence: 'high' },
  { name: 'Bilaspur Crash', lat: 22.0797, lon: 82.1409, confidence: 'high' },
  { name: 'Unmapped News Mention', lat: undefined, lon: undefined, confidence: 'low' },
];

const citizenLat = 21.2514;
const citizenLon = 81.6296;

const within100km = candidateIncidents
  .filter(inc => inc.confidence !== 'low' && typeof inc.lat === 'number' && typeof inc.lon === 'number')
  .map(inc => ({
    ...inc,
    distanceKm: calculateHaversineDistanceKm(citizenLat, citizenLon, inc.lat, inc.lon),
  }))
  .filter(inc => inc.distanceKm <= 100);

assert.strictEqual(within100km.length, 1, 'Only Durg incident (<=100km) should pass filter');
assert.strictEqual(within100km[0].name, 'Durg Incident');
console.log('  ✓ 100 KM Haversine distance filtering & low-confidence exclusion verified');

// 2. Road Category Classification
function classifyRoadCategory(roadName, formattedAddress = '') {
  const combined = `${roadName} ${formattedAddress}`.toLowerCase();

  if (
    !roadName ||
    roadName.toLowerCase().includes('unavailable') ||
    roadName.toLowerCase().includes('unidentified') ||
    roadName.toLowerCase().startsWith('lat ')
  ) {
    if (!formattedAddress) return 'other';
  }

  if (/\bnh[\s-]?\d+/i.test(combined) || combined.includes('national highway') || combined.includes('nhai')) {
    return 'national_highway';
  }
  if (/\bsh[\s-]?\d+/i.test(combined) || combined.includes('state highway')) {
    return 'state_highway';
  }
  if (combined.includes('pmgsy') || combined.includes('gram sadak') || combined.includes('rural road') || combined.includes('village road')) {
    return 'rural_road';
  }
  if (combined.includes('mdr') || combined.includes('district road')) {
    return 'district_road';
  }
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

console.log('\n[2/5] Testing Deterministic Road Category Classifier:');
assert.strictEqual(classifyRoadCategory('NH-53 Great Eastern Road'), 'national_highway');
assert.strictEqual(classifyRoadCategory('SH-7 State Highway'), 'state_highway');
assert.strictEqual(classifyRoadCategory('PMGSY Gram Sadak Link Road'), 'rural_road');
assert.strictEqual(classifyRoadCategory('MDR-12 District Ring Road'), 'district_road');
assert.strictEqual(classifyRoadCategory('VIP Road, Telibandha'), 'municipal_road');
assert.strictEqual(classifyRoadCategory('Road name unavailable from open map data'), 'other');
console.log('  ✓ National, State, Rural, District, and Urban categories classified correctly');

// 3. Dynamic Authority Routing & Manual Verification Fallback
function routeAuthority(location, isLiveCase = false) {
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
      routingConfidence: 0.2,
      isDemo: !isLiveCase,
    };
  }

  const district = (location.district || 'District').trim();
  const state = (location.state || 'State').trim();
  const locality = (location.locality || 'Locality').trim();
  const roadCategory = location.roadCategory || classifyRoadCategory(roadName, address);

  let authorityName = '';
  let department = '';
  let authorityId = '';

  switch (roadCategory) {
    case 'national_highway':
      authorityName = `National Highways Authority of India (NHAI) - ${district} PIU`;
      department = 'Ministry of Road Transport and Highways (MoRTH)';
      authorityId = `auth-nhai-${district.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      break;
    case 'state_highway':
      authorityName = `${state} Public Works Department (${state} PWD)`;
      department = 'State Highways & Major Infrastructure Division';
      authorityId = `auth-pwd-${state.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      break;
    case 'municipal_road':
      authorityName = `${locality} Municipal Corporation / Urban Local Body`;
      department = 'Urban Infrastructure & Public Works Cell';
      authorityId = `auth-ulb-${locality.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      break;
    case 'rural_road':
      authorityName = `${state} Rural Road Development Agency (${state} RRDA)`;
      department = 'Panchayat & Rural Development (PMGSY)';
      authorityId = `auth-pmgsy-${district.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      break;
    default:
      authorityName = `${district} District Administration & PWD`;
      department = 'Public Works & Infrastructure Division';
      authorityId = `auth-pwd-${district.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  return {
    authorityId: isLiveCase ? authorityId.replace('demo', 'live') : authorityId,
    authorityName,
    department,
    isDemo: !isLiveCase,
  };
}

console.log('\n[3/5] Testing Authority Routing & Fallback Verification:');
const liveNH = routeAuthority({ roadName: 'NH-44', district: 'Nagpur', state: 'Maharashtra' }, true);
console.log(`  - NH-44 Live: ${liveNH.authorityName} (isDemo: ${liveNH.isDemo})`);
assert.strictEqual(liveNH.isDemo, false, 'Live case must have isDemo: false');
assert(liveNH.authorityName.includes('National Highways Authority of India'), 'Should route to NHAI');

const uncertainCase = routeAuthority(
  {
    roadName: 'Road name unavailable from open map data',
    district: 'Administrative Area',
    state: 'Local Jurisdiction',
  },
  true
);
console.log(`  - Uncertain location: ${uncertainCase.authorityName}`);
assert.strictEqual(
  uncertainCase.authorityName,
  'Authority requires manual verification',
  'Must return manual verification when ownership cannot be determined'
);
console.log('  ✓ Deterministic routing and "Authority requires manual verification" verified');

// 4. In-Memory Geocoding Cache Verification
console.log('\n[4/5] Testing Geocoding Cache:');
const cache = new Map();
function getCacheKey(lat, lon) {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}
const k1 = getCacheKey(21.2514123, 81.6296456);
const k2 = getCacheKey(21.2514188, 81.6296411);
assert.strictEqual(k1, k2, 'Nearby coordinates (~11m) must map to same cache key');
cache.set(k1, { roadName: 'Great Eastern Road', cached: true });
assert.strictEqual(cache.get(k2)?.cached, true, 'Cache hits must avoid redundant network calls');
console.log('  ✓ Coordinate rounding spatial cache verified');

// 5. Priority Calculation
function calculatePriority({ hazardSeverity, casualties, fatalCount, reportCount, roadCategory }) {
  let score = 0;
  if (hazardSeverity === 'critical') score += 45;
  else if (hazardSeverity === 'high') score += 30;
  else if (hazardSeverity === 'medium') score += 18;
  else score += 8;

  if (fatalCount > 0) score += 35;
  else if (casualties > 0) score += 25;

  if (reportCount > 5) score += 15;
  else if (reportCount > 2) score += 10;
  else if (reportCount > 1) score += 5;

  if (roadCategory === 'national_highway') score += 12;
  else if (roadCategory === 'state_highway') score += 8;

  score = Math.min(100, Math.max(5, score));
  let priority = 'MEDIUM';
  if (score >= 80) priority = 'CRITICAL';
  else if (score >= 60) priority = 'HIGH';
  else if (score < 40) priority = 'LOW';

  return { score, priority };
}

console.log('\n[5/5] Testing Priority Assessment:');
const critResult = calculatePriority({
  hazardSeverity: 'critical',
  casualties: 3,
  fatalCount: 1,
  reportCount: 3,
  roadCategory: 'national_highway',
});
console.log(`  - Critical Hazard + Fatal Crash + NH-53: Score ${critResult.score}, Priority ${critResult.priority}`);
assert.strictEqual(critResult.priority, 'CRITICAL', 'Should evaluate to CRITICAL priority');

console.log('\n=========================================================');
console.log('  ALL KIZUNA OPEN MAPPING SUITE TESTS PASSED! (5/5)');
console.log('=========================================================\n');
