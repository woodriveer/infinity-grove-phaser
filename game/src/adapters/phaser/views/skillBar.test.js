import { describe, expect, it } from 'vitest';
import { renderLeaderCard, renderSkillBar } from './skillBar';

const leader = (...unlocked) => ({
    id: 'kael',
    skills: unlocked.map((open, index) => ({
        slot: index + 1, name: `Skill ${index + 1}`, type: 'Ataque', effect: 'x', cooldownSeconds: 10 * (index + 1), image: `art_${index + 1}`, unlocked: open
    }))
});

const slots = (bar) => [ ...bar.querySelectorAll('.skill-slot') ];

describe('renderSkillBar', () => {
    it('shows three slots with the art, name and cooldown seconds of each skill', () => {
        const bar = renderSkillBar(leader(true, false, false));

        expect(slots(bar).map((slot) => slot.getAttribute('data-testid'))).toEqual([ 'skill-slot-1', 'skill-slot-2', 'skill-slot-3' ]);
        expect(slots(bar).map((slot) => slot.querySelector('img').getAttribute('src'))).toEqual([
            'assets/heroes/art_1.jpg', 'assets/heroes/art_2.jpg', 'assets/heroes/art_3.jpg'
        ]);
        expect(slots(bar).map((slot) => slot.querySelector('.skill-slot-name').textContent)).toEqual([ 'Skill 1', 'Skill 2', 'Skill 3' ]);
        expect(slots(bar).map((slot) => slot.querySelector('.skill-slot-cooldown').textContent)).toEqual([ '10s', '20s', '30s' ]);
    });

    it('locks all three slots of a leader with no star', () => {
        const bar = renderSkillBar(leader(false, false, false));

        expect(slots(bar).map((slot) => slot.getAttribute('data-unlocked'))).toEqual([ 'false', 'false', 'false' ]);
        expect(bar.querySelectorAll('.skill-lock-mark')).toHaveLength(3);
    });

    it('unlocks slot 1 at one star and keeps the others locked with a lock mark', () => {
        const bar = renderSkillBar(leader(true, false, false));

        expect(slots(bar).map((slot) => slot.classList.contains('is-locked'))).toEqual([ false, true, true ]);
        expect(slots(bar)[0].querySelector('.skill-lock-mark')).toBeNull();
        expect(slots(bar)[1].querySelector('.skill-lock-mark')).not.toBeNull();
    });

    it('shows every slot lit at three stars', () => {
        const bar = renderSkillBar(leader(true, true, true));

        expect(bar.querySelectorAll('.is-locked')).toHaveLength(0);
        expect(bar.querySelectorAll('.skill-lock-mark')).toHaveLength(0);
    });

    it('shows no slot without a leader', () => {
        expect(slots(renderSkillBar(null))).toHaveLength(0);
    });

    it('clicking a slot does not throw and changes nothing', () => {
        const bar = renderSkillBar(leader(true, true, false));
        const before = bar.innerHTML;

        slots(bar).forEach((slot) => slot.click());

        expect(bar.innerHTML).toBe(before);
    });
});

describe('renderLeaderCard', () => {
    it('shows the sprite, the name and the leader bonus of the leader', () => {
        const card = renderLeaderCard({ ...leader(true), name: 'Kael Raizférrea', leaderBonus: '+25% contra chefes' });

        expect(card.querySelector('img').getAttribute('src')).toBe('assets/heroes/kael_sprite.png');
        expect(card.querySelector('.leader-name').textContent).toBe('Kael Raizférrea');
        expect(card.querySelector('.leader-bonus').textContent).toBe('Líder · +25% contra chefes');
    });

    it('is empty without a leader', () => {
        expect(renderLeaderCard(null).children).toHaveLength(0);
    });
});
