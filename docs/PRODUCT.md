# Product Specification

## 1. Purpose

The Supply Chain Disruption Map is a collaborative, map-first application for documenting incidents that may affect the movement of goods, transport infrastructure, trade routes, or logistics operations.

The application is not intended to be merely a map of wars. Armed conflict is one possible cause of disruption alongside infrastructure failures, restrictions, labor action, natural disasters, border closures, and other events.

The primary product object is an **incident/disruption record**.

## 2. Product concept

Each incident answers six questions:

1. **What happened?**
2. **Where did it happen or apply?**
3. **When did it begin or occur?**
4. **What is its current state now?**
5. **How does it affect supply chains?**
6. **What evidence supports the record?**

A key rule is that the original event and its ongoing consequences are distinct.

Example:

- Event start: missile strike on 7 September.
- Current status: Active.
- Current-state description: port access remains restricted and vessel movements are delayed.
- Last verified: 11 September.

The strike is a past event; its supply-chain relevance can still be active.

---

## 3. User types

### 3.1 Normal user

A signed-in normal user can:

- view published/non-deleted incidents on the map;
- filter visible incidents by status;
- open incident details;
- create a point incident;
- view a list of incidents they created;
- edit incidents they created;
- update the current state of incidents they created;
- add or remove sources on incidents they created;
- remove incidents they created.

A normal user cannot:

- directly edit another user's incident;
- directly remove another user's incident;
- grant themselves admin privileges;
- bypass ownership rules through direct API/database calls.

### 3.2 Admin

v0.1 has a designated admin account for the project owner.

The admin can:

- perform every normal-user action;
- view all incidents in the administration view;
- edit any incident;
- update any incident's current state;
- manage sources on any incident;
- remove any incident;
- see the creator associated with each incident.

There is **no v0.1 interface for promoting users to admin**. Admin status is provisioned securely outside the normal client UI.

---

## 4. Main application areas

### 4.1 Authentication

Required v0.1 functions:

- sign up;
- sign in;
- sign out;
- persistent authenticated session.

Account recovery, social login, profile customization, public profiles, and reputation systems are not required for v0.1.

### 4.2 Main map

The main application view contains an interactive world map.

Required interactions:

- pan;
- zoom;
- click/tap an incident marker;
- open the incident's information from the marker;
- open the add-incident flow;
- toggle visibility by incident status.

v0.1 displays **point incidents only**.

The data model must nevertheless remain compatible with future:

- polygon/area incidents;
- line/route incidents.

Markers should visually distinguish incident categories. The exact color palette is a UI decision and is not fixed in this specification.

### 4.3 Status filters

The v0.1 map must allow independent toggling of:

- **Upcoming**
- **Active**
- **Resolved**
- **Unverified**

These describe the incident's **current relevance/status**, not its category.

The initial default may show all statuses except Resolved, but this is a UI default and may be adjusted during implementation without changing the underlying product model.

### 4.4 My Incidents

A signed-in user has a dedicated view containing incidents they created.

For each owned incident, the user can:

- open it;
- edit its record;
- update its current state;
- change its status;
- manage its sources;
- remove it.

The application must not rely on this page to enforce ownership. Database authorization remains authoritative.

### 4.5 Admin

An admin-only area must provide a practical way to:

- list all non-deleted incidents;
- inspect their owners;
- open any incident;
- edit any incident;
- remove any incident.

The admin route may be hidden from normal navigation, but security must be enforced server/database-side as well.

---

## 5. Incident creation flow

The user starts by pressing an add (`+`) control.

### Step 1 — Location

For v0.1:

- the user places one point on the map;
- the chosen point is represented as geospatial geometry;
- latitude/longitude may be shown to the user, but raw latitude/longitude are not the conceptual data model.

Future versions may add polygon drawing and route/line drawing.

### Step 2 — Basic information

Required:

- title;
- category;
- general/event description.

The general description answers **what happened**.

### Step 3 — Time and current state

Required:

- event start/occurrence date-time (`event_start_at`);
- status;
- current-state description;
- last-verified date-time.

Optional:

- resolution date-time (`resolved_at`) when known.

The current-state description answers **what is true now**, not merely what happened originally.

### Step 4 — Supply-chain relevance

Required:

- at least one affected transport mode;
- at least one effect;
- free-text supply-chain impact description.

The free-text description explains the logistics meaning of the incident and must remain separate from the general event description.

### Step 5 — Severity

Required severity scale:

1. Low
2. Moderate
3. Significant
4. Severe
5. Critical

In v0.1 severity is user-assigned. There is no automatic severity algorithm.

### Step 6 — Evidence

An incident can contain multiple structured sources.

A source may contain:

