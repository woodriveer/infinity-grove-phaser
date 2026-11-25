-- early-game-rebalance (AD-030): every chapter moves to the fitted table, 8 phases a stage, 3x minibosses, 45 s and 90 s limits. Data only
-- (AD-016): same columns, so the previous backend keeps reading them. Each update touches only a row that still holds the value the release
-- seeded, so a value tuned in the database survives, and a second run changes nothing.

-- 1. Phases
update stages set phases_per_stage = 8 where phases_per_stage = 5;

-- 2. Adds of chapters 11 to 15 first, while their stage still holds the old seed: 3 times the new phase health
update stage_adds a
   set hit_points = 3 * t.health
  from stages s,
       (values
        (11, 1, 38000), (11, 2, 39520), (11, 3, 41101), (11, 4, 42745), (11, 5, 44455), (11, 6, 46233), (11, 7, 48082), (11, 8, 50005), (11, 9, 52006), (11, 10, 54086),
        (12, 1, 64000), (12, 2, 66560), (12, 3, 69222), (12, 4, 71991), (12, 5, 74871), (12, 6, 77866), (12, 7, 80980), (12, 8, 84220), (12, 9, 87588), (12, 10, 91092),
        (13, 1, 90000), (13, 2, 93600), (13, 3, 97344), (13, 4, 101238), (13, 5, 105287), (13, 6, 109499), (13, 7, 113879), (13, 8, 118434), (13, 9, 123171), (13, 10, 128098),
        (14, 1, 133000), (14, 2, 138320), (14, 3, 143853), (14, 4, 149607), (14, 5, 155591), (14, 6, 161815), (14, 7, 168287), (14, 8, 175019), (14, 9, 182020), (14, 10, 189300),
        (15, 1, 161000), (15, 2, 167440), (15, 3, 174138), (15, 4, 181103), (15, 5, 188347), (15, 6, 195881), (15, 7, 203716), (15, 8, 211865), (15, 9, 220340), (15, 10, 229153)
       ) as t (chapter, number, health)
 where a.stage_id = s.id and s.chapter = t.chapter and s.number = t.number
   and s.monster_hit_points = (40 + 4 * (s.number - 1)) * (case when s.chapter <= 5 then power(4, s.chapter - 1) else 256 * power(2, s.chapter - 5) end)::bigint
   and a.hit_points = 3 * (40 + 4 * (s.number - 1)) * (case when s.chapter <= 5 then power(4, s.chapter - 1) else 256 * power(2, s.chapter - 5) end)::bigint;

-- 3. Phase monster and miniboss health of chapters 1 to 15
update stages s
   set monster_hit_points  = t.health,
       miniboss_hit_points = 3 * t.health
  from (values
        (1, 1, 69), (1, 2, 92), (1, 3, 122), (1, 4, 162), (1, 5, 216), (1, 6, 287), (1, 7, 382), (1, 8, 508), (1, 9, 676), (1, 10, 898),
        (2, 1, 265), (2, 2, 342), (2, 3, 441), (2, 4, 569), (2, 5, 734), (2, 6, 947), (2, 7, 1221), (2, 8, 1575), (2, 9, 2032), (2, 10, 2622),
        (3, 1, 1000), (3, 2, 1160), (3, 3, 1346), (3, 4, 1561), (3, 5, 1811), (3, 6, 2100), (3, 7, 2436), (3, 8, 2826), (3, 9, 3278), (3, 10, 3803),
        (4, 1, 4750), (4, 2, 4940), (4, 3, 5138), (4, 4, 5343), (4, 5, 5557), (4, 6, 5779), (4, 7, 6010), (4, 8, 6251), (4, 9, 6501), (4, 10, 6761),
        (5, 1, 7250), (5, 2, 7540), (5, 3, 7842), (5, 4, 8155), (5, 5, 8481), (5, 6, 8821), (5, 7, 9174), (5, 8, 9541), (5, 9, 9922), (5, 10, 10319),
        (6, 1, 10000), (6, 2, 10400), (6, 3, 10816), (6, 4, 11249), (6, 5, 11699), (6, 6, 12167), (6, 7, 12653), (6, 8, 13159), (6, 9, 13686), (6, 10, 14233),
        (7, 1, 28000), (7, 2, 29120), (7, 3, 30285), (7, 4, 31496), (7, 5, 32756), (7, 6, 34066), (7, 7, 35429), (7, 8, 36846), (7, 9, 38320), (7, 10, 39853),
        (8, 1, 36000), (8, 2, 37440), (8, 3, 38938), (8, 4, 40495), (8, 5, 42115), (8, 6, 43800), (8, 7, 45551), (8, 8, 47374), (8, 9, 49268), (8, 10, 51239),
        (9, 1, 58000), (9, 2, 60320), (9, 3, 62733), (9, 4, 65242), (9, 5, 67852), (9, 6, 70566), (9, 7, 73389), (9, 8, 76324), (9, 9, 79377), (9, 10, 82552),
        (10, 1, 71000), (10, 2, 73840), (10, 3, 76794), (10, 4, 79865), (10, 5, 83060), (10, 6, 86382), (10, 7, 89838), (10, 8, 93431), (10, 9, 97168), (10, 10, 101055),
        (11, 1, 38000), (11, 2, 39520), (11, 3, 41101), (11, 4, 42745), (11, 5, 44455), (11, 6, 46233), (11, 7, 48082), (11, 8, 50005), (11, 9, 52006), (11, 10, 54086),
        (12, 1, 64000), (12, 2, 66560), (12, 3, 69222), (12, 4, 71991), (12, 5, 74871), (12, 6, 77866), (12, 7, 80980), (12, 8, 84220), (12, 9, 87588), (12, 10, 91092),
        (13, 1, 90000), (13, 2, 93600), (13, 3, 97344), (13, 4, 101238), (13, 5, 105287), (13, 6, 109499), (13, 7, 113879), (13, 8, 118434), (13, 9, 123171), (13, 10, 128098),
        (14, 1, 133000), (14, 2, 138320), (14, 3, 143853), (14, 4, 149607), (14, 5, 155591), (14, 6, 161815), (14, 7, 168287), (14, 8, 175019), (14, 9, 182020), (14, 10, 189300),
        (15, 1, 161000), (15, 2, 167440), (15, 3, 174138), (15, 4, 181103), (15, 5, 188347), (15, 6, 195881), (15, 7, 203716), (15, 8, 211865), (15, 9, 220340), (15, 10, 229153)
       ) as t (chapter, number, health)
 where s.chapter = t.chapter and s.number = t.number
   and s.monster_hit_points  = (40 + 4 * (s.number - 1)) * (case when s.chapter <= 5 then power(4, s.chapter - 1) else 256 * power(2, s.chapter - 5) end)::bigint
   and s.miniboss_hit_points = 5 * (40 + 4 * (s.number - 1)) * (case when s.chapter <= 5 then power(4, s.chapter - 1) else 256 * power(2, s.chapter - 5) end)::bigint;

