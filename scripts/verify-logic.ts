import { routeAuthority, classifyRoadCategory } from '@/lib/authority/routing';
import { calculatePriority } from '@/lib/risk/priority';

console.log('Testing KIZUNA Domain Logic...');

// 1. National Highway
const cat1 = classifyRoadCategory('National Highway 30 (NH-30)');
console.log('Classified NH-30:', cat1);
if (cat1 !== 'national_highway') throw new Error('Expected national_highway');

const route1 = routeAuthority({
  roadName: 'National Highway 30 (NH-30)',
  roadCategory: cat1,
  district: 'Raipur',
});
console.log('Routed Authority for NH-30:', route1.authorityName, 'Confidence:', route1.routingConfidence);
if (!route1.authorityName.includes('National Highways Authority')) {
  throw new Error('Expected NHAI authority');
}

// 2. Municipal Road
const cat2 = classifyRoadCategory('Great Eastern Road, Telibandha Chowk');
console.log('Classified GE Road:', cat2);
const route2 = routeAuthority({
  roadName: 'Great Eastern Road',
  roadCategory: cat2,
  district: 'Raipur',
});
console.log('Routed Authority for GE Road:', route2.authorityName);
if (!route2.authorityName.includes('Raipur Municipal Corporation')) {
  throw new Error('Expected RMC authority');
}

// 3. Priority Assessment
const priority = calculatePriority({
  hazardAnalysis: {
    hazardType: 'pothole',
    severity: 'high',
    confidence: 0.95,
    description: 'Deep road crater',
    requiresAttention: true,
    visibleRoadClues: [],
    additionalHazards: [],
  },
  accidentEvents: [
    {
      date: '2026-04-12',
      location: 'NH-30',
      eventType: 'collision',
      severity: 'serious',
      source: 'Test News',
      url: 'https://example.com',
      title: 'Crash on NH-30',
      relevance: 'HIGH',
    },
  ],
  citizenReportCount: 6,
  roadCategory: 'national_highway',
});
console.log('Calculated Priority:', priority.priority, 'Factors:', priority.factors.length);
if (priority.priority !== 'CRITICAL' && priority.priority !== 'HIGH') {
  throw new Error('Expected HIGH or CRITICAL priority');
}

console.log('🎉 ALL KIZUNA CORE LOGIC VERIFICATIONS PASSED SUCCESSFULLY!');
