import { describe, expect, it, vi } from 'vitest';
import { placeTalentScroll, renderTalents, renderTalentsUnavailable, revealTalent, SHIFT_HINT, talentScrollOf, updateTalents } from './talentsView';

//  [ id, branch, label, unit, perLevel of grade 1 ]: the 9 graded talents in the order of the backend
const catalog = [
    [ 'MINIBOSS_TIME', 'TIME', 'Tempo do miniboss', 's', 2 ], [ 'BOSS_DAMAGE', 'TIME', 'Dano contra chefes', '%', 2 ],
    [ 'PHYSICAL_BREAK', 'BREAK', 'Quebra de defesa', 'points', 1 ], [ 'ARMOR_PIERCE', 'BREAK', 'Perfuração de armadura', '%', 1 ],
    [ 'CLICK_DAMAGE', 'POWER', 'Dano de clique (%)', '%', 5 ], [ 'CRIT_CHANCE', 'POWER', 'Chance de crítico', 'points', 1 ], [ 'CRIT_DAMAGE', 'POWER', 'Dano crítico', '%', 5 ],
    [ 'COMBO', 'COMBO', 'Limite de dano do combo', '%', 5 ], [ 'CLICK_FLAT_DAMAGE', 'POWER', 'Dano direto de clique', 'dmg', 2 ]
];
const gradeId = (id, grade) => (grade === 1 ? id : `${id}_G${grade}`);
//  The 28 talents as the backend answers them (design, Data Models): 3 grades of the 9 talents, then Fúria crescente, which COMBO at level 10 opens
const tree = (levels = {}) =>
{
    const graded = [ 1, 2, 3 ].flatMap((grade) => catalog.map(([ id, branch, label, unit, perLevel ]) => ({
        id: gradeId(id, grade), baseId: id, grade, branch, label, unit, perLevel: perLevel * grade, maxLevel: 10, cost: grade,
        requiredId: grade === 1 ? null : gradeId(id, grade - 1), requiredLevel: grade === 1 ? null : 10
    })));
    const fury = { id: 'COMBO_FURY', baseId: 'COMBO_FURY', grade: 1, branch: 'COMBO', label: 'Fúria crescente', unit: 'combo-step', perLevel: 1, maxLevel: 4, cost: 2, requiredId: 'COMBO', requiredLevel: 10 };

    return [ ...graded, fury ].map(({ cost, ...talent }) =>
    {
        const level = levels[talent.id] ?? 0;

        return {
            ...talent,
            level,
            value: level * talent.perLevel,
            nextCost: level >= talent.maxLevel ? null : cost,
            unlocked: talent.requiredId === null || (levels[talent.requiredId] ?? 0) >= talent.requiredLevel
        };
    });
};

const points = (available, spent = 0) => ({ earned: available + spent, spent, available });
const show = (levels, available = 50, options = {}) => renderTalents(tree(levels), points(available), { onSelect: vi.fn(), onUpgrade: vi.fn(), onReset: vi.fn(), ...options });
const find = (screen, id) => screen.querySelector(`[data-testid="${id}"]`);
const text = (screen, id) => find(screen, id).textContent;
const nodes = (screen) => [ ...screen.querySelectorAll('.talent-node') ];
const fail = (image) => image.dispatchEvent(new Event('error'));

