-- 2026-08-01 — Fix ward deacon assignment (applied to prod).
-- wards.deacon_id FK pointed at profiles(id), but the admin UI assigns a
-- deacons.id, so assignment FK-violated and never persisted. Repoint the FK to
-- deacons(id). The wards GET no longer embeds deacons(...) (ambiguous now that
-- both wards.deacon_id->deacons and deacons.ward_id->wards exist); the page
-- resolves the assigned deacon client-side from wards.deacon_id.
do $$
declare c text;
begin
  select con.conname into c
  from pg_constraint con
  join pg_attribute a on a.attrelid = con.conrelid and a.attnum = con.conkey[1]
  where con.conrelid = 'public.wards'::regclass and con.contype = 'f' and a.attname = 'deacon_id';
  if c is not null then execute 'alter table public.wards drop constraint ' || quote_ident(c); end if;
end $$;

alter table public.wards
  add constraint wards_deacon_id_deacons_fkey
  foreign key (deacon_id) references public.deacons(id) on delete set null;
