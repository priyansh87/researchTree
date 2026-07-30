import { db } from '@/lib/db';
import { memoryItems } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { Annotation, StateGraph, END, START } from "@langchain/langgraph";

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MEM0_API_URL = 'https://api.mem0.ai/v3/memories';

// Call Groq LLM API with retries, exponential backoff, and model failover
async function callGroq(
  messages: any[],
  jsonMode = false,
  retries = 3,
  delayMs = 2000,
  modelIndex = 0
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not defined.');
  }

  // Define models list to cycle through in case of rate limits (429)
  const models = ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'llama-3.1-8b-instant'];
  const currentModel = models[modelIndex] || models[0];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: currentModel,
        messages,
        temperature: 0.2,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (response.status === 429 && retries > 0) {
      console.warn(`Groq rate limit (429) encountered. Retrying in ${delayMs}ms with model failover...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return callGroq(messages, jsonMode, retries - 1, delayMs * 2, (modelIndex + 1) % models.length);
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API Error:', errText);
      throw new Error(`Groq API returned error status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (err) {
    if (retries > 0) {
      console.warn(`Groq connection error. Retrying in ${delayMs}ms...`, err);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return callGroq(messages, jsonMode, retries - 1, delayMs * 2, (modelIndex + 1) % models.length);
    }
    throw err;
  }
}

// Call Tavily Search API
async function callTavily(query: string): Promise<any[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.log('No TAVILY_API_KEY found. Falling back to LLM-simulated web results.');
    return [];
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_answer: false,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.results || [];
    } else {
      const text = await res.text();
      console.error('Tavily API Error:', text);
      return [];
    }
  } catch (err) {
    console.error('Failed to search Tavily:', err);
    return [];
  }
}

// Defensive JSON clean and parse helper
function cleanAndParseJSON(text: string) {
  let cleaned = text.trim();
  // Remove markdown code block wrappers
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  
  // Find first '{' and last '}' to strip any surrounding text just in case
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  
  return JSON.parse(cleaned);
}

// Helper to extract JSON metadata block from markdown content safely
function parseMetadataFromResponse(content: string) {
  const regex = /```json-metadata\s*([\s\S]*?)\s*```/;
  const match = regex.exec(content);
  
  let metadata = {
    sources: [],
    relatedResearch: [],
    facts: []
  };
  
  let cleanedMarkdown = content;
  
  if (match) {
    try {
      metadata = cleanAndParseJSON(match[1]);
      cleanedMarkdown = content.replace(regex, '').trim();
    } catch (e) {
      console.error('Failed to parse json-metadata block:', e);
    }
  }
  
  return { metadata, cleanedMarkdown };
}

// Define the LangGraph State Annotation Schema
const AgentStateAnnotation = Annotation.Root({
  prompt: Annotation<string>,
  choices: Annotation<Record<string, string>>,
  history: Annotation<any[]>,
  topic: Annotation<string>,
  intent: Annotation<'conversational' | 'research'>,
  clarificationNeeded: Annotation<boolean>,
  questions: Annotation<any[]>,
  conversationalReply: Annotation<string | null>,
  searchQuery: Annotation<string | null>,
  searchResults: Annotation<any[]>,
  memories: Annotation<any[]>,
  report: Annotation<{
    markdown: string;
    sources: Array<{ domain: string; title: string; trust: number; url: string }>;
    relatedResearch: Array<{ title: string; icon: string; studies: number }>;
    facts: string[];
    topicMetadata?: {
      topic: string;
      parent: string | null;
      keywords: string[];
      summary: string;
    } | null;
  } | null>,
});

// LANGGRAPH NODES

