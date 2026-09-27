import { NextRequest, NextResponse } from 'next/server';
import { searchAccidentNews } from '@/lib/news/newsapi';
import { analyzeAccidentIntelligence } from '@/lib/ai/accident-analysis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roadName, locality, district, state, latitude, longitude, isDemo } = body;

    if (!roadName) {
      return NextResponse.json(
        { error: 'roadName is required to query accident records.' },
        { status: 400 }
      );
    }

    // 1. Search public news articles via NewsAPI
    const rawArticles = await searchAccidentNews(
      roadName,
      locality || 'Local Area',
      district || 'District Administration',
      Boolean(isDemo)
    );

    // 2. Extract structured accident events, geocode, and filter strictly within 100 km radius
    const intelligence = await analyzeAccidentIntelligence(
      rawArticles,
      roadName,
      locality || 'Local Area',
      district || 'District Administration',
      state || 'State Authority',
      typeof latitude === 'number' ? latitude : undefined,
      typeof longitude === 'number' ? longitude : undefined,
      Boolean(isDemo)
    );

    return NextResponse.json(intelligence);
  } catch (error: unknown) {
    console.error('Error in /api/accidents:', error);
    // Graceful error recovery: Return safe fallback rather than crashing
    return NextResponse.json({
      events: [],
      totalFound: 0,
      highRelevanceCount: 0,
      summary: 'Accident intelligence temporarily unavailable.',
    });
  }
}
