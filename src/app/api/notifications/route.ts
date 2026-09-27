import { NextRequest, NextResponse } from 'next/server';
import { getNotifications, markNotificationAsRead } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') as 'citizen' | 'authority' | null;

  const notifications = getNotifications(role || undefined);
  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }
    markNotificationAsRead(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
