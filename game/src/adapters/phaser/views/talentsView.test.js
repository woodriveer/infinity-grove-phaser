import { describe, expect, it, vi } from 'vitest';
import { placeTalentScroll, renderTalents, renderTalentsUnavailable, revealTalent, talentScrollOf } from './talentsView';

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

        expect([ find(screen, 'talent-CLICK_DAMAGE').style.left, find(screen, 'talent-CLICK_DAMAGE').style.top ]).toEqual([ '55%', '50%' ]);
        expect([ find(screen, 'talent-COMBO_FURY').style.left, find(screen, 'talent-COMBO_FURY').style.top ]).toEqual([ '80%', '61%' ]);
        expect([ find(screen, 'talent-MINIBOSS_TIME').style.left, find(screen, 'talent-MINIBOSS_TIME').style.top ]).toEqual([ '9%', '60%' ]);
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

    it('calls onUpgrade with the talent when the card button is clicked', () => {
        const onUpgrade = vi.fn();
        const screen = show({}, 5, { selectedId: 'CLICK_DAMAGE', onUpgrade });

        upgradeButton(screen, 'CLICK_DAMAGE').click();

        expect(onUpgrade).toHaveBeenCalledTimes(1);
        expect(onUpgrade.mock.calls[0][0].id).toBe('CLICK_DAMAGE');
    });

    it('disables the card button while busy', () => {
        expect(upgradeButton(show({}, 5, { selectedId: 'CLICK_DAMAGE', busy: true }), 'CLICK_DAMAGE').disabled).toBe(true);
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
});

describe('the board', () => {
    it('draws the four banners in branch order with their titles and positions', () => {
        const screen = show();

        expect([ ...screen.querySelectorAll('.talent-branch-title') ].map((node) => node.textContent)).toEqual([ 'Caça aos chefes', 'Quebra de defesa', 'Poder do clique', 'Combo' ]);
        expect([ find(screen, 'talent-branch-POWER').style.left, find(screen, 'talent-branch-POWER').style.top ]).toEqual([ '66%', '5%' ]);
    });

    it('gives each lit layer its ellipse and its opacity', () => {
        const screen = show({ MINIBOSS_TIME: 5 });
        const lit = find(screen, 'talent-lit-TIME');

        expect([ '--cx', '--cy', '--rx', '--ry' ].map((name) => lit.style.getPropertyValue(name))).toEqual([ '25%', '50%', '22%', '24%' ]);
        expect(lit.style.opacity).toBe('0.27');
        expect(find(screen, 'talent-lit-POWER').style.opacity).toBe('0');
    });

    it('draws the trunk and 9 veins', () => {
        const lines = [ ...find(show(), 'talent-tree-veins').querySelectorAll('polyline') ];

        expect(lines).toHaveLength(10);
        expect(lines[0].getAttribute('points')).toBe('50,100 50,58');
    });

    it('shows the points on the medallion and the reset button', () => {
        const screen = show({}, 3);

        expect(text(screen, 'talent-points')).toBe('Pontos de talento: 3');
        expect(text(screen, 'talent-reset')).toBe('Reiniciar pontos');
    });

    it('disables Reiniciar pontos while nothing is spent and while busy, and calls onReset', () => {
        const withSpent = (spent, options = {}) => renderTalents(tree(), points(0, spent), { onUpgrade: vi.fn(), ...options });
        const onReset = vi.fn();
        const screen = withSpent(3, { onReset });

        expect(find(withSpent(0), 'talent-reset').disabled).toBe(true);
        expect(find(withSpent(3, { busy: true }), 'talent-reset').disabled).toBe(true);
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
    //  A phone board: 2048 x 1152 in a 1024 x 576 viewport, opened centred (scroll 512, 288); the plaque is fixed on the top 76 px, the card on the bottom 136 px
    const phone = (scrollLeft, scrollTop) =>
    {
        const screen = show();
        const scroll = find(screen, 'talent-tree-scroll');

        Object.entries({ scrollWidth: 2048, clientWidth: 1024, scrollHeight: 1152, clientHeight: 576 })
            .forEach(([ name, value ]) => Object.defineProperty(scroll, name, { value, configurable: true }));
        scroll.scrollLeft = scrollLeft;
        scroll.scrollTop = scrollTop;

        return { screen, scroll };
    };

    it('scrolls Fúria crescente from under the card up into the free area, as far as the board allows', () => {
        const { screen, scroll } = phone(512, 288);

        revealTalent(screen, 'COMBO_FURY');

        //  Its centre (80 %, 61 %) is at (1638.4, 702.72) of the board: the right edge keeps 88 + 12 px, the bottom keeps 88 px of node and 108 px of caption above the card
        expect(scroll.scrollLeft).toBeCloseTo(1638.4 - (1024 - 88 - 12), 5);
        expect(scroll.scrollTop).toBeCloseTo(702.72 - (576 - 136 - 88 - 108), 5);
    });

    it('scrolls a grade 3 node out from under the plaque and keeps its caption room above the card for a grade 1 node', () => {
        const { screen, scroll } = phone(512, 288);

        revealTalent(screen, 'CLICK_DAMAGE_G3');

        //  (55 %, 26 %) is at (1126.4, 299.52): 76 + 60 px under the top edge
        expect(scroll.scrollLeft).toBe(512);
        expect(scroll.scrollTop).toBeCloseTo(299.52 - (76 + 60), 5);

        const low = phone(0, 0);

        revealTalent(low.screen, 'MINIBOSS_TIME');

        //  (9 %, 60 %) is at (184.32, 691.2): left edge 60 + 12 px, bottom edge 576 - 136 - 60 - 108 px
        expect(low.scroll.scrollLeft).toBe(0);
        expect(low.scroll.scrollTop).toBeCloseTo(691.2 - (576 - 136 - 60 - 108), 5);
    });

    it('leaves the scroll alone when the node is already in the free area', () => {
        const { screen, scroll } = phone(700, 400);

        revealTalent(screen, 'CLICK_DAMAGE');

        expect([ scroll.scrollLeft, scroll.scrollTop ]).toEqual([ 700, 400 ]);
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
