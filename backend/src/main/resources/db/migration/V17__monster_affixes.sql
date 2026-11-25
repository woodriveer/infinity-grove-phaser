-- Monster affixes (spec early-game-rebalance, AD-030): one per miniboss (stage_affixes) or chapter boss (chapter_affixes). Expand only
-- (AD-016): the previous backend never reads these tables. ChapterSeeder never overwrites a stored chapter, so the stored stages and chapters
-- 2 to 15 get their affixes here; a new database has none yet and the seeder writes them. Every statement can run again.
create table if not exists stage_affixes (
    stage_id  varchar(255) primary key references stages (id) on delete restrict,
    affix     varchar(32)  not null check (affix in ('SHELL', 'HIT_SHIELD', 'REGENERATION', 'ARMORED')),
    amount    bigint       not null check (amount >= 1),
    period_ms bigint       null check (period_ms is null or period_ms between 1 and 600000),
    constraint ck_stage_affixes_period check ((affix = 'HIT_SHIELD') = (period_ms is not null))
);

create table if not exists chapter_affixes (
    chapter   integer      primary key references chapters (number) on delete restrict,
    affix     varchar(32)  not null check (affix in ('SHELL', 'HIT_SHIELD', 'REGENERATION', 'ARMORED')),
    amount    bigint       not null check (amount >= 1),
    period_ms bigint       null check (period_ms is null or period_ms between 1 and 600000),
    constraint ck_chapter_affixes_period check ((affix = 'HIT_SHIELD') = (period_ms is not null))
);

insert into stage_affixes (stage_id, affix, amount, period_ms)
select s.id, a.affix, a.amount::bigint, a.period_ms::bigint
  from stages s
  join (values
        (2, 3, 'HIT_SHIELD', 10, 6000), (2, 6, 'HIT_SHIELD', 10, 6000), (2, 9, 'HIT_SHIELD', 10, 6000),
        (3, 3, 'SHELL', 6, null::integer), (3, 6, 'HIT_SHIELD', 15, 6000), (3, 9, 'SHELL', 14, null),
        (4, 3, 'REGENERATION', 50, null), (4, 6, 'SHELL', 24, null), (4, 9, 'REGENERATION', 50, null),
        (5, 3, 'ARMORED', 20, null), (5, 6, 'REGENERATION', 50, null), (5, 9, 'ARMORED', 20, null),
        (6, 3, 'HIT_SHIELD', 30, 6000), (6, 6, 'SHELL', 49, null), (6, 9, 'REGENERATION', 50, null),
        (7, 3, 'SHELL', 122, null), (7, 6, 'REGENERATION', 50, null), (7, 9, 'ARMORED', 20, null),
        (8, 3, 'REGENERATION', 50, null), (8, 6, 'ARMORED', 20, null), (8, 9, 'HIT_SHIELD', 30, 6000),
        (9, 3, 'ARMORED', 20, null), (9, 6, 'HIT_SHIELD', 30, 6000), (9, 9, 'SHELL', 318, null),
        (10, 3, 'HIT_SHIELD', 30, 6000), (10, 6, 'SHELL', 346, null), (10, 9, 'REGENERATION', 50, null)
       ) as a (chapter, number, affix, amount, period_ms)
    on a.chapter = s.chapter and a.number = s.number
on conflict (stage_id) do nothing;

insert into chapter_affixes (chapter, affix, amount, period_ms)
select c.number, a.affix, a.amount::bigint, a.period_ms::bigint
  from chapters c
  join (values
        (2, 'HIT_SHIELD', 10, 6000), (3, 'SHELL', 16, null::integer), (4, 'REGENERATION', 25, null), (5, 'ARMORED', 20, null),
        (6, 'ARMORED', 20, null), (7, 'HIT_SHIELD', 30, 6000), (8, 'SHELL', 205, null), (9, 'REGENERATION', 25, null), (10, 'ARMORED', 20, null),
        (11, 'HIT_SHIELD', 30, 6000), (12, 'SHELL', 365, null), (13, 'REGENERATION', 25, null), (14, 'ARMORED', 20, null), (15, 'HIT_SHIELD', 30, 6000)
       ) as a (chapter, affix, amount, period_ms)
    on a.chapter = c.number
on conflict (chapter) do nothing;
