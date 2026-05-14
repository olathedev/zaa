CREATE TYPE "public"."job_application_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_request_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"worker_profile_id" uuid NOT NULL,
	"status" "job_application_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_work_request_id_work_requests_id_fk" FOREIGN KEY ("work_request_id") REFERENCES "public"."work_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_applications_work_request_id_idx" ON "job_applications" USING btree ("work_request_id");--> statement-breakpoint
CREATE INDEX "job_applications_worker_id_idx" ON "job_applications" USING btree ("worker_id");