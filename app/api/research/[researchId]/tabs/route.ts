import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { chatTabs, researchItems, workspaceMembers } from '@/lib/db/schema';
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

// GET all chat tabs for a research item
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

    const tabs = await db
      .select()
      .from(chatTabs)
      .where(eq(chatTabs.researchId, researchId))
      .orderBy(asc(chatTabs.createdAt));

    return NextResponse.json({ tabs });
  } catch (error: any) {
    console.error('Error fetching chat tabs:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch chat tabs' }, { status: 500 });
  }
}

// POST create a new chat tab
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

    const { name, memoryMode, selectedNodeIds } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Tab name is required' }, { status: 400 });
    }

    const newTabId = Math.random().toString(36).substring(2, 15);
    const newTab = {
      id: newTabId,
      researchId,
      name: name.trim(),
      memoryMode: memoryMode || 'research',
      selectedNodeIds: selectedNodeIds || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(chatTabs).values(newTab);

    return NextResponse.json({ tab: newTab });
  } catch (error: any) {
    console.error('Error creating chat tab:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create chat tab' }, { status: 500 });
  }
}
