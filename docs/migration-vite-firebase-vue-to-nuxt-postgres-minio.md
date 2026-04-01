# Migration Plan: Vite + Firebase + Vue -> Nuxt + Postgres + MinIO (S3)

This document describes a practical, low-drama migration plan for moving from the current stack:

- Frontend: `Vite + Vue 3 (+ vue-router)`
- Data/auth: `Firebase Auth + Firestore`
- Storage: `Firebase Storage (S3-like API, via GCS under the hood)`
- Local dev: Docker Compose running Firebase emulators

To a new target stack:

- Frontend: `Nuxt 3`
- Data/auth: `Postgres`
- Storage: `MinIO (S3-compatible)`
- Local dev: Docker Compose with `postgres + minio (+ nuxt + an optional migration job)`

## 1) Current data flow (what we need to replace)

From the repo, the core “domain” shape is:

- Firestore collections:
  - `collections/{collectionId}`: `{ user, name, pinned, updated, images: [src...] }`
  - `images/{imageId}`: `{ collectionId, src(path), updated, user }` (note: `src` is an object key/path in Storage)
  - `tmp_images/{tmpImageId}`: `{ path }` (tmp object key created during upload)

- Firebase Storage object layout:
  - objects under `images/{userId}/{filename}`

- Remote URL upload:
  - Frontend calls a callable function `uploadImage(url)`
  - Function downloads the remote image and uploads it to Storage, returning a Storage `path`
  - Frontend creates a tmp record (`tmp_images`) using that `path`

These responsibilities must be reproduced with Postgres + MinIO behind a Nuxt server API.

### Minimal Drizzle schema (mirrors the target tables)

This is a starting point for a `schema.ts` that matches the proposed tables/fields:

```ts
// schema.ts (suggested location: e.g. `server/db/schema.ts`)
import { relations } from "drizzle-orm";
import {
	pgEnum,
	pgTable,
	uuid,
	text,
	boolean,
	timestamp,
	integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	email: text("email").notNull(),
	name: text("name"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const collections = pgTable("collections", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	pinned: boolean("pinned").notNull().default(false),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const images = pgTable("images", {
	id: uuid("id").defaultRandom().primaryKey(),
	collectionId: uuid("collection_id")
		.notNull()
		.references(() => collections.id, { onDelete: "cascade" }),
	// Mirrors the old “images/{imageId} includes user” rule.
	userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
	objectKey: text("object_key").notNull(), // maps to old Storage `src(path)`
	width: integer("width"),
	height: integer("height"),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const uploadStatus = pgEnum("upload_status", ["tmp", "final"]);

export const uploads = pgTable("uploads", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	objectKey: text("object_key").notNull(),
	status: uploadStatus("status").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// Optional relations (useful for query helpers).
export const usersRelations = relations(users, ({ many }) => ({
	collections: many(collections),
	images: many(images),
	uploads: many(uploads),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
	images: many(images),
}));

export const imagesRelations = relations(images, ({ one }) => ({
	collection: one(collections, {
		fields: [images.collectionId],
		references: [collections.id],
	}),
	user: one(users, {
		fields: [images.userId],
		references: [users.id],
	}),
}));
```

## 2) Target data model (proposed mapping)

Design goal: preserve the app’s conceptual model first (collections + images), then optimize later.

### Tables

1. `users`
   - `id` (uuid/text, maps from Firebase `uid`)
   - `email`
   - `name`
   - `created_at`, `updated_at`

2. `collections`
   - `id` (uuid/text)
   - `user_id` (FK -> `users.id`)
   - `name`
   - `pinned` (boolean)
   - `updated_at` (timestamp)

3. `images`
   - `id` (uuid/text)
   - `collection_id` (FK -> `collections.id`)
   - `user_id` (FK -> `users.id`) [optional but mirrors old rules]
   - `object_key` (string) [maps to old `src`]
   - `width` / `height` (nullable) [optional: if you still compute later]
   - `updated_at`

4. `uploads` (optional; replaces `tmp_images`)
   - `id`
   - `user_id`
   - `object_key`
   - `status` (`tmp|final`)
   - `created_at`, `expires_at` (recommended)

### Object key strategy

To reduce migration complexity, keep the same object key pattern in MinIO:

- `images/{userId}/{filename}` for final images

For “tmp” objects, you can either:

- Keep tmp objects under the same bucket with a different prefix (e.g. `tmp_images/...`)
- Or drop the tmp concept entirely:
  - upload produces the final object key
  - a second request associates it with a collection (the “finalize upload” step)

## 3) Migration strategy (phased)

### Phase A — Bootstrap the new Docker local environment

Replace Firebase emulators with local services:

- `postgres` (e.g. port `5432`)
- `minio` (e.g. port `9000` + console `9001`)
- `nuxt` (e.g. port `3000`)

Important: keep volumes so you can iterate and re-run the migration job.

Deliverables:

