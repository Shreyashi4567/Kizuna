import { NextRequest, NextResponse } from 'next/server';
import { verifyResolutionVisuals } from '@/lib/ai/resolution-analysis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { beforeImageUrl, afterImageUrl, hazardDescription } = body;

    if (!afterImageUrl) {
      return NextResponse.json(
        { error: 'afterImageUrl is required.' },
        { status: 400 }
      );
    }

    const verification = await verifyResolutionVisuals(
      beforeImageUrl || '',
      afterImageUrl,
      hazardDescription || 'Reported road defect'
    );

    return NextResponse.json(verification);
  } catch (error: unknown) {
    console.error('Error in /api/verify-resolution:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify resolution.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
