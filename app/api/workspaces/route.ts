import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { workspaces, workspaceMembers, users } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

async function ensureUserSynced(userObj: any) {
  if (!userObj || !userObj.id) return;
  
  try {
    const [existing] = await db.select().from(users).where(eq(users.id, userObj.id));
    if (!existing) {
      await db.insert(users).values({
        id: userObj.id,
        name: userObj.name || 'User',
        email: userObj.email,
        emailVerified: userObj.emailVerified || false,
        image: userObj.image || null,
        createdAt: userObj.createdAt ? new Date(userObj.createdAt) : new Date(),
        updatedAt: userObj.updatedAt ? new Date(userObj.updatedAt) : new Date(),
      });
    }
  } catch (err) {
    console.error('Error syncing user into public.user:', err);
  }
}


// GET all workspaces for the logged in user
export async function GET(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  await ensureUserSynced(session.user);

  try {
    // Retrieve workspaces where the user is either the owner or a member
    const userWorkspaces = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        ownerId: workspaces.ownerId,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(workspaces)
      .leftJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(
        or(
          eq(workspaces.ownerId, userId),
          eq(workspaceMembers.userId, userId)
        )
      );

    // Filter duplicates just in case (due to left join)
    const uniqueWorkspaces = Array.from(new Map(userWorkspaces.map(w => [w.id, w])).values());

    return NextResponse.json({ workspaces: uniqueWorkspaces });
  } catch (error: any) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch workspaces' }, { status: 500 });
  }
}

// POST create a new workspace
export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  await ensureUserSynced(session.user);

  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const workspaceId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

    // Create the workspace
    await db.insert(workspaces).values({
      id: workspaceId,
      name,
      ownerId: userId,
    });

    // Add owner as member
    await db.insert(workspaceMembers).values({
      id: Math.random().toString(36).substring(2, 15),
      workspaceId,
      userId,
      role: 'owner',
    });

    return NextResponse.json({ workspace: { id: workspaceId, name, ownerId: userId } });
  } catch (error: any) {
    console.error('Error creating workspace:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create workspace' }, { status: 500 });
  }
}
