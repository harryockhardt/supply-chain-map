-- Run as postgres against a development database. All fixtures roll back.
-- Every assertion raises on failure; a successful result is followed by ROLLBACK.
begin;
do $$
declare
 a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); admin_id uuid := gen_random_uuid();
 incident_a uuid; incident_b uuid; source_a uuid; affected integer; before_update timestamptz;
begin
 insert into auth.users(id) values (a),(b),(admin_id);
 if (select count(*) from public.profiles where id in (a,b,admin_id) and role='user') <> 3 then
  raise exception 'FAIL: new users must default to user'; end if;
 update public.profiles set role='admin' where id=admin_id;
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',a,'role','authenticated')::text,true);
 set local role authenticated;
 if private.is_admin() then raise exception 'FAIL: A is not admin'; end if;
 if (select count(*) from public.incident_categories) <> 9 or (select count(*) from public.transport_modes) <> 5 or (select count(*) from public.effect_types) <> 8 then
  raise exception 'FAIL: taxonomy seed counts'; end if;
 if (select count(*) from public.profiles where id in (a,b,admin_id)) <> 1 then raise exception 'FAIL: profile privacy'; end if;
 begin
  update public.profiles set role='admin' where id=a;
  raise exception 'FAIL: role escalation allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.profiles(id,role) values (gen_random_uuid(),'admin');
  raise exception 'FAIL: profile insertion allowed';
 exception when insufficient_privilege then null; end;
 insert into public.incidents(title,category_slug,description,geometry,event_start_at,status,current_state_description,last_verified_at,severity,impact_description)
 values ('Foundation test A','attack','Test event',extensions.st_setsrid(extensions.st_makepoint(10,20),4326),now(),'unverified','Test current state',now(),3,'Test impact') returning id into incident_a;
 insert into public.incident_transport_modes values (incident_a,'maritime');
 insert into public.incident_effects values (incident_a,'delay');
 set constraints all immediate;
 set constraints all deferred;
 if (select owner_id from public.incidents where id=incident_a) <> a then raise exception 'FAIL: owner default'; end if;
 if (select extensions.st_x(geometry) from public.incidents where id=incident_a) <> 10 then raise exception 'FAIL: geometry'; end if;
 begin
  update public.incidents set status='active' where id=incident_a;
  set constraints all immediate;
  raise exception 'FAIL: verified status without source';
 exception when check_violation then null; end;
 set constraints all deferred;
 insert into public.incident_sources(incident_id,source_name,url) values (incident_a,'Test source','https://example.com/evidence') returning id into source_a;
 update public.incidents set status='active' where id=incident_a;
 set constraints all immediate;
 set constraints all deferred;
 begin
  delete from public.incident_sources where id=source_a;
  set constraints all immediate;
  raise exception 'FAIL: last source removed from active incident';
 exception when check_violation then null; end;
 set constraints all deferred;
 begin
  delete from public.incident_transport_modes where incident_id=incident_a;
  set constraints all immediate;
  raise exception 'FAIL: last mode removed';
 exception when check_violation then null; end;
 set constraints all deferred;
 begin
  delete from public.incident_effects where incident_id=incident_a;
  set constraints all immediate;
  raise exception 'FAIL: last effect removed';
 exception when check_violation then null; end;
 set constraints all deferred;
 begin
  update public.incidents set severity=6 where id=incident_a;
  raise exception 'FAIL: invalid severity';
 exception when check_violation then null; end;
 begin
  update public.incidents set title=' ' where id=incident_a;
  raise exception 'FAIL: empty title';
 exception when check_violation then null; end;
 begin
  update public.incidents set geometry=extensions.st_setsrid(extensions.st_makepoint(181,20),4326) where id=incident_a;
  raise exception 'FAIL: invalid longitude';
 exception when check_violation then null; end;
 begin
  update public.incidents set geometry=extensions.st_geomfromtext('LINESTRING(0 0,1 1)',4326) where id=incident_a;
  raise exception 'FAIL: non-point geometry';
 exception when check_violation then null; end;
 begin
  update public.incidents set owner_id=b where id=incident_a;
  raise exception 'FAIL: owner reassignment';
 exception when insufficient_privilege then null; end;
 begin
  update public.incident_sources set incident_id=gen_random_uuid() where id=source_a;
  raise exception 'FAIL: source reparenting';
 exception when insufficient_privilege then null; end;
 begin
  delete from public.incidents where id=incident_a;
  raise exception 'FAIL: hard delete allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.incidents(owner_id,title,category_slug,description,geometry,event_start_at,status,current_state_description,last_verified_at,severity,impact_description)
  values (b,'Forged owner','attack','Test',extensions.st_setsrid(extensions.st_makepoint(10,20),4326),now(),'unverified','Test',now(),3,'Test');
  raise exception 'FAIL: arbitrary owner creation';
 exception when insufficient_privilege then null; end;
 select updated_at into before_update from public.incidents where id=incident_a;
 update public.incidents set title='Updated by owner' where id=incident_a;
 if (select updated_at from public.incidents where id=incident_a) <= before_update then raise exception 'FAIL: timestamp did not advance'; end if;

 -- User B can read shared incidents but cannot modify A or A's children.
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',b,'role','authenticated')::text,true);
 if not exists(select 1 from public.incidents where id=incident_a) then raise exception 'FAIL: shared read'; end if;
 update public.incidents set title='Unauthorized B' where id=incident_a;
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'FAIL: cross-owner update'; end if;
 delete from public.incident_sources where id=source_a;
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'FAIL: cross-owner source removal'; end if;
 update public.incident_sources set source_name='Unauthorized' where id=source_a;
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'FAIL: cross-owner source update'; end if;
 begin
  insert into public.incident_effects values (incident_a,'closure');
  raise exception 'FAIL: cross-owner child insert';
 exception when insufficient_privilege then null; end;
 begin
  perform public.remove_incident(incident_a);
  raise exception 'FAIL: cross-owner soft delete';
 exception when insufficient_privilege then null; end;
 insert into public.incidents(title,category_slug,description,geometry,event_start_at,status,current_state_description,last_verified_at,severity,impact_description)
 values ('Foundation test B','attack','Test',extensions.st_setsrid(extensions.st_makepoint(10,20),4326),now(),'unverified','Test',now(),3,'Test') returning id into incident_b;
 insert into public.incident_transport_modes values (incident_b,'road');
 insert into public.incident_effects values (incident_b,'closure');
 set constraints all immediate;
 set constraints all deferred;
 perform public.remove_incident(incident_b);
 if exists(select 1 from public.incidents where id=incident_b) then raise exception 'FAIL: owner sees deleted row'; end if;
 if exists(select 1 from public.incident_effects where incident_id=incident_b) then raise exception 'FAIL: deleted child visible'; end if;
 begin
  update public.incidents set deleted_at=null where id=incident_b;
  raise exception 'FAIL: restore privilege';
 exception when insufficient_privilege then null; end;

 -- Admin override uses a protected database role, not user metadata.
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',admin_id,'role','authenticated')::text,true);
 if not private.is_admin() then raise exception 'FAIL: admin recognition'; end if;
 if (select count(*) from public.profiles where id in (a,b,admin_id)) <> 3 then raise exception 'FAIL: admin owner visibility'; end if;
 update public.incidents set title='Admin updated' where id=incident_a;
 get diagnostics affected = row_count;
 if affected <> 1 then raise exception 'FAIL: admin update'; end if;
 update public.incident_sources set source_name='Admin updated source' where id=source_a;
 get diagnostics affected = row_count;
 if affected <> 1 then raise exception 'FAIL: admin source update'; end if;
 set constraints all immediate;
 set constraints all deferred;
 perform public.remove_incident(incident_a);
 if exists(select 1 from public.incidents where id=incident_a) then raise exception 'FAIL: admin sees tombstone'; end if;

 -- An unauthenticated request cannot read application data or call removal.
 reset role;
 perform set_config('request.jwt.claim.sub','',true);
 perform set_config('request.jwt.claims','{}',true);
 set local role anon;
 begin
  perform 1 from public.incidents;
  raise exception 'FAIL: anonymous read';
 exception when insufficient_privilege then null; end;
 begin
  perform public.remove_incident(incident_a);
  raise exception 'FAIL: anonymous remove';
 exception when insufficient_privilege then null; end;
 reset role;
 if (select count(*) from public.incidents where id in (incident_a,incident_b) and deleted_at is not null) <> 2 then raise exception 'FAIL: soft-deleted rows not retained'; end if;
 set constraints all immediate;
end;
$$;
select 'PASS: database foundation, ownership, admin, evidence, geometry, timestamps, soft deletion and anonymous isolation' as result;
rollback;
