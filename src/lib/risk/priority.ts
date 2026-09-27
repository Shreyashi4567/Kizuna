import { HazardAnalysis, AccidentEvent, PriorityAssessment, PriorityLevel, RoadCategory } from '@/types';

interface PriorityCalculationInput {
  hazardAnalysis: HazardAnalysis;
  accidentEvents: AccidentEvent[];
  citizenReportCount?: number;
  roadCategory?: RoadCategory;
}

/**
 * AI-assisted prototype priority indicator.
 * Combines hazard severity, accident history, repeat citizen reports, and road type.
 * Note: Clearly labeled as an AI-assisted prototype indicator, not a scientifically certified score.
 */
export function calculatePriority({
  hazardAnalysis,
  accidentEvents,
  citizenReportCount = 1,
  roadCategory = 'municipal_road',
}: PriorityCalculationInput): PriorityAssessment {
  const factors: string[] = [];
  let score = 0;

  // 1. Hazard Severity Weighting
  switch (hazardAnalysis.severity) {
    case 'critical':
      score += 45;
      factors.push(`Critical hazard severity: ${hazardAnalysis.hazardType.replace('_', ' ')} pose immediate danger to motorists`);
      break;
    case 'high':
      score += 30;
      factors.push(`High hazard severity: significant ${hazardAnalysis.hazardType.replace('_', ' ')} requiring urgent intervention`);
      break;
    case 'medium':
      score += 18;
      factors.push(`Moderate hazard severity: noticeable road defect needing maintenance`);
      break;
    case 'low':
      score += 8;
      factors.push(`Low hazard severity: minor wear or surface condition`);
      break;
  }

  // 2. Accident Intelligence Evidence (100 KM Radius)
  const highRelevanceAccidents = accidentEvents.filter(e => e.relevance === 'HIGH');
  const fatalAccidents = highRelevanceAccidents.filter(e => e.severity === 'fatal' || e.eventType === 'fatal_accident');
  const casualtiesCount = accidentEvents.reduce((sum, e) => sum + (e.casualties || 0), 0);

  if (fatalAccidents.length > 0) {
    score += 35;
    factors.push(`Historical precedent: ${fatalAccidents.length} fatal accident report(s) documented within 100 km of this road segment`);
  } else if (casualtiesCount > 0) {
    score += 25;
    factors.push(`Casualty precedent: ${casualtiesCount} reported injuries/casualties in nearby crashes within 100 km`);
  } else if (highRelevanceAccidents.length > 0) {
    score += 20;
    factors.push(`Accident history: ${highRelevanceAccidents.length} verified news reports of crashes on this corridor`);
  } else if (accidentEvents.length > 0) {
    score += 10;
    factors.push(`Contextual safety signals: ${accidentEvents.length} public incident reports identified within 100 km perimeter`);
  }

  // 3. Citizen Report Velocity / Crowdsourced Reports
  if (citizenReportCount >= 5) {
    score += 20;
    factors.push(`High civic concern: ${citizenReportCount} community reports filed for this hazardous spot`);
  } else if (citizenReportCount > 1) {
    score += 10;
    factors.push(`Multiple community reports (${citizenReportCount}) indicating persistent hazard`);
  }

  // 4. Road Hierarchy / Traffic Volume Context
  if (roadCategory === 'national_highway') {
    score += 15;
    factors.push(`High-speed corridor: National Highway classification increases collision risk at highway speeds`);
  } else if (roadCategory === 'state_highway') {
    score += 10;
    factors.push(`High-traffic corridor: State Highway classification with continuous heavy vehicle traffic`);
  }

  // Determine final priority tier
  let priority: PriorityLevel = 'LOW';
  if (score >= 65 || hazardAnalysis.severity === 'critical') {
    priority = 'CRITICAL';
  } else if (score >= 45) {
    priority = 'HIGH';
  } else if (score >= 25) {
    priority = 'MEDIUM';
  } else {
    priority = 'LOW';
  }

  const confidence = Math.min(0.96, Math.max(0.70, (hazardAnalysis.confidence * 0.6) + (accidentEvents.length > 0 ? 0.35 : 0.2)));

  const explanation = `Calculated prototype risk level ${priority} based on ${hazardAnalysis.severity} severity detection, ${highRelevanceAccidents.length} verified accident records, and road corridor exposure.`;

  return {
    priority,
    factors,
    confidence: Number(confidence.toFixed(2)),
    explanation,
  };
}
