CREATE TYPE "public"."line_profile_status" AS ENUM('pending_customer', 'linked');--> statement-breakpoint
CREATE TABLE "line_user_profiles" (
	"line_user_id" varchar(100) PRIMARY KEY NOT NULL,
	"phone_normalized" varchar(20) NOT NULL,
	"name" varchar(100),
	"birthdate" date,
	"email" varchar(200),
	"line_display_name" varchar(200),
	"line_picture_url" varchar(500),
	"status" "line_profile_status" DEFAULT 'pending_customer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "phone_normalized" varchar(20);--> statement-breakpoint
UPDATE "customers" SET "phone_normalized" = REGEXP_REPLACE("phone", '[-\s]', '', 'g');--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "phone_normalized" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_line_profiles_phone_normalized" ON "line_user_profiles" USING btree ("phone_normalized");--> statement-breakpoint
CREATE INDEX "idx_customers_phone_normalized" ON "customers" USING btree ("phone_normalized");--> statement-breakpoint
CREATE INDEX "idx_customers_line_user_id" ON "customers" USING btree ("line_user_id");