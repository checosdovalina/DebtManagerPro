---
name: Storage switch to DatabaseStorage
description: Why storage.ts was changed from hardcoded MemStorage to environment-aware selection.
---

The export at the bottom of `server/storage.ts` was hardcoded as `new MemStorage()`, causing all data (debtors, clients, debts, etc.) to live only in RAM and be lost on every server restart.

**Why:** `DATABASE_URL` is always available (Replit provides its PostgreSQL; VPS has IONOS PostgreSQL set in env). DatabaseStorage was fully capable once its stub methods were implemented.

**How to apply:** Export is now `process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage()`. Any environment with DATABASE_URL set will use real PostgreSQL persistence automatically.

**Replit dev DB is EMPTY; production DB is populated.** The production VPS has its own PostgreSQL with real data. The Replit dev PostgreSQL has the schema pushed but ZERO rows — so with the env-aware switch active you cannot even log in on Replit until you seed. `server/seed.ts` (`npx tsx server/seed.ts`) bootstraps demo data; it is idempotent (skips if the admin user already exists) and only ever touches whatever DB `DATABASE_URL` points at — never run it against production. Do NOT assume reads returning data means the real DB has data — earlier confusion came from MemStorage's seed data being mistaken for DB data.

**Auth quirk:** the login strategy has a plaintext special-case for the demo admin account; all other users authenticate via bcrypt. Seed scripts therefore must not be relied on for realistic password hashing.
