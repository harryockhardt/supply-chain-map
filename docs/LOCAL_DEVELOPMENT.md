# Local development

This file records implementation progress against docs/ROADMAP.md. The user-requested Other transport option is reflected in PRODUCT.md and DATA_MODEL.md.

## Current state

- Milestone 0: Next.js App Router, TypeScript, Tailwind, folder structure and local Git baseline.
- Milestone 1: Supabase database foundation installed and checked. Project: dsrbnnffdwigojjzhzzo.
- Milestone 2: authentication and protected routes implemented; owner email confirmation and admin role verified.
- Milestone 3: world map rendering, navigation, resizing, timeout and retry verified.
- Milestone 4: persisted incidents render with category colors and open read-only detail pages.
- Milestone 5: point placement, validated incident form and atomic database save implemented and verified.
- Milestone 6: owned incident list, editing, source management and soft removal implemented and verified. Status filtering remains Milestone 7.

## Configuration

Use Node.js 24. Copy .env.example to .env.local and fill in the project's URL and publishable key. The current local .env.local is configured. It is excluded from Git.

NEXT_PUBLIC_APP_URL is http://127.0.0.1:3000 for local development. Supabase Auth's Site URL matches it and the redirect allowlist contains http://127.0.0.1:3000/auth/callback. Signup/login pages opened on another host offer a Continue link to this exact origin before showing the form, so PKCE cookies and confirmation links agree. Callback redirects also use the configured origin. Rebuild and restart after changing NEXT_PUBLIC_APP_URL.

No service-role key or database password is used by the application.

## Run

```sh
npm ci
npm run build
npm start -- --hostname 127.0.0.1
```

Open http://127.0.0.1:3000. Stop the server with Control-C. The current preview runs the production build.

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

## Milestone 5 — completed 12 September 2026

Press + Add incident, then click/tap a point on the map. A preview pin and a form capture title, active category, event description, local event time, status, current state, last verification time, optional resolution time, multiple transport modes/effects, impact, severity and sources. The device's local times are converted to ISO UTC before server validation. Source publication time is optional.

Changing the point keeps the draft. Cancel discards the draft without saving. Source rows can be added and removed. Validation failures retain inputs and selections; native form reset is prevented. The form disables controls while saving. Unsaved drafts are in-memory only.

lib/incidents/create-validation.ts performs shared input validation, and the Server Action authenticates again before calling public.create_incident. Lookup choices come from the active database rows. Migration 20260912090039_create_incident.sql matches the remote migration history.

The SECURITY INVOKER create function writes the incident, modes, effects and sources in one transaction with existing grants, RLS, constraints and deferred integrity triggers. Ownership always comes from auth.uid(); client-supplied owner/id/deletion fields are rejected by the RPC. It validates active lookup choices and rejects missing selections or evidence for non-Unverified statuses. There is no service-role access, new table, client role change, or edit/delete flow.

A successful save refreshes incident data and returns to the map centered on the new point with a confirmation. If a network failure leaves the result uncertain, the form asks the user to check the map before retrying. Repeated submissions after an uncertain response are not deduplicated automatically.

Verification:

- Typecheck, lint, production build and all eight unit tests passed.
- tests/integration/incident-create.sql passed using a temporary normal-user identity inside a rolled-back transaction: ownership, multiple modes/effects, all four statuses, evidence requirements, required fields, invalid categories/modes/effects/status/severity, owner spoof rejection, point-only/range validation, anonymous/no-identity denial, and rollback with no partial incident after a late source error.
- Browser: +, point placement, changing point while retaining input, source validation, adding/removing a source row, pending state, save, full reload and opening the new marker all passed. The selected modes, effects, severity, source and UTC times matched the persisted database record.
- Mobile: placement, form layout and cancellation checked at 390 × 844. Cancel left the database record count unchanged.
- Security advisor still reports only the previously documented disabled Auth leaked-password protection setting.

The explicitly fictional Unverified record TEST — Milestone 5 form-created incident remains for review (id b45d7d31-d5c8-47fa-8821-da27690e536b). It was created through the real UI, owned by the signed-in account, at [3.872005288, 46.780395298], with Road/Rail, Delay/Rerouting, severity 3 and one labelled test reference. The two earlier Milestone 4 fixtures also remain.

Next milestone: My Incidents (Milestone 6). Original product/architecture documents are unchanged.

## Milestone 6 — completed 12 September 2026

My Incidents (/my-incidents) lists only the signed-in user's non-deleted records, ordered by last update. The application header links to it and the map. Owned details expose Edit incident and Remove incident; another user's edit URL displays an authorization message. Admin management UI remains Milestone 8.

The shared IncidentForm now supports both creation and prefilled editing. Editing covers the point, core fields, dates, current state, status, modes/effects (including Other), severity and source add/edit/remove. Changing the point retains the draft; Cancel leaves persisted data unchanged. Existing inactive lookup selections can be retained. The editor initializes device-local dates after hydration, avoiding server/browser timezone mismatches.

