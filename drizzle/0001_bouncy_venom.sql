ALTER TABLE "images" ADD COLUMN "z_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH ranked AS (
	SELECT
		"id",
		ROW_NUMBER() OVER (PARTITION BY "collection_id" ORDER BY "updated_at" DESC, "id" ASC) - 1 AS z
	FROM "images"
)
UPDATE "images" AS i
SET "z_index" = ranked.z
FROM ranked
WHERE i."id" = ranked."id";