- source name;
- URL;
- publication date/time, if known.

v0.1 validation rule:

- **Unverified** incidents may be created without a source;
- any incident marked **Upcoming**, **Active**, or **Resolved** must contain at least one source before it can be saved in that status.

This keeps the Unverified state meaningful while requiring evidence for records presented as verified operational information.

### Step 7 — Save

Saving must persist the incident to the backend.

A successful save means the incident remains available after page reload and in a new authenticated session.

---

## 6. Incident taxonomy

### 6.1 Category — what happened?

Initial category seed list:

- Armed Conflict
- Attack
- Airspace Restriction
- Maritime Restriction
- Infrastructure Disruption
- Border Restriction
- Labor Disruption
- Natural Disaster
- Other

Categories are represented as data/lookup values so the list can evolve without redesigning the incident table.

### 6.2 Status — what is its current relevance?

Exactly four v0.1 statuses:

- Upcoming
- Active
- Resolved
- Unverified

### 6.3 Transport mode — what logistics system is affected?

Initial transport-mode seed list:

- Maritime
- Aviation
- Road
- Rail
- Pipeline
- Other

An incident may affect more than one mode. “Multimodal” does not need to be stored as a separate mode; it is represented by selecting multiple modes.

### 6.4 Effect — what consequence does it create?

Initial effect seed list:

- Closure
- Delay
- Rerouting
- Capacity Reduction
- Security Risk
- Infrastructure Damage
- Cost Increase
- Other

An incident may have more than one effect.

---

## 7. Incident detail view

Opening an incident should expose, at minimum:

- title;
- category;
- severity;
- status;
- location on the map;
- general description;
- event start/occurrence time;
- current-state description;
- last-verified time;
- affected transport modes;
- effects;
- supply-chain impact description;
- sources;
- creator attribution appropriate to the current privacy model;
- created and last-updated times.

Owned incidents expose edit/remove controls.

Admin users expose edit/remove controls on all incidents.

Normal users viewing another user's incident do not receive direct edit/remove controls in v0.1.

---

## 8. Removal behavior

The user-facing action is called **Remove/Delete**.

Internally, v0.1 should use soft deletion (`deleted_at`) rather than immediately destroying the database record. Deleted records must disappear from normal map/list queries.

Reasons:

- protects against accidental destructive loss;
- preserves a clean path toward future moderation/audit capability;
- avoids designing irreversible deletion into the earliest schema.

A restore UI is not required for v0.1.

---

## 9. Non-goals for v0.1

Do not implement these while building v0.1:

- polygon/area creation;
- route/line creation;
- historical timeline slider;
- user-to-user edit suggestions;
- notifications;
- live ship feeds;
- live cargo aircraft feeds;
- port/airport live operational feeds;
- automated external data ingestion;
- AI incident extraction;
- AI-generated descriptions;
- automatic severity scoring;
- comments;
- votes;
- reputation;
- direct messaging;
- paid plans;
- mobile-native applications.

---

## 10. v0.1 acceptance criteria

v0.1 is not complete until all of these are true:

### Authentication

- [ ] A new user can sign up.
- [ ] A user can sign in.
- [ ] A user can sign out.
- [ ] An authenticated session survives a normal page refresh.

### Map

- [ ] The world map loads reliably.
- [ ] The user can pan and zoom.
- [ ] Saved point incidents render on the map.
- [ ] Clicking a marker opens the correct incident.

### Creation

- [ ] A signed-in user can place a point.
- [ ] The incident form validates required fields.
- [ ] The user can select multiple modes.
- [ ] The user can select multiple effects.
- [ ] The source/status validation rule is enforced.
- [ ] Save persists the incident.
- [ ] Reloading does not lose it.

### Ownership

- [ ] A user can edit their own incident.
- [ ] A user can remove their own incident.
- [ ] A user cannot update another user's incident by manipulating the client or calling the backend directly.
- [ ] A user cannot remove another user's incident by manipulating the client or calling the backend directly.

### Filters

- [ ] Upcoming can be toggled.
- [ ] Active can be toggled.
- [ ] Resolved can be toggled.
- [ ] Unverified can be toggled.
- [ ] Multiple statuses can be visible simultaneously.

### Admin

- [ ] The designated admin can access the admin view.
- [ ] A normal user cannot access admin data/actions.
- [ ] The admin can edit any incident.
- [ ] The admin can remove any incident.
- [ ] A normal user cannot promote themselves to admin.

### Persistence and integrity

- [ ] Incident timestamps are stored with timezone-aware database types.
- [ ] Geometry is stored in PostGIS-compatible form.
- [ ] Removed incidents are excluded from normal reads.
- [ ] `created_at` and `updated_at` behave correctly.
