begin;
do $test$
declare
 caller uuid := gen_random_uuid(); created uuid; baseline integer; bad jsonb; status_value text;
 valid jsonb := '{"title":"M5 transaction test","category_slug":"infrastructure-disruption","description":"Fictional test","geometry":{"type":"Point","coordinates":[13.4,52.5]},"event_start_at":"2026-09-12T10:00:00+02:00","status":"unverified","current_state_description":"Test only","last_verified_at":"2026-09-12T10:00:00+02:00","resolved_at":null,"severity":3,"impact_description":"Test impact","modes":["rail","road"],"effects":["delay","rerouting"],"sources":[]}'::jsonb;
begin
 insert into auth.users(id) values(caller);
 perform set_config('request.jwt.claim.sub',caller::text,true);
 set local role authenticated;
 assert not private.is_admin(), 'Test caller must be a normal user';
 created := public.create_incident(valid);
 set constraints all immediate;
 set constraints all deferred;
 assert (select owner_id from public.incidents where id=created) = caller, 'Owner mismatch';
 assert (select count(*) from public.incident_transport_modes where incident_id=created)=2, 'Missing modes';
 assert (select count(*) from public.incident_effects where incident_id=created)=2, 'Missing effects';
 assert public.read_incidents(created)->0->'geometry'->'coordinates' = '[13.4,52.5]'::jsonb, 'Wrong geometry';
 for status_value in select unnest(array['active','upcoming','resolved']) loop
  begin
   perform public.create_incident(valid || jsonb_build_object('status',status_value));
   raise exception 'FAIL missing evidence accepted';
  exception when check_violation then null; end;
  created := public.create_incident(valid || jsonb_build_object('status',status_value,'sources',
   jsonb_build_array(jsonb_build_object('source_name','Test evidence','url','https://example.org'))));
  set constraints all immediate;
  set constraints all deferred;
 end loop;
 select count(*) into baseline from public.incidents;
 for bad in select value from jsonb_array_elements(jsonb_build_array(
   valid || '{"modes":[]}', valid || '{"effects":[]}', valid || '{"severity":0}',
   valid || '{"severity":6}', valid || '{"title":" "}', valid || '{"description":""}',
   valid || '{"event_start_at":null}', valid || '{"last_verified_at":null}',
   valid || '{"current_state_description":""}', valid || '{"impact_description":""}',
   valid || '{"category_slug":"not-real"}', valid || '{"modes":["not-real"]}',
   valid || '{"effects":["not-real"]}', valid || '{"status":"not-real"}',
   valid || '{"owner_id":"00000000-0000-0000-0000-000000000001"}',
   valid || '{"geometry":{"type":"LineString","coordinates":[[0,0],[1,1]]}}',
   valid || '{"geometry":{"type":"Point","coordinates":[181,0]}}',
   valid || '{"sources":[{"source_name":"Bad link","url":"javascript:alert(1)"}]}'
 )) loop
  begin
   perform public.create_incident(bad);
   set constraints all immediate;
   raise exception 'FAIL invalid data accepted: %', bad;
  exception when check_violation or not_null_violation or foreign_key_violation then null;
  end;
  set constraints all deferred;
  assert (select count(*) from public.incidents)=baseline, 'Partial incident persisted';
 end loop;
 assert not has_function_privilege('anon','public.create_incident(jsonb)','execute'), 'Anonymous can create';
 perform set_config('request.jwt.claim.sub','',true);
 begin
  perform public.create_incident(valid);
  raise exception 'FAIL missing identity allowed';
 exception when insufficient_privilege then null; end;
end $test$;
rollback;
