---
name: DatabaseStorage stub methods
description: DatabaseStorage in server/storage.ts had unimplemented methods that throw or return empty.
---

`server/storage.ts` has two IStorage implementations: `MemStorage` (full, in-RAM) and `DatabaseStorage` (drizzle/Postgres). When the project ran on MemStorage, several DatabaseStorage methods were left as stubs — `createNotification` threw `Error("Not implemented")`, and notifications/bulkCreateDebtors/bulkCreateDebts/payment-promises/message-templates returned empty.

**Why it matters:** Switching the exported `storage` to DatabaseStorage without implementing those stubs would make the expediente import fail at the `createNotification` call (500), or silently drop bulk-imported rows (`bulkCreateDebtors` returned `[]`).

**How to apply:** When adding a method to the IStorage interface, implement it in BOTH MemStorage and DatabaseStorage. If you see a stub that throws/returns empty in one implementation, it is a latent bug waiting for a storage switch. The export is environment-aware: DatabaseStorage when `DATABASE_URL` is set, else MemStorage.
