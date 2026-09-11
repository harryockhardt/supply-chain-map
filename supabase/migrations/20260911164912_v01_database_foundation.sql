-- Milestone 1: the locked v0.1 database foundation.
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id),
 display_name text,
 role text not null default 'user' check (role in ('user','admin')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.incident_categories (
 slug text primary key check (length(btrim(slug)) > 0),
 label text not null check (length(btrim(label)) > 0),
 sort_order integer not null,
 is_active boolean not null default true
);
create table public.transport_modes (
 slug text primary key check (length(btrim(slug)) > 0),
 label text not null check (length(btrim(label)) > 0),
 sort_order integer not null,
 is_active boolean not null default true
);
create table public.effect_types (
 slug text primary key check (length(btrim(slug)) > 0),
 label text not null check (length(btrim(label)) > 0),
 sort_order integer not null,
 is_active boolean not null default true
);
create table public.incidents (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) default auth.uid(),
 title text not null check (length(btrim(title)) > 0),
 category_slug text not null references public.incident_categories(slug),
 description text not null check (length(btrim(description)) > 0),
 geometry extensions.geometry(Geometry,4326) not null,
 event_start_at timestamptz not null,
 status text not null check (status in ('upcoming','active','resolved','unverified')),
 current_state_description text not null check (length(btrim(current_state_description)) > 0),
 last_verified_at timestamptz not null,
 resolved_at timestamptz,
 severity smallint not null check (severity between 1 and 5),
 impact_description text not null check (length(btrim(impact_description)) > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 deleted_at timestamptz,
 constraint v01_point_geometry check (
   extensions.geometrytype(geometry) = 'POINT'
   and not extensions.st_isempty(geometry)
   and extensions.st_ndims(geometry) = 2
   and extensions.st_x(geometry) between -180 and 180
   and extensions.st_y(geometry) between -90 and 90
 )
);
create table public.incident_transport_modes (
 incident_id uuid not null references public.incidents(id),
 mode_slug text not null references public.transport_modes(slug),
 primary key (incident_id,mode_slug)
);
create table public.incident_effects (
 incident_id uuid not null references public.incidents(id),
 effect_slug text not null references public.effect_types(slug),
 primary key (incident_id,effect_slug)
);
create table public.incident_sources (
 id uuid primary key default gen_random_uuid(),
 incident_id uuid not null references public.incidents(id),
 source_name text not null check (length(btrim(source_name)) > 0),
 url text not null check (url ~ '^https?://[^[:space:]]+$'),
 published_at timestamptz,
 created_at timestamptz not null default now()
);
create index incidents_geometry_idx on public.incidents using gist (geometry);
create index incidents_owner_idx on public.incidents(owner_id);
create index incidents_category_idx on public.incidents(category_slug);
create index incidents_status_idx on public.incidents(status);
create index incidents_event_start_idx on public.incidents(event_start_at);
create index incidents_last_verified_idx on public.incidents(last_verified_at);
create index incident_sources_incident_idx on public.incident_sources(incident_id);
create index incident_modes_mode_idx on public.incident_transport_modes(mode_slug);
create index incident_effects_effect_idx on public.incident_effects(effect_slug);

-- Only this fixed, non-exposed helper may read the caller's protected role.
create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (
  select 1 from public.profiles where id = auth.uid() and role = 'admin'
 );
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

create function private.set_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 new.updated_at := clock_timestamp();
 return new;
end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;
create trigger profiles_updated before update on public.profiles
for each row execute function private.set_updated_at();
create trigger incidents_updated before update on public.incidents
for each row execute function private.set_updated_at();

-- Auth user creation is trusted; user-editable metadata never sets role.
create function private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id) values (new.id);
 return new;
