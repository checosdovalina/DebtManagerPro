---
name: Dev workflow does not auto-reload backend
description: Why backend (Express/routes) code changes silently fail to take effect until a full workflow restart.
---

The "Start application" workflow runs `tsx server/index.ts` (NOT `tsx watch`). Vite HMR only reloads the **frontend**; the backend tsx process keeps running the code it loaded at startup.

**Why this caused a long debugging detour:** New/edited Express routes (e.g. `POST /api/import/expediente`) and added `console.log` lines lived in `server/routes.ts` but never took effect — the running server still had the old route table. Requests to the not-yet-loaded route fell through to Vite's catch-all and returned `index.html` (`<!DOCTYPE html>`), which the client tried to `res.json()` → "Unexpected token '<'". The handler's logs never printed because the handler was never loaded.

**How to apply:** After ANY change under `server/`, do an explicit `restart_workflow` before testing. Do not trust that editing a backend file applied. Symptom to recognize: an API route returns HTML / `<!DOCTYPE` and content-type `text/html` while neighboring routes return JSON → the route isn't loaded; restart the workflow. On the VPS this is a non-issue because PM2 is restarted on deploy.
