-- Run after supabase/fixtures/milestone4.sql; all changes roll back.
begin;
do $$ begin
 assert not has_function_privilege('anon', 'public.read_incidents(uuid)', 'execute'), 'Anonymous RPC access';
 assert not (select prosecdef from pg_proc where oid = 'public.read_incidents(uuid)'::regprocedure), 'Read RPC bypasses RLS';
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','40000000-0000-4000-8000-000000000099',true);
do $$ declare records jsonb; row jsonb; begin
 records := public.read_incidents();
 assert jsonb_array_length(records) >= 2, 'Non-owner cannot read shared incidents';
 row := public.read_incidents('40000000-0000-4000-8000-000000000001')->0;
 assert row->>'title' = 'TEST — Rotterdam port delay', 'Wrong record opened';
 assert row->'geometry'->'coordinates' = '[4.47917,51.9225]'::jsonb, 'Coordinate order changed';
 assert row->'transport_modes'->0->>'slug' = 'maritime', 'Missing mode';
 assert row->'sources'->0->>'url' = 'https://example.org', 'Missing evidence';
 assert public.read_incidents('40000000-0000-4000-8000-000000000098') = '[]'::jsonb, 'Missing ID is not empty';
end $$;
reset role;
update public.incidents set deleted_at = now() where id = '40000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$ begin
 assert public.read_incidents('40000000-0000-4000-8000-000000000002') = '[]'::jsonb, 'Deleted incident leaks';
 assert not exists (select 1 from jsonb_array_elements(public.read_incidents()) i where i->>'id' = '40000000-0000-4000-8000-000000000002'), 'Deleted marker leaks';
end $$;
select set_config('request.jwt.claim.sub','',true);
do $$ begin assert public.read_incidents() = '[]'::jsonb, 'Missing identity leaks records'; end $$;
rollback;
