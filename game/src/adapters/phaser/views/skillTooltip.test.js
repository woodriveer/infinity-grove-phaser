import { describe, expect, it } from 'vitest';
import { renderSkillRow } from './catalogView';
import { attachSkillTooltip } from './skillTooltip';

const skill = { slot: 2, name: 'Investida do Baluarte', type: 'Controle', effect: 'Atordoa o chefe por 3s.', cooldownSeconds: 25, image: 'kael_charge', unlocked: true };
const enter = (node) => node.dispatchEvent(new Event('pointerenter'));
const leave = (node) => node.dispatchEvent(new Event('pointerleave'));

describe('attachSkillTooltip', () => {
    it('shows the skill card of the hero screens while the pointer is on the node', () => {
        const node = document.createElement('div');

        attachSkillTooltip(node, () => skill);
        enter(node);

        const tooltip = node.querySelector('[data-testid="skill-tooltip"]');

        expect(tooltip.querySelector('.skill-name').textContent).toBe('Investida do Baluarte');
        expect(tooltip.querySelector('.skill-type').textContent).toBe('Controle');
        expect(tooltip.querySelector('.skill-effect').textContent).toBe('Atordoa o chefe por 3s.');
        expect(tooltip.querySelector('.skill-cooldown').textContent).toBe('Recarga: 25s');
        expect(tooltip.querySelector('.skill-state').textContent).toBe('Liberada');
        expect(tooltip.querySelector('img').getAttribute('src')).toBe('assets/heroes/kael_charge.jpg');
    });

    it('carries exactly the texts of renderSkillRow', () => {
        const node = document.createElement('div');

        attachSkillTooltip(node, () => skill);
        enter(node);

        expect(node.querySelector('.skill-row').textContent).toBe(renderSkillRow(skill).textContent);
    });

    it('says Bloqueada for a locked skill', () => {
        const node = document.createElement('div');

        attachSkillTooltip(node, () => ({ ...skill, unlocked: false }));
        enter(node);

        expect(node.querySelector('.skill-state').textContent).toBe('Bloqueada');
    });

    it('hides when the pointer leaves', () => {
        const node = document.createElement('div');

        attachSkillTooltip(node, () => skill);
        enter(node);
        leave(node);

        expect(node.querySelector('[data-testid="skill-tooltip"]')).toBeNull();
    });

    it('shows one tooltip even when the pointer enters twice', () => {
        const node = document.createElement('div');

        attachSkillTooltip(node, () => skill);
        enter(node);
        enter(node);

        expect(node.querySelectorAll('[data-testid="skill-tooltip"]')).toHaveLength(1);
    });

    it('shows nothing when there is no skill', () => {
        const node = document.createElement('div');

        attachSkillTooltip(node, () => null);
        enter(node);

        expect(node.querySelector('[data-testid="skill-tooltip"]')).toBeNull();
    });

    it('places the tooltip above or below as asked', () => {
        const above = document.createElement('div');
        const below = document.createElement('div');

        attachSkillTooltip(above, () => skill);
        attachSkillTooltip(below, () => skill, 'below');
        enter(above);
        enter(below);

        expect(above.querySelector('.skill-tooltip').classList.contains('is-above')).toBe(true);
        expect(below.querySelector('.skill-tooltip').classList.contains('is-below')).toBe(true);
    });

    it('the tooltip of a level 2 skill carries its level', () => {
        const node = document.createElement('div');

        attachSkillTooltip(node, () => ({ ...skill, unlocked: true, level: 2 }));
        enter(node);

        expect(node.querySelector('.skill-tooltip .skill-level').textContent).toBe('Nível 2 · +25% de poder');
    });
});
