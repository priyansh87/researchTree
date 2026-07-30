import { db } from '@/lib/db';
import { researchTopics, researchItems, workspaceMembers } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

interface RouteParams {
  params: Promise<{
    workspaceId: string;
  }>;
}

async function checkWorkspaceMember(workspaceId: string, userId: string) {
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
  return !!member;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { workspaceId } = await params;

  try {
    const isMember = await checkWorkspaceMember(workspaceId, userId);
    if (!isMember) {
      return NextResponse.json({ error: 'Unauthorized workspace access' }, { status: 403 });
    }

    // 1. Fetch all research items in this workspace
    const workspaceResearch = await db
      .select({ id: researchItems.id, title: researchItems.title })
      .from(researchItems)
      .where(eq(researchItems.workspaceId, workspaceId));

    if (workspaceResearch.length === 0) {
      return NextResponse.json({ topics: [], research: [] });
    }

    const ids = workspaceResearch.map((r) => r.id);

    // 2. Fetch all topics for these research items
    const topicsList = await db
      .select()
      .from(researchTopics)
      .where(inArray(researchTopics.researchId, ids));

    return NextResponse.json({ topics: topicsList, research: workspaceResearch });
  } catch (error: any) {
    console.error('Error fetching workspace topics:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch workspace topics' }, { status: 500 });
  }
}
