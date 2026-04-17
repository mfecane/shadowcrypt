# Shadowcrypt

Shadowcrypt is an infinite-canvas moodboard application designed for fast visual exploration and structured reference management.

The system emphasizes direct manipulation, persistent layout state, and predictable performance at scale, combining a Pixi.js rendering layer with WebAssembly-based layout processing and a production-oriented backend.

Live app: `https://shadowcrypt-eight.vercel.app/list`

## Overview

This project focuses on interaction quality, state persistence, and production-ready architecture:

- passwordless authentication via email one-time codes, with optional Google OAuth
- infinite canvas with drag, resize, pan, zoom, and fullscreen interaction
- persistent board state including viewport, layout, and stacking order
- collections, folders, pinning, and archiving for organization
- PostgreSQL with Drizzle ORM for relational data modeling
- S3-compatible object storage for media handling
- local development environment with Dockerized services (Postgres, MinIO, Mailpit)

Layout and overlap resolution are handled in WebAssembly using a spatial grid and iterative relaxation, allowing large boards to remain responsive under heavy interaction.

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
- **Board auto-layout (WebAssembly)**: Zig `0.15.x`, built to `ReleaseSmall` and served as `public/zig/main.wasm`

### Zig and WebAssembly

Overlap resolution and auto-layout are implemented in Zig and compiled to WebAssembly.

The solver uses a spatial hash grid and iterative relaxation with bounded work per pass, ensuring stable performance characteristics alongside real-time canvas interaction.

The WebAssembly module is integrated through a typed bridge and participates directly in the board layout pipeline.

## Architecture

- `app/` contains the Nuxt application, pages, and UI components.
- `lib/board/` contains the board runtime, interaction system, autosave, and Pixi integration (layout rect round-trips through Zig WASM).
- `zig-src/` + `build.zig` compile the auto-layout solver to `public/zig/main.wasm`; `lib/zig/` loads and types the WASM surface for the app.
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
