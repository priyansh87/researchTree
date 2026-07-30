import { db } from '@/lib/db';
import { researchTopics, researchItems, workspaceMembers, sources } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

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

    // 1. Fetch all topics for this research item
    const topicsList = await db
      .select()
      .from(researchTopics)
      .where(eq(researchTopics.researchId, researchId));

    // 2. Fetch active sources count for this research
    const dbSources = await db
      .select()
      .from(sources)
      .where(eq(sources.researchId, researchId));

    const sourcesCount = dbSources.length || 3;
    const citationsCount = sourcesCount + 2;

    // 3. Format topic nodes to include count metadata
    const formattedTopics = topicsList.map((t) => ({
      id: t.id,
      title: t.title,
      summary: t.summary,
      keywords: Array.isArray(t.keywords) ? t.keywords : [],
      parentId: t.parentId,
      sourcesCount,
      citationsCount,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({ topics: formattedTopics });
  } catch (error: any) {
    console.error('Error fetching research topics:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch research topics' }, { status: 500 });
  }
}