end;
$$;
revoke all on function private.create_profile() from public, anon, authenticated;
create trigger create_application_profile after insert on auth.users
for each row execute function private.create_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
alter table public.incident_categories enable row level security;
revoke all on public.incident_categories from public, anon, authenticated;
grant select on public.incident_categories to authenticated;
alter table public.transport_modes enable row level security;
revoke all on public.transport_modes from public, anon, authenticated;
grant select on public.transport_modes to authenticated;
alter table public.effect_types enable row level security;
revoke all on public.effect_types from public, anon, authenticated;
grant select on public.effect_types to authenticated;
alter table public.incidents enable row level security;
revoke all on public.incidents from public, anon, authenticated;
grant select on public.incidents to authenticated;
alter table public.incident_transport_modes enable row level security;
revoke all on public.incident_transport_modes from public, anon, authenticated;
grant select on public.incident_transport_modes to authenticated;
alter table public.incident_effects enable row level security;
revoke all on public.incident_effects from public, anon, authenticated;
grant select on public.incident_effects to authenticated;
alter table public.incident_sources enable row level security;
revoke all on public.incident_sources from public, anon, authenticated;
grant select on public.incident_sources to authenticated;
create policy profiles_read on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));
-- Only display_name is client-editable; role and identity are immutable to clients.
grant update(display_name) on public.profiles to authenticated;
create policy profiles_update on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy lookup_read on public.incident_categories for select to authenticated using ((select auth.uid()) is not null);
create policy lookup_read on public.transport_modes for select to authenticated using ((select auth.uid()) is not null);
create policy lookup_read on public.effect_types for select to authenticated using ((select auth.uid()) is not null);
grant insert(owner_id,title,category_slug,description,geometry,event_start_at,status,current_state_description,last_verified_at,resolved_at,severity,impact_description) on public.incidents to authenticated;
grant update(title,category_slug,description,geometry,event_start_at,status,current_state_description,last_verified_at,resolved_at,severity,impact_description) on public.incidents to authenticated;
create policy incidents_read on public.incidents for select to authenticated
using ((select auth.uid()) is not null and deleted_at is null);
create policy incidents_create on public.incidents for insert to authenticated
with check (owner_id = (select auth.uid()) and deleted_at is null);
create policy incidents_update on public.incidents for update to authenticated
using (deleted_at is null and (owner_id = (select auth.uid()) or (select private.is_admin())))
with check (deleted_at is null and (owner_id = (select auth.uid()) or (select private.is_admin())));
create policy child_read on public.incident_transport_modes for select to authenticated
using (exists (select 1 from public.incidents i where i.id = incident_id and i.deleted_at is null));
create policy child_create on public.incident_transport_modes for insert to authenticated
with check (exists (select 1 from public.incidents i where i.id = incident_id and i.deleted_at is null and (i.owner_id = (select auth.uid()) or (select private.is_admin()))));
create policy child_delete on public.incident_transport_modes for delete to authenticated
using (exists (select 1 from public.incidents i where i.id = incident_id and i.deleted_at is null and (i.owner_id = (select auth.uid()) or (select private.is_admin()))));
grant delete on public.incident_transport_modes to authenticated;
create policy child_read on public.incident_effects for select to authenticated
using (exists (select 1 from public.incidents i where i.id = incident_id and i.deleted_at is null));
create policy child_create on public.incident_effects for insert to authenticated
with check (exists (select 1 from public.incidents i where i.id = incident_id and i.deleted_at is null and (i.owner_id = (select auth.uid()) or (select private.is_admin()))));
create policy child_delete on public.incident_effects for delete to authenticated
using (exists (select 1 from public.incidents i where i.id = incident_id and i.deleted_at is null and (i.owner_id = (select auth.uid()) or (select private.is_admin()))));
grant delete on public.incident_effects to authenticated;
create policy child_read on public.incident_sources for select to authenticated
using (exists (select 1 from public.incidents i where i.id = incident_id and i.deleted_at is null));
create policy child_create on public.incident_sources for insert to authenticated
with check (exists (select 1 from public.incidents i where i.id = incident_id and i.deleted_at is null and (i.owner_id = (select auth.uid()) or (select private.is_admin()))));
create policy child_delete on public.incident_sources for delete to authenticated
using (exists (select 1 from public.incidents i where i.id = incident_id and i.deleted_at is null and (i.owner_id = (select auth.uid()) or (select private.is_admin()))));
grant delete on public.incident_sources to authenticated;
grant insert(incident_id,mode_slug) on public.incident_transport_modes to authenticated;
grant insert(incident_id,effect_slug) on public.incident_effects to authenticated;
grant insert(incident_id,source_name,url,published_at) on public.incident_sources to authenticated;
grant update(source_name,url,published_at) on public.incident_sources to authenticated;
create policy source_update on public.incident_sources for update to authenticated
using (exists (select 1 from public.incidents i where i.id = incident_id and i.deleted_at is null and (i.owner_id = (select auth.uid()) or (select private.is_admin()))))
with check (exists (select 1 from public.incidents i where i.id = incident_id and i.deleted_at is null and (i.owner_id = (select auth.uid()) or (select private.is_admin()))));

