import { NextRequest, NextResponse } from 'next/server';
import {
  reverseGeocode,
  forwardGeocode,
  forwardGeocodeStructured,
} from '@/lib/geo/geocoding';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude, manualQuery, manualParts } = body;

    // 1. Manual Location Entry Fallback
    if (manualParts && (manualParts.city || manualParts.locality || manualParts.road)) {
      const location = await forwardGeocodeStructured(manualParts);
      if (!location) {
        return NextResponse.json(
          { error: 'Unable to identify the entered location. Please check the city or locality.' },
          { status: 404 }
        );
      }
      return NextResponse.json(location);
    }

    if (manualQuery && typeof manualQuery === 'string') {
      const location = await forwardGeocode(manualQuery);
      if (!location) {
        return NextResponse.json(
          { error: 'Unable to identify the entered location. Please check the spelling or specify the district.' },
          { status: 404 }
        );
      }
      return NextResponse.json(location);
    }

    // 2. Real Browser GPS Coordinates Reverse-Geocoding
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Valid latitude and longitude numbers are required.' },
        { status: 400 }
      );
    }

    const location = await reverseGeocode(latitude, longitude);

    return NextResponse.json(location);
  } catch (error: unknown) {
    console.error('Error in /api/identify-road (Open Geocoding):', error);
    const message =
      error instanceof Error ? error.message : 'Unable to identify the road from this location.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
