import { NextRequest, NextResponse } from 'next/server';
import { analyzeRoadPhotograph } from '@/lib/ai/road-analysis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required (imageBase64).' },
        { status: 400 }
      );
    }

    const analysis = await analyzeRoadPhotograph(
      imageBase64,
      mimeType || 'image/jpeg'
    );

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error('Error in /api/analyze-road:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze road photograph.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