-- A narrow delete operation is necessary because RLS hides the resulting tombstone.
-- It cannot change incident contents, restore rows, or act without a user ID.
create function private.remove_incident(target_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then
  raise exception 'Authentication required' using errcode = '42501';
 end if;
 update public.incidents set deleted_at = clock_timestamp()
 where id = target_id and deleted_at is null
 and (owner_id = auth.uid() or private.is_admin());
 if not found then
  raise exception 'Incident unavailable or access denied' using errcode = '42501';
 end if;
end;
$$;
revoke all on function private.remove_incident(uuid) from public, anon, authenticated;
grant execute on function private.remove_incident(uuid) to authenticated;
create function public.remove_incident(target_id uuid) returns void
language sql security invoker set search_path = '' as $$
 select private.remove_incident(target_id);
$$;
revoke all on function public.remove_incident(uuid) from public, anon, authenticated;
grant execute on function public.remove_incident(uuid) to authenticated;

-- Child writes lock/update the parent, serializing concurrent evidence edits.
create function private.touch_parent() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare parent_id uuid;
begin
 parent_id := case when TG_OP = 'DELETE' then old.incident_id else new.incident_id end;
 update public.incidents set title = title where id = parent_id;
 if not found then raise exception 'Incident unavailable or access denied' using errcode = '42501'; end if;
 if TG_OP = 'DELETE' then return old; end if;
 return new;
end;
$$;
revoke all on function private.touch_parent() from public, anon, authenticated;

-- Validate the complete record at transaction end, after its children are saved.
create function private.check_incident_complete() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare target uuid; current_status text;
begin
 if TG_TABLE_NAME = 'incidents' then target := new.id;
 elsif TG_OP = 'DELETE' then target := old.incident_id;
 else target := new.incident_id;
 end if;
 select status into current_status from public.incidents where id = target and deleted_at is null;
 if not found then return null; end if;
 if not exists(select 1 from public.incident_transport_modes where incident_id = target)
 or not exists(select 1 from public.incident_effects where incident_id = target) then
  raise exception 'An incident requires a transport mode and an effect' using errcode = '23514';
 end if;
 if current_status <> 'unverified' and not exists(select 1 from public.incident_sources where incident_id = target) then
  raise exception 'This status requires a source' using errcode = '23514';
 end if;
 return null;
end;
$$;
revoke all on function private.check_incident_complete() from public, anon, authenticated;
create trigger touch_parent before insert or update or delete on public.incident_transport_modes
for each row execute function private.touch_parent();
create constraint trigger complete_incident after insert or update or delete on public.incident_transport_modes
deferrable initially deferred for each row execute function private.check_incident_complete();
create trigger touch_parent before insert or update or delete on public.incident_effects
for each row execute function private.touch_parent();
create constraint trigger complete_incident after insert or update or delete on public.incident_effects
deferrable initially deferred for each row execute function private.check_incident_complete();
create trigger touch_parent before insert or update or delete on public.incident_sources
for each row execute function private.touch_parent();
create constraint trigger complete_incident after insert or update or delete on public.incident_sources
deferrable initially deferred for each row execute function private.check_incident_complete();
create constraint trigger complete_incident after insert or update on public.incidents
deferrable initially deferred for each row execute function private.check_incident_complete();
insert into public.incident_categories(slug,label,sort_order) values
('armed-conflict','Armed Conflict',1),
('attack','Attack',2),
('airspace-restriction','Airspace Restriction',3),
('maritime-restriction','Maritime Restriction',4),
('infrastructure-disruption','Infrastructure Disruption',5),
('border-restriction','Border Restriction',6),
('labor-disruption','Labor Disruption',7),
('natural-disaster','Natural Disaster',8),
('other','Other',9);
insert into public.transport_modes(slug,label,sort_order) values
('maritime','Maritime',1),
('aviation','Aviation',2),
('road','Road',3),
('rail','Rail',4),
('pipeline','Pipeline',5);
insert into public.effect_types(slug,label,sort_order) values
('closure','Closure',1),
('delay','Delay',2),
('rerouting','Rerouting',3),
('capacity-reduction','Capacity Reduction',4),
('security-risk','Security Risk',5),
('infrastructure-damage','Infrastructure Damage',6),
('cost-increase','Cost Increase',7),
('other','Other',8);
