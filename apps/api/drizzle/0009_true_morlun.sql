CREATE TYPE "public"."escrow_status" AS ENUM('pending_payment', 'funded', 'released', 'refunded', 'expired');--> statement-breakpoint
CREATE TABLE "job_escrows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_application_id" uuid NOT NULL,
	"work_request_id" uuid NOT NULL,
	"employer_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"status" "escrow_status" DEFAULT 'pending_payment' NOT NULL,
	"transaction_ref" text NOT NULL,
	"dva_account_number" text,
	"expires_at" timestamp with time zone,
	"squad_transaction_reference" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_escrows_transaction_ref_unique" UNIQUE("transaction_ref")
);
--> statement-breakpoint
ALTER TABLE "job_escrows" ADD CONSTRAINT "job_escrows_job_application_id_job_applications_id_fk" FOREIGN KEY ("job_application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_escrows" ADD CONSTRAINT "job_escrows_work_request_id_work_requests_id_fk" FOREIGN KEY ("work_request_id") REFERENCES "public"."work_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_escrows" ADD CONSTRAINT "job_escrows_employer_id_users_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_escrows" ADD CONSTRAINT "job_escrows_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_escrows_job_application_id_idx" ON "job_escrows" USING btree ("job_application_id");--> statement-breakpoint
CREATE INDEX "job_escrows_employer_id_idx" ON "job_escrows" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "job_escrows_worker_id_idx" ON "job_escrows" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "job_escrows_transaction_ref_idx" ON "job_escrows" USING btree ("transaction_ref");