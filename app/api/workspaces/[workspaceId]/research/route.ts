import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { researchItems, workspaceMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    workspaceId: string;
  }>;
}

// Helper to check if user is in workspace
async function checkWorkspaceMember(workspaceId: string, userId: string) {
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
  return !!member;
}

// GET all research items in a workspace
export async function GET(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { workspaceId } = await params;

  // Check optional folderId search param
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId');

  try {
    const isMember = await checkWorkspaceMember(workspaceId, userId);
    if (!isMember) {
      return NextResponse.json({ error: 'Unauthorized workspace access' }, { status: 403 });
    }

    let query = db
      .select()
      .from(researchItems)
      .where(
        folderId
          ? and(eq(researchItems.workspaceId, workspaceId), eq(researchItems.folderId, folderId))
          : eq(researchItems.workspaceId, workspaceId)
      );

    const items = await query;
    return NextResponse.json({ research: items });
  } catch (error: any) {
    console.error('Error fetching research items:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch research items' }, { status: 500 });
  }
}

// POST create new research item
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

    const { title, description, category, folderId } = await request.json();
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Research title is required' }, { status: 400 });
    }

    const researchId = title.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

    const values = {
      id: researchId,
      title,
      description: description || '',
      category: category || 'General',
      folderId: folderId || null,
      workspaceId,
      memory: '',
    };

    await db.insert(researchItems).values(values);

    return NextResponse.json({ research: values });
  } catch (error: any) {
    console.error('Error creating research item:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create research item' }, { status: 500 });
  }
}
