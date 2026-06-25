---
name: Auth password handling
description: How login validates passwords and why non-admin roles previously couldn't log in
---

# Auth password handling

Login (Passport LocalStrategy) must support BOTH bcrypt-hashed and legacy plain-text stored passwords.

**Why:** Users created/updated through the app are stored as plain text (the create/update user path does not hash). The original LocalStrategy only special-cased `admin@dcs.com` for plain-text and ran `bcrypt.compare` for everyone else — so every non-admin role (executive, manager, collector) failed login ("Contraseña incorrecta") because `bcrypt.compare(plaintext, plaintext)` is always false. This presented to the user as "executive logs in but sees no clients/debtors" — really they could not authenticate at all.

**How to apply:** In the strategy, branch on `storedPassword.startsWith("$2")`: if hashed use `bcrypt.compare`, else plain-text equality. On a successful plain-text match, lazily re-hash with bcrypt and persist via `storage.updateUser` so the plain-text fallback phases out. Long-term: hash at write time in user create/update + reset/seed scripts, then remove the plain-text fallback.

# Logout redirect

`ProtectedRoute` (client/src/lib/auth.tsx) checks `/api/auth/session` only once on mount and never reacts to the react-query session changing. So clearing/invalidating the session query after logout does NOT redirect the user — logout appears to do nothing.

**How to apply:** `logout()` in use-auth.ts must `queryClient.clear()` then `window.location.href = "/login"` after a successful logout POST, forcing a full reload so the guard re-evaluates the cleared session.
