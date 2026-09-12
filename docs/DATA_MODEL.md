# Data Model

## 1. Design goals

The v0.1 data model must be simple enough to implement now while preserving clean paths toward:

- polygon conflict/restriction areas;
- route/line disruptions;
- edit suggestions;
- notifications;
- revision history;
- historical timeline playback;
- live transport overlays;
- automated ingestion.

The schema must not implement those future systems prematurely.

## 2. Database platform

- PostgreSQL hosted by Supabase
- PostGIS enabled for geospatial data
- Supabase Auth for authentication
- PostgreSQL Row Level Security for authorization

All application timestamps should use timezone-aware PostgreSQL timestamps (`timestamptz`).

All application-generated primary identifiers should use UUIDs unless there is a specific reason not to.

---

## 3. Authentication versus application profile

Supabase Auth owns authentication identities in `auth.users`.

Application-specific user data belongs in a separate `profiles` table keyed by the Auth user ID.

### `profiles`

| Field | Type | Required | Purpose |
|---|---|---:|---|
| `id` | uuid | yes | Same ID as the corresponding Auth user |
| `display_name` | text | no | User-facing name; may be added during/after signup |
| `role` | enum/text constraint | yes | `user` or `admin`; defaults to `user` |
| `created_at` | timestamptz | yes | Profile creation time |
| `updated_at` | timestamptz | yes | Last profile update |

### Role rules

- New accounts default to `user`.
- A normal client must never be allowed to change its own `role`.
- v0.1 has no “make admin” UI.
- The project owner's account is promoted to `admin` through a controlled administrative/database operation.
- Admin checks must not depend on comparing a hardcoded email address in frontend code.

---

## 4. Incident core

### `incidents`

| Field | Type | Required | Purpose |
|---|---|---:|---|
| `id` | uuid | yes | Incident identifier |
| `owner_id` | uuid -> profiles.id | yes | User who created/owns the incident |
| `title` | text | yes | Short incident title |
| `category_slug` | text -> incident_categories.slug | yes | What kind of incident occurred |
| `description` | text | yes | General description of what happened |
| `geometry` | `geometry(Geometry, 4326)` | yes | Geographic representation |
| `event_start_at` | timestamptz | yes | When the event began/occurred |
| `status` | enum/text constraint | yes | `upcoming`, `active`, `resolved`, `unverified` |
| `current_state_description` | text | yes | What is true/current now |
| `last_verified_at` | timestamptz | yes | When the current state was last checked |
| `resolved_at` | timestamptz | no | When the disruption/relevance ended, if known |
| `severity` | smallint | yes | Integer 1 through 5 |
| `impact_description` | text | yes | Free-text explanation of supply-chain relevance |
| `created_at` | timestamptz | yes | Creation timestamp |
| `updated_at` | timestamptz | yes | Last modification timestamp |
| `deleted_at` | timestamptz | no | Soft-delete timestamp |

### Geometry rule

The column is intentionally generic PostGIS geometry rather than separate latitude/longitude columns.

v0.1 application behavior permits creation of only:

- `Point`

The storage design must remain capable of later accepting:

- `Polygon` / `MultiPolygon` for affected zones;
- `LineString` / `MultiLineString` for affected routes or corridors.

A database constraint should reject unrelated geometry families if/when multiple geometry types are enabled.

All stored geometries use SRID 4326 (WGS 84), which is appropriate for standard longitude/latitude geospatial interchange and GeoJSON-based map workflows.

### Severity constraint

`severity` must satisfy:

`1 <= severity <= 5`

Meaning:

1. Low
2. Moderate
3. Significant
4. Severe
5. Critical

### Status semantics

`upcoming` — expected/scheduled disruption or event that has not yet become active.

`active` — currently relevant to supply-chain operations.

`resolved` — no longer operationally relevant, while remaining part of the historical record.

`unverified` — record exists, but its claim/current state has not met the normal evidence standard.

Status describes **current relevance**, not whether the original event is ongoing.

### Time semantics

`event_start_at` and `last_verified_at` are different:

- `event_start_at`: when the underlying incident happened/began;
- `last_verified_at`: when the record's current state was last checked.

`resolved_at`, when present, refers to the end of the disruption/current relevance rather than necessarily the physical end of the original event.

---

## 5. Categories

Categories should be lookup data rather than hardcoded columns.

### `incident_categories`

| Field | Type | Required | Purpose |
|---|---|---:|---|
| `slug` | text primary key | yes | Stable machine identifier |
| `label` | text | yes | User-facing label |
| `sort_order` | integer | yes | UI ordering |
| `is_active` | boolean | yes | Whether it may be selected for new incidents |

Initial seed values:

| slug | label |
|---|---|
| `armed-conflict` | Armed Conflict |
| `attack` | Attack |
| `airspace-restriction` | Airspace Restriction |
| `maritime-restriction` | Maritime Restriction |
| `infrastructure-disruption` | Infrastructure Disruption |
| `border-restriction` | Border Restriction |
| `labor-disruption` | Labor Disruption |
| `natural-disaster` | Natural Disaster |
| `other` | Other |

Using lookup rows means future categories can be added/deactivated without changing the incidents table structure.

---

## 6. Transport modes

An incident can affect multiple transport modes, so modes must not be stored as a single string field on `incidents`.

