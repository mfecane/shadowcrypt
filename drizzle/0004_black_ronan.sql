ALTER TABLE "collections" ADD COLUMN "current_board_id" uuid;
--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_current_board_id_boards_id_fk" FOREIGN KEY ("current_board_id") REFERENCES "public"."boards"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "boards" DROP COLUMN "is_default";
