import { NextRequest, NextResponse } from 'next/server';
import { fetchCasesAsync, createCaseAsync } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const authorityId = searchParams.get('authorityId') || undefined;

    const cases = await fetchCasesAsync({ status, priority, authorityId });
    return NextResponse.json({ cases });
  } catch (error: unknown) {
    console.error('Error fetching cases:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve cases.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const caseData = await req.json();

    if (!caseData.imageUrl || !caseData.location || !caseData.hazardAnalysis) {
      return NextResponse.json(
        { error: 'Missing required case payload fields (imageUrl, location, hazardAnalysis).' },
        { status: 400 }
      );
    }

    const created = await createCaseAsync(caseData);
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating case:', error);
    const message = error instanceof Error ? error.message : 'Failed to create case.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
