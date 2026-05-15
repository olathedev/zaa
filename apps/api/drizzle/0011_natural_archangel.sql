ALTER TYPE "public"."job_application_status" ADD VALUE 'completed';--> statement-breakpoint
ALTER TYPE "public"."job_application_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TYPE "public"."work_request_status" ADD VALUE 'pending_completion' BEFORE 'completed';