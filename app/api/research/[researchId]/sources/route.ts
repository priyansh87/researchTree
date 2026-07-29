import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { sources, researchItems, workspaceMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    researchId: string;
  }>;
}

async function checkResearchAccess(researchId: string, userId: string) {
  const [research] = await db
    .select()
    .from(researchItems)
    .where(eq(researchItems.id, researchId));

  if (!research) return false;

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, research.workspaceId), eq(workspaceMembers.userId, userId)));

  return !!member;
}

// GET all sources for a research
export async function GET(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { researchId } = await params;

  try {
    const hasAccess = await checkResearchAccess(researchId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized research access' }, { status: 403 });
    }

    const items = await db
      .select()
      .from(sources)
      .where(eq(sources.researchId, researchId));

    return NextResponse.json({ sources: items });
  } catch (error: any) {
    console.error('Error fetching sources:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch sources' }, { status: 500 });
  }
}

// POST create a source
export async function POST(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { researchId } = await params;

  try {
    const hasAccess = await checkResearchAccess(researchId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized research access' }, { status: 403 });
    }

    const { domain, title, trust, url } = await request.json();
    if (!domain || !title) {
      return NextResponse.json({ error: 'Domain and Title are required' }, { status: 400 });
    }

    const sourceId = Math.random().toString(36).substring(2, 15);

    const values = {
      id: sourceId,
      researchId,
      domain,
      title,
      trust: trust !== undefined ? trust : 100,
      url: url || null,
    };

    await db.insert(sources).values(values);

    return NextResponse.json({ source: values });
  } catch (error: any) {
    console.error('Error creating source:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create source' }, { status: 500 });
  }
}
