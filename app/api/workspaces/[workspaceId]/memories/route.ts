import { db } from '@/lib/db';
import { researchItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { searchWorkspaceMem0Memories } from '@/lib/agents/research-agent';

interface RouteParams {
  params: Promise<{
    workspaceId: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { workspaceId } = await params;

  try {
    // 1. Fetch workspace research titles to map IDs to titles
    const workspaceResearch = await db
      .select({ id: researchItems.id, title: researchItems.title })
      .from(researchItems)
      .where(eq(researchItems.workspaceId, workspaceId));

    const researchMap = new Map(workspaceResearch.map((r) => [r.id, r.title]));

    // 2. Fetch workspace-wide memories from Mem0 or Local Fallback
    const memories = await searchWorkspaceMem0Memories(userId, workspaceId);

    // 3. Format memories for the visual graph
    const formatted = memories.map((m: any, idx: number) => {
      if (typeof m === 'object' && m !== null) {
        const researchId = m.metadata?.researchId || m.researchId || '';
        const topic = m.metadata?.topic || 'general';
        const content = m.memory || m.content || JSON.stringify(m);
        const title = researchMap.get(researchId) || topic || 'General Research';

        return {
          id: m.id || `mem-${idx}`,
          researchTitle: title,
          content: content,
        };
      }

      return {
        id: `mem-${idx}`,
        researchTitle: 'General Research',
        content: String(m),
      };
    });

    return NextResponse.json({ memories: formatted });
  } catch (error: any) {
    console.error('Error fetching workspace memories:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch workspace memories' }, { status: 500 });
  }
}
