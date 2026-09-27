export interface RawNewsArticle {
  title: string;
  source: { id: string | null; name: string };
  author: string | null;
  description: string | null;
  url: string;
  publishedAt: string;
}

const newsApiKey = process.env.NEWS_API_KEY || '';

export const isNewsApiConfigured = Boolean(
  newsApiKey && !newsApiKey.includes('placeholder') && newsApiKey.length > 8
);

/**
 * Searches publicly available accident reports from NewsAPI /v2/everything
 * with dynamic boolean queries based on road, locality, and collision keywords.
 * Never fabricates or synthesizes fake news articles.
 */
export async function searchAccidentNews(
  roadName: string,
  locality: string,
  district: string = 'Raipur'
): Promise<RawNewsArticle[]> {
  if (!isNewsApiConfigured) {
    return [];
  }

  try {
    const cleanRoad = roadName.replace(/National Highway\s*/i, 'NH-').replace(/State Highway\s*/i, 'SH-').trim();
    const query = `("${cleanRoad}" OR "${locality}" OR "${district}") AND (accident OR crash OR collision OR overturned OR fatal OR "road safety")`;
    const encodedQuery = encodeURIComponent(query);

    const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=publishedAt&pageSize=15&apiKey=${newsApiKey}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && Array.isArray(data.articles) && data.articles.length > 0) {
        return data.articles.map((art: {
          title?: string;
          source?: { id: string | null; name: string };
          author?: string;
          description?: string;
          url?: string;
          publishedAt?: string;
        }) => ({
          title: art.title || 'Untitled Report',
          source: { id: art.source?.id || null, name: art.source?.name || 'News Source' },
          author: art.author || null,
          description: art.description || '',
          url: art.url || '#',
          publishedAt: art.publishedAt || new Date().toISOString(),
        }));
      }
    }
  } catch (err) {
    console.warn('NewsAPI fetch error or timeout:', err);
  }

  return [];
}
