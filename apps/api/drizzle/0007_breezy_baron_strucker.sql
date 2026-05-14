CREATE TYPE "public"."work_request_status" AS ENUM('draft', 'open', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "work_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_type" text,
	"location" text,
	"budget" text,
	"preferred_date" text,
	"description" text,
	"status" "work_request_status" DEFAULT 'draft' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_requests" ADD CONSTRAINT "work_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "work_requests_user_id_idx" ON "work_requests" USING btree ("user_id");