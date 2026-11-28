//  The team of the fight (spec hero-team, team-click-damage): one round of ally hits per click. Pure JavaScript: no Phaser.

//  One round of the team (spec team-click-damage): every ally in slot order hits the target read right before its hit; a missing or dead
//  target ends the round, so the later slots do not land. Pure JavaScript: no Phaser.
//    allies  [ { slot, attacker } ] in slot order
//    hit(attacker, target) -> damage   lands one hit
//    target() the monster the next hit lands on
//  Returns { slots, damage, hits: [ { slot, target, damage } ] } in the order the hits landed.
export const landTeam = ({ allies, hit, target }) =>
{
    const slots = [];
    const hits = [];
    let damage = 0;

    for (const { slot, attacker } of allies)
    {
        const aim = target();

        if (!aim || aim.dead)
        {
            break;
        }

        const dealt = hit(attacker, aim);

        slots.push(slot);
        hits.push({ slot, target: aim, damage: dealt });
        damage += dealt;
    }

    return { slots, damage, hits };
};
