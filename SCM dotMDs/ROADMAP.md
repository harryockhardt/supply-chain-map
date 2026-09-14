# Roadmap

## Roadmap rule

Versions are sequential product contracts, not a wishlist to implement simultaneously.

A later version must not begin merely because its feature is exciting. The previous version must first satisfy its acceptance criteria and receive a Git tag/release checkpoint.

---

# v0.1 — Core incident system

## Goal

Prove the complete core workflow:

`account -> map -> point incident -> persistent save -> view -> own edit/remove -> status filters -> admin override`

## Milestone 0 — Freeze foundations

Deliverables:

- [x] README.md
- [x] PRODUCT.md
- [x] DATA_MODEL.md
- [x] ARCHITECTURE.md
- [x] ROADMAP.md

Before coding:

- [ ] create Git repository;
- [ ] scaffold Next.js + TypeScript project;
- [ ] establish formatting/linting;
- [ ] commit clean baseline.

Exit condition: the application boots locally from a clean checkout.

---

## Milestone 1 — Supabase project and database foundation

Implement:

- Supabase project connection;
- migrations directory/workflow;
- PostGIS extension;
- profile/role model;
- category/mode/effect lookup tables;
- incidents table;
- source table;
- mode/effect join tables;
- core constraints;
- `updated_at` behavior;
- RLS enabled on exposed application tables.

Seed:

- categories;
- transport modes;
- effect types.

Exit condition: migrations can reproduce the schema and seed data from scratch.

---

## Milestone 2 — Authentication

Implement:

- sign up;
- sign in;
- sign out;
- authenticated session handling;
- profile creation/default `user` role;
- protected application routes.

Provision the project owner's account as admin through a controlled non-client operation.

Test:

- new users default to `user`;
- users cannot modify their role to `admin`.

Exit condition: authentication and role safety work without any map functionality.

---

## Milestone 3 — Empty interactive map

Implement:

- MapLibre map component;
- world basemap;
- pan;
- zoom;
- basic application layout;
- placeholder filter panel and add control where appropriate.

Do not add incident creation yet.

Exit condition: the map works reliably across refreshes and normal resizing/navigation.

---

## Milestone 4 — Read incidents on the map

Implement:

- incident query/data-access layer;
- conversion to renderable map geometry/GeoJSON;
- point rendering;
- category-aware marker/layer styling;
- click marker -> incident summary/detail access.

Use seeded/test records if needed.

Exit condition: persisted database incidents appear at the correct locations and open the correct record.

---

## Milestone 5 — Create point incident

Implement add flow:

1. press `+`;
2. select/place point;
3. enter basic information;
4. enter event time/current state;
5. select transport modes;
6. select effects;
7. enter impact description;
8. select severity;
9. add source(s) as required;
10. save.

Validate:

- required fields;
- valid severity;
- one or more modes;
- one or more effects;
- source/status rule;
- Point geometry only from v0.1 UI.

Exit condition: a newly created incident remains after full page reload and appears on the map.

---

## Milestone 6 — My Incidents

Implement:

- current user's incident list;
- owned incident detail/edit flow;
- current-state update;
- status change;
- source management;
- soft-delete action.

Exit condition: user can manage their own records end to end.

---

## Milestone 7 — Status filters

Implement independent toggles for:

- Upcoming;
- Active;
- Resolved;
- Unverified.

Requirements:

- more than one status can be shown simultaneously;
- filter behavior is centralized/composable;
- adding future filter dimensions does not require rewriting marker components.

Exit condition: map visibility correctly reflects all toggle combinations under test.

---

## Milestone 8 — Admin view and override

Implement:

- admin-only route/view;
- list all incidents;
- owner visibility;
- edit any incident;
- soft-delete any incident.

Test direct authorization, not only hidden buttons/routes.

Exit condition: admin succeeds where intended and normal user receives authorization denial for the same cross-owner operations.

---

## Milestone 9 — v0.1 security/integrity pass

Explicit tests:

