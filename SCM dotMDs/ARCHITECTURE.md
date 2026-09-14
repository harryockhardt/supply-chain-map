# Architecture

## 1. Architecture objective

Build v0.1 as a small, maintainable full-stack application whose security and data model remain sound as the product grows.

The architecture must prioritize:

- understandable boundaries;
- database-enforced ownership;
- proper geospatial storage;
- typed application code;
- incremental database migrations;
- low operational complexity;
- easy Git/GitHub versioning;
- clean extension points for future map layers and workflows.

The architecture must not prioritize speculative scale or premature microservices.

---

## 2. Technology decisions

### Web application: Next.js + React + TypeScript

Use Next.js with the **App Router** and TypeScript.

Responsibilities:

- routes/pages;
- authenticated application shell;
- map UI;
- incident forms and detail views;
- server-side/session-aware application logic where appropriate;
- typed interaction with Supabase.

Do not create a separate custom Node/Express backend for v0.1 unless a concrete requirement appears that Supabase + Next.js cannot reasonably satisfy.

### Styling: Tailwind CSS

Use Tailwind for layout and component styling.

Do not let styling decisions leak into domain/data logic.

### Map: MapLibre GL JS

Use MapLibre GL JS for the interactive web map.

Responsibilities:

- pan/zoom;
- rendering incident GeoJSON/geometries;
- marker/layer interaction;
- later support for polygon and line layers.

The basemap tile/style provider is a deployment/configuration decision and must remain replaceable. Do not hardwire product data to a specific basemap vendor.

### Backend platform: Supabase

Use Supabase for:

- Postgres database;
- Auth;
- generated data APIs/client access;
- database migrations/workflows;
- Row Level Security.

### Geospatial: PostGIS

Enable PostGIS and store incident location as geospatial geometry using SRID 4326.

Do not model the core incident location as only two scalar latitude/longitude columns.

### Deployment

Planned deployment:

- Vercel — Next.js application
- Supabase — database/auth/backend services
- GitHub — source repository and version history

Deployment is not a reason to compromise local development or security design.

---

## 3. High-level system

```text
Browser
  |
  | HTTPS
  v
Next.js application
  |
  | authenticated Supabase client / server operations
  v
Supabase
  +-- Auth
  +-- Postgres
  |    +-- PostGIS
  |    +-- Row Level Security
  |
  +-- API layer

Browser
  |
  +------------------------> Basemap/style/tile provider

Git/GitHub
  |
  +--> source, migrations, reviews, tagged releases
```

The basemap is presentation infrastructure. Incident data remains controlled by the application/database.

---

## 4. Trust and security boundaries

### Never trust the browser for authorization

The UI may hide unavailable actions, but that is only user experience.

Actual permissions are enforced through PostgreSQL grants/RLS and validated server/database operations.

Examples:

- hiding an Edit button does not protect an incident;
- checking `user.email === ...` in React does not create admin security;
- accepting `owner_id` from the browser without RLS validation is unsafe.

### Authentication

Supabase Auth identifies the user.

The authenticated user ID maps to `profiles.id`.

### Authorization

RLS determines whether the authenticated user may read/write a row.

Normal user:

- create as self;
- edit/remove own incidents;
- cannot edit/remove others.

Admin:

- may edit/remove any incident.

Role escalation must be impossible through normal client writes.

### Service-role credentials

Supabase service-role credentials bypass normal RLS and therefore must never be exposed to browser/client code or committed to Git.

If service-role access is ever required, it belongs only in a trusted server environment and only for narrowly justified operations.

v0.1 should avoid service-role usage in ordinary user workflows.

---

## 5. Application layers

Keep the application conceptually divided into four layers.

### 5.1 Presentation

Examples:

- map;
- sidebar/filters;
- incident card;
- incident form;
- My Incidents table/list;
- admin table/list.

Presentation components should not contain raw authorization rules or large blocks of database query logic.

### 5.2 Domain/types

Central TypeScript definitions for concepts such as:

- Incident;
- IncidentStatus;
- Category;
- Severity;
- TransportMode;
- EffectType;
- IncidentSource.

Avoid redefining slightly different versions of “Incident” across multiple components.

### 5.3 Data-access/services

Functions responsible for operations such as:

- list visible incidents;
- get incident by ID;
- create incident;
- update incident;
- remove incident;
- list current user's incidents;
- admin list/update operations.

Components consume these functions rather than duplicating Supabase queries everywhere.

### 5.4 Database

Responsible for:

- persistence;
- relational integrity;
- geospatial fields;
- RLS;
- constraints;
- timestamps;
- ownership enforcement.

The database remains authoritative for data integrity/security rules that must not be bypassable.

---

## 6. Recommended repository structure

The exact structure may evolve slightly during scaffolding, but responsibilities should remain separated.

```text
/
├── README.md
├── docs/
│   ├── PRODUCT.md
│   ├── DATA_MODEL.md
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/
│   │   ├── map/
│   │   ├── incidents/[id]/
│   │   ├── my-incidents/
│   │   └── admin/
│   └── ...
│
├── components/
│   ├── map/
│   ├── incidents/
│   ├── filters/
│   └── layout/
│
├── lib/
│   ├── supabase/
│   ├── incidents/
│   ├── auth/
│   └── geo/
│
├── types/
│   └── ...
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
└── tests/
    ├── unit/
    └── integration/
```

