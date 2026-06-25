---
name: DB driver must be node-postgres (pg), not neon-serverless
description: Why server/db.ts uses the standard pg driver — required for the self-hosted VPS Postgres while staying compatible with Replit's Neon DB.
---

The app is deployed two ways: Replit dev (DATABASE_URL points to a remote Neon Postgres) and a self-hosted IONOS VPS (DATABASE_URL points to a LOCAL Postgres at `localhost:5432`, behind PM2 process `dcs`).

**Rule:** `server/db.ts` must use `drizzle-orm/node-postgres` + the `pg` driver, NOT `@neondatabase/serverless`.

**Why:** `@neondatabase/serverless` connects over a WebSocket to Neon's `wss://.../v2` endpoint. Against a plain/local Postgres it tries `wss://localhost/v2` and dies with `CERT_HAS_EXPIRED` / 1006 — it physically cannot talk to a standard Postgres server. This silently broke ALL DatabaseStorage operations on the VPS (including login), which is why the production app couldn't authenticate after the env-aware storage switch went live. The standard `pg` driver speaks the normal Postgres wire protocol and works against both the VPS local Postgres and Neon (Neon is wire-compatible over TCP).

**How to apply:** Keep conditional SSL in db.ts — `ssl: false` when the host is localhost/127.0.0.1/::1, otherwise `{ rejectUnauthorized: false }` (remote/Neon requires SSL; local Postgres usually has it off). `pg` must be a direct dependency so the VPS `npm install` and the esbuild `--packages=external` build both include it.

**VPS deploy after a db.ts/driver change:** `git pull` → `npm install` → `npm run db:push` (schema may be missing in the local DB) → `npm run build` → `pm2 restart dcs`. The interactive shell does NOT inherit PM2's DATABASE_URL — pull it from the running process before running one-off scripts: `export DATABASE_URL="$(pm2 jlist | node -e "...find dcs...pm2_env.DATABASE_URL")"`.

**Caveat to remember:** the VPS local `dcs_db` may be empty — earlier "real data" seen in production was likely MemStorage in-memory seed data (lost on restart), never persisted, because the neon driver never connected. After the pg fix, data finally persists for real; expect to seed/import fresh.
