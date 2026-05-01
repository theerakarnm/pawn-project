CREATE TYPE "public"."customer_status" AS ENUM('active', 'paid', 'overdue', 'due_soon');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending_verification', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installment_code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"line_user_id" varchar(100),
	"total_price" numeric(12, 2) NOT NULL,
	"down_payment" numeric(12, 2) NOT NULL,
	"monthly_payment" numeric(12, 2) NOT NULL,
	"total_installments" integer NOT NULL,
	"paid_installments" integer DEFAULT 0 NOT NULL,
	"remaining_balance" numeric(12, 2) NOT NULL,
	"status" "customer_status" DEFAULT 'active' NOT NULL,
	"due_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_installment_code_unique" UNIQUE("installment_code"),
	CONSTRAINT "remaining_balance_non_negative" CHECK ("customers"."remaining_balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"line_user_id" varchar(100),
	"amount" numeric(12, 2) NOT NULL,
	"slip_url" varchar(500) NOT NULL,
	"status" "payment_status" DEFAULT 'pending_verification' NOT NULL,
	"confirmed_by" varchar(100),
	"confirmed_at" timestamp,
	"rejected_by" varchar(100),
	"rejected_at" timestamp,
	"reject_reason" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customers_phone" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_customers_status" ON "customers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payments_customer_id" ON "payments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payments_confirmed_at" ON "payments" USING btree ("confirmed_at");