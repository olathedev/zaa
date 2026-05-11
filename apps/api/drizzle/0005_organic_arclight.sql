CREATE TYPE "public"."worker_assessment_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."worker_profile_status" AS ENUM('not_started', 'in_progress', 'assessment_pending', 'assessment_in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "worker_profile_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"worker_profile_id" uuid NOT NULL,
	"service_title" text NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score" integer,
	"status" "worker_assessment_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "service_title" text;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "experience_level" text;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "availability" text;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "expected_pay_range" text;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "proof_type" text;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "profile_status" "worker_profile_status" DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "assessment_status" "worker_assessment_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "assessment_score" integer;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "worker_profile_assessments" ADD CONSTRAINT "worker_profile_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_profile_assessments" ADD CONSTRAINT "worker_profile_assessments_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worker_profile_assessments_user_id_idx" ON "worker_profile_assessments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "worker_profile_assessments_worker_profile_id_idx" ON "worker_profile_assessments" USING btree ("worker_profile_id");