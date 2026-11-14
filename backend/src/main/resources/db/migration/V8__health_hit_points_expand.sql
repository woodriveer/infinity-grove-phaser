-- Health becomes 64-bit (spec campaign-chapters, AD-019). Expand step of AD-016: the new *_hit_points columns are added and filled, the
-- legacy integer columns stay (nullable) so the previous backend keeps starting; V10 drops them after two more deploys.
alter table chapters add column if not exists boss_hit_points bigint;
alter table stages add column if not exists monster_hit_points bigint;
alter table stages add column if not exists miniboss_hit_points bigint;
update chapters set boss_hit_points = boss_health where boss_hit_points is null;
update stages set monster_hit_points = monster_health where monster_hit_points is null;
update stages set miniboss_hit_points = miniboss_health where miniboss_hit_points is null;
alter table chapters drop constraint if exists ck_chapters_boss_hit_points;
alter table chapters add constraint ck_chapters_boss_hit_points check (boss_hit_points >= 1);
alter table stages drop constraint if exists ck_stages_monster_hit_points;
alter table stages add constraint ck_stages_monster_hit_points check (monster_hit_points >= 1);
alter table stages drop constraint if exists ck_stages_miniboss_hit_points;
alter table stages add constraint ck_stages_miniboss_hit_points check (miniboss_hit_points >= 1);
alter table chapters alter column boss_health drop not null;
alter table stages alter column monster_health drop not null;
alter table stages alter column miniboss_health drop not null;
