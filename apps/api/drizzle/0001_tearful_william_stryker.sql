CREATE TYPE "public"."account_type" AS ENUM('worker', 'employer', 'partner');--> statement-breakpoint
CREATE TYPE "public"."onboarding_stage" AS ENUM('account_type_pending', 'profile_pending', 'completed');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_type" "account_type";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_stage" "onboarding_stage" DEFAULT 'account_type_pending' NOT NULL;