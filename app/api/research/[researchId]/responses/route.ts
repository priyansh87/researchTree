import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { researchResponses, researchItems, workspaceMembers, sources, relatedResearch, researchTopics, chatTabs } from '@/lib/db/schema';
import { eq, and, asc, sql, isNull, inArray } from 'drizzle-orm';

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

import { analyzeQuery, generateResearchReport, addMem0Memory, clearMem0Memories, searchWorkspaceMem0Memories, searchMem0Memories } from '@/lib/agents/research-agent';

async function processTopicMetadata(
  researchId: string,
  topicMetadata: { topic: string; parent: string | null; keywords: string[]; summary: string } | null | undefined
) {
  if (!topicMetadata || !topicMetadata.topic) return;

  const topicTitle = topicMetadata.topic.trim();
  const parentTitle = topicMetadata.parent?.trim();

  // 1. Check if the topic already exists for this research (case-insensitive)
  const [existingTopic] = await db
    .select()
    .from(researchTopics)
    .where(
      and(
        eq(researchTopics.researchId, researchId),
        sql`lower(${researchTopics.title}) = lower(${topicTitle})`
      )
    );

  if (existingTopic) {
    // Smart merge: update summary, merge and deduplicate keywords, update updatedAt
    const existingKeywords = Array.isArray(existingTopic.keywords) ? existingTopic.keywords as string[] : [];
    const mergedKeywords = Array.from(new Set([...existingKeywords, ...(topicMetadata.keywords || [])]));

    await db
      .update(researchTopics)
      .set({
        summary: topicMetadata.summary || existingTopic.summary,
        keywords: mergedKeywords,
        updatedAt: new Date(),
      })
      .where(eq(researchTopics.id, existingTopic.id));
  } else {
    // Look up if parent exists
    let parentId: string | null = null;
    if (parentTitle) {
      const [existingParent] = await db
        .select()
        .from(researchTopics)
        .where(
          and(
            eq(researchTopics.researchId, researchId),
            sql`lower(${researchTopics.title}) = lower(${parentTitle})`
          )
        );

      if (existingParent) {
        parentId = existingParent.id;
      } else {
        // Auto-create parent topic node
        parentId = Math.random().toString(36).substring(2, 15);
        await db.insert(researchTopics).values({
          id: parentId,
          researchId,
          title: parentTitle,
          summary: `Parent category for ${topicTitle}`,
          keywords: [],
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Create new child topic node
    const newTopicId = Math.random().toString(36).substring(2, 15);
    await db.insert(researchTopics).values({
      id: newTopicId,
      researchId,
      title: topicTitle,
      summary: topicMetadata.summary || 'Summary',
      keywords: topicMetadata.keywords || [],
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// Helper to extract json-chart code blocks
function parseChartsFromMarkdown(markdown: string) {
  const chartRegex = /```json-chart\s*([\s\S]*?)\s*```/g;
  const charts: any[] = [];
  let match;
  while ((match = chartRegex.exec(markdown)) !== null) {
    try {
      charts.push(JSON.parse(match[1]));
    } catch (e) {
      console.error('Failed to parse json-chart block:', e);
    }
  }
  const cleanedContent = markdown.replace(chartRegex, '').trim();
  return { charts, cleanedContent };
}

// GET all responses for a research item
export async function GET(request: Request, { params }: RouteParams) {
  const { data: session } = await auth.getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { researchId } = await params;

  // Retrieve chatTabId from query parameters
  const { searchParams } = new URL(request.url);
  const chatTabId = searchParams.get('chatTabId');

  try {
    const hasAccess = await checkResearchAccess(researchId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized research access' }, { status: 403 });
    }

    const responses = await db
      .select()
      .from(researchResponses)
      .where(
        and(
          eq(researchResponses.researchId, researchId),
          chatTabId && chatTabId !== 'main'
            ? eq(researchResponses.chatTabId, chatTabId)
            : isNull(researchResponses.chatTabId)
        )
      )
      .orderBy(asc(researchResponses.createdAt));

    return NextResponse.json({ responses });
  } catch (error: any) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch responses' }, { status: 500 });
  }
}

// POST a new response (handles Planner Agent choices and report synthesis)
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

    const { type, content, choices, chatTabId } = await request.json();

    if (!type || !content) {
      return NextResponse.json({ error: 'Type and content are required' }, { status: 400 });
    }

    // 1. Retrieve the research detail to get workspaceId
    const [research] = await db
      .select()
      .from(researchItems)
      .where(eq(researchItems.id, researchId));

    if (!research) {
      return NextResponse.json({ error: 'Research item not found' }, { status: 404 });
    }

    const workspaceId = research.workspaceId;
    const tabIdDb = chatTabId && chatTabId !== 'main' ? chatTabId : null;

    // 2. Save the user's incoming response to the database
    const userResponseId = Math.random().toString(36).substring(2, 15);
    const userResponse = {
      id: userResponseId,
      researchId,
      chatTabId: tabIdDb,
      type: 'user',
      content,
      summary: null,
      sourcesCount: 0,
      citationsCount: 0,
      confidence: '100%',
      expanded: false,
      charts: choices ? [choices] : [], // Store choices inside user turn charts array for reference
      createdAt: new Date(),
    };

    await db.insert(researchResponses).values(userResponse);

    // 3. Fetch conversation history for context
    const history = await db
      .select()
      .from(researchResponses)
      .where(
        and(
          eq(researchResponses.researchId, researchId),
          tabIdDb
            ? eq(researchResponses.chatTabId, tabIdDb)
            : isNull(researchResponses.chatTabId)
        )
      )
      .orderBy(asc(researchResponses.createdAt));

    // Retrieve custom memory scope paths for the active tab context
    let memories: any[] = [];
    if (tabIdDb) {
      const [tab] = await db
        .select()
        .from(chatTabs)
        .where(eq(chatTabs.id, tabIdDb));

      if (tab) {
        if (tab.memoryMode === 'workspace') {
          memories = await searchWorkspaceMem0Memories(userId, workspaceId);
        } else if (tab.memoryMode === 'research') {
          memories = await searchMem0Memories(userId, workspaceId, researchId);
        } else if (tab.memoryMode === 'custom') {
          const nodeIds = tab.selectedNodeIds as string[];
          if (nodeIds && nodeIds.length > 0) {
            const selectedTopics = await db
              .select()
              .from(researchTopics)
              .where(inArray(researchTopics.id, nodeIds));

            for (const topic of selectedTopics) {
              const topicMems = await searchMem0Memories(userId, workspaceId, researchId, topic.title);
              memories.push(...topicMems);
            }
          }
        }
      }
    } else {
      memories = await searchMem0Memories(userId, workspaceId, researchId);
    }

    // 4. Run the Agentic Logic based on prompt / choice submission
    let assistantResponse;

    if (choices && Object.keys(choices).length > 0) {
      // CASE A: User submitted questionnaire choices, compile final report
      // Fetch the last normal user message from history for context if current is just selections
      const lastUserMessage = history
        .slice()
        .reverse()
        .find((h) => h.type === 'user' && !h.content.includes('Choices submitted'))?.content || content;

      // Extract topic from last query for memory categorization
      const queryAnalysis = await analyzeQuery(lastUserMessage, history.slice(0, -1));
      const topic = queryAnalysis.topic || 'general';

      const reportData = await generateResearchReport(lastUserMessage, choices, history.slice(0, -1), memories);
      const { charts, cleanedContent } = parseChartsFromMarkdown(reportData.markdown || '');

      if (reportData.topicMetadata) {
        await processTopicMetadata(researchId, reportData.topicMetadata);
      }

      const assistantResponseId = Math.random().toString(36).substring(2, 15);
      assistantResponse = {
        id: assistantResponseId,
        researchId,
        chatTabId: tabIdDb,
        type: 'assistant',
        content: cleanedContent,
        summary: `Synthesized Research Report on ${topic}`,
        sourcesCount: reportData.sources?.length || 4,
        citationsCount: (reportData.sources?.length || 4) + 2,
        confidence: '95%',
        expanded: true,
        charts: charts,
        createdAt: new Date(),
      };

      await db.insert(researchResponses).values(assistantResponse);

      // Save sources context
      if (reportData.sources && reportData.sources.length > 0) {
        for (const src of reportData.sources) {
          await db.insert(sources).values({
            id: Math.random().toString(36).substring(2, 15),
            researchId,
            domain: src.domain || 'reference.org',
            title: src.title || 'Resource Link',
            trust: src.trust || 90,
            url: src.url || null,
          });
        }
      }

      // Save related research context
      if (reportData.relatedResearch && reportData.relatedResearch.length > 0) {
        for (const rel of reportData.relatedResearch) {
          await db.insert(relatedResearch).values({
            id: Math.random().toString(36).substring(2, 15),
            researchId,
            title: rel.title || 'Related Study',
            icon: rel.icon || '📄',
            studies: rel.studies || 0,
          });
        }
      }

      // Save facts / memory
      if (reportData.facts && reportData.facts.length > 0) {
        for (const fact of reportData.facts) {
          await addMem0Memory(userId, workspaceId, researchId, topic, fact);
        }
      } else {
        await addMem0Memory(
          userId,
          workspaceId,
          researchId,
          topic,
          `User researched '${lastUserMessage}' with criteria: ${JSON.stringify(choices)}.`
        );
      }

    } else {
      // CASE B: Standard user query, run Planner Agent check
      const queryAnalysis = await analyzeQuery(content, history.slice(0, -1));
      const topic = queryAnalysis.topic || 'general';

      if (queryAnalysis.intent === 'conversational') {
        // Conversational greeting or small talk
        const assistantResponseId = Math.random().toString(36).substring(2, 15);
        assistantResponse = {
          id: assistantResponseId,
          researchId,
          chatTabId: tabIdDb,
          type: 'assistant',
          content: queryAnalysis.conversationalReply || "Hello! How can I help you with your research today?",
          summary: "Greeting",
          sourcesCount: 0,
          citationsCount: 0,
          confidence: '100%',
          expanded: true,
          charts: [],
          createdAt: new Date(),
        };

        await db.insert(researchResponses).values(assistantResponse);

      } else if (queryAnalysis.clarificationNeeded && queryAnalysis.questions?.length > 0) {
        // Planner needs more info, save structured questions as clarification JSON
        const assistantResponseId = Math.random().toString(36).substring(2, 15);
        assistantResponse = {
          id: assistantResponseId,
          researchId,
          chatTabId: tabIdDb,
          type: 'assistant',
          content: JSON.stringify({
            isClarification: true,
            questions: queryAnalysis.questions,
            topic: topic,
          }),
          summary: `Clarifying research criteria for ${topic}`,
          sourcesCount: 0,
          citationsCount: 0,
          confidence: '100%',
          expanded: true,
          charts: [],
          createdAt: new Date(),
        };

        await db.insert(researchResponses).values(assistantResponse);

      } else {
        // Enough details present, generate research directly
        const reportData = await generateResearchReport(content, {}, history.slice(0, -1), memories);
        const { charts, cleanedContent } = parseChartsFromMarkdown(reportData.markdown || '');

        if (reportData.topicMetadata) {
          await processTopicMetadata(researchId, reportData.topicMetadata);
        }

        const assistantResponseId = Math.random().toString(36).substring(2, 15);
        assistantResponse = {
          id: assistantResponseId,
          researchId,
          chatTabId: tabIdDb,
          type: 'assistant',
          content: cleanedContent,
          summary: `Compiled Research Report on ${topic}`,
          sourcesCount: reportData.sources?.length || 3,
          citationsCount: (reportData.sources?.length || 3) + 2,
          confidence: '92%',
          expanded: true,
          charts: charts,
          createdAt: new Date(),
        };

        await db.insert(researchResponses).values(assistantResponse);

        // Save sources context
        if (reportData.sources && reportData.sources.length > 0) {
          for (const src of reportData.sources) {
            await db.insert(sources).values({
              id: Math.random().toString(36).substring(2, 15),
              researchId,
              domain: src.domain || 'reference.org',
              title: src.title || 'Resource Link',
              trust: src.trust || 90,
              url: src.url || null,
            });
          }
        }

        // Save related research context
        if (reportData.relatedResearch && reportData.relatedResearch.length > 0) {
          for (const rel of reportData.relatedResearch) {
            await db.insert(relatedResearch).values({
              id: Math.random().toString(36).substring(2, 15),
              researchId,
              title: rel.title || 'Related Study',
              icon: rel.icon || '📄',
              studies: rel.studies || 0,
            });
          }
        }

        // Save facts / memory
        if (reportData.facts && reportData.facts.length > 0) {
          for (const fact of reportData.facts) {
            await addMem0Memory(userId, workspaceId, researchId, topic, fact);
          }
        } else {
          await addMem0Memory(
            userId,
            workspaceId,
            researchId,
            topic,
            `User researched '${content}' under topic: ${topic}.`
          );
        }
      }
    }

    return NextResponse.json({
      userResponse,
      response: assistantResponse,
    });
  } catch (error: any) {
    console.error('Error adding response:', error);
    return NextResponse.json({ error: error?.message || 'Failed to add response' }, { status: 500 });
  }
}

// DELETE all responses for a research item (clear chat)
export async function DELETE(request: Request, { params }: RouteParams) {
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

    // Retrieve research item to obtain workspaceId
    const [research] = await db
      .select()
      .from(researchItems)
      .where(eq(researchItems.id, researchId));

    if (research) {
      const workspaceId = research.workspaceId;
      // Clear local and remote Mem0 memories
      await clearMem0Memories(userId, workspaceId, researchId);
    }

    // Delete all topics for this research item
    await db
      .delete(researchTopics)
      .where(eq(researchTopics.researchId, researchId));

    // Delete all sources for this research item
    await db
      .delete(sources)
      .where(eq(sources.researchId, researchId));

    // Delete all responses for this research item
    await db
      .delete(researchResponses)
      .where(eq(researchResponses.researchId, researchId));

    return NextResponse.json({ message: 'Chat, sources, topics, and memories cleared successfully' });
  } catch (error: any) {
    console.error('Error clearing chat:', error);
    return NextResponse.json({ error: error?.message || 'Failed to clear chat' }, { status: 500 });
  }
}
