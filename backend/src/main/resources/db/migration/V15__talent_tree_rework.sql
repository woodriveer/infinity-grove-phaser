-- talent-tree-rework (AD-029): the chapter boss time and the critical resistance break left the talent catalog.
--
-- Their levels are deleted; the talent points they cost come back by themselves, because the points spent are derived from
-- player_talents (V5). Data only, no schema change: the previous backend reads a missing row as level 0 (expand/contract, AD-016).
delete from player_talents
 where talent_id in ('BOSS_TIME', 'BOSS_TIME_G2', 'BOSS_TIME_G3', 'CRIT_RESIST_BREAK', 'CRIT_RESIST_BREAK_G2', 'CRIT_RESIST_BREAK_G3');