Do not force every future feature into this exact tree. Preserve clear module boundaries instead.

---

## 7. Database change discipline

All persistent schema changes must be represented as migrations committed to Git.

Do not treat manual production-dashboard changes as the source of truth.

A database change should generally follow:

1. explain the required product change;
2. create a migration;
3. update generated/handwritten TypeScript types as needed;
4. update data-access code;
5. add/update tests;
6. update documentation if the contract changed.

Never silently change the schema to make a UI implementation easier.

---

## 8. Geospatial architecture

### v0.1

- creation UI accepts Point only;
- database stores PostGIS geometry;
- application converts between database geometry representation and GeoJSON/map rendering as needed.

### Future

The same map/domain boundary should later accept:

- Polygon/MultiPolygon;
- LineString/MultiLineString.

Map components should render geometries by type rather than assume every incident will always be a marker.

This future compatibility is architectural; polygon/line creation must not be implemented in v0.1.

---

## 9. Map data strategy

For a small v0.1 dataset, fetching visible incidents and rendering them through a GeoJSON source/layer or an equivalent MapLibre approach is acceptable.

Do not prematurely introduce:

- vector-tile infrastructure;
- custom map tile servers;
- streaming geospatial pipelines;
- complex spatial partitioning.

If dataset size later makes full incident transfer inefficient, optimize based on measured performance and viewport/spatial queries.

---

## 10. State/filter strategy

Status filter state belongs in client UI state and should determine which incidents are rendered/queried.

The four canonical status values come from the shared domain model:

- upcoming;
- active;
- resolved;
- unverified.

Do not represent the same status with inconsistent strings in different files.

As filters expand later (category, mode, severity, time), filter logic should remain composable rather than hardcoded into map marker components.

---

## 11. Forms and validation

Validation should exist at more than one layer where appropriate:

- UI/form validation for immediate user feedback;
- service/domain validation for application correctness;
- database constraints/RLS for non-bypassable integrity/security.

Important v0.1 checks include:

- required fields;
- severity 1-5;
- valid status;
- at least one transport mode;
- at least one effect;
- allowed geometry type for v0.1 creation;
- source requirement for non-Unverified statuses;
- ownership restrictions.

Do not rely exclusively on client-side form validation.

---

## 12. Error handling

User-facing failures should distinguish at least:

- authentication required;
- authorization denied;
- validation failure;
- network/backend failure;
- not found.

Do not expose secrets, SQL internals, service credentials, or sensitive stack traces to end users.

Development logs may contain useful diagnostic information but must not include secrets.

---

## 13. Environment configuration

Secrets/configuration belong in environment variables and local environment files excluded from Git.

Browser-safe Supabase configuration may use variables intended for public client configuration.

Privileged secrets must never use public/client-exposed environment variable prefixes.

The basemap style URL/provider configuration should also be environment/config driven when practical so the provider can be replaced later.

---

## 14. Testing strategy for v0.1

### Unit tests

Use for deterministic domain logic such as:

- validation helpers;
- status/source rules;
- geometry conversion helpers;
- filter behavior.

### Integration/security tests

Highest priority.

Must prove:

- user A can create as user A;
- user A can edit user A's incident;
- user A cannot edit user B's incident;
- user A cannot remove user B's incident;
- user A cannot set themselves to admin;
- admin can edit/remove both A and B incidents;
- child-row modification follows parent ownership;
- soft-deleted incidents disappear from normal reads.

### End-to-end smoke flow

At minimum:

`signup/login -> map -> add point -> save -> refresh -> open -> edit -> filter -> remove`

Do not mark v0.1 complete without testing the security cases separately from the UI.

---

## 15. Performance philosophy

Optimize for correctness and clarity first.

Expected v0.1 scale does not justify distributed systems or microservices.

Add performance mechanisms only when a measured bottleneck exists, with likely future options including:

- viewport-based spatial queries;
- clustering;
- pagination;
- caching;
- vector tiles for very large map datasets.

These are not v0.1 requirements.

---

## 16. Future external feeds

AIS vessels and ADS-B aircraft should later be architected as **separate live map layers**, not converted into incident records.

Reason:

- an incident is curated disruption intelligence;
- a vessel/aircraft position is high-frequency telemetry.

Mixing them in one table would create incorrect lifecycle, scale, ownership, and retention assumptions.

Any future live-feed integration must separately evaluate:

- API/provider licensing;
- redistribution permissions;
- update-rate limits;
- cost;
- geographic coverage;
- data quality;
- storage/retention terms.

No live-feed provider is selected in v0.1.

---

## 17. AI/automatic ingestion boundary

Future AI/news ingestion should create **candidate records or suggestions for review**, not silently overwrite trusted human-maintained incidents by default.

That future pipeline is separate from the v0.1 CRUD path.

No LLM/API dependency is required for v0.1.

---

## 18. Engineering rules

During implementation:

- do not change the v0.1 product contract silently;
- do not replace PostGIS geometry with ad-hoc coordinate fields;
- do not hardcode admin identity in browser logic;
- do not bypass RLS for ordinary CRUD;
- do not introduce a new framework/service without a concrete reason;
- do not implement future roadmap features while a current milestone is incomplete;
- do not put unrelated map, form, auth, and database logic into one giant component;
- do use migrations for schema changes;
- do keep TypeScript domain types centralized;
- do test each milestone before proceeding;
- do update documentation when a deliberate contract/architecture change is approved.
