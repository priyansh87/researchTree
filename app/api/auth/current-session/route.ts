import { auth } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth.getSession();
    return NextResponse.json(session);
  } catch (err: any) {
    console.error('Error in current-session API:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch session' }, { status: 500 });
  }
}
