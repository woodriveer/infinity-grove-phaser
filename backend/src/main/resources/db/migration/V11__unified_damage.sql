-- unified-damage (AD-021): one damage, one enemy defense, one defense break talent.
--
-- 1. The magical defense break left the talent catalog. Its levels are deleted; the talent points they cost come back by themselves,
--    because the points spent are derived from player_talents (V5). The previous backend reads a missing row as level 0.
delete from player_talents
 where talent_id in ('MAGICAL_BREAK', 'MAGICAL_BREAK_G2', 'MAGICAL_BREAK_G3');

-- 2. Texts without damage types. HeroSeeder never overwrites a hero, so a database seeded before this migration keeps the old texts;
--    each update touches only the text that was seeded, so a value tuned in the database survives (pattern of V2).
update heroes
   set leader_bonus = '+20% de dano total.'
 where id = 'orina'
   and leader_bonus = '+20% de Poder Arcano para todo o grupo.';

update hero_skills
   set effect = 'Um golpe que rasga o próprio espaço, causando 1500% de dano a todos os inimigos e ignorando 30% da defesa.'
 where hero_id = 'kael' and slot = 1
   and effect = 'Um golpe que rasga o próprio espaço, causando 1500% de dano físico a todos os inimigos e ignorando 30% da resistência física.';

update hero_skills
   set effect = 'Um grito de guerra que causa Medo: inimigos perdem 30 pontos de defesa por 10s.'
 where hero_id = 'kael' and slot = 3
   and effect = 'Um grito de guerra que causa Medo: inimigos perdem 30% de resistência física por 10s.';

update hero_skills
   set effect = 'Dispara duas flechas, cada uma causando 300% de dano.'
 where hero_id = 'lyra' and slot = 1
   and effect = 'Dispara duas flechas, cada uma causando 300% de dano físico.';

update hero_skills
   set effect = 'Vinhas de espinhos prendem os inimigos por 2s; enquanto presos, recebem +25% de dano.'
 where hero_id = 'orina' and slot = 1
   and effect = 'Vinhas mágicas prendem os inimigos por 2s; enquanto presos, recebem +25% de dano mágico.';

update hero_skills
   set effect = 'Raios caem por 6s, causando 200% de dano por segundo a todos os inimigos.'
 where hero_id = 'orina' and slot = 2
   and effect = 'Raios caem por 6s, causando 200% de dano mágico por segundo a todos os inimigos.';

update hero_skills
   set effect = 'Uma chuva de estrelas causa 2500% de dano em área.'
 where hero_id = 'orina' and slot = 3
   and effect = 'Uma chuva de estrelas causa 2500% de dano mágico em área.';

update hero_skills
   set effect = 'Por 15s, todos os aliados ganham +20% de Precisão, +30% de dano e +25% de velocidade de ataque.'
 where hero_id = 'seraphine' and slot = 1
   and effect = 'Por 15s, todos os aliados ganham +20% de Precisão, +30% de Força e +25% de velocidade de ataque.';

update hero_skills
   set effect = 'Um pilar de luz atinge todos os inimigos, causando 800% de dano (+50% contra criaturas do Submundo).'
 where hero_id = 'seraphine' and slot = 2
   and effect = 'Um pilar de luz atinge todos os inimigos, causando 800% de dano mágico (+50% contra criaturas do Submundo).';
