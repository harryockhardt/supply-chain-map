-- All fixtures, including accounts, are rolled back. Existing data is untouched.
begin;
do $test$
declare
 a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); admin_id uuid := gen_random_uuid();
 ia uuid; ib uuid;
 payload jsonb := '{"title":"M6 ownership fixture","category_slug":"other","description":"Temporary verification","geometry":{"type":"Point","coordinates":[0,0]},"event_start_at":"2026-09-14T00:00:00Z","status":"unverified","current_state_description":"Temporary","last_verified_at":"2026-09-14T00:00:00Z","severity":1,"impact_description":"Temporary","modes":["other"],"effects":["other"],"sources":[]}';
begin
 insert into auth.users(id) values(a),(b),(admin_id);
 update public.profiles set role='admin' where id=admin_id;
 perform set_config('request.jwt.claim.sub',a::text,true);
 set local role authenticated;
 ia := public.create_incident(payload);
 perform set_config('request.jwt.claim.sub',b::text,true);
 ib := public.create_incident(payload);
 set constraints all immediate;
 assert (select array_agg(id) from public.incidents where owner_id=auth.uid() and deleted_at is null)=array[ib], 'User B list includes another owner';
 assert (select count(*) from public.incidents where id in(ia,ib))=2, 'Shared map reads broken';
 perform set_config('request.jwt.claim.sub',a::text,true);
 assert (select array_agg(id) from public.incidents where owner_id=auth.uid() and deleted_at is null)=array[ia], 'User A list includes another owner';
 perform public.remove_incident(ia);
 assert not exists(select 1 from public.incidents where owner_id=auth.uid() and deleted_at is null), 'Removed incident remains in My Incidents';
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 assert private.is_admin(), 'Admin fixture failed';
 assert not exists(select 1 from public.incidents where owner_id=auth.uid() and deleted_at is null), 'Admin My Incidents includes other owners';
 assert exists(select 1 from public.incidents where id=ib), 'Admin shared read broken';
 reset role;
 assert exists(select 1 from public.incidents where id=ia and deleted_at is not null), 'Soft deletion destroyed data';
end $test$;
rollback;
