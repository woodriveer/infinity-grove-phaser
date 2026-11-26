-- Expand step of TD-002 (spec defense-contract; AD-016, AD-021): the one enemy defense gets its own column `defense`. The backend before
-- this feature still reads physical_defense and writes physical_defense and magical_defense; the new backend reads and writes only
-- defense. The trigger fills whichever side an insert leaves null, so every row holds the same value in the three columns until V20
-- drops the old two. No code updates an enemy row, so the trigger runs on insert only.
alter table enemies add column if not exists defense integer;

update enemies set defense = physical_defense where defense is null;

create or replace function enemies_defense_sync() returns trigger
language plpgsql as $$
begin
    new.defense := coalesce(new.defense, new.physical_defense);
    new.physical_defense := coalesce(new.physical_defense, new.defense);
    new.magical_defense := coalesce(new.magical_defense, new.defense);
    return new;
end;
$$;

drop trigger if exists enemies_defense_sync on enemies;
create trigger enemies_defense_sync before insert on enemies for each row execute function enemies_defense_sync();

alter table enemies alter column defense set not null;
alter table enemies add constraint ck_enemies_defense check (defense between 0 and 90);
alter table enemies add constraint uk_enemies_defense unique (element, defense, crit_resistance);
