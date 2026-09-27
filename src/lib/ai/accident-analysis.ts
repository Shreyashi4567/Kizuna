/**
 * Accident Intelligence Service for KIZUNA (Open Mapping Stack).
 * Pure OpenStreetMap geocoding + Local Haversine Distance (No Google Cloud or billing dependencies).
 * Enforces strict 100 km radius filtering based on real user coordinates.
 */

import { RawNewsArticle } from '../news/newsapi';
import { AccidentEvent, AccidentRelevance, AccidentEventType } from '@/types';
import { getGroqClient, isGroqConfigured, GROQ_TEXT_MODELS } from './groq';
import { calculateDistanceKm } from '@/lib/geo/distance';
import { forwardGeocode } from '@/lib/geo/geocoding';

export interface AccidentIntelligenceResult {
  events: AccidentEvent[];
  totalFound: number;
  highRelevanceCount: number;
  summary: string;
}

/**
 * Resolves coordinates for an incident location mention using OpenStreetMap Nominatim.
 * Strictly respects rule: if location cannot be geocoded, returns null (never invents coordinates).
 */
async function geocodeIncidentLocation(
  locationText: string,
  districtHint: string = '',
  stateHint: string = ''
): Promise<{ lat: number; lng: number } | null> {
  const query = [locationText, districtHint, stateHint].filter(Boolean).join(', ');

  try {
    const geo = await forwardGeocode(query);
    if (geo && typeof geo.latitude === 'number' && typeof geo.longitude === 'number') {
      return { lat: geo.latitude, lng: geo.longitude };
    }

    // Secondary attempt with just locationText
    const fallbackGeo = await forwardGeocode(locationText);
    if (fallbackGeo && typeof fallbackGeo.latitude === 'number' && typeof fallbackGeo.longitude === 'number') {
      return { lat: fallbackGeo.latitude, lng: fallbackGeo.longitude };
    }
  } catch (err) {
    console.warn(`Geocoding failed for incident location "${locationText}":`, err);
  }

  return null;
}

/**
/**
 * Analyzes candidate accident news using Groq AI and OpenStreetMap geocoding.
 * Filters strictly to <= 100 km radius from the citizen's GPS coordinates.
 * Never fabricates or synthesizes fake accident events.
 */
