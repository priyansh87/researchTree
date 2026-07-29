CREATE TABLE "memory_items" (
	"id" text PRIMARY KEY NOT NULL,
	"research_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "related_research" (
	"id" text PRIMARY KEY NOT NULL,
	"research_id" text NOT NULL,
	"related_research_id" text,
	"title" text NOT NULL,
	"icon" text DEFAULT '📄' NOT NULL,
	"studies" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '📁' NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_items" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"folder_id" text,
	"workspace_id" text NOT NULL,
	"memory" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"research_id" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"sources_count" integer DEFAULT 0 NOT NULL,
	"citations_count" integer DEFAULT 0 NOT NULL,
	"confidence" text DEFAULT '100%' NOT NULL,
	"expanded" boolean DEFAULT false NOT NULL,
	"charts" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"research_id" text NOT NULL,
	"domain" text NOT NULL,
	"title" text NOT NULL,
	"trust" integer DEFAULT 100 NOT NULL,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memory_items" ADD CONSTRAINT "memory_items_research_id_research_items_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."research_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_research" ADD CONSTRAINT "related_research_research_id_research_items_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."research_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_research" ADD CONSTRAINT "related_research_related_research_id_research_items_id_fk" FOREIGN KEY ("related_research_id") REFERENCES "public"."research_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_folders" ADD CONSTRAINT "research_folders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_items" ADD CONSTRAINT "research_items_folder_id_research_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."research_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_items" ADD CONSTRAINT "research_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_responses" ADD CONSTRAINT "research_responses_research_id_research_items_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."research_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_research_id_research_items_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."research_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;