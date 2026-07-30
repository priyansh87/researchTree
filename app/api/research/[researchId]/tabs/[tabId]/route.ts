import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { chatTabs, researchItems, workspaceMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    researchId: string;
    tabId: string;
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

// PUT update chat tab settings
export async function PUT(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { researchId, tabId } = await params;

  try {
    const hasAccess = await checkResearchAccess(researchId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized research access' }, { status: 403 });
    }

    const { name, memoryMode, selectedNodeIds } = await request.json();

    const [existingTab] = await db
      .select()
      .from(chatTabs)
      .where(and(eq(chatTabs.id, tabId), eq(chatTabs.researchId, researchId)));

    if (!existingTab) {
      return NextResponse.json({ error: 'Chat tab not found' }, { status: 404 });
    }

    const updatedFields: any = {
      updatedAt: new Date(),
    };
    if (name !== undefined) updatedFields.name = name.trim();
    if (memoryMode !== undefined) updatedFields.memoryMode = memoryMode;
    if (selectedNodeIds !== undefined) updatedFields.selectedNodeIds = selectedNodeIds;

    await db
      .update(chatTabs)
      .set(updatedFields)
      .where(eq(chatTabs.id, tabId));

    return NextResponse.json({ tab: { ...existingTab, ...updatedFields } });
  } catch (error: any) {
    console.error('Error updating chat tab:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update chat tab' }, { status: 500 });
  }
}

// DELETE a chat tab
export async function DELETE(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { researchId, tabId } = await params;

  try {
    const hasAccess = await checkResearchAccess(researchId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized research access' }, { status: 403 });
    }

    const [existingTab] = await db
      .select()
      .from(chatTabs)
      .where(and(eq(chatTabs.id, tabId), eq(chatTabs.researchId, researchId)));

    if (!existingTab) {
      return NextResponse.json({ error: 'Chat tab not found' }, { status: 404 });
    }

    await db
      .delete(chatTabs)
      .where(eq(chatTabs.id, tabId));

    return NextResponse.json({ success: true, message: 'Chat tab deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting chat tab:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete chat tab' }, { status: 500 });
  }
}
