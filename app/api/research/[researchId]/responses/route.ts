import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { researchResponses, researchItems, workspaceMembers } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

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

// GET all responses for a research item
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

    const responses = await db
      .select()
      .from(researchResponses)
      .where(eq(researchResponses.researchId, researchId))
      .orderBy(asc(researchResponses.createdAt));

    return NextResponse.json({ responses });
  } catch (error: any) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch responses' }, { status: 500 });
  }
}

// POST a new response (from user or assistant)
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

    const { type, content, summary, sourcesCount, citationsCount, confidence, expanded, charts } = await request.json();

    if (!type || !content) {
      return NextResponse.json({ error: 'Type and content are required' }, { status: 400 });
    }

    const responseId = Math.random().toString(36).substring(2, 15);

    const values = {
      id: responseId,
      researchId,
      type, // 'user' | 'assistant'
      content,
      summary: summary || null,
      sourcesCount: sourcesCount || 0,
      citationsCount: citationsCount || 0,
      confidence: confidence || '100%',
      expanded: expanded !== undefined ? expanded : false,
      charts: charts || [],
    };

    await db.insert(researchResponses).values(values);

    return NextResponse.json({ response: values });
  } catch (error: any) {
    console.error('Error adding response:', error);
    return NextResponse.json({ error: error?.message || 'Failed to add response' }, { status: 500 });
  }
}
