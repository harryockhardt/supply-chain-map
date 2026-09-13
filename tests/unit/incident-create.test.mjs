import assert from "node:assert/strict";
import test from "node:test";
import { validateCreateIncident } from "../../lib/incidents/create-validation.ts";
const valid = {"title":"M5 transaction test","category_slug":"infrastructure-disruption","description":"Fictional test","geometry":{"type":"Point","coordinates":[13.4,52.5]},"event_start_at":"2026-09-12T10:00:00+02:00","status":"unverified","current_state_description":"Test only","last_verified_at":"2026-09-12T10:00:00+02:00","resolved_at":null,"severity":3,"impact_description":"Test impact","modes":["rail","road"],"effects":["delay","rerouting"],"sources":[]};
test("Valid point incident converts timezone, supports multiple modes and effects",()=>{
 const value = validateCreateIncident(valid);
 assert.equal(value.event_start_at,"2026-09-12T08:00:00.000Z");
 assert.equal(value.modes.length,2);
 assert.equal(value.effects.length,2);
 assert.equal(value.sources.length,0);
});
test("Non-unverified statuses require named, valid sources",()=>{
 for(const status of ["active","upcoming","resolved"]) {
  assert.throws(()=>validateCreateIncident({...valid,status}),/source/);
  assert.equal(validateCreateIncident({...valid,status,sources:[{source_name:"Report",url:"https://example.org",published_at:null}]}).status,status);
 }
});
test("Rejects empty fields, invalid severity, missing selections, dates and non-point geometry",()=>{
 for(const key of ["title","description","category_slug","current_state_description","impact_description","event_start_at","last_verified_at"]) assert.throws(()=>validateCreateIncident({...valid,[key]:""}));
 for(const severity of [0,6,2.5,NaN,"2"]) assert.throws(()=>validateCreateIncident({...valid,severity}));
 for(const key of ["modes","effects"]) assert.throws(()=>validateCreateIncident({...valid,[key]:[]}));
 assert.throws(()=>validateCreateIncident({...valid,event_start_at:"2026-09-12T10:00"}));
 assert.throws(()=>validateCreateIncident({...valid,geometry:{type:"Polygon",coordinates:[]}}));
 assert.throws(()=>validateCreateIncident({...valid,geometry:{type:"Point",coordinates:[0,91]}}));
 for(const source of [{source_name:"",url:"https://example.org"},{source_name:"X",url:"javascript:alert(1)"}]) assert.throws(()=>validateCreateIncident({...valid,sources:[source]}));
});

test("Editing preserves source identity and rejects malformed IDs",()=>{
 const source={id:"40000000-0000-4000-8000-000000000001",source_name:"Report",url:"https://example.org"};
 assert.equal(validateCreateIncident({...valid,sources:[source]}).sources[0].id,source.id);
 for(const id of [null,123,"not-an-id"]) assert.throws(()=>validateCreateIncident({...valid,sources:[{...source,id}]}),/Invalid source/);
});
