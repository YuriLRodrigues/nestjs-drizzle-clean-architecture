CREATE TYPE "task_status" AS ENUM('PENDING', 'DONE');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY,
	"owner_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'PENDING'::"task_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"email" varchar(254) NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'USER'::"user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tasks_owner_id_created_at_idx" ON "tasks" ("owner_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE;