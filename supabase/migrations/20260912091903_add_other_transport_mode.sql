-- Add the user-requested fallback to the database-driven transport checkboxes.
insert into public.transport_modes (slug, label, sort_order, is_active)
values ('other', 'Other', 6, true);
