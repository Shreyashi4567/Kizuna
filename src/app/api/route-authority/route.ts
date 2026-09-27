import { NextRequest, NextResponse } from 'next/server';
import { routeAuthority } from '@/lib/authority/routing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { location, isLiveCase } = body;

    if (!location) {
      return NextResponse.json(
        { error: 'Location object is required.' },
        { status: 400 }
      );
    }

    const routingResult = routeAuthority(location, Boolean(isLiveCase));
    return NextResponse.json(routingResult);
  } catch (error: unknown) {
    console.error('Error in /api/route-authority:', error);
    const message = error instanceof Error ? error.message : 'Failed to determine responsible authority.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