// Node 1: Orchestrator / Intent Decision Node
async function orchestratorNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  // Check if choices are already present (follow-up choices submission step)
  if (state.choices && Object.keys(state.choices).length > 0) {
    const lastUserMessage = state.history
      .slice()
      .reverse()
      .find((h) => h.type === 'user' && !h.content.includes('Choices submitted'))?.content || state.prompt;

    const systemPrompt = `You are a query classifier. The user has submitted selections for: "${lastUserMessage}".
Extract the topic category name (e.g. "gaming-laptop", "camera") and a search query for Tavily (e.g. "best action cameras under 500 dollars specs").
    
You MUST respond with a JSON object:
{
  "topic": "topic-slug",
  "searchQuery": "tavily search query string"
}`;
    try {
      const responseText = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Selections:\n${JSON.stringify(state.choices)}` }
      ], true);
      const parsed = cleanAndParseJSON(responseText);
      return {
        intent: 'research',
        clarificationNeeded: false,
        questions: [],
        topic: parsed.topic || 'general-research',
        searchQuery: parsed.searchQuery || lastUserMessage,
      };
    } catch (e) {
      console.error('Error in orchestrator choices classification:', e);
      return {
        intent: 'research',
        clarificationNeeded: false,
        questions: [],
        topic: 'general-research',
        searchQuery: lastUserMessage,
      };
    }
  }

  // Normal orchestrator check
  const systemPrompt = `You are the Orchestrator for an AI-powered Research Platform.
Your task is to analyze the user's input and determine their intent:
1. "conversational": Simple greetings (e.g. "hi", "hello", "hey", "how are you"), check-ins, general chat, or questions about what you can do.
2. "research": An actual request to find, compare, analyze, or research a topic (e.g. "find me a laptop", "explain quantum computing", "compare iPhone and Samsung", "buying a shop").

For "conversational" intent:
- Set "intent" to "conversational".
- Set "clarificationNeeded" to false.
- Set "conversationalReply" to a friendly, context-appropriate reply welcoming the user, acknowledging their message, and prompting them for a research topic (keep it under 3 sentences).
- Set "topic" to "general".
- Set "searchQuery" to null.
- Set "questions" to an empty array.

For "research" intent:
- Set "intent" to "research".
- Set "conversationalReply" to null.
- Evaluate if critical details are missing to compile a high-quality report.
  - If details are missing, set "clarificationNeeded" to true, and return 1-3 DYNAMIC, highly specific, intelligent multiple-choice questions in the "questions" array tailored EXACTLY to the user's specific topic.
  - If enough detail is already present, set "clarificationNeeded" to false, return an empty questions array, and extract a search query for Tavily in "searchQuery" (e.g. "buying retail shop requirements property values").
- "topic": Choose a short, clean topic name representing the category (e.g. 'gaming-laptop', 'quantum-physics', 'retail-shop').

You MUST respond with a JSON object matching this schema:
{
  "intent": "conversational" | "research",
  "conversationalReply": string | null,
  "clarificationNeeded": boolean,
  "questions": [
    {
      "id": "unique-slug",
      "question": "Clear, intelligent, highly-specific question tailored to the topic",
      "choices": ["Option A", "Option B", "Option C"]
    }
  ],
  "topic": "topic-name",
  "searchQuery": string | null
}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...state.history.slice(-6).map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
    { role: 'user', content: state.prompt },
  ];

  try {
    const responseText = await callGroq(messages, true);
    const parsed = cleanAndParseJSON(responseText);
    return {
      intent: parsed.intent || 'research',
      conversationalReply: parsed.conversationalReply || null,
      clarificationNeeded: parsed.clarificationNeeded || false,
      questions: parsed.questions || [],
      topic: parsed.topic || 'general-research',
      searchQuery: parsed.searchQuery || null,
    };
  } catch (err) {
    console.error('Failed in orchestratorNode:', err);
    return {
      intent: 'research',
      clarificationNeeded: false,
      topic: 'general-research',
      searchQuery: state.prompt,
    };
  }
}

// Node 2: Tavily Search Node
async function tavilySearchNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  const query = state.searchQuery || state.prompt;
  let results = await callTavily(query);
  
  // Fallback search results simulation using Groq
  if (results.length === 0) {
    const systemPrompt = `You are a web search simulation agent.
Generate 3 realistic search results snippet for the query: "${query}".
Ensure they represent niche, credible data, specifications, and articles.

You MUST respond with a JSON object matching this schema:
{
  "results": [
    {
      "title": "Article Title",
      "url": "https://credible-site.org/article",
      "content": "Rich detailed paragraph summary containing mock search details."
    }
  ]
}`;
    try {
      const responseText = await callGroq([{ role: 'system', content: systemPrompt }], true);
      const parsed = cleanAndParseJSON(responseText);
      results = parsed.results || [];
    } catch (e) {
      console.error('Error generating fallback search results:', e);
    }
  }

  return { searchResults: results };
}

