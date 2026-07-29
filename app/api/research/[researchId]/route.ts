import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { researchItems, workspaceMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    researchId: string;
  }>;
}

// Helper to check access to research item based on workspace membership
async function checkResearchAccess(researchId: string, userId: string) {
  const [research] = await db
    .select()
    .from(researchItems)
    .where(eq(researchItems.id, researchId));

  if (!research) return { allowed: false, research: null };

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, research.workspaceId), eq(workspaceMembers.userId, userId)));

  return { allowed: !!member, research };
}

// GET details of specific research
export async function GET(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { researchId } = await params;

  try {
    const { allowed, research } = await checkResearchAccess(researchId, userId);
    if (!allowed || !research) {
      return NextResponse.json({ error: 'Research not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ research });
  } catch (error: any) {
    console.error('Error fetching research details:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch research details' }, { status: 500 });
  }
}

// PATCH update research meta
export async function PATCH(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { researchId } = await params;

  try {
    const { allowed, research } = await checkResearchAccess(researchId, userId);
    if (!allowed || !research) {
      return NextResponse.json({ error: 'Research not found or unauthorized' }, { status: 404 });
    }

    const { title, description, category, memory, folderId } = await request.json();

    const updates: Partial<typeof researchItems.$inferSelect> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (memory !== undefined) updates.memory = memory;
    if (folderId !== undefined) updates.folderId = folderId;

    await db
      .update(researchItems)
      .set(updates)
      .where(eq(researchItems.id, researchId));

    return NextResponse.json({ success: true, research: { ...research, ...updates } });
  } catch (error: any) {
    console.error('Error updating research details:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update research details' }, { status: 500 });
  }
}

// DELETE research
export async function DELETE(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { researchId } = await params;

  try {
    const { allowed, research } = await checkResearchAccess(researchId, userId);
    if (!allowed || !research) {
      return NextResponse.json({ error: 'Research not found or unauthorized' }, { status: 404 });
    }

    await db.delete(researchItems).where(eq(researchItems.id, researchId));

    return NextResponse.json({ success: true, message: 'Research item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting research:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete research' }, { status: 500 });
  }
}
