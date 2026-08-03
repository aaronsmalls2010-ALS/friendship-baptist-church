-- 2026-08-02 — Drop wards.deacon_id (supersedes 20260801_wards_deacon_fk.sql).
-- Deacon↔ward is consolidated onto deacons.ward_id. Keeping wards.deacon_id made
-- a second deacons↔wards FK relationship, so PostgREST embeds like `wards(name)`
-- from deacons became ambiguous and 500'd — the public /deacons page showed no
-- deacons as a result. Removing the column restores a single, unambiguous link.
ALTER TABLE public.wards DROP COLUMN IF EXISTS deacon_id;