// Node 3: Synthesizer Node (generates final friendly response + code block metadata)
async function synthesizerNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  const choicesStr = Object.entries(state.choices)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  const searchResultsStr = state.searchResults
    .map((r, i) => `[Source ${i+1}]: ${r.title} (${r.url})\nSnippet: ${r.content}`)
    .join('\n\n');

  const memoriesStr = state.memories && state.memories.length > 0
    ? state.memories.map((m: any, i) => `[Memory ${i+1}]: ${m.content || m.memory || String(m)}`).join('\n')
    : 'No prior memories found for this scope.';

  const systemPrompt = `You are a premium, expert AI Deep Research synthesis agent.
Write a detailed, friendly, and natural chat response answering the user's query in detail (similar to responses from ChatGPT, Gemini, or Claude). Talk directly to the user. Use bolding, tables, bullet points, and headers naturally in markdown.
Incorporate the user's choices:
${choicesStr}

Incorporate user preferences and historical facts from active memory paths:
${memoriesStr}

Incorporate the web search findings:
${searchResultsStr}

To display comparison charts inside your response markdown, you can output a fenced code block with language "json-chart" containing the chart configuration. Make sure it is valid JSON.
Example:
\`\`\`json-chart
{
  "type": "bar",
  "data": [
    {"name": "Option A", "Performance": 90, "Value": 85},
    {"name": "Option B", "Performance": 95, "Value": 70}
  ],
  "keys": ["Performance", "Value"]
}
\`\`\`

At the very end of your response, output a fenced code block with language "json-metadata" containing the structural metadata for the database. Make sure it is valid JSON.
Example format:
\`\`\`json-metadata
{
  "topicMetadata": {
    "topic": "Gaming Laptops",
    "parent": "Laptops",
    "keywords": ["RTX 5070", "Budget", "Performance"],
    "summary": "Comparison of gaming laptops using RTX 5070."
  },
  "sources": [
    {
      "domain": "niche-website.com",
      "title": "Insightful Title of Article/Resource",
      "trust": 95,
      "url": "https://example.com/some-resource"
    }
  ],
  "relatedResearch": [
    {
      "title": "Name of a related research topic",
      "icon": "📄",
      "studies": 14
    }
  ],
  "facts": [
    "User prefers X",
    "User budget is Y"
  ]
}
\`\`\``;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...state.history.slice(-10).map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
    { role: 'user', content: `Research Prompt: ${state.prompt}\n\nClarifying user selections:\n${choicesStr}\n\nSearch Context:\n${searchResultsStr}` },
  ];

  try {
    // Generate text response (non JSON-mode!)
    const responseText = await callGroq(messages, false);
    
    // Parse the output to separate markdown text and metadata block
    const { metadata, cleanedMarkdown } = parseMetadataFromResponse(responseText);

    return {
      report: {
        markdown: cleanedMarkdown,
        sources: metadata.sources || [],
        relatedResearch: metadata.relatedResearch || [],
        facts: metadata.facts || [],
        topicMetadata: metadata.topicMetadata || null,
      },
    };
  } catch (err) {
    console.error('Failed in synthesizerNode:', err);
    return {
      report: {
        markdown: `Hello! I encountered an error compiling the research on: ${state.prompt}. Please try again.`,
        sources: [],
        relatedResearch: [],
        facts: [`User researched ${state.topic}`],
        topicMetadata: null,
      },
    };
  }
}

// COMPILE THE NATIVE LANGGRAPH STATEGRAPH WORKFLOW

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode('orchestrator', orchestratorNode)
  .addNode('tavily_search', tavilySearchNode)
  .addNode('synthesizer', synthesizerNode)
  .addEdge(START, 'orchestrator');

// Add conditional route edge from orchestrator
workflow.addConditionalEdges('orchestrator', (state) => {
  if (state.intent === 'conversational') return END;
  if (state.clarificationNeeded) return END;
  return 'tavily_search';
});

workflow.addEdge('tavily_search', 'synthesizer');
workflow.addEdge('synthesizer', END);

const app = workflow.compile();

// Main Graph invocation function
export async function runResearchAgentWorkflow(
  prompt: string,
  choices: Record<string, string> = {},
  history: any[] = [],
  memories: any[] = []
): Promise<typeof AgentStateAnnotation.State> {
  const initialState = {
    prompt,
    choices,
    history,
    memories,
    topic: 'general',
    intent: 'research' as const,
    clarificationNeeded: false,
    questions: [],
    conversationalReply: null,
    searchQuery: null,
    searchResults: [],
    report: null,
  };

  return await app.invoke(initialState);
}

// Backwards compatibility functions to avoid breaking imports
export async function analyzeQuery(prompt: string, history: any[] = []) {
  const result = await runResearchAgentWorkflow(prompt, {}, history);
  return {
    intent: result.intent,
    conversationalReply: result.conversationalReply,
    clarificationNeeded: result.clarificationNeeded,
    questions: result.questions,
    topic: result.topic,
  };
}

