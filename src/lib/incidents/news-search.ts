/**
 * NewsAPI Search Service for Road Accident Intelligence.
 * Builds dynamic search queries from the user's actual geographic context.
 * Strictly avoids synthetic or invented articles.
 */

export interface CandidateArticle {
  title: string;
  description: string;
  content?: string;
  source: { name: string };
  publishedAt: string;
  url: string;
}

const newsApiKey = process.env.NEWS_API_KEY || '';

// In-memory cache for news queries (TTL 30 minutes)
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const newsCache = new Map<string, CacheEntry<CandidateArticle[]>>();
const NEWS_CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Searches for recent road accident articles around the user's geographic context.
 * Uses a default 30-day lookback window.
 */
export async function searchIncidentNews(context: {
  roadName?: string;
  locality?: string;
  district?: string;
  state?: string;
  daysBack?: number;
}): Promise<CandidateArticle[]> {
  if (!newsApiKey || newsApiKey.includes('placeholder')) {
    console.warn('NewsAPI is unconfigured (NEWS_API_KEY missing). Zero synthetic articles will be generated.');
    return [];
  }

  const { roadName, locality, district, state, daysBack = 30 } = context;

  // Build clean search query components
  const validRoad =
    roadName && !roadName.toLowerCase().includes('unavailable') && !roadName.toLowerCase().includes('lat ')
      ? roadName
      : '';

  const locationTerms = [validRoad, locality, district, state].filter(Boolean);

  if (locationTerms.length === 0) {
    return [];
  }

  // Calculate ISO date for lookback window (default 30 days)
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);
  const fromIso = fromDate.toISOString().split('T')[0];

  // Primary road safety terms
  const safetyKeywords = '(accident OR crash OR collision OR "road accident" OR "fatal crash" OR "traffic accident" OR "pothole accident")';

  // Construct queries: Start specific, then fallback to district
  const queriesToTry: string[] = [];

  if (validRoad && district) {
    queriesToTry.push(`("${validRoad}" OR "${district}") AND ${safetyKeywords}`);
  } else if (district) {
    queriesToTry.push(`"${district}" AND ${safetyKeywords}`);
  } else if (locality) {
    queriesToTry.push(`"${locality}" AND ${safetyKeywords}`);
  }

  // Check cache for top query
  const primaryQuery = queriesToTry[0];
  const cacheKey = `${primaryQuery}_${fromIso}`;
  const cached = newsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  for (const q of queriesToTry) {
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        q
      )}&from=${fromIso}&sortBy=publishedAt&pageSize=15&language=en&apiKey=${newsApiKey}`;

      const res = await fetch(url, {
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        console.warn(`NewsAPI query failed with HTTP ${res.status}`);
        continue;
      }

      const json = await res.json();
      const rawArticles = (json.articles || []) as Array<{
        title: string;
        description: string;
        content?: string;
        source: { name: string };
        publishedAt: string;
        url: string;
      }>;

      // Filter out invalid/removed articles
      const filtered = rawArticles.filter(
        a =>
          a.title &&
          a.title !== '[Removed]' &&
          a.description &&
          !a.description.includes('removed')
      );

      if (filtered.length > 0) {
        newsCache.set(cacheKey, { data: filtered, expiresAt: Date.now() + NEWS_CACHE_TTL_MS });
        return filtered;
      }
    } catch (err) {
      console.warn(`Error querying NewsAPI for query "${q}":`, err);
    }
  }

  newsCache.set(cacheKey, { data: [], expiresAt: Date.now() + NEWS_CACHE_TTL_MS });
  return [];
}
