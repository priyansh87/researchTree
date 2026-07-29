import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    workspaceId: string;
  }>;
}

// PATCH update workspace details
export async function PATCH(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { workspaceId } = await params;

  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    // Check if the user is the owner of the workspace to rename it
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, userId)));

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or unauthorized' }, { status: 404 });
    }

    await db
      .update(workspaces)
      .set({ name, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));

    return NextResponse.json({ success: true, workspace: { ...workspace, name } });
  } catch (error: any) {
    console.error('Error updating workspace:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update workspace' }, { status: 500 });
  }
}

// DELETE workspace
export async function DELETE(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { workspaceId } = await params;

  try {
    // Only the owner can delete the workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, userId)));

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or unauthorized to delete' }, { status: 404 });
    }

    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));

    return NextResponse.json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete workspace' }, { status: 500 });
  }
}
