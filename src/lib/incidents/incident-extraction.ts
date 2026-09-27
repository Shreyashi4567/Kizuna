/**
 * Incident Information Extraction Engine using Groq AI.
 * Extracts structured crash details from unstructured news articles.
 * Strictly separates article publication dates from actual accident occurrence dates.
 */

import { CandidateArticle } from './news-search';
import { AccidentRelevance, AccidentEventType } from '@/types';
import { getGroqClient, isGroqConfigured, GROQ_TEXT_MODELS } from '@/lib/ai/groq';

export interface ExtractedIncident {
  date: string | null;
  dateConfidence: 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
  locationText: string;
  eventType: AccidentEventType;
  severity: 'minor' | 'moderate' | 'serious' | 'fatal';
  casualties: number;
  source: string;
  url: string;
  title: string;
  snippet: string;
  relevance: AccidentRelevance;
  relevanceReason: string;
  locationConfidence: 'high' | 'medium' | 'low';
}

/**
 * Uses Groq AI to parse candidate news articles into verified incident events.
 */
export async function extractIncidentEvents(
  articles: CandidateArticle[],
  userContext: {
    roadName?: string;
    locality?: string;
    district?: string;
    state?: string;
  }
): Promise<{ incidents: ExtractedIncident[]; summary: string }> {
  if (articles.length === 0) {
    return {
      incidents: [],
      summary: 'No recent publicly reported incidents were found within this geographic corridor.',
    };
  }

  if (!isGroqConfigured) {
    return {
      incidents: [],
      summary: 'Incident extraction requires GROQ_API_KEY. News articles detected but unstructured extraction is paused.',
    };
  }

  const groq = getGroqClient();
  if (!groq) {
    return {
      incidents: [],
      summary: 'Groq client initialization failed for incident extraction.',
    };
  }

  const { roadName, locality, district, state } = userContext;

  const prompt = `You are an AI Road Safety Intelligence Analyst for the KIZUNA platform.
Analyze these recent news articles and extract road accident incidents in this geographic region.

Target Context:
Road: "${roadName || 'Unknown'}"
Locality: "${locality || 'Unknown'}"
District: "${district || 'Unknown'}"
State: "${state || 'Unknown'}"

Articles:
${JSON.stringify(
  articles.map((a, i) => ({
    id: i,
    title: a.title,
    description: a.description,
    source: a.source.name,
    publishedAt: a.publishedAt,
    url: a.url,
  })),
  null,
  2
)}

CRITICAL INSTRUCTIONS:
1. For each article, determine if it describes an actual road accident/crash event.
2. Differentiate the article's publication date from the date when the accident actually occurred. If the exact accident date is not specified, return null and set dateConfidence to "UNKNOWN".
3. Extract the most specific location text mentioned (intersection, landmark, chowk, kilometer stone, or road name). If vague (e.g. only mentions a large state), set locationConfidence to "low".
4. Determine casualty count: explicit number of fatalities or serious injuries (0 if none mentioned).
5. Categorize eventType: "collision", "crash", "pedestrian_accident", "vehicle_accident", "overturning", "fatal_accident", "injury_accident", "unknown".
6. Categorize severity: "minor", "moderate", "serious", "fatal". If deaths occurred, it MUST be "fatal".
7. Classify relevance strictly:
   - "HIGH": Explicitly refers to ${roadName || 'this corridor'} or this exact locality.
   - "MEDIUM": Refers to nearby intersection or road in ${district || 'this district'}.
   - "LOW": Regional incident in ${state || 'the state'} on a different road.
   - "NOT_RELEVANT": Not a road crash or unrelated subject.
8. If the location text cannot be geocoded or is too generic (e.g., just "India" or just the state name), set locationConfidence to "low".
9. Never invent casualty numbers or fake details.

Return JSON strictly in this structure:
{
  "incidents": [
    {
      "date": string | null,
      "dateConfidence": "EXACT" | "APPROXIMATE" | "UNKNOWN",
      "locationText": string,
      "locationConfidence": "high" | "medium" | "low",
      "eventType": string,
      "severity": "minor" | "moderate" | "serious" | "fatal",
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

  let text = '';
  let lastError: unknown = null;

  for (const model of GROQ_TEXT_MODELS) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });
      const resText = response.choices?.[0]?.message?.content;
      if (resText) {
        text = resText;
        break;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Groq model ${model} error during incident extraction, trying next:`, err);
    }
  }

  if (!text) {
    if (lastError) console.error('Groq extraction failed across models:', lastError);
    return {
      incidents: [],
      summary: 'Recent articles were found, but automated AI extraction could not process them at this time.',
    };
  }

  try {
    const parsed = JSON.parse(text);
    const rawIncidents = (parsed.incidents || []) as ExtractedIncident[];

    // Filter out NOT_RELEVANT items
    const relevant = rawIncidents.filter(inc => inc.relevance !== 'NOT_RELEVANT');

    return {
      incidents: relevant,
      summary:
        parsed.summary ||
        `Identified ${relevant.length} relevant road safety incident report(s) from public news archives.`,
    };
  } catch (err) {
    console.error('Failed to parse Groq incident extraction JSON:', err);
    return {
      incidents: [],
      summary: 'Recent articles were found, but their structured details could not be parsed.',
    };
  }
}