export async function analyzeAccidentIntelligence(
  articles: RawNewsArticle[],
  roadName: string,
  locality: string,
  district: string,
  state: string,
  citizenLat?: number,
  citizenLng?: number
): Promise<AccidentIntelligenceResult> {
  if (articles.length === 0) {
    return {
      events: [],
      totalFound: 0,
      highRelevanceCount: 0,
      summary: 'No recent publicly reported incidents were found within this geographic corridor.',
    };
  }

  if (!isGroqConfigured) {
    return {
      events: [],
      totalFound: 0,
      highRelevanceCount: 0,
      summary: 'Recent articles were found, but automated AI extraction is paused (GROQ_API_KEY unconfigured). Zero synthetic incidents are generated.',
    };
  }

  const groq = getGroqClient();
  if (!groq) {
    return {
      events: [],
      totalFound: 0,
      highRelevanceCount: 0,
      summary: 'Groq client initialization failed for incident analysis.',
    };
  }

  const prompt = `You are a Road Safety Intelligence Analyst for KIZUNA.
Analyze these recent news articles and extract road accident incidents in this geographic region.

Target Context:
Road: "${roadName}"
Locality: "${locality}"
District: "${district}"
State: "${state}"

Articles:
${JSON.stringify(articles.map((a, i) => ({ index: i, title: a.title, description: a.description, source: a.source?.name, publishedAt: a.publishedAt, url: a.url })), null, 2)}

Instructions:
1. For each article, extract the specific road accident event.
2. Distinguish article publication date from accident event date. If accident date is unclear, return null.
3. Extract precise location text (e.g. specific intersection, landmark, chowk, or highway corridor).
4. Classify relevance strictly:
   - "HIGH": Explicitly refers to ${roadName} or this exact locality/corridor.
   - "MEDIUM": Refers to nearby intersection or road in ${locality} or ${district}.
   - "LOW": Regional accident in ${district} or ${state} on a different road.
   - "NOT_RELEVANT": Unrelated topic or completely different jurisdiction.
5. Categorize eventType: "collision", "crash", "pedestrian_accident", "vehicle_accident", "overturning", "fatal_accident", "injury_accident", "unknown".
6. Categorize severity: "minor", "moderate", "serious", "fatal".
7. Extract casualties: integer count of fatalities or severe injuries (0 if none mentioned).
8. Never present uncertain speculation as confirmed fact.

Return JSON in this format:
{
  "events": [
    {
      "date": string | null,
      "location": string,
      "eventType": string,
      "severity": string,
      "casualties": number,
      "source": string,
      "url": string,
      "title": string,
      "snippet": string,
      "relevance": "HIGH" | "MEDIUM" | "LOW" | "NOT_RELEVANT",
      "relevanceReason": string
    }
  ],
  "summary": string
}`;

  try {
    let text = '';
    let lastError: unknown = null;

    for (const model of GROQ_TEXT_MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a Road Safety Intelligence Analyst for KIZUNA. You analyze news articles and extract real accident incidents. Output valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        });

        text = completion.choices[0]?.message?.content || '';
        if (text) break;
      } catch (err) {
        lastError = err;
        console.warn(`Groq text model ${model} error in accident extraction, trying next:`, err);
      }
    }

    if (!text && lastError) {
      throw lastError;
    }

    const parsed = JSON.parse(text || '{}');
    const parsedEvents = (parsed.events || []) as Array<{
      date?: string | null;
      location?: string;
      eventType?: AccidentEventType;
      severity?: 'minor' | 'moderate' | 'serious' | 'fatal';
      casualties?: number;
      source?: string;
      url?: string;
      title?: string;
      snippet?: string;
      relevance?: AccidentRelevance;
      relevanceReason?: string;
    }>;

    // Filter out NOT_RELEVANT articles
    const validEvents = parsedEvents.filter(e => e.relevance !== 'NOT_RELEVANT');

    // Geocode and calculate Haversine distance for each incident
    const processedEvents: AccidentEvent[] = await Promise.all(
      validEvents.map(async (e, i: number) => {
        const eventLoc = e.location || `${roadName}, ${locality}`;
        let lat: number | undefined;
        let lng: number | undefined;
        let distanceKm: number | undefined;

        // Attempt to geocode incident location via OpenStreetMap Nominatim
        const coords = await geocodeIncidentLocation(eventLoc, district, state);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
          if (citizenLat !== undefined && citizenLng !== undefined) {
            distanceKm = calculateDistanceKm(citizenLat, citizenLng, lat, lng);
          }
        }

        return {
          id: `acc-${i}-${Date.now()}`,
          date: e.date || null,
          location: eventLoc,
          eventType: e.eventType || 'unknown',
          severity: e.severity || 'moderate',
          source: e.source || articles[i]?.source?.name || 'News Source',
          url: e.url || articles[i]?.url || '#',
          title: e.title || articles[i]?.title || 'Public Report',
          snippet: e.snippet || articles[i]?.description || '',
          relevance: e.relevance || 'MEDIUM',
          relevanceReason: e.relevanceReason || 'Extracted via public news intelligence.',
          latitude: lat,
          longitude: lng,
          distanceKm,
          casualties: e.casualties ?? (e.severity === 'fatal' ? 1 : 0),
          dateConfidence: e.date ? 'EXACT' : 'UNKNOWN',
        };
      })
    );

    // Apply strict 100 KM Radius Boundary
    // If location cannot be geocoded reliably, exclude from map radius results
    const within100KmEvents = processedEvents.filter(e => {
      if (e.distanceKm !== undefined) {
        return e.distanceKm <= 100;
      }
      return false; // Exclude unmapped incidents from strict radius
    });

    // Sort by: Distance (closest first), then Relevance (HIGH first), then Casualties
    within100KmEvents.sort((a, b) => {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        if (a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }
      }
      const relOrder = { HIGH: 3, MEDIUM: 2, LOW: 1, NOT_RELEVANT: 0 };
      const relDiff = (relOrder[b.relevance] || 0) - (relOrder[a.relevance] || 0);
      if (relDiff !== 0) return relDiff;
      return (b.casualties || 0) - (a.casualties || 0);
    });

    const highRelCount = within100KmEvents.filter(e => e.relevance === 'HIGH').length;

    let finalSummary = parsed.summary || `Verified ${within100KmEvents.length} public incident(s) within 100 km radius.`;
    if (processedEvents.length > 0 && within100KmEvents.length === 0) {
      finalSummary = 'Recent articles were found, but their locations could not be reliably mapped within the 100 km perimeter.';
    }

    return {
      events: within100KmEvents,
      totalFound: processedEvents.length,
      highRelevanceCount: highRelCount,
      summary: finalSummary,
    };
  } catch (err) {
    console.error('Error during Groq accident extraction:', err);
    return {
      events: [],
      totalFound: 0,
      highRelevanceCount: 0,
      summary: 'Accident intelligence processing encountered a temporary error. Zero synthetic articles substituted.',
    };
  }
}
