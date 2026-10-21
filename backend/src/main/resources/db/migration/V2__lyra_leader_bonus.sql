-- Lyra's leader bonus is now a double critical click (spec click-power). HeroSeeder never overwrites a hero, so a database seeded
-- before this migration keeps the old text; the update only touches the text that was seeded, so a value tuned in the database survives.
update heroes
   set leader_bonus = '30% de chance de executar um clique duplo crítico.'
 where id = 'lyra'
   and leader_bonus = 'Ventos Ligeiros dura 50% mais.';