describe('the nodes', () => {
    it('draws one node per talent of the list that the map places: 28', () => {
        expect(nodes(show())).toHaveLength(28);
    });

    it('draws no node for a talent outside the map and throws nothing', () => {
        const extra = { id: 'NEW_ONE', baseId: 'NEW_ONE', branch: 'POWER', label: 'Novo', unit: '%', perLevel: 1, maxLevel: 10, level: 0, value: 0, nextCost: 1, unlocked: true };
        const screen = renderTalents([ ...tree(), extra ], points(5), { onUpgrade: vi.fn() });

        expect(nodes(screen)).toHaveLength(28);
        expect(find(screen, 'talent-NEW_ONE')).toBeNull();
    });

    it('draws no node for a mapped talent missing from the list', () => {
        const screen = renderTalents(tree().filter(({ id }) => id !== 'COMBO_FURY'), points(5), { onUpgrade: vi.fn() });

        expect(nodes(screen)).toHaveLength(27);
        expect(find(screen, 'talent-COMBO_FURY')).toBeNull();
    });

    it('centres each node on its map coordinates', () => {
        const screen = show();

        expect([ find(screen, 'talent-CLICK_DAMAGE').style.left, find(screen, 'talent-CLICK_DAMAGE').style.top ]).toEqual([ '53%', '49.5%' ]);
        expect([ find(screen, 'talent-COMBO_FURY').style.left, find(screen, 'talent-COMBO_FURY').style.top ]).toEqual([ '76%', '62%' ]);
        expect([ find(screen, 'talent-MINIBOSS_TIME').style.left, find(screen, 'talent-MINIBOSS_TIME').style.top ]).toEqual([ '43.5%', '58%' ]);
    });

    it('marks Fúria crescente large and gives it the large frame', () => {
        const screen = show();
        const fury = find(screen, 'talent-COMBO_FURY');

        expect(fury.classList.contains('is-large')).toBe(true);
        expect(fury.querySelector('.talent-node-frame').src.endsWith('assets/talent-node-frame-large.png')).toBe(true);
        expect(find(screen, 'talent-CLICK_DAMAGE').classList.contains('is-large')).toBe(false);
        expect(find(screen, 'talent-CLICK_DAMAGE').querySelector('.talent-node-frame').src.endsWith('assets/talent-node-frame.png')).toBe(true);
    });

    it('shows the level chip, the title and the aria-label', () => {
        const node = find(show({ CLICK_DAMAGE_G2: 3 }), 'talent-CLICK_DAMAGE_G2');

        expect(node.querySelector('.talent-node-level').textContent).toBe('3/10');
        expect(node.getAttribute('title')).toBe('Dano de clique (%) (Grau 2)');
        expect(node.getAttribute('aria-label')).toBe('Dano de clique (%) (Grau 2), nível 3 de 10');
    });

    it('captions grade 1 nodes and Fúria crescente and badges grade 2 and 3', () => {
        const screen = show();

        expect(text(screen, 'talent-caption-CLICK_DAMAGE')).toBe('Dano de clique (%)');
        expect(text(screen, 'talent-caption-COMBO_FURY')).toBe('Fúria crescente');
        expect(find(screen, 'talent-caption-CLICK_DAMAGE_G2')).toBeNull();
        expect(text(screen, 'talent-node-grade-CLICK_DAMAGE_G2')).toBe('II');
        expect(text(screen, 'talent-node-grade-CLICK_DAMAGE_G3')).toBe('III');
        expect(find(screen, 'talent-node-grade-CLICK_DAMAGE')).toBeNull();
    });

    it('marks a node locked and draws the lock over it', () => {
        const node = find(show(), 'talent-CLICK_DAMAGE_G2');

        expect(node.getAttribute('data-state')).toBe('locked');
        expect(node.querySelectorAll('.talent-node-lock')).toHaveLength(1);
    });

    it('marks a node maxed at its top level', () => {
        const node = find(show({ CLICK_DAMAGE: 10 }), 'talent-CLICK_DAMAGE');

        expect(node.getAttribute('data-state')).toBe('maxed');
        expect(node.querySelector('.talent-node-lock')).toBeNull();
    });

    it('marks a node available when the points pay its next level', () => {
        expect(find(show({}, 1), 'talent-CRIT_CHANCE').getAttribute('data-state')).toBe('available');
    });

    it('marks a node open when the points do not pay its next level', () => {
        expect(find(show({}, 0), 'talent-CRIT_CHANCE').getAttribute('data-state')).toBe('open');
        expect(find(show({ CRIT_CHANCE: 10 }, 1), 'talent-CRIT_CHANCE_G2').getAttribute('data-state')).toBe('open');
    });

    it('marks the selected node aria-pressed true and the others false', () => {
        const screen = show({}, 50, { selectedId: 'COMBO' });

        expect(find(screen, 'talent-COMBO').getAttribute('aria-pressed')).toBe('true');
        expect(nodes(screen).filter((node) => node.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
        expect(find(screen, 'talent-CLICK_DAMAGE').getAttribute('aria-pressed')).toBe('false');
    });

    it('calls onSelect with the id on a node click and never onUpgrade', () => {
        const onSelect = vi.fn();
        const onUpgrade = vi.fn();
        const screen = show({}, 50, { onSelect, onUpgrade });

        find(screen, 'talent-CLICK_DAMAGE').click();

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('CLICK_DAMAGE');
        expect(onUpgrade).not.toHaveBeenCalled();
    });
});

describe('the detail card', () => {
    const upgradeButton = (screen, id) => find(screen, `talent-upgrade-${id}`);

    it('shows the empty text and no button with nothing selected', () => {
        const screen = show();
        const detail = find(screen, 'talent-detail');

        expect(text(screen, 'talent-detail-empty')).toBe('Escolha um talento na árvore para ver os detalhes.');
        expect(detail.querySelector('.talent-upgrade')).toBeNull();
        expect(detail.hasAttribute('data-branch')).toBe(false);
    });

    it('shows the empty text when the selected id is not in the list', () => {
        const screen = show({}, 50, { selectedId: 'NOPE' });

        expect(text(screen, 'talent-detail-empty')).toBe('Escolha um talento na árvore para ver os detalhes.');
        expect(find(screen, 'talent-detail').querySelector('.talent-upgrade')).toBeNull();
    });

    it('fills the card of an open talent: name, level, effect and a 1 point button', () => {
        const screen = show({}, 1, { selectedId: 'CLICK_DAMAGE' });

        expect(text(screen, 'talent-detail-name')).toBe('Dano de clique (%)');
        expect(text(screen, 'talent-level-CLICK_DAMAGE')).toBe('Nível 0/10');
        expect(text(screen, 'talent-effect-CLICK_DAMAGE')).toBe('Efeito: nenhum');
        expect(text(screen, 'talent-upgrade-CLICK_DAMAGE')).toBe('Melhorar (1 ponto)');
        expect(upgradeButton(screen, 'CLICK_DAMAGE').disabled).toBe(false);
        expect(find(screen, 'talent-detail').getAttribute('data-branch')).toBe('POWER');
    });

    it('prices a grade 2 level in points: Melhorar (2 pontos)', () => {
        const screen = show({ COMBO: 10 }, 50, { selectedId: 'COMBO_G2' });

        expect(text(screen, 'talent-upgrade-COMBO_G2')).toBe('Melhorar (2 pontos)');
    });

    it('calls onUpgrade with the talent id and no Shift when the card button is clicked', () => {
        const onUpgrade = vi.fn();
        const screen = show({}, 5, { selectedId: 'CLICK_DAMAGE', onUpgrade });

        upgradeButton(screen, 'CLICK_DAMAGE').click();

        expect(onUpgrade).toHaveBeenCalledTimes(1);
        expect(onUpgrade).toHaveBeenCalledWith('CLICK_DAMAGE', { shift: false });
    });

    it('marks the card button aria-disabled while busy and leaves it enabled', () => {
        const button = upgradeButton(show({}, 5, { selectedId: 'CLICK_DAMAGE', busy: true }), 'CLICK_DAMAGE');

        expect(button.disabled).toBe(false);
        expect(button.getAttribute('aria-disabled')).toBe('true');
    });

    it('disables the card button when the talent costs more than the points', () => {
        expect(upgradeButton(show({ COMBO: 10 }, 1, { selectedId: 'COMBO_G2' }), 'COMBO_G2').disabled).toBe(true);
    });

    it('shows Nível máximo and no button for a maxed talent', () => {
        const screen = show({ CLICK_DAMAGE: 10 }, 50, { selectedId: 'CLICK_DAMAGE' });

        expect(text(screen, 'talent-max-CLICK_DAMAGE')).toBe('Nível máximo');
        expect(upgradeButton(screen, 'CLICK_DAMAGE')).toBeNull();
    });

    it('shows the grade lock text and no button for a locked grade', () => {
        const screen = show({}, 50, { selectedId: 'CLICK_DAMAGE_G2' });

        expect(text(screen, 'talent-locked-CLICK_DAMAGE_G2')).toBe('Bloqueado: chegue ao nível 10 do Grau 1');
        expect(upgradeButton(screen, 'CLICK_DAMAGE_G2')).toBeNull();
    });

    it('shows the lock text of Fúria crescente', () => {
        const screen = show({}, 50, { selectedId: 'COMBO_FURY' });

        expect(text(screen, 'talent-locked-COMBO_FURY')).toBe('Bloqueado: chegue ao nível 10 de Limite de dano do combo');
        expect(upgradeButton(screen, 'COMBO_FURY')).toBeNull();
    });

    it('reads Fúria crescente as Nível 1/4 and +2% por clique', () => {
        const screen = show({ COMBO: 10, COMBO_FURY: 1 }, 50, { selectedId: 'COMBO_FURY' });

        expect(text(screen, 'talent-level-COMBO_FURY')).toBe('Nível 1/4');
        expect(text(screen, 'talent-effect-COMBO_FURY')).toBe('Efeito: +2% por clique');
    });

    it('explains the selected talent after its level and effect', () => {
        const screen = show({}, 1, { selectedId: 'CLICK_DAMAGE' });
        const description = find(screen, 'talent-description-CLICK_DAMAGE');

        expect(description.tagName).toBe('P');
        expect(description.classList.contains('talent-detail-description')).toBe(true);
        expect(description.textContent).toBe('Aumenta em porcentagem o dano de cada clique e de cada habilidade do seu líder.');
        expect([ ...find(screen, 'talent-detail-body').children ].map((child) => child.getAttribute('data-testid') ?? child.className)).toEqual([
            'talent-detail-name', 'talent-detail-stats', 'talent-description-CLICK_DAMAGE', 'talent-upgrade-CLICK_DAMAGE'
        ]);
    });

    it('explains grade 3 with the text of grade 1, before the lock text', () => {
        const screen = show({}, 50, { selectedId: 'CLICK_DAMAGE_G3' });
        const description = find(screen, 'talent-description-CLICK_DAMAGE_G3');

        expect(description.textContent).toBe('Aumenta em porcentagem o dano de cada clique e de cada habilidade do seu líder.');
        expect(description.nextElementSibling).toBe(find(screen, 'talent-locked-CLICK_DAMAGE_G3'));
    });

    it('explains Fúria crescente', () => {
        const screen = show({}, 50, { selectedId: 'COMBO_FURY' });

        expect(text(screen, 'talent-description-COMBO_FURY')).toBe('Cada clique soma mais bônus de combo, então você chega ao limite com menos cliques.');
    });

    it('shows no description for a talent the game has no text for, and the rest of the card', () => {
        const extra = { id: 'NEW_ONE', baseId: 'NEW_ONE', branch: 'POWER', label: 'Novo', unit: '%', perLevel: 1, maxLevel: 10, level: 0, value: 0, nextCost: 1, unlocked: true };
        const screen = renderTalents([ ...tree(), extra ], points(5), { selectedId: 'NEW_ONE', onUpgrade: vi.fn() });

        expect(text(screen, 'talent-detail-name')).toBe('Novo');
        expect(screen.querySelector('[data-testid^="talent-description-"]')).toBeNull();
        expect(find(screen, 'talent-upgrade-NEW_ONE')).not.toBeNull();
    });

    it('puts the level and the effect on one row', () => {
        const screen = show({}, 1, { selectedId: 'CLICK_DAMAGE' });
        const row = find(screen, 'talent-level-CLICK_DAMAGE').parentElement;

        expect(find(screen, 'talent-effect-CLICK_DAMAGE').parentElement).toBe(row);
        expect(row.classList.contains('talent-detail-stats')).toBe(true);
    });

    it('shows the icon of the talent at the right of the card, the grade file first', () => {
        const screen = show({ CLICK_DAMAGE: 10 }, 50, { selectedId: 'CLICK_DAMAGE_G2' });
        const icon = find(screen, 'talent-detail-icon');

        expect([ ...find(screen, 'talent-detail').children ].map((child) => child.getAttribute('data-testid'))).toEqual([ 'talent-detail-body', 'talent-detail-icon' ]);
        expect(icon.querySelector('.talent-detail-art img').src.endsWith('assets/talent-click-damage-g2.png')).toBe(true);
    });

    it('falls back on the card to the grade 1 icon, then to the branch glyph', () => {
        const screen = show({ CLICK_DAMAGE: 10 }, 50, { selectedId: 'CLICK_DAMAGE_G2' });
        const image = () => screen.querySelector('.talent-detail-art img');

        fail(image());
        expect(image().src.endsWith('assets/talent-click-damage.png')).toBe(true);
        fail(image());
        expect(screen.querySelector('.talent-detail-art .icon-fallback').textContent).toBe('⚔');

        [ [ 'MINIBOSS_TIME', '⏳' ], [ 'PHYSICAL_BREAK', '🛡' ], [ 'COMBO_FURY', '✦' ] ].forEach(([ id, glyph ]) =>
        {
            const card = show({}, 50, { selectedId: id });

            fail(card.querySelector('.talent-detail-art img'));
            expect(card.querySelector('.talent-detail-art .icon-fallback').textContent).toBe(glyph);
        });
    });

    it('shows no icon and no description with nothing selected', () => {
        const screen = show();

        expect(find(screen, 'talent-detail-icon')).toBeNull();
        expect(find(screen, 'talent-detail-body')).toBeNull();
        expect(screen.querySelector('[data-testid^="talent-description-"]')).toBeNull();
        expect(text(screen, 'talent-detail-empty')).toBe('Escolha um talento na árvore para ver os detalhes.');
    });
});

describe('the board', () => {
    it('draws the four banners in branch order with their titles and positions', () => {
        const screen = show();

        expect([ ...screen.querySelectorAll('.talent-branch-title') ].map((node) => node.textContent)).toEqual([ 'Caça aos chefes', 'Quebra de defesa', 'Poder do clique', 'Combo' ]);
        expect([ find(screen, 'talent-branch-POWER').style.left, find(screen, 'talent-branch-POWER').style.top ]).toEqual([ '66.5%', '3.5%' ]);
    });

    it('gives each lit layer its ellipse and its opacity', () => {
        const screen = show({ MINIBOSS_TIME: 5 });
        const lit = find(screen, 'talent-lit-TIME');

        expect([ '--cx', '--cy', '--rx', '--ry' ].map((name) => lit.style.getPropertyValue(name))).toEqual([ '29%', '52%', '18%', '17%' ]);
        expect(lit.style.opacity).toBe('0.27');
        expect(find(screen, 'talent-lit-POWER').style.opacity).toBe('0');
    });

    it('draws the trunk, 9 chain veins and the twig of Fúria crescente', () => {
        const lines = [ ...find(show(), 'talent-tree-veins').querySelectorAll('polyline') ];

        expect(lines).toHaveLength(11);
        expect(lines[0].getAttribute('points')).toBe('50,100 50,58');
        expect(lines[10].getAttribute('points')).toBe('60,61 76,62');
    });

    it('shows the points on the medallion and the reset button', () => {
        const screen = show({}, 3);

        expect(text(screen, 'talent-points')).toBe('Pontos de talento: 3');
        expect(text(screen, 'talent-reset')).toBe('Reiniciar pontos');
    });

    it('disables Reiniciar pontos while nothing is spent, marks it aria-disabled while busy, and calls onReset', () => {
        const withSpent = (spent, options = {}) => renderTalents(tree(), points(0, spent), { onUpgrade: vi.fn(), ...options });
        const onReset = vi.fn();
        const screen = withSpent(3, { onReset });

        expect(find(withSpent(0), 'talent-reset').disabled).toBe(true);
        expect(find(withSpent(3, { busy: true }), 'talent-reset').disabled).toBe(false);
        expect(find(withSpent(3, { busy: true }), 'talent-reset').getAttribute('aria-disabled')).toBe('true');
        expect(find(screen, 'talent-reset').disabled).toBe(false);

        find(screen, 'talent-reset').click();

        expect(onReset).toHaveBeenCalledTimes(1);
    });
});

describe('the fallbacks', () => {
    it('falls back to the gradient board when the board image is missing', () => {
        const screen = show();

        fail(screen.querySelector('.talent-tree-image'));

        expect(find(screen, 'talent-tree').classList.contains('is-fallback')).toBe(true);
        expect(screen.querySelector('.talent-tree-image')).toBeNull();
    });

    it('falls back to a ring when a node frame is missing', () => {
        const node = find(show(), 'talent-CLICK_DAMAGE');

        fail(node.querySelector('.talent-node-frame'));

        expect(node.classList.contains('no-frame')).toBe(true);
        expect(node.querySelector('.talent-node-frame')).toBeNull();
    });

    it('falls back to the CSS plaque or the bare pill when a banner, the title, the medallion or the reset art is missing', () => {
        const screen = show({}, 3);
        const missing = [ [ 'talent-branch-TIME', '.talent-banner-art' ], [ 'talent-title', '.talent-plaque-art' ], [ 'talent-points', '.talent-round-art' ], [ 'talent-reset', '.talent-round-art' ] ];

        missing.forEach(([ id, selector ]) =>
        {
            fail(find(screen, id).querySelector(selector));

            expect(find(screen, id).classList.contains('no-art')).toBe(true);
            expect(find(screen, id).querySelector(selector)).toBeNull();
        });
        expect(text(screen, 'talent-points')).toBe('Pontos de talento: 3');
        expect(text(screen, 'talent-reset')).toBe('Reiniciar pontos');
    });

    it('falls back to the branch glyph when an icon is missing and to the grade 1 icon first for grades 2 and 3', () => {
        const screen = show();
        const plain = find(screen, 'talent-CLICK_DAMAGE');
        const second = find(screen, 'talent-CLICK_DAMAGE_G2');

        fail(plain.querySelector('.talent-node-icon img'));
        expect(plain.querySelector('.talent-node-icon .icon-fallback').textContent).toBe('⚔');

        fail(second.querySelector('.talent-node-icon img'));
        expect(second.querySelector('.talent-node-icon img').src.endsWith('assets/talent-click-damage.png')).toBe(true);
    });

    it('falls back to the lock glyph when the lock art is missing', () => {
        const node = find(show(), 'talent-CLICK_DAMAGE_G2');

        fail(node.querySelector('.talent-node-lock img'));

        expect(node.querySelector('.talent-node-lock .icon-fallback').textContent).toBe('🔒');
    });
});

describe('the scroll of the tree', () => {
    it('placeTalentScroll centres the tree without a previous scroll and keeps a previous one', () => {
        const screen = show();
        const scroll = find(screen, 'talent-tree-scroll');

        Object.entries({ scrollWidth: 2048, clientWidth: 1024, scrollHeight: 1152, clientHeight: 576 })
            .forEach(([ name, value ]) => Object.defineProperty(scroll, name, { value, configurable: true }));

        placeTalentScroll(screen, null);
        expect([ scroll.scrollLeft, scroll.scrollTop ]).toEqual([ 512, 288 ]);

        placeTalentScroll(screen, { left: 120, top: 40 });
        expect([ scroll.scrollLeft, scroll.scrollTop ]).toEqual([ 120, 40 ]);

        expect(talentScrollOf(null)).toBeNull();
        expect(talentScrollOf(screen)).toEqual({ left: 120, top: 40 });
    });
});

describe('revealTalent', () => {
    //  A phone board: 2048 x 1152 in a 1024 x 576 viewport, opened centred (scroll 512, 288); the plaque is fixed on the top 76 px, the card on the bottom 144 px
    const phone = (scrollLeft, scrollTop, clientHeight = 576) =>
    {
        const screen = show();
        const scroll = find(screen, 'talent-tree-scroll');

        Object.entries({ scrollWidth: 2048, clientWidth: 1024, scrollHeight: 1152, clientHeight })
            .forEach(([ name, value ]) => Object.defineProperty(scroll, name, { value, configurable: true }));
        scroll.scrollLeft = scrollLeft;
        scroll.scrollTop = scrollTop;

        return { screen, scroll };
    };

    it('scrolls Fúria crescente from under the card up into the free area, as far as the board allows', () => {
        const { screen, scroll } = phone(512, 288);

        revealTalent(screen, 'COMBO_FURY');

        //  Its centre (76 %, 62 %) is at (1556.48, 714.24) of the board: the right edge keeps 56 + 12 px, the bottom keeps 56 px of node and 108 px of caption above the card
        expect(scroll.scrollLeft).toBeCloseTo(1556.48 - (1024 - 56 - 12), 5);
        expect(scroll.scrollTop).toBeCloseTo(714.24 - (576 - 144 - 56 - 108), 5);
    });

    it('scrolls a grade 3 node out from under the plaque and keeps its caption room above the card for a grade 1 node', () => {
        const { screen, scroll } = phone(512, 288);

        revealTalent(screen, 'CLICK_DAMAGE_G3');

        //  (58 %, 24.5 %) is at (1187.84, 282.24): 76 + 44 px under the top edge
        expect(scroll.scrollLeft).toBe(512);
        expect(scroll.scrollTop).toBeCloseTo(282.24 - (76 + 44), 5);

        const low = phone(0, 0);

        revealTalent(low.screen, 'MINIBOSS_TIME');

        //  (43.5 %, 58 %) is at (890.88, 668.16): inside the side edges, bottom edge 576 - 144 - 44 - 108 px
        expect(low.scroll.scrollLeft).toBe(0);
        expect(low.scroll.scrollTop).toBeCloseTo(668.16 - (576 - 144 - 44 - 108), 5);
    });

    it('leaves the scroll alone when the node is already in the free area', () => {
        const { screen, scroll } = phone(700, 400);

        revealTalent(screen, 'CLICK_DAMAGE');

        expect([ scroll.scrollLeft, scroll.scrollTop ]).toEqual([ 700, 400 ]);
    });

    //  A column (grade 3 node and its seal down to the caption of grade 1) is about 500 px tall at 2x (498 px for CLICK_DAMAGE), the free area of a 1024 x 576 window
    //  432 px (the card and the buttons take 144 px): it never fits there, so these cases use a taller window of 800 px (664 px free)
    describe('the whole column', () => {
        it('brings a column under Fechar 48 px under the top of the window, grade 3 seal included, up to the top of the board', () => {
            const { screen, scroll } = phone(700, 400, 800);

            revealTalent(screen, 'CRIT_DAMAGE');

            //  CRIT_DAMAGE sits at x 78.5 % = 1607.68 of the board, 907.68 px across the window (its caption reaches 987.68 px, over Fechar from 896); its grade 3 (8 % = 92.16)
            //  keeps 44 px of node and 14 px of seal and must start 48 px down: 92.16 - 44 - 14 - 48 is below 0, so the scroll stops at 0 (without the Fechar room it would be 34.16)
            expect(scroll.scrollLeft).toBe(700);
            expect(scroll.scrollTop).toBe(0);
        });

        it('brings a column under the plaque 76 px under the top of the window', () => {
            const { screen, scroll } = phone(512, 288, 800);

            revealTalent(screen, 'CLICK_DAMAGE');

            //  (53 %: 1085.44 across the board, 573.44 across the window); grade 3 at 24.5 % = 282.24
            expect(scroll.scrollTop).toBeCloseTo(282.24 - 44 - 14 - 76, 5);
        });

        it('brings a column clear of every fixed part to the top of the window when it fits', () => {
            const { screen, scroll } = phone(512, 288, 800);

            revealTalent(screen, 'CLICK_FLAT_DAMAGE');

            //  (61.5 %: 747.52 across the window, between the plaque and Fechar); grade 3 at 19 % = 218.88 keeps its 44 px and 14 px of seal above the window edge
            expect(scroll.scrollTop).toBeCloseTo(218.88 - 44 - 14, 5);
        });

        it('keeps the scroll the player chose when the whole column is already in the free area', () => {
            const { screen, scroll } = phone(512, 100, 800);

            revealTalent(screen, 'CLICK_FLAT_DAMAGE');

            expect([ scroll.scrollLeft, scroll.scrollTop ]).toEqual([ 512, 100 ]);
        });

        it('keeps the node and its caption in the free area, as before, when the column does not fit', () => {
            //  The 1024 x 576 phone window: Fúria crescente under the card goes up as far as its caption allows, the grade 1 node of CLICK_FLAT_DAMAGE is free, so the scroll stays
            const { screen, scroll } = phone(512, 288);

            revealTalent(screen, 'CLICK_FLAT_DAMAGE');
            expect([ scroll.scrollLeft, scroll.scrollTop ]).toEqual([ 512, 288 ]);

            revealTalent(screen, 'COMBO_FURY');
            expect(scroll.scrollTop).toBeCloseTo(714.24 - (576 - 144 - 56 - 108), 5);
        });
    });

    it('does nothing on a board that does not scroll, for a talent without a node or without a screen', () => {
        const flat = show();
        const scroll = find(flat, 'talent-tree-scroll');

        Object.entries({ scrollWidth: 1024, clientWidth: 1024, scrollHeight: 576, clientHeight: 576 })
            .forEach(([ name, value ]) => Object.defineProperty(scroll, name, { value, configurable: true }));
        scroll.scrollTop = 7;
        revealTalent(flat, 'COMBO_FURY');
        expect(scroll.scrollTop).toBe(7);

        const { screen, scroll: moving } = phone(512, 288);

        revealTalent(screen, 'NOT_A_TALENT');
        revealTalent(null, 'COMBO_FURY');
        expect([ moving.scrollLeft, moving.scrollTop ]).toEqual([ 512, 288 ]);
    });
});

describe('talents unavailable', () => {
    it('says Talentos indisponíveis', () => {
        expect(renderTalentsUnavailable().textContent).toBe('Talentos indisponíveis');
    });
});

describe('updateTalents', () => {
    //  A screen built with `renderTalents` for `levels`, `available` points and `spent` points spent
    const fresh = (levels, available, spent, options = {}) => renderTalents(tree(levels), points(available, spent), { onSelect: vi.fn(), onUpgrade: vi.fn(), onReset: vi.fn(), ...options });
    const patch = (screen, levels, available, spent, options = {}) => updateTalents(screen, tree(levels), points(available, spent), { onUpgrade: vi.fn(), ...options });
    const snapshot = (screen) =>
    {
        const button = screen.querySelector('.talent-upgrade');
        const detail = find(screen, 'talent-detail');

        return {
            nodes: nodes(screen).map((node) => [
                node.getAttribute('data-testid'), node.getAttribute('data-state'), node.getAttribute('aria-label'), node.getAttribute('aria-pressed'),
                node.querySelector('.talent-node-level').textContent, node.querySelector('.talent-node-lock') !== null
            ]),
            lit: [ ...screen.querySelectorAll('.talent-lit') ].map((lit) => lit.style.opacity),
            points: text(screen, 'talent-points'),
            reset: [ find(screen, 'talent-reset').disabled, find(screen, 'talent-reset').getAttribute('aria-disabled') ],
            busy: screen.getAttribute('data-busy'),
            card: [ detail.getAttribute('data-selected-id'), detail.textContent ],
            button: button ? [ button.textContent, button.disabled, button.getAttribute('aria-disabled'), button.getAttribute('data-max'), button.getAttribute('title') ] : null
        };
    };
    const kept = (screen) => ({
        image: screen.querySelector('.talent-tree-image'), nodes: nodes(screen), detail: find(screen, 'talent-detail'), icon: find(screen, 'talent-detail').querySelector('img'),
        images: [ ...screen.querySelectorAll('img') ]
    });

    it('keeps the board image, the 28 nodes, the card and the card icon after a level bought', () => {
        const screen = fresh({}, 5, 0, { selectedId: 'CLICK_DAMAGE' });
        const before = kept(screen);

        patch(screen, { CLICK_DAMAGE: 1 }, 4, 1, { selectedId: 'CLICK_DAMAGE' });

        const after = kept(screen);

        expect(before.nodes).toHaveLength(28);
        expect(after.image).toBe(before.image);
        expect(after.nodes).toHaveLength(28);
        after.nodes.forEach((node, index) => expect(node).toBe(before.nodes[index]));
        expect(after.detail).toBe(before.detail);
        expect(after.icon).toBe(before.icon);
        expect(after.images).toHaveLength(before.images.length);
        after.images.forEach((image, index) => expect(image).toBe(before.images[index]));
    });

    it('writes the new values in place', () => {
        const screen = fresh({}, 5, 0, { selectedId: 'CLICK_DAMAGE' });

        patch(screen, { CLICK_DAMAGE: 1 }, 4, 1, { selectedId: 'CLICK_DAMAGE' });

        const target = fresh({ CLICK_DAMAGE: 1 }, 4, 0, { selectedId: 'CLICK_DAMAGE' });

        expect(find(screen, 'talent-CLICK_DAMAGE').getAttribute('data-state')).toBe('available');
        expect(text(screen, 'talent-node-level-CLICK_DAMAGE')).toBe('1/10');
        expect(find(screen, 'talent-CLICK_DAMAGE').getAttribute('aria-label')).toBe('Dano de clique (%), nível 1 de 10');
        expect(text(screen, 'talent-points')).toBe('Pontos de talento: 4');
        expect(text(screen, 'talent-level-CLICK_DAMAGE')).toBe('Nível 1/10');
        expect(text(screen, 'talent-effect-CLICK_DAMAGE')).toBe('Efeito: +5%');
        expect(text(screen, 'talent-upgrade-CLICK_DAMAGE')).toBe('Melhorar (1 ponto)');
        expect(find(screen, 'talent-upgrade-CLICK_DAMAGE').disabled).toBe(false);
        expect([ ...screen.querySelectorAll('.talent-lit') ].map((lit) => lit.style.opacity)).toEqual([ ...target.querySelectorAll('.talent-lit') ].map((lit) => lit.style.opacity));
        expect(find(screen, 'talent-lit-POWER').style.opacity).not.toBe('0');
    });

    describe('a patched screen reads like a fresh build of the same tree', () => {
        const transitions = [
            [ '(a) a level bought', [ {}, 5, 0, { selectedId: 'CLICK_DAMAGE' } ], [ { CLICK_DAMAGE: 1 }, 4, 1, { selectedId: 'CLICK_DAMAGE' } ] ],
            [ '(b) the last level of COMBO', [ { COMBO: 9 }, 1, 9, { selectedId: 'COMBO' } ], [ { COMBO: 10 }, 0, 10, { selectedId: 'COMBO' } ] ],
            [ '(c) Reiniciar pontos', [ { COMBO: 10, COMBO_G2: 3 }, 0, 16, { selectedId: 'COMBO_G2' } ], [ {}, 16, 0, { selectedId: 'COMBO_G2' } ] ],
            [ '(d) a node chosen', [ {}, 5, 0, { selectedId: null } ], [ {}, 5, 0, { selectedId: 'COMBO' } ] ],
            [ '(e) a request starts', [ {}, 5, 0, { selectedId: 'CLICK_DAMAGE' } ], [ {}, 5, 0, { selectedId: 'CLICK_DAMAGE', busy: true } ] ],
            [ '(f) Shift pressed', [ {}, 5, 0, { selectedId: 'COMBO' } ], [ {}, 5, 0, { selectedId: 'COMBO', shiftHeld: true } ] ]
        ];

        transitions.forEach(([ name, from, to ]) =>
        {
            it(name, () => {
                const screen = fresh(...from);

                patch(screen, ...to);

                expect(snapshot(screen)).toEqual(snapshot(fresh(...to)));
            });
        });
    });

    it('replaces only the card when another node is selected', () => {
        const screen = fresh({}, 5, 0, { selectedId: null });
        const before = kept(screen);

        patch(screen, {}, 5, 0, { selectedId: 'COMBO' });

        const after = kept(screen);

        expect(after.image).toBe(before.image);
        after.nodes.forEach((node, index) => expect(node).toBe(before.nodes[index]));
        expect(after.detail).not.toBe(before.detail);
        expect(after.detail.getAttribute('data-selected-id')).toBe('COMBO');
    });

    it('keeps the card when the same node stays selected', () => {
        const screen = fresh({}, 5, 0, { selectedId: 'CLICK_DAMAGE' });
        const card = find(screen, 'talent-detail');

        patch(screen, { CLICK_DAMAGE: 1 }, 4, 1, { selectedId: 'CLICK_DAMAGE' });

        expect(find(screen, 'talent-detail')).toBe(card);
    });

    it('adds the lock to the grades that lock again, keeping their frame and icon', () => {
        const screen = fresh({ COMBO: 10, COMBO_G2: 3 }, 0, 16, { selectedId: 'COMBO_G2' });
        const parts = [ 'COMBO_G2', 'COMBO_FURY' ].map((id) => [ id, find(screen, `talent-${id}`).querySelector('.talent-node-frame'), find(screen, `talent-${id}`).querySelector('.talent-node-icon') ]);

        patch(screen, {}, 16, 0, { selectedId: 'COMBO_G2' });

        parts.forEach(([ id, frame, icon ]) =>
        {
            const node = find(screen, `talent-${id}`);

            expect(node.querySelectorAll('.talent-node-lock')).toHaveLength(1);
            expect(node.querySelector('.talent-node-frame')).toBe(frame);
            expect(node.querySelector('.talent-node-icon')).toBe(icon);
        });
    });

    it('removes the lock from a node that opens, keeping its frame and icon', () => {
        const screen = fresh({ COMBO: 9 }, 1, 9, { selectedId: 'COMBO' });
        const parts = [ 'COMBO_G2', 'COMBO_FURY' ].map((id) => [ id, find(screen, `talent-${id}`).querySelector('.talent-node-frame'), find(screen, `talent-${id}`).querySelector('.talent-node-icon') ]);

        expect(find(screen, 'talent-COMBO_G2').querySelectorAll('.talent-node-lock')).toHaveLength(1);

        patch(screen, { COMBO: 10 }, 0, 10, { selectedId: 'COMBO' });

        parts.forEach(([ id, frame, icon ]) =>
        {
            const node = find(screen, `talent-${id}`);

            expect(node.querySelectorAll('.talent-node-lock')).toHaveLength(0);
            expect(node.querySelector('.talent-node-frame')).toBe(frame);
            expect(node.querySelector('.talent-node-icon')).toBe(icon);
        });
    });

    it('replaces only the action when the button becomes Nível máximo', () => {
        const screen = fresh({ COMBO: 9 }, 1, 9, { selectedId: 'COMBO' });
        const ids = [ 'talent-detail-name', 'talent-level-COMBO', 'talent-effect-COMBO', 'talent-detail-icon' ];
        const before = ids.map((id) => find(screen, id));

        patch(screen, { COMBO: 10 }, 0, 10, { selectedId: 'COMBO' });

        expect(text(screen, 'talent-max-COMBO')).toBe('Nível máximo');
        expect(find(screen, 'talent-upgrade-COMBO')).toBeNull();
        ids.forEach((id, index) => expect(find(screen, id)).toBe(before[index]));
    });

    it('sends the talent id after a patch, with the Shift of the click', () => {
        const onUpgrade = vi.fn();
        const screen = fresh({}, 5, 0, { selectedId: 'CLICK_DAMAGE', onUpgrade });

        patch(screen, { CLICK_DAMAGE: 1 }, 4, 1, { selectedId: 'CLICK_DAMAGE' });

        const button = find(screen, 'talent-upgrade-CLICK_DAMAGE');

        button.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
        expect(onUpgrade).toHaveBeenLastCalledWith('CLICK_DAMAGE', { shift: true });

        button.click();
        expect(onUpgrade).toHaveBeenLastCalledWith('CLICK_DAMAGE', { shift: false });
        expect(onUpgrade).toHaveBeenCalledTimes(2);
    });

    it('ignores clicks on both buttons while busy and takes them again after', () => {
        const onUpgrade = vi.fn();
        const onReset = vi.fn();
        const screen = fresh({ COMBO: 1 }, 5, 0, { selectedId: 'COMBO', busy: true, onUpgrade, onReset });

        find(screen, 'talent-upgrade-COMBO').click();
        find(screen, 'talent-reset').click();

        expect(onUpgrade).not.toHaveBeenCalled();
        expect(onReset).not.toHaveBeenCalled();
        expect(screen.getAttribute('data-busy')).toBe('true');

        patch(screen, { COMBO: 1 }, 5, 1, { selectedId: 'COMBO', busy: false });

        expect(find(screen, 'talent-upgrade-COMBO').getAttribute('aria-disabled')).toBe('false');
        expect(find(screen, 'talent-reset').getAttribute('aria-disabled')).toBe('false');

        find(screen, 'talent-upgrade-COMBO').click();
        find(screen, 'talent-reset').click();

        expect(onUpgrade).toHaveBeenCalledTimes(1);
        expect(onReset).toHaveBeenCalledTimes(1);
    });
});

describe('the Shift form of the card button', () => {
    const button = (screen, id) => find(screen, `talent-upgrade-${id}`);

    it('labels the button Melhorar até o nível 5 (5 pontos) with data-max true while Shift is held', () => {
        const screen = show({}, 5, { selectedId: 'COMBO', shiftHeld: true });

        expect(button(screen, 'COMBO').textContent).toBe('Melhorar até o nível 5 (5 pontos)');
        expect(button(screen, 'COMBO').getAttribute('data-max')).toBe('true');
    });

    it('goes back to Melhorar (1 ponto) with data-max false on the same button when Shift ends', () => {
        const screen = show({}, 5, { selectedId: 'COMBO', shiftHeld: true });
        const held = button(screen, 'COMBO');

        updateTalents(screen, tree({}), points(5), { selectedId: 'COMBO', shiftHeld: false, onUpgrade: vi.fn() });

        expect(button(screen, 'COMBO')).toBe(held);
        expect(held.textContent).toBe('Melhorar (1 ponto)');
        expect(held.getAttribute('data-max')).toBe('false');
    });

    it('keeps Melhorar (2 pontos), disabled and data-max false when no level is affordable', () => {
        const screen = show({ COMBO: 10 }, 1, { selectedId: 'COMBO_G2', shiftHeld: true });

        expect(button(screen, 'COMBO_G2').textContent).toBe('Melhorar (2 pontos)');
        expect(button(screen, 'COMBO_G2').disabled).toBe(true);
        expect(button(screen, 'COMBO_G2').getAttribute('data-max')).toBe('false');
    });

    it('reads the Shift texts of E2, E3, E5, E6 and E7', () => {
        const textOf = (levels, available, selectedId) => button(show(levels, available, { selectedId, shiftHeld: true }), selectedId).textContent;

        expect(textOf({ CLICK_DAMAGE: 7 }, 20, 'CLICK_DAMAGE')).toBe('Melhorar até o nível 10 (3 pontos)');
        expect(textOf({ COMBO: 10 }, 5, 'COMBO_G2')).toBe('Melhorar até o nível 2 (4 pontos)');
        expect(textOf({}, 1, 'COMBO')).toBe('Melhorar até o nível 1 (1 ponto)');
        expect(textOf({ COMBO: 10 }, 9, 'COMBO_FURY')).toBe('Melhorar até o nível 4 (8 pontos)');
        expect(textOf({ CLICK_DAMAGE: 10, CLICK_DAMAGE_G2: 10 }, 30, 'CLICK_DAMAGE_G3')).toBe('Melhorar até o nível 10 (30 pontos)');
    });

    it('keeps the lock text and Nível máximo while Shift is held', () => {
        const locked = show({ COMBO: 5 }, 50, { selectedId: 'COMBO_G2', shiftHeld: true });
        const maxed = show({ CLICK_DAMAGE: 10 }, 50, { selectedId: 'CLICK_DAMAGE', shiftHeld: true });

        expect(find(locked, 'talent-locked-COMBO_G2')).not.toBeNull();
        expect(button(locked, 'COMBO_G2')).toBeNull();
        expect(text(maxed, 'talent-max-CLICK_DAMAGE')).toBe('Nível máximo');
    });

    it('carries the tooltip Segure Shift para melhorar até o máximo in both forms', () => {
        const plain = show({}, 5, { selectedId: 'COMBO', shiftHeld: false });
        const held = show({}, 5, { selectedId: 'COMBO', shiftHeld: true });

        expect(SHIFT_HINT).toBe('Segure Shift para melhorar até o máximo');
        expect(button(plain, 'COMBO').getAttribute('title')).toBe('Segure Shift para melhorar até o máximo');
        expect(button(held, 'COMBO').getAttribute('title')).toBe('Segure Shift para melhorar até o máximo');
    });
});
