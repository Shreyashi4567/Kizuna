import { NextRequest, NextResponse } from 'next/server';
import { calculatePriority } from '@/lib/risk/priority';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hazardAnalysis, accidentEvents, citizenReportCount, roadCategory } = body;

    if (!hazardAnalysis) {
      return NextResponse.json(
        { error: 'hazardAnalysis is required.' },
        { status: 400 }
      );
    }

    const assessment = calculatePriority({
      hazardAnalysis,
      accidentEvents: accidentEvents || [],
      citizenReportCount: citizenReportCount || 1,
      roadCategory: roadCategory || 'municipal_road',
    });

    return NextResponse.json(assessment);
  } catch (error: unknown) {
    console.error('Error in /api/calculate-priority:', error);
    const message = error instanceof Error ? error.message : 'Failed to calculate priority.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
