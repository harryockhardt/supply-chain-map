# Supply Chain Disruption Map

> Working title. The project name is intentionally not fixed yet.

A collaborative, map-first application for recording, viewing, and maintaining incidents that may disrupt global supply chains.

The core object is a **disruption record**, not merely a map pin. Each record combines what happened, where it happened, when it began, its current relevance, its supply-chain impact, evidence, severity, and ownership.

## Project status

**Current phase:** product and architecture definition for v0.1.

The project should not expand beyond the v0.1 scope until the complete v0.1 flow works end to end and passes its acceptance checks.

## v0.1 goal

A user must be able to:

1. create an account and sign in;
2. open an interactive world map;
3. press an add button and place a point incident on the map;
4. enter the incident's core information, current state, supply-chain relevance, severity, and sources;
5. save the incident persistently;
6. reload the application and still see the incident;
7. open the incident from the map;
8. view, edit, update, and remove incidents they created;
9. filter the map by incident status; and
10. remain unable to edit or remove another normal user's incidents.

A designated **admin** account must additionally be able to view, edit, and remove every incident.

## Explicitly out of scope for v0.1

The following are planned possibilities, but they are not v0.1 work:

- polygon/area incident creation;
- route/line incident creation;
- timeline slider;
- edit suggestions between users;
- notifications;
- revision history UI;
- live AIS vessel tracking;
- live ADS-B aircraft tracking;
- automated news or intelligence ingestion;
- AI-generated incident extraction or severity scoring;
- automatic route-impact modelling;
- comments, voting, reputation, or social features.

The data and architecture should avoid blocking these features later, but v0.1 must not implement them prematurely.

## Intended stack

- **Application:** Next.js with the App Router
- **Language:** TypeScript
- **UI:** React + Tailwind CSS
- **Map:** MapLibre GL JS
- **Authentication:** Supabase Auth
- **Database:** Supabase Postgres
- **Geospatial storage:** PostGIS
- **Authorization:** Postgres Row Level Security (RLS)
- **Source control:** Git + GitHub
- **Deployment target:** Vercel for the web app, Supabase for backend services

Exact package versions are intentionally not pinned in these planning documents. They should be fixed by the package lockfile when the application is scaffolded.

## Source-of-truth documents

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product behavior and v0.1 requirements
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — entities, fields, relationships, validation, and authorization-relevant data
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — technical structure and engineering constraints
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — milestone order and future version boundaries

If implementation code conflicts with these documents, the conflict must be identified and resolved deliberately rather than silently changing product behavior.

## Core product principles

1. **Event and consequence are separate concepts.** A one-time event can remain supply-chain relevant long after it occurred.
2. **Geography is first-class data.** v0.1 creates only point incidents, but the stored geometry must remain compatible with future polygons and lines.
3. **Ownership is enforced in the database.** Frontend button visibility is not a security boundary.
4. **Evidence matters.** Sources belong to incidents as structured records rather than being buried in free text.
5. **Current state matters.** Every incident has an explicit status, a current-state description, and a verification time.
6. **Build vertically.** Complete and test one end-to-end flow before adding breadth.
7. **Do not overbuild v0.1.** Future capability is preserved through clean data structures and interfaces, not by implementing future features now.

## Definition of v0.1 complete

v0.1 is complete only when the following flow succeeds using persistent backend data:

`sign up / sign in -> map -> add point -> complete incident form -> save -> reload -> open incident -> edit own incident -> filter by status -> remove own incident`

and when security testing confirms:

- a normal user cannot update or remove another user's incident through direct database/API requests;
- an admin can update or remove any incident;
- role escalation cannot be performed by a normal user;
- protected data writes are enforced by RLS, not only by frontend logic.
