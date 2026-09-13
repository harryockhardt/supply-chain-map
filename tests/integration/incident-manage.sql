begin;
do $test$
declare
 owner_user uuid:=gen_random_uuid(); other_user uuid:=gen_random_uuid(); target uuid; source_id uuid;
 version timestamptz; original_created timestamptz; before_data jsonb; after_data jsonb; bad jsonb;
 payload jsonb:='{"title":"M6 temporary test","category_slug":"other","description":"Fictional test","geometry":{"type":"Point","coordinates":[13.4,52.5]},"event_start_at":"2026-09-12T10:00:00Z","status":"unverified","current_state_description":"Test state","last_verified_at":"2026-09-12T10:00:00Z","resolved_at":null,"severity":2,"impact_description":"Test impact","modes":["other"],"effects":["delay"],"sources":[]}'::jsonb;
begin
 insert into auth.users(id) values(owner_user),(other_user);
 perform set_config('request.jwt.claim.sub',owner_user::text,true);
 set local role authenticated;
 assert not private.is_admin(), 'Must test normal user';
 target:=public.create_incident(payload);
 set constraints all immediate; set constraints all deferred;
 select updated_at,created_at into version,original_created from public.incidents where id=target;
 payload:=payload || '{"title":"Edited incident","geometry":{"type":"Point","coordinates":[4.5,51.9]},"status":"active","current_state_description":"Updated state","severity":4,"modes":["rail","other"],"effects":["delay","rerouting"],"sources":[{"source_name":"Test source","url":"https://example.org"}]}';
 perform public.update_incident(target,version,payload);
 set constraints all immediate; set constraints all deferred;
 after_data:=public.read_incidents(target)->0;
 assert after_data->>'title'='Edited incident' and after_data->>'current_state_description'='Updated state', 'Fields not updated';
 assert after_data->'geometry'->'coordinates'='[4.5,51.9]'::jsonb, 'Point not updated';
 assert (after_data->>'created_at')::timestamptz=original_created, 'Creation timestamp changed';
 assert (after_data->>'updated_at')::timestamptz>version, 'Update timestamp unchanged';
 assert after_data->>'owner_id'=owner_user::text, 'Ownership changed';
 begin
  perform public.update_incident(target,version,payload);
  raise exception 'FAIL stale edit accepted';
 exception when serialization_failure then null; end;
 version:=(after_data->>'updated_at')::timestamptz;
 source_id:=(after_data->'sources'->0->>'id')::uuid;
 payload:=payload || jsonb_build_object('sources',jsonb_build_array(jsonb_build_object('id',source_id,'source_name','Edited source','url','https://example.org/updated')));
 perform public.update_incident(target,version,payload);
 set constraints all immediate; set constraints all deferred;
 after_data:=public.read_incidents(target)->0;
 assert after_data->'sources'->0->>'id'=source_id::text, 'Source identity changed';
 assert after_data->'sources'->0->>'source_name'='Edited source', 'Source not updated';
 version:=(after_data->>'updated_at')::timestamptz;
 before_data:=public.read_incidents(target);
 for bad in select value from jsonb_array_elements(jsonb_build_array(
  payload || '{"sources":[]}',payload || '{"modes":[]}',payload || '{"effects":[]}',
  payload || '{"severity":6}',payload || '{"title":" "}',payload || '{"description":""}',
  payload || '{"current_state_description":""}',payload || '{"impact_description":""}',
  payload || '{"event_start_at":null}',payload || '{"last_verified_at":null}',
  payload || '{"status":"invalid"}',payload || '{"category_slug":"invalid"}',
  payload || '{"modes":["invalid"]}',payload || '{"effects":["invalid"]}',
  payload || '{"owner_id":"00000000-0000-0000-0000-000000000001"}',
  payload || '{"geometry":{"type":"LineString","coordinates":[[0,0],[1,1]]}}',
  payload || '{"sources":[{"source_name":"Bad","url":"javascript:alert(1)"}]}',
  payload || jsonb_build_object('sources',jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'source_name','Bad','url','https://example.org')))
 )) loop
  begin
   perform public.update_incident(target,version,bad);
   set constraints all immediate;
   raise exception 'FAIL invalid update accepted: %',bad;
  exception when check_violation or not_null_violation or foreign_key_violation then null; end;
  set constraints all deferred;
  assert public.read_incidents(target)=before_data, 'Failed edit partially changed record';
 end loop;
 perform set_config('request.jwt.claim.sub',other_user::text,true);
 begin
  perform public.update_incident(target,version,payload);
  raise exception 'FAIL other user edited';
 exception when insufficient_privilege then null; end;
 begin
  perform public.remove_incident(target);
  raise exception 'FAIL other user removed';
 exception when insufficient_privilege then null; end;
 update public.incidents set title='Unauthorized' where id=target;
 assert not found, 'Direct cross-owner update allowed';
 delete from public.incident_sources where id=source_id;
 assert not found, 'Direct cross-owner source removal allowed';
 update public.incident_sources set source_name='Unauthorized' where id=source_id;
 assert not found, 'Direct cross-owner source update allowed';
 begin
  insert into public.incident_transport_modes(incident_id,mode_slug) values(target,'road');
  raise exception 'FAIL cross-owner child insert';
 exception when insufficient_privilege then null; end;
 assert public.read_incidents(target)=before_data, 'Unauthorized writes changed record';
 perform set_config('request.jwt.claim.sub',owner_user::text,true);
 payload:=payload || '{"status":"resolved","resolved_at":"2026-09-12T12:00:00Z"}';
 perform public.update_incident(target,version,payload);
 set constraints all immediate; set constraints all deferred;
 select updated_at into version from public.incidents where id=target;
 payload:=payload || '{"status":"upcoming","resolved_at":null}';
 perform public.update_incident(target,version,payload);
 set constraints all immediate; set constraints all deferred;
 select updated_at into version from public.incidents where id=target;
 -- Removing the last source is allowed only when also switching to Unverified.
 payload:=payload || '{"status":"unverified","sources":[]}';
 perform public.update_incident(target,version,payload);
 set constraints all immediate; set constraints all deferred;
 assert public.read_incidents(target)->0->'sources'='[]'::jsonb, 'Source removal failed';
 perform public.remove_incident(target);
 set constraints all immediate;
 assert public.read_incidents(target)='[]'::jsonb, 'Deleted record still readable';
 assert not exists(select 1 from public.incidents where id=target), 'Deleted record in ordinary list';
 assert not exists(select 1 from public.incident_transport_modes where incident_id=target and mode_slug='other'), 'Deleted children visible';
 begin
  perform public.update_incident(target,version,payload);
  raise exception 'FAIL edited removed record';
 exception when insufficient_privilege then null; end;
 assert not has_function_privilege('anon','public.update_incident(uuid,timestamptz,jsonb)','execute'), 'Anonymous update granted';
 perform set_config('request.jwt.claim.sub','',true);
 begin
  perform public.update_incident(target,version,payload);
  raise exception 'FAIL no-identity update';
 exception when insufficient_privilege then null; end;
 reset role;
 assert exists(select 1 from public.incidents where id=target and deleted_at is not null), 'Record physically destroyed';
end $test$;
rollback;
