# Local development

The five original planning documents remain unchanged. This file records implementation progress against docs/ROADMAP.md.

## Current state

- Milestone 0: Next.js App Router, TypeScript, Tailwind, folder structure and local Git baseline.
- Milestone 1: Supabase database foundation installed and checked. Project: dsrbnnffdwigojjzhzzo.
- Milestone 2: authentication and protected routes implemented; owner email confirmation and admin role verified.
- Milestone 3: world map rendering, navigation, resizing, timeout and retry verified.
- Milestone 4: persisted incidents render with category colors and open read-only detail pages. Creation, editing, removal UI and status filtering remain later milestones.

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
- Owner email confirmation and the database admin role were verified on 11 September. The owner reported that the email link did not navigate correctly, although subsequent sign-in succeeded; confirmation-link navigation remains a separate follow-up.

## Owner provisioning

After the owner signs up and confirms their email, verify the exact auth.users email and confirmation timestamp. Promote only the corresponding profiles row through a controlled database operation, then verify the role. Do not add the owner's email or an admin shortcut to client code.

GitHub and deployment are not configured.

## Milestone 3 — completed 12 September 2026

The empty interactive MapLibre map now renders the OpenFreeMap world basemap. Pan, zoom, attribution, the application layout and disabled incident/filter placeholders are in place. No incident creation or incident data rendering is implemented.

Two causes of the blank map were fixed:

- MapLibre 6 requires an explicit worker URL in Next.js. The predev/prebuild script copies the worker and its shared module from the installed package into public/maplibre. These generated vendor files are ignored by Git and ESLint. Reference: https://maplibre.org/maplibre-gl-js/docs/
- MapLibre's own positioning style overrode the container positioning and left it with zero height. A separate positioned wrapper now gives the map a stable full-height container.

Loading times out after 20 seconds with a visible Retry map button. Retry reloads the page, preserving the auth session and discarding failed worker state. Map errors and graphics-context loss also show recovery guidance. ResizeObserver and effect cleanup handle resizing and unmounting.

Verified in the actual signed-in Chrome browser:

- Visible geographic tiles and labels, with provider attribution.
- Zoom button and drag pan change the visible geography.
- A 390 × 844 viewport renders the map and controls without the desktop sidebar; restoring the viewport resizes correctly.
- Reloads and home-to-map navigation render the map again.
- Temporarily withholding the generated worker triggers the timeout; restoring it and clicking Retry renders the full map again. The generated file was restored.
- Lint, production build (including TypeScript), auth validation unit tests and git diff whitespace checks pass. Browser checks were manual through browser automation; no automated map test suite is claimed.

Current repository: /Users/harryockhardt/Documents/Codex/supply-chain-map/scm-project/outputs/codes

The verified production preview is http://127.0.0.1:3001/map. An older user-owned process occupies port 3000 and could not be stopped from this session. To run the verified preview manually from this repository:

```sh
npm run build
npm run start -- --hostname 127.0.0.1 --port 3001
```

Do not start another process if that port is already running. The basemap requires an internet connection; NEXT_PUBLIC_MAP_STYLE_URL can be set before building to configure the provider.

## Milestone 4 — completed 12 September 2026

The read-only public.read_incidents RPC converts PostGIS geometry with ST_AsGeoJSON and returns category labels, modes, effects and sources. It is SECURITY INVOKER, has an empty search_path, and is executable only by authenticated users (plus administrative roles). Existing table RLS remains authoritative; deleted incidents are explicitly excluded. Migration 20260912084054_incident_read_api.sql matches the remote history. The generated database type includes the RPC.

lib/incidents/read.ts owns session-aware data access. Central domain types and runtime parsing separate database data from presentation. lib/geo/incidents.ts produces Point GeoJSON in longitude/latitude order and rejects malformed or unsupported geometry. No coordinate columns or new write operations were added.

The map uses accessible MapLibre marker links, category colors with a legend, and a neutral color for unknown categories. All four statuses are shown; filters remain Milestone 7. Markers open /incidents/[id], showing the record's details, UTC dates and safe HTTP(S) source links. Creator attribution is "You" or "Community contributor"; it does not disclose another user's email or protected profile. Missing/removed records and failed loads have separate messages.

Two persisted development records remain available for review: TEST — Rotterdam port delay (4.47917, 51.9225) and TEST — Cairo road disruption (31.2357, 30.0444). Both are explicitly fictional and Unverified. Rotterdam's example.org link is labelled as a test reference, not real evidence. supabase/fixtures/milestone4.sql records their setup separately from production migrations and requires one provisioned admin. It is not run automatically during deployment.

Verification:

- Lint, typecheck, production build and all five unit tests passed.
- tests/integration/incident-read.sql passed: non-owner authenticated shared reads, anonymous RPC denial, no-identity exclusion, exact ID/coordinate/child-data matching, missing record and soft-deleted record exclusion. Its deletion test rolls back.
- Browser: both category-colored markers visible at their locations; each opened its matching persisted record; detail refresh and return-to-map worked; narrow-screen detail layout checked at 390 × 844; missing record showed Incident not found.
- Empty database reads returned an empty array before fixtures were inserted. No mock incident data is supplied by the application.
- Security advisor reported Auth leaked-password protection disabled, an existing Auth setting unrelated to the read RPC. No database/RLS findings were reported. Follow-up: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Local reset from scratch still requires Docker, which has not been available; the migration was applied and verified on the connected development project. The HTTP auth test's page assertion was updated for the map, but that complete login/logout suite was not rerun for Milestone 4.
