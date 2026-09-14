-- Runs against the development database; all identities and incidents roll back.
begin;
do $test$
declare
 a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); admin_id uuid:=gen_random_uuid();
 ia uuid; ib uuid; version timestamptz; original_created timestamptz; before_data jsonb; after_data jsonb;
 payload jsonb:='{"title":"M8 temporary fixture","category_slug":"other","description":"Fictional test","geometry":{"type":"Point","coordinates":[10,50]},"event_start_at":"2026-09-14T10:00:00Z","status":"unverified","current_state_description":"Test state","last_verified_at":"2026-09-14T10:00:00Z","resolved_at":null,"severity":2,"impact_description":"Test impact","modes":["other"],"effects":["delay"],"sources":[]}';
begin
 insert into auth.users(id) values(a),(b),(admin_id);
 update public.profiles set role='admin' where id=admin_id;
 update public.profiles set display_name='Owner A' where id=a;
 perform set_config('request.jwt.claim.sub',a::text,true);
 set local role authenticated;
 ia:=public.create_incident(payload);
 perform set_config('request.jwt.claim.sub',b::text,true);
 ib:=public.create_incident(payload);
 set constraints all immediate; set constraints all deferred;
 select updated_at,created_at into version,original_created from public.incidents where id=ia;
 before_data:=public.read_incidents(ia);
 assert not private.is_admin(), 'Normal user became admin';
 assert not exists(select 1 from public.profiles where id in(a,admin_id)), 'Normal user can read private owner profiles';
 begin
  update public.profiles set role='admin' where id=b;
  raise exception 'FAIL role promotion allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.update_incident(ia,version,payload);
  raise exception 'FAIL normal user cross-owner update';
 exception when insufficient_privilege then null; end;
 begin
  perform public.remove_incident(ia);
  raise exception 'FAIL normal user cross-owner removal';
 exception when insufficient_privilege then null; end;
 update public.incidents set title='Unauthorized' where id=ia;
 assert not found, 'Direct parent update allowed';
 begin
  insert into public.incident_sources(incident_id,source_name,url) values(ia,'Unauthorized','https://example.org');
  raise exception 'FAIL direct child insert allowed';
 exception when insufficient_privilege then null; end;
 assert public.read_incidents(ia)=before_data, 'Denied operations changed record';
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 assert private.is_admin(), 'Admin fixture is not admin';
 assert (select count(*) from public.incidents where id in(ia,ib) and deleted_at is null)=2, 'Admin list omits other owners';
 assert (select p.display_name from public.incidents i join public.profiles p on p.id=i.owner_id where i.id=ia)='Owner A', 'Admin owner visibility failed';
 assert not exists(select 1 from public.incidents where owner_id=auth.uid()), 'Admin My Incidents includes others';
 payload:=payload || '{"title":"Admin override","status":"active","geometry":{"type":"Point","coordinates":[11,51]},"modes":["rail","road"],"effects":["delay","rerouting"],"sources":[{"source_name":"Admin source","url":"https://example.org"}]}';
 perform public.update_incident(ia,version,payload);
 set constraints all immediate; set constraints all deferred;
 after_data:=public.read_incidents(ia)->0;
 assert after_data->>'title'='Admin override' and after_data->>'status'='active', 'Admin update failed';
 assert after_data->>'owner_id'=a::text, 'Admin reassigned owner';
 assert (after_data->>'created_at')::timestamptz=original_created, 'Admin changed creation time';
 assert (after_data->>'updated_at')::timestamptz>version, 'Update timestamp did not advance';
 assert after_data->'geometry'->'coordinates'='[11,51]'::jsonb, 'Admin point update failed';
 assert jsonb_array_length(after_data->'sources')=1 and jsonb_array_length(after_data->'transport_modes')=2 and jsonb_array_length(after_data->'effects')=2, 'Admin child update failed';
 begin
  perform public.update_incident(ia,version,payload);
  raise exception 'FAIL admin stale overwrite';
 exception when serialization_failure then null; end;
 version:=(after_data->>'updated_at')::timestamptz;
 begin
  perform public.update_incident(ia,version,payload || '{"sources":[]}');
  raise exception 'FAIL admin bypassed evidence rule';
 exception when check_violation then null; end;
 update public.incident_sources set source_name='Edited by admin' where incident_id=ia;
 assert found, 'Admin direct source edit failed';
 perform public.remove_incident(ia);
 set constraints all immediate;
 assert public.read_incidents(ia)='[]'::jsonb, 'Removed incident visible to admin';
 assert not exists(select 1 from public.incidents where id=ia and deleted_at is null), 'Removed incident remains in admin list';
 assert not exists(select 1 from public.incident_sources where incident_id=ia), 'Removed child visible';
 assert exists(select 1 from public.incidents where id=ib), 'Removal affected another record';
 reset role;
 assert exists(select 1 from public.incidents where id=ia and deleted_at is not null and owner_id=a), 'Removal destroyed or reassigned record';
 -- Role changes take effect without waiting for a new JWT.
 update public.profiles set role='user' where id=admin_id;
 set local role authenticated;
 assert not private.is_admin(), 'Revoked admin role remains effective';
 select updated_at into version from public.incidents where id=ib;
 begin
  perform public.update_incident(ib,version,payload);
  raise exception 'FAIL revoked admin still edits others';
 exception when insufficient_privilege then null; end;
 begin
  perform public.remove_incident(ib);
  raise exception 'FAIL revoked admin still removes others';
 exception when insufficient_privilege then null; end;
 assert not has_function_privilege('anon','public.update_incident(uuid,timestamptz,jsonb)','execute'), 'Anonymous update granted';
 assert not has_function_privilege('anon','public.remove_incident(uuid)','execute'), 'Anonymous removal granted';
 reset role;
end $test$;
rollback;