The authenticated update Server Action validates the form again and calls public.update_incident. Migration 20260912092931_update_incident.sql matches remote history. The SECURITY INVOKER function locks the parent, checks the supplied updated_at version, and updates parent/children atomically under existing RLS. It preserves source IDs and creation timestamps for retained sources, rejects foreign/duplicate source IDs, and keeps owner_id and created_at unchanged. Validation failures roll back every change. A stale version is rejected with an explicit reload message rather than overwriting a newer edit. Generated RPC metadata was checked against types/database.ts.

Removal uses the existing narrow remove_incident function after a confirmation in the UI and a fresh owner check in the Server Action. It sets deleted_at and invalidates map, list and detail views. No physical delete, restore UI or new privileged credential is introduced. The existing function's controlled private helper retains the database owner/admin authorization check.

Verification:

- Typecheck, lint and all nine unit tests passed; production build passed.
- tests/integration/incident-manage.sql passed both before migration commit in a rollback transaction and against the applied migration. It uses two temporary normal-user identities and rolls back all fixtures.
- Checks cover own edits, geometry and state changes, all four statuses, source editing with stable identity, last-source removal only with Unverified, unchanged owner/created timestamp, advancing updated_at, stale edit rejection, invalid-field and late-source-error rollback, direct cross-owner parent/child write denial, cross-owner removal denial, anonymous/no-identity denial, and soft-delete invisibility with the underlying record retained.
- Browser: owned list and editor, prefilled values, source requirement with retained draft, point move, state/mode/effect changes, save and full reload passed. Source add/edit/remove and Unverified transition passed. Removal cancellation and confirmation passed; the test record stayed absent from the list after reload and its detail showed Not found. Database inspection confirmed a soft-deleted row remains. Desktop map layout and 390 × 844 mobile editor checked.
- Security advisor still reports only the existing disabled [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) setting; no new database/RLS findings.

No product scope change. Status filters remain Milestone 7; admin UI remains Milestone 8. Local clean-reset verification still requires Docker as previously documented.

## Authentication repair — 13 September 2026

Supabase Site URL was http://localhost:3000 and its redirect allowlist was empty. Both are now configured for http://127.0.0.1:3000, with /auth/callback as the exact allowed redirect. The local environment/example and CLI callback list match. The confirmation template currently uses the supported {{ .ConfirmationURL }} variable; the earlier invalid-template error is historical and the current template was retained.

Signup and resend both build their callback from a validated application origin. Login/signup on another host provide a Continue link to the configured address before showing a credential form. The confirmation callback always returns to the configured origin. A resend form is available without repeating signup or entering a password, and failed callback guidance explains that the email may already be confirmed even when automatic sign-in fails.

Verification: lint, TypeScript/build, eleven unit tests and tests/integration/auth-redirect-http.mjs passed. The HTTP test checks that canonical pages load, localhost pages offer the exact canonical link without a redirect loop, callback errors return to the correct address, the resend form is rendered, and anonymous map access remains blocked. Browser signup rendered at http://127.0.0.1:3000/signup.

Historical email failure: Auth logs showed Gmail 535 BadCredentials. The initial claim that Sender email address and Username were empty was incorrect: browser screenshots confirmed both were populated; the accessibility text had omitted their values. The user subsequently reported fixing delivery with their email setup. On 14 September, the database contains both the admin and a normal account. Do not overwrite the user's working SMTP configuration. Default Supabase email is not a substitute for general-user delivery: [SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp).

At the initial 13 September check only the admin account existed. The user's later successful signup supersedes that historical blocker. No email confirmation was disabled and no existing account was manually confirmed during this repair. The live preview uses port 3000.

## Milestone 6 verification — 14 September 2026

The existing My Incidents query correctly restricted owner_id to the verified session user and excluded deleted_at rows. The live admin list matched its six database-owned records and omitted the normal user's record. The record titled "user" belongs to the admin; a record title does not determine ownership. Shared map reads remain available to all authenticated users.

The ownership query is now isolated in lib/incidents/owned-query.ts and used by listMyIncidents. A regression test uses the installed Supabase client to verify the outgoing owner/deletion filters for two different identities and rejects an empty identity before any request. Admins use the same ownership filter; the broader admin interface remains Milestone 8.

Verification performed:

- All 15 unit tests, lint, TypeScript/production build, and auth-redirect-http.mjs passed.
- incident-manage.sql passed against hosted Supabase with rolled-back fixtures: editing, four statuses, source add/edit/remove, geometry, required fields, stale updates, cross-owner writes/child changes, and soft deletion.
- owned-incidents.sql passed with rolled-back normal-user/admin fixtures: separate owned lists, shared reads, empty admin-owned list, and exclusion of removed records.
- Browser, admin's own-record flow: prefilled editor, required-source validation, current-state/status update and source addition, save/full reload, removal cancellation, confirmed removal and list/full reload passed. Another owner's editor was denied by the Milestone 6 UI.
- Browser verification record cabfc862-b364-46cf-8bde-dd0cf1eaeb9c was soft-deleted through the app. Original seven visible records remain; no original incident was edited or removed.
- Normal-user browser verification is awaiting sign-in as the normal account. Both currently inspected browser sessions were admin sessions; do not claim a normal-user browser pass until verified.

Security advisor reports no database/RLS findings. Its existing Auth warning is disabled [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), outside this milestone's ownership changes. No schema or permission changes were required.
