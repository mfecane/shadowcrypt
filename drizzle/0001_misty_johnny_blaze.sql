ALTER TABLE "users" ALTER COLUMN "roles" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT ARRAY['user']::user_role[]::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'demo', 'admin', 'moderator');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT ARRAY['user']::user_role[]::"public"."user_role"[];--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "roles" SET DATA TYPE "public"."user_role"[] USING "roles"::"public"."user_role"[];