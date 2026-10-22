import { describe, expect, it, vi } from 'vitest';
import { renderTalents, renderTalentsUnavailable } from './talentsView';

const catalog = [
    [ 'MINIBOSS_TIME', 'TIME', 'Tempo do miniboss', 's', 2 ], [ 'BOSS_TIME', 'TIME', 'Tempo do chefe do capítulo', 's', 3 ],
    [ 'PHYSICAL_BREAK', 'BREAK', 'Quebra de defesa física', 'points', 1 ], [ 'MAGICAL_BREAK', 'BREAK', 'Quebra de defesa mágica', 'points', 1 ],
    [ 'CRIT_RESIST_BREAK', 'BREAK', 'Quebra de resistência a crítico', 'points', 1 ],
    [ 'CLICK_DAMAGE', 'POWER', 'Dano de clique', '%', 3 ], [ 'CRIT_CHANCE', 'POWER', 'Chance de crítico', 'points', 1 ], [ 'CRIT_DAMAGE', 'POWER', 'Dano crítico', '%', 5 ],
    [ 'COMBO', 'COMBO', 'Limite de dano do combo', '%', 5 ]
];
//  The tree as the backend answers it
const tree = (levels = {}) => catalog.map(([ id, branch, label, unit, perLevel ]) =>
{
    const level = levels[id] ?? 0;

    return { id, branch, label, unit, perLevel, maxLevel: 10, level, value: level * perLevel, nextCost: level >= 10 ? null : 1 };
});

const points = (available) => ({ earned: available, spent: 0, available });
const show = (levels, available = 50, options = {}) => renderTalents(tree(levels), points(available), { onUpgrade: vi.fn(), ...options });
const text = (screen, id) => screen.querySelector(`[data-testid="${id}"]`).textContent;

describe('renderTalents', () => {
    it('shows four columns titled Tempo, Quebra de defesa, Poder do clique and Combo', () => {
        const screen = show();

        expect([ ...screen.querySelectorAll('.talent-branch-title') ].map((node) => node.textContent)).toEqual([ 'Tempo', 'Quebra de defesa', 'Poder do clique', 'Combo' ]);
    });

    it('puts the talents of each branch in its column: 2, 3, 3 and 1', () => {
        const screen = show();

        expect([ 'TIME', 'BREAK', 'POWER', 'COMBO' ].map((branch) => screen.querySelectorAll(`[data-testid="talent-branch-${branch}"] .talent-card`).length)).toEqual([ 2, 3, 3, 1 ]);
    });

    it('holds the card Limite de dano do combo in the Combo column', () => {
        const screen = show();

        expect(screen.querySelector('[data-testid="talent-branch-COMBO"] .talent-name').textContent).toBe('Limite de dano do combo');
    });

    it('reads the available points above the columns', () => {
        expect(text(show({}, 7), 'talent-points')).toBe('Pontos de talento: 7');
        expect(text(show({}, 0), 'talent-points')).toBe('Pontos de talento: 0');
    });

    it('reads the combo effect: nenhum at level 0 and +25% at level 5', () => {
        expect(text(show(), 'talent-effect-COMBO')).toBe('Efeito: nenhum');
        expect(text(show({ COMBO: 5 }), 'talent-effect-COMBO')).toBe('Efeito: +25%');
    });

    it('shows the label, the level and the effect of a talent', () => {
        const screen = show({ CLICK_DAMAGE: 3 });

        expect(screen.querySelector('[data-testid="talent-CLICK_DAMAGE"] .talent-name').textContent).toBe('Dano de clique');
        expect(text(screen, 'talent-level-CLICK_DAMAGE')).toBe('Nível 3/10');
        expect(text(screen, 'talent-effect-CLICK_DAMAGE')).toBe('Efeito: +9%');
    });

    it('reads the effect of every unit: +6 s, -3 pontos for a break and +3 pontos', () => {
        const screen = show({ BOSS_TIME: 2, PHYSICAL_BREAK: 3, CRIT_CHANCE: 3 });

        expect(text(screen, 'talent-effect-BOSS_TIME')).toBe('Efeito: +6 s');
        expect(text(screen, 'talent-effect-PHYSICAL_BREAK')).toBe('Efeito: -3 pontos');
        expect(text(screen, 'talent-effect-CRIT_CHANCE')).toBe('Efeito: +3 pontos');
    });

    it('reads Efeito: nenhum at level 0', () => {
        expect(text(show(), 'talent-effect-CLICK_DAMAGE')).toBe('Efeito: nenhum');
    });

    it('shows Melhorar (1 ponto) at every level below the top, whatever the level', () => {
        const screen = show({ CRIT_CHANCE: 1, CLICK_DAMAGE: 8 });

        expect(text(screen, 'talent-upgrade-CLICK_DAMAGE')).toBe('Melhorar (1 ponto)');
        expect(text(screen, 'talent-upgrade-CRIT_CHANCE')).toBe('Melhorar (1 ponto)');
        expect(text(screen, 'talent-upgrade-COMBO')).toBe('Melhorar (1 ponto)');
    });

    it('shows no wallet price', () => {
        expect(show().textContent).not.toMatch(/prata|cobre|ouro/);
    });

    it('calls onUpgrade with the talent when the button is clicked', () => {
        const onUpgrade = vi.fn();
        const screen = show({}, 1, { onUpgrade });

        screen.querySelector('[data-testid="talent-upgrade-CLICK_DAMAGE"]').click();

        expect(onUpgrade).toHaveBeenCalledTimes(1);
        expect(onUpgrade.mock.calls[0][0]).toMatchObject({ id: 'CLICK_DAMAGE', level: 0 });
    });

    it('enables every button with 1 available point and disables every one with 0', () => {
        const one = show({}, 1);
        const none = show({}, 0);

        expect(one.querySelector('[data-testid="talent-upgrade-CLICK_DAMAGE"]').disabled).toBe(false);
        expect([ ...none.querySelectorAll('.talent-upgrade') ].every((button) => button.disabled)).toBe(true);
    });

    it('disables every button while a request runs', () => {
        const screen = show({}, 50, { busy: true });

        expect([ ...screen.querySelectorAll('.talent-upgrade') ].every((button) => button.disabled)).toBe(true);
    });

    it('shows Nível máximo and no button at level 10', () => {
        const screen = show({ CLICK_DAMAGE: 10 });

        expect(text(screen, 'talent-max-CLICK_DAMAGE')).toBe('Nível máximo');
        expect(screen.querySelector('[data-testid="talent-upgrade-CLICK_DAMAGE"]')).toBeNull();
        expect(text(screen, 'talent-effect-CLICK_DAMAGE')).toBe('Efeito: +30%');
        expect(screen.querySelector('[data-testid="talent-upgrade-CRIT_CHANCE"]')).not.toBeNull();
    });

    it('shows the icon of the talent and draws a mark in its place when the file is missing', () => {
        const screen = show();
        const icon = screen.querySelector('[data-testid="talent-CLICK_DAMAGE"] .icon');

        expect(icon.querySelector('img').getAttribute('src')).toBe('assets/ui/talent-click-damage.png');

        icon.querySelector('img').dispatchEvent(new Event('error'));

        expect(icon.querySelector('img')).toBeNull();
        expect(icon.querySelector('.icon-fallback').textContent).toBe('⚔');
    });
});

describe('renderTalentsUnavailable', () => {
    it('says Talentos indisponíveis', () => {
        const node = renderTalentsUnavailable();

        expect(node.textContent).toBe('Talentos indisponíveis');
        expect(node.getAttribute('data-testid')).toBe('talents-unavailable');
    });
});
