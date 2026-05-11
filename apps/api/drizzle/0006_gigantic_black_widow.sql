CREATE TABLE "worker_trust_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"worker_profile_id" uuid NOT NULL,
	"assessment_id" uuid,
	"trust_score" integer NOT NULL,
	"skill_score" integer NOT NULL,
	"reliability_score" integer NOT NULL,
	"profile_strength_score" integer NOT NULL,
	"risk_level" text NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"improvement_tips" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"input_signals" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_output" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"evaluator" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "worker_trust_evaluations" ADD CONSTRAINT "worker_trust_evaluations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_trust_evaluations" ADD CONSTRAINT "worker_trust_evaluations_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_trust_evaluations" ADD CONSTRAINT "worker_trust_evaluations_assessment_id_worker_profile_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."worker_profile_assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worker_trust_evaluations_user_id_idx" ON "worker_trust_evaluations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "worker_trust_evaluations_worker_profile_id_idx" ON "worker_trust_evaluations" USING btree ("worker_profile_id");