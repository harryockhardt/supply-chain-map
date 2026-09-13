-- Atomic editing with caller RLS and a version check to prevent stale overwrites.
create function public.update_incident(target_id uuid, expected_updated_at timestamptz, payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare result uuid := target_id; previous public.incidents%rowtype; item jsonb; mode text; effect text;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 select * into previous from public.incidents
 where id=target_id and deleted_at is null and (owner_id=auth.uid() or private.is_admin()) for update;
 if not found then raise exception 'Incident unavailable or access denied' using errcode='42501'; end if;
 if expected_updated_at is distinct from previous.updated_at then
  raise exception 'Incident changed; reload before editing' using errcode='40001';
 end if;
 if jsonb_typeof(payload) is distinct from 'object' or payload ? 'owner_id'
 or payload ? 'id' or payload ? 'deleted_at' then
  raise exception 'Invalid incident payload' using errcode='23514';
 end if;
 if payload->'geometry'->>'type' is distinct from 'Point'
 or jsonb_typeof(payload->'modes') is distinct from 'array'
 or jsonb_typeof(payload->'effects') is distinct from 'array'
 or jsonb_typeof(payload->'sources') is distinct from 'array' then
  raise exception 'Point, modes, effects and sources are required' using errcode='23514';
 end if;
 if jsonb_array_length(payload->'modes') = 0 or jsonb_array_length(payload->'effects') = 0 then
  raise exception 'Select at least one mode and effect' using errcode='23514';
 end if;
 if payload->>'status' <> 'unverified' and jsonb_array_length(payload->'sources') = 0 then
  raise exception 'This status requires a source' using errcode='23514';
 end if;
 if not exists(select 1 from public.incident_categories where slug=payload->>'category_slug' and (is_active or slug=previous.category_slug)) then
  raise exception 'Category is unavailable' using errcode='23514';
 end if;
 update public.incidents set
 title=btrim(payload->>'title'), category_slug=payload->>'category_slug', description=btrim(payload->>'description'),
 geometry=extensions.st_geomfromgeojson(payload->'geometry'), event_start_at=(payload->>'event_start_at')::timestamptz,
 status=payload->>'status', current_state_description=btrim(payload->>'current_state_description'),
 last_verified_at=(payload->>'last_verified_at')::timestamptz, resolved_at=nullif(payload->>'resolved_at','')::timestamptz,
 severity=(payload->>'severity')::smallint, impact_description=btrim(payload->>'impact_description')
 where id=target_id;
 -- Keep unchanged source identities and reject IDs belonging to any other record.
 if exists(select 1 from jsonb_array_elements(payload->'sources') s where s ? 'id'
  and not exists(select 1 from public.incident_sources existing where existing.incident_id=target_id and existing.id=(s->>'id')::uuid))
 or (select count(*) from jsonb_array_elements(payload->'sources') s where s ? 'id') <>
    (select count(distinct s->>'id') from jsonb_array_elements(payload->'sources') s where s ? 'id') then
  raise exception 'Invalid source identity' using errcode='23514';
 end if;
 delete from public.incident_sources where incident_id=target_id and id not in
  (select (s->>'id')::uuid from jsonb_array_elements(payload->'sources') s where s ? 'id');
 delete from public.incident_transport_modes where incident_id=target_id and mode_slug not in
  (select jsonb_array_elements_text(payload->'modes'));
 delete from public.incident_effects where incident_id=target_id and effect_slug not in
  (select jsonb_array_elements_text(payload->'effects'));
 for mode in select distinct jsonb_array_elements_text(payload->'modes') loop
  if not exists(select 1 from public.transport_modes where slug=mode and (is_active or exists(select 1 from public.incident_transport_modes where incident_id=target_id and mode_slug=mode))) then
   raise exception 'Transport mode is unavailable' using errcode='23514';
  end if;
  insert into public.incident_transport_modes(incident_id,mode_slug) values(result,mode) on conflict do nothing;
 end loop;
 for effect in select distinct jsonb_array_elements_text(payload->'effects') loop
  if not exists(select 1 from public.effect_types where slug=effect and (is_active or exists(select 1 from public.incident_effects where incident_id=target_id and effect_slug=effect))) then
   raise exception 'Effect is unavailable' using errcode='23514';
  end if;
  insert into public.incident_effects(incident_id,effect_slug) values(result,effect) on conflict do nothing;
 end loop;
 for item in select jsonb_array_elements(payload->'sources') loop
  if item ? 'id' then
   update public.incident_sources set source_name=btrim(item->>'source_name'),url=btrim(item->>'url'),
    published_at=nullif(item->>'published_at','')::timestamptz where incident_id=target_id and id=(item->>'id')::uuid;
  else
  insert into public.incident_sources(incident_id,source_name,url,published_at)
  values(result,btrim(item->>'source_name'),btrim(item->>'url'),nullif(item->>'published_at','')::timestamptz);
  end if;
 end loop;
 return result;
end;
$$;
revoke all on function public.update_incident(uuid,timestamptz,jsonb) from public, anon;
grant execute on function public.update_incident(uuid,timestamptz,jsonb) to authenticated;
