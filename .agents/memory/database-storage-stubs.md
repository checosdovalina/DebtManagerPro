---
name: DatabaseStorage stub methods
description: DatabaseStorage in server/storage.ts had unimplemented methods that throw or return empty.
---

`server/storage.ts` has two IStorage implementations: `MemStorage` (full, in-RAM) and `DatabaseStorage` (drizzle/Postgres). When the project ran on MemStorage, several DatabaseStorage methods were left as stubs — `createNotification` threw `Error("Not implemented")`, and notifications/bulkCreateDebtors/bulkCreateDebts/payment-promises/message-templates returned empty.

**Why it matters:** Switching the exported `storage` to DatabaseStorage without implementing those stubs would make the expediente import fail at the `createNotification` call (500), or silently drop bulk-imported rows (`bulkCreateDebtors` returned `[]`).

**How to apply:** When adding a method to the IStorage interface, implement it in BOTH MemStorage and DatabaseStorage. If you see a stub that throws/returns empty in one implementation, it is a latent bug waiting for a storage switch. The export is environment-aware: DatabaseStorage when `DATABASE_URL` is set, else MemStorage.

**Column/import drift (real class of bugs found):** Because DatabaseStorage was never exercised, several methods referenced columns/symbols that don't exist and would throw at runtime once activated — e.g. `debts.amount` (real columns are `originalAmount`/`currentAmount`), `activityLogs.followUpRequired`/`followUpDate` (real column is `nextActionDate`), and missing drizzle imports (`lte`, `asc`, `isNotNull`) plus missing schema constants (`CLIENT_STATUS`). The project never type-checks (dev=`tsx`, build=`esbuild`, both skip types) so `npx tsc --noEmit` is the only way to surface these — run it after touching storage, but treat only missing-name/missing-column errors as runtime-breaking; the many Date-vs-string / null-vs-undefined errors are pre-existing and harmless.
