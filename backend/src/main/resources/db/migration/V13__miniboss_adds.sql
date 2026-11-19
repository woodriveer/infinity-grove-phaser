-- The adds of a miniboss (spec miniboss-adds): 0 to 2 per stage, each with its health and the points it adds to the miniboss's defense.
-- Expand only (AD-016): the previous backend never reads this table. Stages of chapters 1 to 10 have no row. Every statement can run
-- again (StageAddsMigrationIT re-runs the file).
create table if not exists stage_adds (
    id           varchar(255) primary key,
    stage_id     varchar(255) not null references stages (id) on delete restrict,
    slot         integer      not null check (slot between 1 and 2),
    hit_points   bigint       not null check (hit_points >= 1),
    defense_buff integer      not null check (defense_buff between 0 and 90),
    constraint uk_stage_adds_stage_slot unique (stage_id, slot)
);

create index if not exists idx_stage_adds_stage on stage_adds (stage_id);

-- ChapterSeeder never overwrites a stored chapter, so the stored stages of chapters 11 to 15 get their two adds here: health 3 times the
-- phase monster health the stage holds now, the buff of the chapter. A new database has no stage yet; the seeder writes its adds.
insert into stage_adds (id, stage_id, slot, hit_points, defense_buff)
select s.id || '/' || a.slot, s.id, a.slot, 3 * s.monster_hit_points, b.buff
  from stages s
  join (values (11, 30), (12, 35), (13, 40), (14, 45), (15, 50)) as b (chapter, buff) on b.chapter = s.chapter
 cross join (values (1), (2)) as a (slot)
 where s.monster_hit_points is not null
on conflict (id) do nothing;
