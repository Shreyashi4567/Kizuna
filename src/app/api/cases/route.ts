import { NextRequest, NextResponse } from 'next/server';
import { getAllCases, createCase } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const authorityId = searchParams.get('authorityId');

    let cases = getAllCases();

    if (status) {
      cases = cases.filter(c => c.status.toLowerCase() === status.toLowerCase());
    }
    if (priority) {
      cases = cases.filter(c => c.priorityAssessment.priority.toLowerCase() === priority.toLowerCase());
    }
    if (authorityId) {
      cases = cases.filter(c => c.authorityRouting.authorityId === authorityId);
    }

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

    const created = createCase(caseData);
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
