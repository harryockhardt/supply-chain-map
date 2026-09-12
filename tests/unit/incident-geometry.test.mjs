import assert from "node:assert/strict";
import test from "node:test";
import { parsePoint, safeSourceUrl, parseIncidents } from "../../lib/incidents/parse.ts";
import { incidentsToGeoJSON } from "../../lib/geo/incidents.ts";

test("GeoJSON preserves longitude/latitude order and stable incident identity", () => {
  const geometry = { type: "Point", coordinates: [4.47917, 51.9225] };
  const features = incidentsToGeoJSON([{id:"rotterdam", title:"Port", category_slug:"maritime-restriction", category_label:"Maritime Restriction", severity:2, status:"unverified", geometry}]);
  assert.equal(features.features[0].id, "rotterdam");
  assert.deepEqual(features.features[0].geometry.coordinates, [4.47917, 51.9225]);
  assert.equal(features.features[0].properties.category_slug, "maritime-restriction");
  assert.deepEqual(incidentsToGeoJSON([]).features, []);
});
test("Invalid or unsupported geometry fails explicitly rather than drawing at a wrong location", () => {
  for (const geometry of [null, {type:"Polygon",coordinates:[]}, {type:"Point",coordinates:[181,0]}, {type:"Point",coordinates:[0,91]}, {type:"Point",coordinates:[NaN,0]}, {type:"Point",coordinates:[1,2,3]}]) {
    assert.throws(() => parsePoint(geometry));
  }
  assert.deepEqual(parsePoint({type:"Point",coordinates:[-74,40.7]}).coordinates, [-74,40.7]);
  assert.throws(() => parseIncidents({}));
});
test("Evidence links accept only safe web URLs", () => {
  assert.equal(safeSourceUrl("https://example.org/report"),"https://example.org/report");
  for (const url of ["javascript:alert(1)","data:text/html,x","file:///etc/passwd","https://user:pass@example.org","not a URL"]) assert.equal(safeSourceUrl(url),null);
});
