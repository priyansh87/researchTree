import { pgTable, text, timestamp, boolean, integer, jsonb, customType } from 'drizzle-orm/pg-core';

// Mirroring the default Better Auth 'user' table handled by Neon Auth
export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});


export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workspaceMembers = pgTable('workspace_members', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // 'owner' | 'member'
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const researchFolders = pgTable('research_folders', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('📁'),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const researchItems = pgTable('research_items', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  category: text('category').notNull().default('General'),
  folderId: text('folder_id').references(() => researchFolders.id, { onDelete: 'set null' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  memory: text('memory').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const chatTabs = pgTable('chat_tabs', {
  id: text('id').primaryKey(),
  researchId: text('research_id').notNull().references(() => researchItems.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  memoryMode: text('memory_mode').notNull().default('research'), // 'workspace' | 'research' | 'custom'
  selectedNodeIds: jsonb('selected_node_ids').notNull().default('[]'), // array of active topic/node IDs
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const researchResponses = pgTable('research_responses', {
  id: text('id').primaryKey(),
  researchId: text('research_id').notNull().references(() => researchItems.id, { onDelete: 'cascade' }),
  chatTabId: text('chat_tab_id').references(() => chatTabs.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  summary: text('summary'),
  sourcesCount: integer('sources_count').notNull().default(0),
  citationsCount: integer('citations_count').notNull().default(0),
  confidence: text('confidence').notNull().default('100%'),
  expanded: boolean('expanded').notNull().default(false),
  charts: jsonb('charts').default('[]'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const memoryItems = pgTable('memory_items', {
  id: text('id').primaryKey(),
  researchId: text('research_id').notNull().references(() => researchItems.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sources = pgTable('sources', {
  id: text('id').primaryKey(),
  researchId: text('research_id').notNull().references(() => researchItems.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull(),
  title: text('title').notNull(),
  trust: integer('trust').notNull().default(100),
  url: text('url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const relatedResearch = pgTable('related_research', {
  id: text('id').primaryKey(),
  researchId: text('research_id').notNull().references(() => researchItems.id, { onDelete: 'cascade' }),
  relatedResearchId: text('related_research_id').references(() => researchItems.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  icon: text('icon').notNull().default('📄'),
  studies: integer('studies').notNull().default(0),
});

export const researchTopics = pgTable('research_topics', {
  id: text('id').primaryKey(),
  researchId: text('research_id').notNull().references(() => researchItems.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  keywords: jsonb('keywords').notNull().default('[]'),
  parentId: text('parent_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pgVector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(384)';
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: unknown): number[] {
    if (typeof value === 'string') {
      return value.slice(1, -1).split(',').map(Number);
    }
    return value as number[];
  }
});

export const pdfChunks = pgTable('pdf_chunks', {
  id: text('id').primaryKey(),
  researchId: text('research_id').notNull().references(() => researchItems.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  embedding: pgVector('embedding'),
  pageNumber: integer('page_number'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