- `docker-compose.nuxt-postgres-minio.yml` (or update existing compose)
- Local env variables:
  - `DATABASE_URL`
  - `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
  - `APP_BASE_URL` (for generating URLs/signed URLs)

### Phase A.1 — Add Tailwind to the Nuxt app

Since the current frontend uses SCSS, the goal in this phase is to:

1. Scaffold Tailwind in Nuxt 3 (PostCSS + Tailwind config + global stylesheet).
2. Keep layout/typography consistent by mapping your existing tokens gradually.

Suggested approach:

- Create `app/assets/css/tailwind.css` (or equivalent) and wire it as the Nuxt global stylesheet.
- Move “reset/null” styles first (you currently have `frontend/src/scss/null.scss`) into Tailwind-compatible base styles or keep minimal CSS if it’s easier.
- Convert components incrementally:
  - Start with “leaf” components (`Button`, `Input`, `Dialog`, etc.)
  - Then move toward page-level layout (`CollectionGrid`, `MainGrid`)

Deliverables:

- Tailwind classes working end-to-end on at least the landing page
- No visual regressions that block your next backend migration steps

### Phase A.2 — Add Nuxt UI to the Nuxt app

Nuxt UI can speed up building the same dialogs/inputs/buttons you already have in your Vue app, while keeping styling consistent with Tailwind.

Suggested approach:

- Install Nuxt UI and wire it into Nuxt (it will rely on your Tailwind setup).
- Create a thin “design wrapper” layer:
  - map your existing components (`Button`, `Dialog`, `Input`, `Confirmation`) to Nuxt UI equivalents
  - keep your domain logic in Nuxt components, only swap presentation components
- Migrate UI screens incrementally:
  - start with auth screens (`/signin`, `/signup`, `/forgot`)
  - then the collection screens (`/list`, `/collections/:id`)

Deliverables:

- Your core UI flows work with Nuxt UI components (no missing modals/buttons)
- Tailwind + Nuxt UI look cohesive (shared theme tokens, consistent spacing/typography)

### Phase A.3 — Add `nuxt-lucide-icons`

If you already use an icon abstraction in the Vue app, you can migrate it early so UI screens don’t end up half-styled.

Suggested approach:

- Install `nuxt-lucide-icons`.
- Create a small “icon wrapper” component in Nuxt that maps your current icon types/props to Lucide icon components.
- Convert icons screen-by-screen:
  - auth screens first
  - then collection screens

Deliverables:

- No missing icons in the key flows (`/signin`, `/signup`, `/forgot`, `/list`, `/collections/:id`)
- Consistent icon sizing via Tailwind classes (avoid per-icon CSS)

### Phase B — Build the Nuxt server API + auth

### Phase B.1 — Use Drizzle ORM (Postgres)

To keep DB access type-safe and migrations repeatable, set up Drizzle in your Nuxt server:

- Install Drizzle + Postgres driver + migration tooling.
- Create a `schema` that matches the proposed tables:
  - `users`
  - `collections`
  - `images`
  - (optional) `uploads`
- Add Drizzle relations:
  - `collections.user_id -> users.id`
  - `images.collection_id -> collections.id`
  - `images.user_id -> users.id` (if you keep the mirror of the old rules)
- Implement migrations early so the migration job (Firestore -> Postgres) has stable targets.

Deliverables:

- A working `db` module that reads `DATABASE_URL`
- Drizzle migrations committed and runnable locally (so you can reset/iterate)
- Query helpers for:
  - list collections by `user_id`
  - fetch a collection with its images
  - insert/associate images during “finalize upload”

Implement a small API surface that matches the current frontend capabilities:

Auth:

1. Choose auth approach:
   - Option 1 (simplest): session/JWT in Nuxt server using credentials stored in Postgres
   - Option 2: OAuth (Google) + account linking in Postgres (mirrors current “Sign in with Google”)

2. Implement endpoints:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/auth/logout`
   - `POST /api/auth/password-reset` (if you still need the flow)
   - `GET /api/me`

Collections:

1. Endpoints:
   - `GET /api/collections` (by `user_id`)
   - `POST /api/collections`
   - `PATCH /api/collections/:id` (rename, pinned toggle)
   - `GET /api/collections/:id` (with images)
   - `DELETE /api/collections/:id` (optional; only if your UI supports it)

Images:

1. Signed-url flow (recommended for UX/performance):
   - `POST /api/images/upload-init` -> returns `{ uploadUrl, objectKey }`
   - Client uploads directly to MinIO using `uploadUrl`
   - `POST /api/images/finalize` -> creates DB rows and associates to collection

2. Server-side remote URL upload (mirrors current callable function):
   - `POST /api/images/upload-from-url` with `{ url }`
   - Server downloads, uploads to MinIO, creates tmp record (if you keep it) or directly finalizes.

3. “Resolve path” replacement:
   - Instead of `getDownloadURL` + emulator URL rewriting, return:
     - either public MinIO URLs, or
     - signed URLs on demand via `GET /api/images/:id/url`

Deliverables:

