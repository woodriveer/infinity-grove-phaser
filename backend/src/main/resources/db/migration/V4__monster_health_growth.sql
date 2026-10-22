-- Monster health now grows by 4x each chapter (spec monster-scaling). ChapterSeeder never overwrites a chapter, so a database seeded before
-- this migration keeps the old linear health; each update only touches a row still holding the seeded value, so a value tuned in the
-- database survives.
update stages
   set monster_health  = (40 + 4 * (number - 1)) * power(4, chapter - 1)::integer,
       miniboss_health = (40 + 4 * (number - 1)) * power(4, chapter - 1)::integer * 5
 where monster_health = (10 + number - 1) * chapter
   and miniboss_health = (10 + number - 1) * chapter * 5;

update chapters
   set boss_health = 2000 * power(4, number - 1)::integer
 where boss_health = 300 * number;
