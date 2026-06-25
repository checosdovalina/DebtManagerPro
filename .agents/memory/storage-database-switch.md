---
name: Storage switch to DatabaseStorage
description: Why storage.ts was changed from hardcoded MemStorage to environment-aware selection.
---

The export at the bottom of `server/storage.ts` was hardcoded as `new MemStorage()`, causing all data (debtors, clients, debts, etc.) to live only in RAM and be lost on every server restart.

**Why:** `DATABASE_URL` is always available (Replit provides its PostgreSQL; VPS has IONOS PostgreSQL set in env). DatabaseStorage was fully capable once its stub methods were implemented.

**How to apply:** Export is now `process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage()`. Any environment with DATABASE_URL set will use real PostgreSQL persistence automatically.