- Postgres migrations
- API routes + auth middleware
- S3/MinIO client wrapper in the Nuxt server

### Phase C — Data migration (Firestore -> Postgres, Firebase Storage -> MinIO)

Run a one-off migration job (container or node script) that:

1. Connects to Firestore (use existing Firebase emulator export or a real project if needed)
2. Reads:
   - `users`
   - `collections` (filter by `user`)
   - `images` + `collections.images` (choose one source of truth)
3. Inserts into Postgres in batches
4. Copies Storage objects:
   - Only copy objects that are referenced by migrated `images.object_key`

Operational notes:

- Preserve timestamps:
  - `updated` in Firestore -> `updated_at` in Postgres
- Decide how to handle missing objects:
  - If a DB row references a key not found in Storage, either skip it or mark it “missing” and surface to the UI.

### Phase D — Dual-write / compatibility window (optional but safer)

To avoid downtime:

- Keep the old app working while the new backend is built
- For a subset of users/collections, point the frontend to the new Nuxt API
- Compare results (counts, sample object keys, and URL accessibility)

If dual-write is too heavy, do “read-only cutover” first:

- Frontend reads from Nuxt API but still uploads through Firebase for a short window
- Then switch uploads once MinIO signed URL flow is validated

### Phase E — Frontend cutover

Replace frontend Firebase modules:

- Remove `frontend/src/firebase/index.ts` usage (Firestore/Storage/Firebase Auth)
- Replace Firestore calls with API calls to Nuxt endpoints
- Replace Storage download URL resolution:
  - use signed URL endpoint or generate public URLs from `object_key`

Deliverables:

- Nuxt app replacing the current Vite app (or running both temporarily)
- Equivalent routes:
  - `/` and `/landing`
  - `/list`
  - `/signup`, `/signin`, `/forgot`
  - `/user`
  - `/collections/:id`

### Phase F — Decommission Firebase

After verifying parity:

- Stop using Firestore/Storage for reads and writes
- Keep Firebase credentials disabled (or remove from env)
- Optionally keep Firestore data for archival

## 4) Docker integration plan (what changes in your current compose)

Today you have a `docker-compose.yml` with:

- `database` service running Firebase emulators + functions watch
- `frontend` service running Vite dev server

In the target:

- `database` becomes `postgres + minio` (and optionally a `migration` one-shot service)
- `frontend` becomes `nuxt` service

Suggested service naming:

- `postgres`
- `minio`
- `nuxt`
- `migration` (runs and exits)

Ports to pick:

- Postgres: `5432` (container -> host mapping optional)
- MinIO: `9000` (S3) and `9001` (console)
- Nuxt: `3000`

Deliverables:

- One compose for local dev
- One compose or script for migration job (if you want it separable)

## 5) Key business-rule parity checks

Your current Firebase security rules include special hardcoded user logic (see `isMfecane(userId)`).

During migration, ensure you replicate or intentionally remove those constraints:

- Who can read collections/images?
- Who can delete storage objects?
- Are writes restricted in production?

Also check upload constraints:

- The remote upload callable function currently enforces that the remote URL filename extension is `jpg` (see the regex + extension check).
- Storage rule checks include images content types (`image/jpg`, `image/jpeg`, `image/png`, `image/webp`).

Decide whether to keep:

- the “remote URL must look like .jpg” limitation (compat mode)
- or improve it (download content-type and allow more)

## 6) Cutover + rollback plan

### Cutover checklist

1. Postgres has correct row counts:
   - users
   - collections
   - images
2. MinIO has correct object keys:
   - verify a sample of `images.object_key` exist
3. UI smoke tests:
   - sign in
   - list collections
   - view collection images
   - upload file -> see new image in collection
   - upload from URL (if supported)
   - delete image -> DB updated and object removed
4. Signed URL / public URL works from the browser:
   - no CORS issues
   - correct content-type

### Rollback plan

If the cutover fails:

- Switch frontend back to Firebase configuration (keep old endpoints intact during early testing)
- Keep the new backend’s DB and storage independent until you confirm parity

## 7) Suggested implementation order (engineering sequence)

1. Create Nuxt project structure + Postgres connection + migrations
2. Add `/api/collections` read-only endpoints
3. Add `/api/collections/:id` with image records
4. Add MinIO integration:
   - upload init + signed URL
   - finalize endpoint
5. Add delete endpoint:
   - delete DB record
   - delete MinIO object
6. Add remote URL upload endpoint (optional last)
7. Migrate data
8. Cut over frontend route-by-route
9. Decommission Firebase

## 8) Open questions to resolve early

1. Auth strategy:
   - do you want to keep “email/password” (current register/login) or move fully to OAuth?
2. URL access:
   - are MinIO objects public, or do you want signed URLs?
3. Tmp concept:
   - keep `tmp_images` or replace with upload-init/finalize?
4. Image metadata:
   - do you still need width/height, and when do you compute it?
5. Deletion semantics:
   - should deleting an image from a collection also delete the MinIO object immediately?

