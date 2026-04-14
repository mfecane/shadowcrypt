# Shadowcrypt

Shadowcrypt is a full-stack moodboard application for collecting, arranging, and revisiting visual references. It combines a polished Nuxt interface with a Pixi-powered infinite canvas, passwordless authentication, S3-compatible media storage, and PostgreSQL persistence.

Live app: `https://shadowcrypt-eight.vercel.app/list`

## Overview

This project was built as a product-style portfolio piece rather than a demo toy. The focus is on interaction quality, state persistence, and production-oriented architecture:

- passwordless sign-in with email one-time codes
- optional Google OAuth
- drag, resize, pan, pinch-to-zoom, fullscreen viewing, and autosave on the board
- collections, folders, pinning, archiving, and quick find
- PostgreSQL + Drizzle migrations for relational data
- MinIO / S3-compatible object storage for uploaded images

## Product Highlights

- **Interactive board**: images are rendered on a Pixi.js canvas with direct manipulation tools for navigation and layout.
- **Persistent layout state**: board viewport, image bounds, and stacking order are saved and restored.
- **Image organization**: users can group work into collections and folders, pin important boards, and archive older ones.
- **Upload pipeline**: supports image ingestion with storage-backed originals and processed variants.
- **Authentication flow**: email nonce login is implemented end-to-end, with Google OAuth available via runtime config.
- **Production-minded dev setup**: local Docker services for Postgres, MinIO, Mailpit, and migration/seed workflows.

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, Pinia, Vue Query, Tailwind CSS, Nuxt UI
- **Canvas / interaction**: Pixi.js
- **Backend**: Nitro server routes
- **Database**: PostgreSQL + Drizzle ORM
- **Storage**: MinIO / S3-compatible object storage
- **Auth**: `nuxt-auth-utils`, Google OAuth, email one-time codes
- **Tooling**: TypeScript, ESLint, Docker Compose

## Architecture

- `app/` contains the Nuxt application, pages, and UI components.
- `lib/board/` contains the board runtime, interaction system, autosave, and Pixi integration.
- `server/api/` contains collection, image, auth, folder, and profile endpoints.
- `server/db/schema.ts` defines the database schema via Drizzle.
- `server/storage/` contains image storage abstractions for S3-compatible backends.
- `drizzle/` contains generated SQL migrations and metadata snapshots.

## Local Development with Docker

1. Copy `.env.example` to `.env.local` and adjust values if needed.
2. Start the stack:

```bash
npm run start
```

This brings up:

- Nuxt app on `http://127.0.0.1:3000`
- Postgres on `127.0.0.1:5432`
- MinIO API on `127.0.0.1:9002`
- MinIO console on `http://127.0.0.1:9001`
- Mailpit UI on `http://127.0.0.1:8025`
- Adminer on `http://127.0.0.1:8084`

Stop the stack with:

```bash
npm run stop
```

## Environment

The project expects runtime configuration for:

- session encryption
- PostgreSQL connection
- S3 / MinIO credentials and public asset URL
- email delivery
- email nonce pepper
- optional Google OAuth credentials
- demo mode flags

See `.env.example` for the full list of variables.

## Database

Generate and run migrations with:

```bash
npm run db:generate
npm run db:migrate
```

Seed local data with:

```bash
npm run db:seed
```

Open Drizzle Studio with:

```bash
npm run db:studio
```

## Quality Checks

Run the full verification pipeline with:

```bash
npm run check
```

This performs TypeScript checks, ESLint, and a production Nuxt build.

## License

MIT
