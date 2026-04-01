## Auth flow

This app uses **NextAuth (Auth.js)** through **@sidebase/nuxt-auth** with two sign-in methods:

- **Google OAuth** (`google` provider)
- **Email one-time code** (`email-nonce` credentials provider)

Main server wiring:

- `lib/auth/buildAuthOptions.ts` — NextAuth options (providers, JWT/session `maxAge`, callbacks)
- `server/api/auth/[...].ts` — NuxtAuth handler (`NuxtAuthHandler(buildAuthOptions())`)

---

## Entry point: auth gate

UI starts at `app/pages/auth/gate.vue`.

The page provides:

- **Continue with Google** → `GET /api/auth/signin/google?callbackUrl=...`
- **Email + Continue** → `POST /api/auth/email/request` with `{ email }`, then navigation to `/auth/nonce?email=...`

---

## Flow A: Google sign-in

1. User clicks **Continue with Google** on the gate page.
2. Browser goes to NextAuth’s Google sign-in URL (full redirect).
3. `buildAuthOptions` registers `GoogleProvider` when `NUXT_GOOGLE_CLIENT_ID` / `NUXT_GOOGLE_CLIENT_SECRET` are set.
4. After OAuth callback, the **`jwt` callback** runs with `account.provider === 'google'`:
   - Upserts `users` (`email`, `name`, `image`, `email_verified` → `users.email_verified`) in a **transaction**
   - Ensures a **`user_profiles`** row exists (`INSERT … ON CONFLICT DO NOTHING`)
5. **`session` callback** loads the current user from **`users`** and normalizes **`user.image`** (DB `image` or Gravatar from email).
6. User is redirected to `callbackUrl` (default `/`).

This project does **not** use `@auth/drizzle-adapter` or an **`account`** table: the Google user row is bound manually in the `jwt` callback (equivalent outcome for JWT sessions).

---

## Flow B: Email one-time code sign-in

### Step 1: Request code

1. User submits email on the gate page.
2. Client `POST`s `server/api/auth/email/request.post.ts` with `{ email }`.
3. Body is validated with `emailNonceRequestSchema` (`lib/auth/emailNonceContract.ts`).
4. `EmailNonceService` generates a **6-digit** code and hashes it with `NUXT_AUTH_EMAIL_NONCE_PEPPER` (`EmailNonceService.hashNonce(email, code)`).
5. In a **transaction**: existing nonce rows for that **email** are **deleted**, then a new row is inserted into **`email_login_nonces`** with `expires_at` (**15 minutes** TTL).
6. `sendNonceCodeEmail(...)` sends the plaintext code (hash only in DB).
7. Client navigates to **`/auth/nonce?email=...`**.

### Step 2: Verify code and create session

1. On `app/pages/auth/nonce.vue`, user enters the 6-digit code.
2. Client `POST`s `/api/auth/signin/email-nonce` (NextAuth credentials sign-in) with CSRF + `email` + `code`, `redirect: false`, `json: true`.
3. In **`email-nonce`** `authorize`:
   - Validates email/code (`emailNonceVerifySchema`)
   - Recomputes nonce hash, finds **unconsumed** and **unexpired** nonce
   - In a **transaction**: marks nonce **consumed**, upserts **`users`** (sets **`email_verified`**), ensures **`user_profiles`** row
4. NextAuth issues a **JWT** session (`session` + `jwt` **maxAge: 30 days**).
5. Client navigates to the returned URL (same-origin path) or treats success as signed in.

There is **no** separate “verify-only” API that consumes a nonce without establishing a session (that pattern would invalidate the code before `signIn`).

---

## Supporting auth API routes

| Route | Role |
|--------|------|
| `server/api/auth/session.get.ts` | Custom `GET` session snapshot (DB-backed user fields where applicable) |
| `server/api/auth/session.post.ts` | Legacy: sets `session_id_token` / optional `session_refresh_token` cookies |
| `server/api/auth/me.get.ts` | Current user payload (`uid`, `email`, `name`, `image`) or `null` |
| `server/api/auth/signout.post.ts` | Clears Auth.js / legacy auth cookies |
| `server/api/user/me.patch.ts` | Authenticated profile update (`name`) |

NextAuth’s own routes (CSRF, sign-in, callback, session, etc.) are served via **`server/api/auth/[...].ts`**.

---

## Auth database schema (Drizzle)

Definitions: `server/db/schema.ts`. PostgreSQL table names:

- **`users`** — Core identity: `id`, `email`, optional `name` / `image`, optional **`email_verified`**, timestamps. Every signed-in user has a row.

- **`user_profiles`** — App profile **1:1** with `users` (`user_id` PK → `users.id`). Created on first successful **Google** or **email-nonce** sign-in (same role as `userProfiles` + `createUser` in adapter-based setups).

- **`email_login_nonces`** — Email OTP flow: `email`, `nonce_hash`, `expires_at`, `consumed_at`, timestamps. Request handler replaces rows per email; `email-nonce` provider validates and marks consumed inside a transaction with user upsert.

- **No** `account`, **`session`**, or **`verificationToken`** tables — this app uses **JWT strategy** only; OAuth linkage is handled in code, not via the Drizzle adapter.

---

## Session model

- **Strategy:** JWT (`session.strategy: 'jwt'`)
- **Max age:** **30 days** (`session.maxAge` and `jwt.maxAge` in `buildAuthOptions`)
- **Session user** is normalized in the **`session` callback** so clients see stable fields: **`id`**, **`email`**, **`name`**, **`image`** (avatar URL or Gravatar fallback).