### `transport_modes`

| Field | Type | Required |
|---|---|---:|
| `slug` | text primary key | yes |
| `label` | text | yes |
| `sort_order` | integer | yes |
| `is_active` | boolean | yes |

Initial seeds:

- `maritime` — Maritime
- `aviation` — Aviation
- `road` — Road
- `rail` — Rail
- `pipeline` — Pipeline
- `other` — Other

### `incident_transport_modes`

| Field | Type | Required |
|---|---|---:|
| `incident_id` | uuid -> incidents.id | yes |
| `mode_slug` | text -> transport_modes.slug | yes |

Primary/unique key: `(incident_id, mode_slug)`.

An incident with several selected modes is inherently multimodal; a separate “Multimodal” mode is not required.

---

## 7. Effects

An incident can have multiple supply-chain effects.

### `effect_types`

| Field | Type | Required |
|---|---|---:|
| `slug` | text primary key | yes |
| `label` | text | yes |
| `sort_order` | integer | yes |
| `is_active` | boolean | yes |

Initial seeds:

- `closure` — Closure
- `delay` — Delay
- `rerouting` — Rerouting
- `capacity-reduction` — Capacity Reduction
- `security-risk` — Security Risk
- `infrastructure-damage` — Infrastructure Damage
- `cost-increase` — Cost Increase
- `other` — Other

### `incident_effects`

| Field | Type | Required |
|---|---|---:|
| `incident_id` | uuid -> incidents.id | yes |
| `effect_slug` | text -> effect_types.slug | yes |

Primary/unique key: `(incident_id, effect_slug)`.

---

## 8. Sources

### `incident_sources`

| Field | Type | Required | Purpose |
|---|---|---:|---|
| `id` | uuid | yes | Source record identifier |
| `incident_id` | uuid -> incidents.id | yes | Parent incident |
| `source_name` | text | yes | Publisher/issuer name |
| `url` | text | yes | Evidence URL |
| `published_at` | timestamptz | no | Publication/release time if known |
| `created_at` | timestamptz | yes | When source was attached |

v0.1 does not attempt to assign automated credibility scores to sources.

### Source validation rule

- `unverified` incidents may have zero sources.
- `upcoming`, `active`, and `resolved` incidents require at least one source.

Because this rule spans the incident and child-source tables, it should be enforced in the save/update service flow and covered by automated integration tests. If later moved into database triggers/functions, the behavior must remain the same.

---

## 9. Ownership and authorization model

The database is the security boundary.

### Read

For v0.1, authenticated users may read non-deleted incidents and their public incident-related child records.

Anonymous/public access is not required for v0.1 and should remain disabled unless explicitly added later.

### Create

An authenticated normal user may create an incident only with:

`owner_id = auth.uid()`

A client must not be able to create an incident owned by another user.

### Update

A normal user may update only an incident where:

`owner_id = auth.uid()`

An admin may update any incident.

### Remove

Removal means setting `deleted_at`.

A normal user may remove only their own incident.

An admin may remove any incident.

### Child rows

Permissions for:

- `incident_sources`;
- `incident_transport_modes`;
- `incident_effects`

must inherit authorization from the parent incident. A user must not be able to modify child records of an incident they cannot modify.

### Admin determination

Admin authorization is based on the authenticated user's `profiles.role` as evaluated by database-safe authorization logic.

Any helper function used by RLS to check admin status should be implemented defensively (including a fixed/safe `search_path` when using `SECURITY DEFINER`) and covered by permission tests.

---

## 10. Soft deletion

Deleted incidents have `deleted_at` set to a timestamp.

Normal application reads use:

`deleted_at IS NULL`

No restore UI is required in v0.1.

The presence of `deleted_at` does **not** create revision history. Revision history remains a future feature.

---

## 11. Update timestamps

`created_at` is assigned once.

`updated_at` must change on meaningful record updates, preferably through a database trigger so correctness does not depend on every client remembering to set it.

---

## 12. Recommended indexes

Initial indexes should include:

- spatial GiST index on `incidents.geometry`;
- B-tree index on `incidents.owner_id`;
- B-tree index on `incidents.status`;
- B-tree index on `incidents.event_start_at`;
- B-tree index on `incidents.last_verified_at`;
- partial or otherwise useful index supporting `deleted_at IS NULL` queries if query plans justify it.

Do not add speculative indexes without evidence once real query patterns exist.

---

## 13. Conceptual relationship diagram

```text
auth.users
    1
    |
    1
 profiles
    1
    |
    +-------------------< incidents >-------------------+
                          |   |   |                     |
                          |   |   |                     |
                          |   |   +---< incident_sources
                          |   |
                          |   +-------< incident_effects >--- effect_types
                          |
                          +-----------< incident_transport_modes >--- transport_modes
                          |
                          +----------- category_slug -------- incident_categories
```

---

## 14. Future extensions this model deliberately preserves

Not implemented in v0.1, but the current model should not block:

- polygon and route geometries;
- revision/event history tables;
- edit-suggestion tables referencing incidents;
- notification tables;
- source-verification metadata;
- machine-generated candidate incidents before human approval;
- transport asset overlays stored separately from incidents;
- historical queries by event/current-state timestamps.

Future features must be added as new capabilities rather than overloading unrelated v0.1 fields.