- user A cannot update user B incident;
- user A cannot delete user B incident;
- user A cannot alter child rows on user B incident;
- user A cannot assign incidents to arbitrary owners;
- user A cannot promote themselves;
- admin can perform required overrides;
- deleted records do not appear in ordinary map/list reads;
- source/status validation is enforced;
- timestamps update correctly;
- geometry persists correctly.

Also verify:

- no privileged keys in browser bundle;
- no secrets committed to Git;
- no security rule exists only in frontend code.

Exit condition: all v0.1 acceptance criteria in PRODUCT.md pass.

---

## Milestone 10 — v0.1 release checkpoint

Before future work:

- clean obvious dead code;
- confirm documentation matches implementation;
- run tests;
- create a Git tag/release checkpoint named `v0.1`;
- record known non-blocking limitations.

Only after this point does v0.2 begin.

---

# v0.2 — Geographic depth and stronger exploration

Primary goals:

- polygon/area incident creation and editing;
- line/route incident creation if the product use case is sufficiently clear;
- map rendering by geometry type;
- category filters;
- transport-mode filters;
- severity filters;
- stronger incident detail page;
- better search/navigation.

Important: polygon/line features use the existing geometry model rather than introducing separate incompatible location systems.

Potential quality improvements:

- spatial search/viewport queries;
- clustering if marker density requires it.

---

# v0.3 — Collaboration and change control

Primary goals:

- suggest-edit workflow for incidents owned by other users;
- owner/admin accept or reject suggestion;
- in-app notifications;
- revision/change history;
- clearer verification workflow;
- moderation tools as required.

Conceptual flow:

`viewer -> suggest change -> owner/admin notification -> review -> accept/reject -> revision recorded`

Do not allow collaborative editing to weaken the ownership/RLS model.

---

# v0.4 — Historical intelligence

Primary goals:

- timeline slider;
- query incidents by time/state;
- historical map playback;
- visibility of resolved historical incidents;
- state-change history sufficient to answer “what did the map look like then?”

This version may require a proper incident-state/revision history model beyond the v0.1 current-state fields.

The timeline must not be faked from only `created_at`; it should be grounded in event and recorded state-change timestamps.

---

# v0.5 — Live transport context

Potential layers:

- cargo/commercial vessel AIS;
- cargo/commercial aircraft ADS-B;
- ports;
- airports;
- shipping lanes/corridors;
- air corridors where data/licensing permits.

These are separate map layers, not incident records.

Before choosing providers, evaluate:

- legal/licensing rights;
- redistribution/display restrictions;
- price;
- API limits;
- latency;
- geographic coverage;
- data quality;
- retention rules.

No provider is preselected by this roadmap.

---

# v0.6 — Assisted/automated incident ingestion

Potential pipeline:

```text
trusted external source
        |
        v
extract candidate event
        |
        v
classify / geolocate / summarize
        |
        v
candidate incident
        |
        v
human verification
        |
        v
publish / merge / reject
```

Possible capabilities:

- ingest trusted news/official notices;
- extract time/location/category;
- suggest transport modes/effects;
- flag likely duplicates;
- propose supply-chain relevance;
- assist severity assessment.

AI must not automatically convert uncertain claims into trusted published incidents without an explicit product decision and a confidence/verification framework.

---

# Later possibilities — intentionally uncommitted

These ideas are not scheduled versions and should not influence v0.1 implementation beyond avoiding unnecessary dead ends:

- route exposure analysis;
- carrier/port/airport operational status;
- insurance/security-risk overlays;
- commodity impact layers;
- notifications/watchlists;
- organization/team accounts;
- API access;
- saved views;
- mobile app;
- automatic severity models;
- commercial intelligence features.

They remain hypotheses until real use demonstrates demand.

---

# Version discipline

For every version:

1. define the scope before coding;
2. update the relevant source-of-truth docs;
3. build in ordered milestones;
4. test each milestone before expanding scope;
5. run authorization/integrity tests;
6. tag a stable checkpoint;
7. only then begin the next version.

The purpose of this roadmap is to prevent the project from becoming a pile of partially implemented features.