-- 4. Limits
update stages   set miniboss_time_limit_ms = 45000 where miniboss_time_limit_ms = 30000;
update chapters set boss_time_limit_ms     = 90000 where boss_time_limit_ms     = 60000;

-- 5. Chapter boss health
update chapters c
   set boss_hit_points = t.health
  from (values (1, 6000), (2, 12500), (3, 13000), (4, 34000), (5, 80000), (6, 130000), (7, 139000), (8, 313000), (9, 475000), (10, 900000),
               (11, 956000), (12, 1850000), (13, 1940000), (14, 2837000), (15, 4265000)) as t (number, health)
 where c.number = t.number
   and c.boss_hit_points = 2000 * (case when c.number <= 5 then power(4, c.number - 1) else 256 * power(2, c.number - 5) end)::bigint;

-- 6. Miniboss critical resistance of chapters 1 to 5: the enemies catalog is shared, so new rows are added and only these minibosses are repointed
insert into enemies (element, physical_defense, magical_defense, crit_resistance)
select distinct e.element, e.physical_defense, e.magical_defense, (s.number - 1) + 8 * (s.chapter - 1)
  from stages s join enemies e on e.id = s.miniboss_enemy_id
 where s.chapter between 1 and 5 and e.crit_resistance = 10 + 2 * s.number + 5 * (s.chapter - 1)
on conflict on constraint uk_enemies_attributes do nothing;

update stages s
   set miniboss_enemy_id = n.id
  from enemies e, enemies n
 where e.id = s.miniboss_enemy_id and s.chapter between 1 and 5
   and e.crit_resistance = 10 + 2 * s.number + 5 * (s.chapter - 1)
   and n.element = e.element and n.physical_defense = e.physical_defense and n.magical_defense = e.magical_defense
   and n.crit_resistance = (s.number - 1) + 8 * (s.chapter - 1);

-- 7. Chapter boss critical resistance of chapters 1 to 5, the same way: 30 + 5(c - 1) becomes 10c - 5
insert into enemies (element, physical_defense, magical_defense, crit_resistance)
select distinct e.element, e.physical_defense, e.magical_defense, 10 * c.number - 5
  from chapters c join enemies e on e.id = c.boss_enemy_id
 where c.number between 1 and 5 and e.crit_resistance = 30 + 5 * (c.number - 1)
on conflict on constraint uk_enemies_attributes do nothing;

update chapters c
   set boss_enemy_id = n.id
  from enemies e, enemies n
 where e.id = c.boss_enemy_id and c.number between 1 and 5
   and e.crit_resistance = 30 + 5 * (c.number - 1)
   and n.element = e.element and n.physical_defense = e.physical_defense and n.magical_defense = e.magical_defense
   and n.crit_resistance = 10 * c.number - 5;
