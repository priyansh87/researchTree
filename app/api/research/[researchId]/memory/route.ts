import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { memoryItems, researchItems, workspaceMembers } from '@/lib/db/schema';
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

import { searchMem0Memories } from '@/lib/agents/research-agent';

// GET all memory items for a research
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

    const [research] = await db
      .select()
      .from(researchItems)
      .where(eq(researchItems.id, researchId));

    if (!research) {
      return NextResponse.json({ error: 'Research not found' }, { status: 404 });
    }

    const workspaceId = research.workspaceId;

    // Fetch memory items using the agent helper
    const memories = await searchMem0Memories(userId, workspaceId, researchId);
    
    // Map list of strings to client-expected objects with IDs
    const mappedMemories = memories.map((m: any, index: number) => {
      if (typeof m === 'object' && m !== null) {
        return {
          id: m.id || `mem-${index}`,
          content: m.content || m.memory || JSON.stringify(m),
        };
      }
      return {
        id: `mem-${index}`,
        content: String(m),
      };
    });

    return NextResponse.json({ memory: mappedMemories });
  } catch (error: any) {
    console.error('Error fetching memories:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch memories' }, { status: 500 });
  }
}

// POST create a memory item
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

    const { content } = await request.json();
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Memory content is required' }, { status: 400 });
    }

    const memoryId = Math.random().toString(36).substring(2, 15);

    const values = {
      id: memoryId,
      researchId,
      content,
    };

    await db.insert(memoryItems).values(values);

    return NextResponse.json({ memory: values });
  } catch (error: any) {
    console.error('Error creating memory:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create memory' }, { status: 500 });
  }
}

// DELETE a memory item
export async function DELETE(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { researchId } = await params;

  // Retrieve memoryItemId from query parameters
  const { searchParams } = new URL(request.url);
  const memoryItemId = searchParams.get('id');

  if (!memoryItemId) {
    return NextResponse.json({ error: 'Memory item ID is required' }, { status: 400 });
  }

  try {
    const hasAccess = await checkResearchAccess(researchId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized research access' }, { status: 403 });
    }

    await db
      .delete(memoryItems)
      .where(and(eq(memoryItems.id, memoryItemId), eq(memoryItems.researchId, researchId)));

    return NextResponse.json({ success: true, message: 'Memory item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting memory:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete memory' }, { status: 500 });
  }
}
