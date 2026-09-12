-- Development fixtures only. Fictional records, not real disruption reports.
-- Requires exactly one provisioned admin; does not run automatically on deployment.
begin;
do $$ begin
 if (select count(*) from public.profiles where role = 'admin') <> 1 then
  raise exception 'Expected exactly one development owner';
 end if;
end $$;
insert into public.incidents (id, owner_id, title, category_slug, description, geometry,
 event_start_at, status, current_state_description, last_verified_at, severity, impact_description)
select v.id::uuid, p.id, v.title, v.category, 'Fictional Milestone 4 test record. No real disruption is being reported.',
 extensions.st_setsrid(extensions.st_makepoint(v.lng,v.lat),4326),
 '2026-09-12T08:00:00Z', 'unverified', 'For map testing only; not verified operational information.',
 '2026-09-12T08:00:00Z', 2, 'Fictional example used to test persistent map locations and incident details.'
from public.profiles p cross join (values
 ('40000000-0000-4000-8000-000000000001','TEST — Rotterdam port delay','maritime-restriction',4.47917,51.9225),
 ('40000000-0000-4000-8000-000000000002','TEST — Cairo road disruption','infrastructure-disruption',31.2357,30.0444)
) v(id,title,category,lng,lat)
where p.role = 'admin'
on conflict (id) do nothing;
insert into public.incident_transport_modes(incident_id,mode_slug) values
 ('40000000-0000-4000-8000-000000000001','maritime'),
 ('40000000-0000-4000-8000-000000000002','road')
on conflict do nothing;
insert into public.incident_effects(incident_id,effect_slug) values
 ('40000000-0000-4000-8000-000000000001','delay'),
 ('40000000-0000-4000-8000-000000000002','rerouting')
on conflict do nothing;
insert into public.incident_sources(id,incident_id,source_name,url,published_at) values
 ('40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001',
 'Test fixture reference — not incident evidence','https://example.org','2026-09-12T08:00:00Z')
on conflict do nothing;
commit;
