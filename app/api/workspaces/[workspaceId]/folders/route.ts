import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { researchFolders, workspaceMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    workspaceId: string;
  }>;
}

// Helper to check if the user is a member of the workspace
async function checkWorkspaceMember(workspaceId: string, userId: string) {
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
  return !!member;
}

// GET all folders in a workspace
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

    const folders = await db
      .select()
      .from(researchFolders)
      .where(eq(researchFolders.workspaceId, workspaceId));

    return NextResponse.json({ folders });
  } catch (error: any) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch folders' }, { status: 500 });
  }
}

// POST create a new folder in workspace
export async function POST(request: Request, { params }: RouteParams) {
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

    const { name, icon } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const folderId = Math.random().toString(36).substring(2, 15);

    await db.insert(researchFolders).values({
      id: folderId,
      name,
      icon: icon || '📁',
      workspaceId,
    });

    return NextResponse.json({
      folder: {
        id: folderId,
        name,
        icon: icon || '📁',
        workspaceId,
      },
    });
  } catch (error: any) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create folder' }, { status: 500 });
  }
}
