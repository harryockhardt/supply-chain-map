# Local development

The five original planning documents remain unchanged. This file records implementation progress against docs/ROADMAP.md.

## Current state

- Milestone 0: Next.js App Router, TypeScript, Tailwind, folder structure and local Git baseline.
- Milestone 1: Supabase database foundation installed and checked. Project: dsrbnnffdwigojjzhzzo.
- Milestone 2: email/password sign-up, sign-in, sign-out, server-verified sessions and protected application layout implemented. Owner signup/email confirmation and admin provisioning remain pending.
- The authenticated map page is a placeholder. No map or incident interface has been implemented.

## Configuration

Use Node.js 24. Copy .env.example to .env.local and fill in the project's URL and publishable key. The current local .env.local is configured. It is excluded from Git.

NEXT_PUBLIC_APP_URL should be http://localhost:3000 for local development. Use the same host throughout signup and email confirmation so the PKCE cookie is available. Supabase Auth's Site URL should match it and its redirect allowlist should include http://localhost:3000/auth/callback. If Supabase falls back to the root Site URL, the application forwards the returned code to the callback.

No service-role key or database password is used by the application.

## Run

```sh
npm ci
npm run build
npm start -- --hostname 127.0.0.1
```

Open http://localhost:3000. Stop the server with Control-C. The current preview runs the production build.

For editing:
```sh
npm run dev -- --hostname 127.0.0.1
```

Stop the development server before building. On this Mac the default development watcher encountered EMFILE (too many open files); if it recurs, use:
```sh
WATCHPACK_POLLING=true npm run dev -- --hostname 127.0.0.1
```

The supported Webpack engine is used because Turbopack previously encountered a local process/port restriction.

## Checks

```sh
npm run lint
npm run typecheck
node --experimental-strip-types --test tests/unit/auth-validation.test.mjs
npm run build
```

The HTTP authentication test requires a disposable, confirmed development account via AUTH_TEST_EMAIL and AUTH_TEST_PASSWORD. It does not create or remove the account. Set these in your shell without committing them, then run:
```sh
node tests/integration/auth-http.mjs
```

This test checks unauthenticated redirects, invalid confirmation codes, wrong passwords, successful login through the actual form action, session cookies, repeat page requests, private cache headers and logout. It uses HTTP rather than browser automation.

## Database foundation

The migration filename matches the remote migration history. Lookup seeds are in the migration, so applying the migration installs the complete taxonomy. supabase/seed.sql is intentionally empty apart from its comment.

The migration uses deferred integrity checks for required modes, effects and evidence. Future incident save/update services must write the incident and its children in ONE database transaction, normally through a security-invoker RPC. Separate REST requests cannot save an incomplete incident. User-facing form and service validation must also be added with the incident flow.

Clients cannot change owner IDs, roles, creation timestamps or deletion timestamps. public.remove_incident calls a narrowly scoped private function that checks the authenticated owner/admin before setting the tombstone. Ordinary queries cannot see deleted incidents or their children.

tests/integration/database-foundation.sql runs as postgres on a development database. It switches to authenticated/anon roles for permission tests and rolls back all fixture changes:
```sh
npx supabase db query --project-ref dsrbnnffdwigojjzhzzo --file tests/integration/database-foundation.sql
```

The CLI needs its own Supabase login for that command; the desktop MCP connection can execute the same file. Local reset workflows require Docker, which was not available on this computer. The migration was applied to the initially empty remote database; a local clean-reset test has not been performed.

## Verification — 11 September 2026

- All eight application tables have RLS; PostGIS is installed.
- Taxonomy counts: 9 categories, 5 transport modes, 8 effect types.
- Database tests passed for role safety, shared reads, cross-owner denial, admin override, evidence rules, geometry, timestamps, child access and soft deletion.
- Supabase security advisor returned no findings. Performance advisor reports unused indexes on the empty dataset; retain the planned indexes until real usage can be measured.
- Authentication libraries are pinned and database TypeScript types are generated from Supabase.
- Lint, type checks, validation tests and production build passed.
- HTTP authentication test passed against the real Supabase Auth service with a temporary confirmed account; that account and its profile were removed after sign-out.
- Real email delivery/confirmation with the owner's account and the admin promotion are still pending. Do not mark Milestone 2 complete until those are checked.

## Owner provisioning

After the owner signs up and confirms their email, verify the exact auth.users email and confirmation timestamp. Promote only the corresponding profiles row through a controlled database operation, then verify the role. Do not add the owner's email or an admin shortcut to client code.

GitHub and deployment are not configured.
