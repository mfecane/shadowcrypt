ALTER TABLE "boards" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;
UPDATE "boards" SET "sort_order" = ranked.rn
FROM (
	SELECT "id", (ROW_NUMBER() OVER (PARTITION BY "collection_id" ORDER BY "created_at") - 1) AS rn
	FROM "boards"
) AS ranked
WHERE "boards"."id" = ranked."id";
