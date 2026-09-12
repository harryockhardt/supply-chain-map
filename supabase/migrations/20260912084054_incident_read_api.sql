-- Read-only GeoJSON projection; all table reads remain subject to caller RLS.
create function public.read_incidents(incident_id uuid default null)
returns jsonb
language sql stable security invoker set search_path = ''
as $$
 select coalesce(jsonb_agg(record order by record->>'id'), '[]'::jsonb)
 from (
  select (to_jsonb(i) - 'geometry' - 'deleted_at') || jsonb_build_object(
   'geometry', extensions.st_asgeojson(i.geometry)::jsonb,
   'category_label', c.label,
   'transport_modes', coalesce((
     select jsonb_agg(jsonb_build_object('slug', m.slug, 'label', m.label) order by m.sort_order)
     from public.incident_transport_modes im join public.transport_modes m on m.slug = im.mode_slug
     where im.incident_id = i.id), '[]'::jsonb),
   'effects', coalesce((
     select jsonb_agg(jsonb_build_object('slug', e.slug, 'label', e.label) order by e.sort_order)
     from public.incident_effects ie join public.effect_types e on e.slug = ie.effect_slug
     where ie.incident_id = i.id), '[]'::jsonb),
   'sources', coalesce((
     select jsonb_agg(jsonb_build_object('id', s.id, 'source_name', s.source_name, 'url', s.url, 'published_at', s.published_at) order by s.created_at, s.id)
     from public.incident_sources s where s.incident_id = i.id), '[]'::jsonb)
  ) as record
  from public.incidents i
  join public.incident_categories c on c.slug = i.category_slug
  where i.deleted_at is null and (read_incidents.incident_id is null or i.id = read_incidents.incident_id)
 ) rows;
$$;
revoke all on function public.read_incidents(uuid) from public, anon;
grant execute on function public.read_incidents(uuid) to authenticated;
