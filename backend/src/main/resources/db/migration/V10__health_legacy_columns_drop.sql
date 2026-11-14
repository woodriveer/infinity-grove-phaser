-- Contract step of AD-016 for the 64-bit health (spec campaign-chapters): the running backend (T13) no longer maps the legacy columns.
alter table chapters drop column boss_health;
alter table stages drop column monster_health;
alter table stages drop column miniboss_health;
alter table chapters alter column boss_hit_points set not null;
alter table stages alter column monster_hit_points set not null;
alter table stages alter column miniboss_hit_points set not null;
