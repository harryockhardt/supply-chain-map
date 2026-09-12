-- Atomic creation with caller permissions; no owner or role supplied by the client.
create function public.create_incident(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare result uuid; item jsonb; mode text; effect text;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
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
 if not exists(select 1 from public.incident_categories where slug=payload->>'category_slug' and is_active) then
  raise exception 'Category is unavailable' using errcode='23514';
 end if;
 insert into public.incidents(owner_id,title,category_slug,description,geometry,event_start_at,status,
  current_state_description,last_verified_at,resolved_at,severity,impact_description)
 values(auth.uid(),btrim(payload->>'title'),payload->>'category_slug',btrim(payload->>'description'),
  extensions.st_geomfromgeojson(payload->'geometry'),(payload->>'event_start_at')::timestamptz,
  payload->>'status',btrim(payload->>'current_state_description'),(payload->>'last_verified_at')::timestamptz,
  nullif(payload->>'resolved_at','')::timestamptz,(payload->>'severity')::smallint,btrim(payload->>'impact_description'))
 returning id into result;
 for mode in select distinct jsonb_array_elements_text(payload->'modes') loop
  if not exists(select 1 from public.transport_modes where slug=mode and is_active) then
   raise exception 'Transport mode is unavailable' using errcode='23514';
  end if;
  insert into public.incident_transport_modes(incident_id,mode_slug) values(result,mode);
 end loop;
 for effect in select distinct jsonb_array_elements_text(payload->'effects') loop
  if not exists(select 1 from public.effect_types where slug=effect and is_active) then
   raise exception 'Effect is unavailable' using errcode='23514';
  end if;
  insert into public.incident_effects(incident_id,effect_slug) values(result,effect);
 end loop;
 for item in select jsonb_array_elements(payload->'sources') loop
  insert into public.incident_sources(incident_id,source_name,url,published_at)
  values(result,btrim(item->>'source_name'),btrim(item->>'url'),nullif(item->>'published_at','')::timestamptz);
 end loop;
 return result;
end;
$$;
revoke all on function public.create_incident(jsonb) from public, anon;
grant execute on function public.create_incident(jsonb) to authenticated;
