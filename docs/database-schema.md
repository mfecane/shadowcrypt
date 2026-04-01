# Database schema (Postgres)

This document describes the application schema defined in Drizzle at `server/db/schema.ts`. Migrations are generated with Drizzle Kit (`drizzle.config.ts`, output under `drizzle/`).

## Overview

| Table | Role |
|-------|------|
| `users` | Accounts (unique `email`) |
| `email_login_nonces` | Email OTP rows for passwordless sign-in |
| `collections` | Image groups per user |
| `images` | Rows pointing at MinIO object keys inside a collection |
| `uploads` | In-flight or finalized uploads (replaces Firestore `tmp_images`) |

Enums: **`upload_status`** — `tmp` \| `final` (used by `uploads.status`). **`user_role`** — `client` \| `artist` \| `admin` \| `moderator` (elements of `users.roles`).

## Tables

### `users`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `email` | text | Not null, **unique** |
| `name` | text | Nullable |
| `roles` | `user_role[]` | Not null, default `{client}` |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

### `email_login_nonces`

| Column | Type | Notes |
|--------|------|--------|
| `id` | text | Primary key |
| `email` | text | Not null |
| `nonce_hash` | text | Not null |
| `expires_at` | timestamptz | Not null |
| `consumed_at` | timestamptz | Nullable |
| `created_at` | timestamptz | Not null |

### `collections`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `users.id`, **ON DELETE CASCADE** |
| `name` | text | Not null |
| `pinned` | boolean | Not null, default false |
| `updated_at` | timestamptz | Default now |

Deleting a user removes their collections (and, via `images`, those rows too).

### `images`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid | Primary key |
| `collection_id` | uuid | FK → `collections.id`, **ON DELETE CASCADE** |
| `user_id` | uuid | FK → `users.id`, **ON DELETE SET NULL** (optional; mirrors legacy “image has user”) |
| `object_key` | text | MinIO/S3 object key (maps to former Storage `src`) |
| `width` | integer | Nullable |
| `height` | integer | Nullable |
| `updated_at` | timestamptz | Default now |

Object keys in production are expected to follow `images/{userId}/{filename}` (see migration plan); that pattern is enforced in application code, not as a DB constraint.

### `uploads`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `users.id`, **ON DELETE CASCADE** |
| `object_key` | text | Not null |
| `status` | `upload_status` | `tmp` or `final` |
| `created_at` | timestamptz | Default now |
| `expires_at` | timestamptz | Not null (cleanup / TTL for temp uploads) |

## Relationships (Drizzle relations)

Declared for query composition (`relations` in `schema.ts`):

- **User** → many `collections`, many `images`, many `uploads`
- **Collection** → one `user`, many `images`
- **Image** → one `collection`, one optional `user`
- **Upload** → one `user`

## Legacy mapping (Firestore)

| Firestore | Postgres |
|-----------|----------|
| `collections/{id}` | `collections` |
| `images/{id}` + `src` | `images` + `object_key` |
| `tmp_images` | `uploads` with `status` and `expires_at` |

Firebase `uid` can be stored as `users.id` when migrating users if you align UUIDs during import.
