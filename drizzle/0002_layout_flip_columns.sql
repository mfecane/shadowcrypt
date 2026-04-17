ALTER TABLE "images" ADD COLUMN "layout_flip_x" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "layout_flip_y" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "images"
SET
	"layout_flip_x" = CASE
		WHEN "layout_w" IS NOT NULL AND "layout_w" < 0 THEN true
		ELSE false
	END,
	"layout_flip_y" = CASE
		WHEN "layout_h" IS NOT NULL AND "layout_h" < 0 THEN true
		ELSE false
	END,
	"layout_w" = CASE
		WHEN "layout_w" IS NOT NULL THEN abs("layout_w")
		ELSE NULL
	END,
	"layout_h" = CASE
		WHEN "layout_h" IS NOT NULL THEN abs("layout_h")
		ELSE NULL
	END;
