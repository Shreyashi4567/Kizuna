import { NextRequest, NextResponse } from 'next/server';
import { fetchCaseByIdAsync, updateCaseStatusAsync } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const found = await fetchCaseByIdAsync(id);

    if (!found) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json(found);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching case';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, actorName, comment, officer, resolutionNotes, resolutionEvidence } = body;

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const updated = await updateCaseStatusAsync(id, status, {
      actorName,
      comment,
      officer,
      resolutionNotes,
      resolutionEvidence,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Case not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating case status';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
