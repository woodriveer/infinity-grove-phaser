-- Contract step of TD-002 (spec defense-contract; AD-016): the running backend (release 1) maps only `defense`, and the backend before
-- it is no longer a rollback target. The old columns, their unique key and the trigger that kept them filled go.
drop trigger if exists enemies_defense_sync on enemies;
drop function if exists enemies_defense_sync();
alter table enemies drop constraint if exists uk_enemies_attributes;
alter table enemies drop column if exists physical_defense;
alter table enemies drop column if exists magical_defense;
