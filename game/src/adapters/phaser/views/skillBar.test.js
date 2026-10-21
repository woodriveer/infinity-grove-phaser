import { describe, expect, it } from 'vitest';
import { refreshSkillBar, renderLeaderCard, renderSkillBar } from './skillBar';

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

    it('calls onUse with the slot number when an unlocked slot is clicked', () => {
        const used = [];
        const bar = renderSkillBar(leader(true, true, false), { onUse: (slot) => used.push(slot) });

        slots(bar).forEach((slot) => slot.click());

        expect(used).toEqual([ 1, 2 ]);
    });

    it('does not call onUse for a locked slot, and clicking without onUse changes nothing', () => {
        const used = [];
        const locked = renderSkillBar(leader(false, false, false), { onUse: (slot) => used.push(slot) });
        const bar = renderSkillBar(leader(true, true, false));
        const before = bar.innerHTML;

        slots(locked).forEach((slot) => slot.click());
        slots(bar).forEach((slot) => slot.click());

        expect(used).toEqual([]);
        expect(bar.innerHTML).toBe(before);
    });

    it('starts unlocked slots ready and locked slots locked', () => {
        const bar = renderSkillBar(leader(true, false, false));

        expect(slots(bar).map((slot) => slot.getAttribute('data-state'))).toEqual([ 'ready', 'locked', 'locked' ]);
    });
});

describe('refreshSkillBar', () => {
    const states = { 1: { state: 'cooling', seconds: 7 }, 2: { state: 'casting', seconds: 2 }, 3: { state: 'ready', seconds: 0 } };

    it('shows a cooling slot with the whole seconds left and a casting slot as Mirando', () => {
        const bar = renderSkillBar(leader(true, true, true));

        refreshSkillBar(bar, (slot) => states[slot]);

        expect(slots(bar).map((slot) => slot.getAttribute('data-state'))).toEqual([ 'cooling', 'casting', 'ready' ]);
        expect(slots(bar).map((slot) => slot.querySelector('.skill-slot-cooldown').textContent)).toEqual([ '7s', 'Mirando', '30s' ]);
    });

    it('shows the cooldown seconds again when a slot is ready after cooling', () => {
        const bar = renderSkillBar(leader(true, false, false));

        refreshSkillBar(bar, () => ({ state: 'cooling', seconds: 3 }));
        refreshSkillBar(bar, () => ({ state: 'ready', seconds: 0 }));

        expect(slots(bar)[0].getAttribute('data-state')).toBe('ready');
        expect(slots(bar)[0].querySelector('.skill-slot-cooldown').textContent).toBe('10s');
    });

    it('keeps a locked slot locked with its cooldown seconds', () => {
        const bar = renderSkillBar(leader(true, false, false));

        refreshSkillBar(bar, (slot) => (slot === 1 ? { state: 'ready', seconds: 0 } : { state: 'locked', seconds: 0 }));

        expect(slots(bar)[1].getAttribute('data-state')).toBe('locked');
        expect(slots(bar)[1].querySelector('.skill-slot-cooldown').textContent).toBe('20s');
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