export async function generateResearchReport(
  prompt: string,
  choices: Record<string, string> = {},
  history: any[] = [],
  memories: any[] = []
) {
  const result = await runResearchAgentWorkflow(prompt, choices, history, memories);
  return result.report || {
    markdown: `### Fallback Report on: ${prompt}`,
    sources: [],
    relatedResearch: [],
    facts: [],
  };
}

// 3. Add facts / conversation turns to Mem0 memory
export async function addMem0Memory(
  userId: string,
  workspaceId: string,
  researchId: string,
  topic: string,
  content: string
) {
  const apiKey = process.env.MEM0_API_KEY;

  if (!apiKey) {
    console.log('No MEM0_API_KEY found. Logging memory to local database table.');
    try {
      await db.insert(memoryItems).values({
        id: Math.random().toString(36).substring(2, 15),
        researchId,
        content: `Topic: ${topic} - ${content}`,
      });
    } catch (err) {
      console.error('Error inserting local memory item:', err);
    }
    return;
  }

  try {
    const res = await fetch(`${MEM0_API_URL}/add/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content }],
        user_id: userId,
        metadata: {
          workspaceId,
          researchId,
          topic,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Mem0 Add Memory API Error:', text);
    }
  } catch (err) {
    console.error('Failed to sync memory to Mem0:', err);
  }
}

// 4. Search and retrieve memories from Mem0
export async function searchMem0Memories(
  userId: string,
  workspaceId: string,
  researchId: string,
  topic?: string
) {
  const apiKey = process.env.MEM0_API_KEY;

  if (!apiKey) {
    const localMemories = await db
      .select()
      .from(memoryItems)
      .where(eq(memoryItems.researchId, researchId));
    return localMemories.map((m) => m.content);
  }

  try {
    const res = await fetch(`${MEM0_API_URL}/search/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({
        query: topic ? `What do you know about ${topic}?` : 'What do you know about my research interests?',
        filters: {
          user_id: userId,
          metadata: {
            workspaceId,
            researchId,
            ...(topic ? { topic } : {}),
          },
        },
        top_k: 15,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const arrayData = Array.isArray(data) ? data : (data.results || []);
      return arrayData;
    } else {
      const text = await res.text();
      console.error('Mem0 Search Memory API Error:', text);
      return [];
    }
  } catch (err) {
    console.error('Failed to search Mem0 memories:', err);
    return [];
  }
}

// 5. Delete all memories for a research item from local DB and Mem0
export async function clearMem0Memories(
  userId: string,
  workspaceId: string,
  researchId: string
) {
  const apiKey = process.env.MEM0_API_KEY;

  try {
    await db.delete(memoryItems).where(eq(memoryItems.researchId, researchId));
  } catch (err) {
    console.error('Error clearing local memories:', err);
  }

  if (!apiKey) return;

  try {
    const memories = await searchMem0Memories(userId, workspaceId, researchId);
    for (const mem of memories) {
      if (typeof mem === 'object' && mem !== null && mem.id) {
        await fetch(`${MEM0_API_URL}/${mem.id}/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Token ${apiKey}`,
          },
        });
      }
    }
  } catch (err) {
    console.error('Failed to clear remote Mem0 memories:', err);
  }
}

// 6. Search all memories in a workspace
export async function searchWorkspaceMem0Memories(
  userId: string,
  workspaceId: string
) {
  const apiKey = process.env.MEM0_API_KEY;

  if (!apiKey) {
    const workspaceResearch = await db
      .select({ id: researchItems.id })
      .from(researchItems)
      .where(eq(researchItems.workspaceId, workspaceId));

    if (workspaceResearch.length === 0) return [];
    const ids = workspaceResearch.map((r) => r.id);

    const localMemories = await db
      .select()
      .from(memoryItems)
      .where(inArray(memoryItems.researchId, ids));

    return localMemories;
  }

  try {
    const res = await fetch(`${MEM0_API_URL}/search/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({
        query: 'What do you know about all research topics and projects in this workspace?',
        filters: {
          user_id: userId,
          metadata: {
            workspaceId,
          },
        },
        top_k: 40,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const arrayData = Array.isArray(data) ? data : (data.results || []);
      return arrayData;
    } else {
      const text = await res.text();
      console.error('Mem0 Search Workspace Memory API Error:', text);
      return [];
    }
  } catch (err) {
    console.error('Failed to search Mem0 workspace memories:', err);
    return [];
  }
}
