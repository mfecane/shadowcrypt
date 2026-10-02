CREATE TABLE "boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"viewport_center_x" double precision,
	"viewport_center_y" double precision,
	"viewport_zoom" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "boards" ("collection_id", "name", "is_default", "viewport_center_x", "viewport_center_y", "viewport_zoom", "created_at", "updated_at")
SELECT "id", 'Board 1', true, "viewport_center_x", "viewport_center_y", "viewport_zoom", "updated_at", "updated_at"
FROM "collections";
--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "board_id" uuid;
--> statement-breakpoint
UPDATE "images" AS i
SET "board_id" = b."id"
FROM "boards" AS b
WHERE b."collection_id" = i."collection_id";
--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "board_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "images" DROP CONSTRAINT "images_collection_id_collections_id_fk";
--> statement-breakpoint
ALTER TABLE "images" DROP COLUMN "collection_id";
--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN "viewport_center_x";
--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN "viewport_center_y";
--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN "viewport_zoom";
