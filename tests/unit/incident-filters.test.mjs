import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_INCIDENT_FILTERS, filterIncidents, toggleIncidentStatus } from "../../lib/incidents/filters.ts";
import { incidentsToGeoJSON } from "../../lib/geo/incidents.ts";

const statuses = ["upcoming", "active", "resolved", "unverified"];
const incidents = statuses.flatMap((status, index) => [0, 1].map(copy => ({
  id: `${status}-${copy}`, title: `${status} fixture`, status,
  category_slug: copy ? "attack" : "other", category_label: copy ? "Attack" : "Other",
  severity: index + 1, geometry: { type: "Point", coordinates: [index * 30, copy * 20] },
})));

for (let mask = 0; mask < 16; mask++) {
  test(`status combination ${mask.toString(2).padStart(4, "0")} renders exactly the matching records`, () => {
    const selected = statuses.filter((_, index) => mask & (1 << index));
    let filters = DEFAULT_INCIDENT_FILTERS;
    for (const status of statuses) if (!selected.includes(status)) filters = toggleIncidentStatus(filters, status);
    const visible = filterIncidents(incidents, filters);
    const expectedIds = selected.flatMap(status => [`${status}-0`, `${status}-1`]);
    assert.deepEqual(visible.map(incident => incident.id), expectedIds);
    assert.deepEqual(incidentsToGeoJSON(visible).features.map(feature => feature.id), expectedIds);
    assert.equal(incidents.length, 8);
    assert.deepEqual(DEFAULT_INCIDENT_FILTERS.statuses, statuses);
  });
}

test("toggling each status off and on restores records without duplicates or lost fields", () => {
  let filters = DEFAULT_INCIDENT_FILTERS;
  for (const status of statuses) {
    filters = toggleIncidentStatus(toggleIncidentStatus(filters, status), status);
    assert.deepEqual(filterIncidents(incidents, filters), incidents);
    assert.equal(new Set(filters.statuses).size, 4);
  }
  assert.deepEqual(filterIncidents([], filters), []);
});

test("filtering uses the latest incident status after an edit", () => {
  const filters = { statuses: ["active"] };
  const record = { ...incidents[0], status: "active" };
  assert.deepEqual(filterIncidents([record], filters), [record]);
  assert.deepEqual(filterIncidents([{ ...record, status: "resolved" }], filters), []);
});
