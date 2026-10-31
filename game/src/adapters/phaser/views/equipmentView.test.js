import { describe, expect, it, vi } from 'vitest';
import { EMPTY_TEXT, renderEquipment, renderEquipmentUnavailable, renderLeaderStats, renderPieceDetail, UNAVAILABLE_TEXT } from './equipmentView';

const hero = (id, owned = true) => ({ id, name: `Hero ${id}`, owned });
const heroes = [ hero('kael'), hero('lyra'), hero('vex', false) ];

const weapon = (extra = {}) => ({
    id: 'w1', slot: 'WEAPON', rarity: 'RARE', refine: 3, clickDamage: 5.2, heroId: null, sellPrice: 750, refineCost: 7368, rerollCost: null,
    affixes: [ { type: 'CRIT_DAMAGE_PCT', value: 27 }, { type: 'BOSS_TIME_SECONDS', value: 2 } ], ...extra
});
const ring = (extra = {}) => ({
    id: 'r1', slot: 'RING', rarity: 'COMMON', refine: 0, heroId: null, sellPrice: 100, refineCost: 500, rerollCost: null,
    affixes: [ { type: 'CLICK_DAMAGE_PCT', value: 7 } ], ...extra
});

const text = (root, testid) => root.querySelector(`[data-testid="${testid}"]`)?.textContent;

describe('renderEquipment', () => {
    it('says there is no equipment yet', () => {
        const empty = renderEquipment([], heroes, { onSelect: vi.fn() });

        expect(empty.getAttribute('data-testid')).toBe('equipment-empty');
        expect(empty.textContent).toBe('Nenhum equipamento ainda. Vença chefes para encontrar peças.');
        expect(EMPTY_TEXT).toBe('Nenhum equipamento ainda. Vença chefes para encontrar peças.');
    });

    it('shows the four slots of every owned hero and none for a hero not owned', () => {
        const screen = renderEquipment([ ring() ], heroes, { onSelect: vi.fn() });

        expect(screen.querySelector('[data-testid="equip-hero-kael"]')).not.toBeNull();
        expect(screen.querySelector('[data-testid="equip-hero-lyra"]')).not.toBeNull();
        expect(screen.querySelector('[data-testid="equip-hero-vex"]')).toBeNull();
        expect([ ...screen.querySelectorAll('[data-testid^="equip-slot-kael-"]') ].map((slot) => slot.getAttribute('data-testid')))
            .toEqual([ 'equip-slot-kael-WEAPON', 'equip-slot-kael-ARMOR', 'equip-slot-kael-RING', 'equip-slot-kael-AMULET' ]);
    });

    it('names the piece worn in a slot and marks the others as empty', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }) ], heroes, { onSelect: vi.fn() });

        expect(screen.querySelector('[data-testid="equip-slot-kael-WEAPON"]').getAttribute('aria-label')).toBe('Raro Arma +3');
        expect(text(screen, 'equip-slot-kael-WEAPON')).toBe('+3');
        expect(text(screen, 'equip-slot-kael-RING')).toBe('vazio');
        expect(screen.querySelector('[data-testid="equip-slot-kael-RING"]').classList.contains('is-empty')).toBe(true);
        expect(screen.querySelector('[data-testid="equip-slot-kael-RING"]').disabled).toBe(true);
        expect(screen.querySelector('[data-testid="equip-slot-kael-WEAPON"]').disabled).toBe(false);
    });

    it('lists only the unworn pieces in the bag, with their rarity, slot and level', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }), ring() ], heroes, { onSelect: vi.fn() });

        expect(screen.querySelector('[data-testid="equip-piece-w1"]')).toBeNull();
        expect(screen.querySelector('[data-testid="equip-piece-r1"]').getAttribute('aria-label')).toBe('Comum Anel +0');
        expect(screen.querySelector('.equip-bag-title').textContent).toBe('Mochila (1)');
    });

    it('calls onSelect with the piece of a clicked bag row and of a clicked worn slot', () => {
        const onSelect = vi.fn();
        const worn = weapon({ heroId: 'kael' });
        const bagged = ring();
        const screen = renderEquipment([ worn, bagged ], heroes, { onSelect });

        screen.querySelector('[data-testid="equip-piece-r1"]').click();
        screen.querySelector('[data-testid="equip-slot-kael-WEAPON"]').click();

        expect(onSelect).toHaveBeenNthCalledWith(1, bagged);
        expect(onSelect).toHaveBeenNthCalledWith(2, worn);
    });
});

describe('renderLeaderStats', () => {
    const stats = { name: 'Kael Raizférrea', lines: [ { id: 'clickDamage', text: 'Dano de clique: 1.0' }, { id: 'critChance', text: 'Chance de crítico: 10%' } ] };

    it('is titled Atributos de <nome> and shows one line per attribute in order', () => {
        const panel = renderLeaderStats(stats);

        expect(panel.getAttribute('data-testid')).toBe('leader-stats');
        expect(panel.querySelector('.leader-stats-title').textContent).toBe('Atributos de Kael Raizférrea');
        expect([ ...panel.querySelectorAll('.stat-line') ].map((line) => line.textContent)).toEqual([ 'Dano de clique: 1.0', 'Chance de crítico: 10%' ]);
        expect(text(panel, 'stat-clickDamage')).toBe('Dano de clique: 1.0');
    });

    it('shows above the slots and the bag in the screen', () => {
        const screen = renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), stats });

        expect(screen.firstElementChild.getAttribute('data-testid')).toBe('leader-stats');
        expect(screen.querySelector('[data-testid="equip-hero-kael"]')).not.toBeNull();
    });

    it('shows with the empty text when there is no piece yet', () => {
        const screen = renderEquipment([], heroes, { onSelect: vi.fn(), stats });

        expect(screen.querySelector('[data-testid="leader-stats"]')).not.toBeNull();
        expect(text(screen, 'equipment-empty')).toBe('Nenhum equipamento ainda. Vença chefes para encontrar peças.');
    });

    it('shows no panel without a leader', () => {
        expect(renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), stats: null }).querySelector('[data-testid="leader-stats"]')).toBeNull();
    });
});

describe('renderEquipment tiles and tooltip', () => {
    const enter = (node) => node.dispatchEvent(new Event('pointerenter'));
    const leave = (node) => node.dispatchEvent(new Event('pointerleave'));
    const tile = (screen, id) => screen.querySelector(`[data-testid="${id}"]`);

    it('shows each bag piece as a tile with the class and the attributes of its rarity, in a grid', () => {
        const screen = renderEquipment([ ring(), weapon({ id: 'w2' }) ], heroes, { onSelect: vi.fn() });

        expect(screen.querySelector('[data-testid="equipment-bag"]').classList.contains('bag-grid')).toBe(true);
        expect(tile(screen, 'equip-piece-r1').getAttribute('data-rarity')).toBe('COMMON');
        expect(tile(screen, 'equip-piece-w2').classList.contains('rarity-rare')).toBe(true);
    });

    it('shows the tooltip of a bag tile on hover: title, weapon line, affixes and Na mochila, with no button', () => {
        const screen = renderEquipment([ weapon({ id: 'w2' }) ], heroes, { onSelect: vi.fn() });

        enter(tile(screen, 'equip-piece-w2'));

        const tooltip = screen.querySelector('[data-testid="piece-tooltip"]');

        expect(tooltip.querySelector('.piece-tooltip-title').textContent).toBe('Raro Arma +3');
        expect([ ...tooltip.querySelectorAll('.piece-tooltip-line') ].map((line) => line.textContent)).toEqual([ 'Dano de clique: 5.2', 'Dano crítico +27%', 'Tempo extra de chefe +2s' ]);
        expect(tooltip.querySelector('.piece-tooltip-worn').textContent).toBe('Na mochila');
        expect(tooltip.querySelector('button')).toBeNull();
    });

    it('names the hero in the tooltip of a worn tile: Equipado em Hero kael', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }) ], heroes, { onSelect: vi.fn() });

        enter(tile(screen, 'equip-slot-kael-WEAPON'));

        expect(screen.querySelector('.piece-tooltip-worn').textContent).toBe('Equipado em Hero kael');
    });

    it('has no weapon line for a ring: only its affix lines', () => {
        const screen = renderEquipment([ ring() ], heroes, { onSelect: vi.fn() });

        enter(tile(screen, 'equip-piece-r1'));

        expect([ ...screen.querySelectorAll('.piece-tooltip-line') ].map((line) => line.textContent)).toEqual([ 'Dano de clique +7%' ]);
    });

    it('hides the tooltip when the pointer leaves the tile', () => {
        const screen = renderEquipment([ ring() ], heroes, { onSelect: vi.fn() });

        enter(tile(screen, 'equip-piece-r1'));
        leave(tile(screen, 'equip-piece-r1'));

        expect(screen.querySelector('[data-testid="piece-tooltip"]')).toBeNull();
    });

    it('opens the actions only on a click, not on hover', () => {
        const onSelect = vi.fn();
        const screen = renderEquipment([ ring() ], heroes, { onSelect });

        enter(tile(screen, 'equip-piece-r1'));
        expect(onSelect).not.toHaveBeenCalled();

        tile(screen, 'equip-piece-r1').click();
        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('shows a worn tile with its tooltip and a dashed empty tile without one', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }) ], heroes, { onSelect: vi.fn() });

        enter(tile(screen, 'equip-slot-kael-RING'));

        expect(screen.querySelector('[data-testid="piece-tooltip"]')).toBeNull();
    });

    it('keeps the slot names above the tiles of every hero', () => {
        const screen = renderEquipment([ ring() ], heroes, { onSelect: vi.fn() });

        expect([ ...screen.querySelectorAll('[data-testid="equip-hero-kael"] .equip-slot-name') ].map((name) => name.textContent)).toEqual([ 'Arma', 'Armadura', 'Anel', 'Amuleto' ]);
    });
});

describe('renderEquipment transfer', () => {
    const owned = [ hero('kael'), hero('lyra'), hero('orina') ];
    const find = (screen, id) => screen.querySelector(`[data-testid="${id}"]`);

    it('shows Transferir conjunto only for a hero that wears a piece', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }) ], owned, { onSelect: vi.fn(), onTransfer: vi.fn() });

        expect(find(screen, 'equip-transfer-kael').textContent).toBe('Transferir conjunto');
        expect(find(screen, 'equip-transfer-lyra')).toBeNull();
        expect(find(screen, 'equip-transfer-orina')).toBeNull();
    });

    it('shows no button when only one hero is owned', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }) ], [ hero('kael'), hero('vex', false) ], { onSelect: vi.fn(), onTransfer: vi.fn() });

        expect(find(screen, 'equip-transfer-kael')).toBeNull();
    });

    it('offers Para <nome> for every other owned hero when the button is clicked, and not for the source', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }) ], owned, { onSelect: vi.fn(), onTransfer: vi.fn() });

        find(screen, 'equip-transfer-kael').click();

        expect(find(screen, 'equip-transfer-kael-to-lyra').textContent).toBe('Para Hero lyra');
        expect(find(screen, 'equip-transfer-kael-to-orina').textContent).toBe('Para Hero orina');
        expect(find(screen, 'equip-transfer-kael-to-kael')).toBeNull();
        expect(find(screen, 'equip-transfer-kael')).toBeNull();
    });

    it('offers no target that is not owned', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }) ], [ ...owned, hero('vex', false) ], { onSelect: vi.fn(), onTransfer: vi.fn() });

        find(screen, 'equip-transfer-kael').click();

        expect(find(screen, 'equip-transfer-kael-to-vex')).toBeNull();
    });

    it('calls onTransfer with the source and the picked target', () => {
        const onTransfer = vi.fn();
        const screen = renderEquipment([ weapon({ heroId: 'kael' }) ], owned, { onSelect: vi.fn(), onTransfer });

        find(screen, 'equip-transfer-kael').click();
        find(screen, 'equip-transfer-kael-to-orina').click();

        expect(onTransfer).toHaveBeenCalledTimes(1);
        expect(onTransfer).toHaveBeenCalledWith('kael', 'orina');
    });

    it('shows the notice at the top', () => {
        const screen = renderEquipment([ ring() ], owned, { onSelect: vi.fn(), notice: 'Conjunto transferido para Hero lyra' });

        expect(find(screen, 'equip-transfer-notice').textContent).toBe('Conjunto transferido para Hero lyra');
    });

    it('shows no notice by default', () => {
        expect(find(renderEquipment([ ring() ], owned, { onSelect: vi.fn() }), 'equip-transfer-notice')).toBeNull();
    });

    it('disables every button while a request runs', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }), ring() ], owned, { onSelect: vi.fn(), onTransfer: vi.fn(), busy: true });

        expect([ ...screen.querySelectorAll('button') ].every((node) => node.disabled)).toBe(true);
    });

    it('leaves the buttons enabled when nothing runs', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }), ring() ], owned, { onSelect: vi.fn(), onTransfer: vi.fn() });

        expect(find(screen, 'equip-transfer-kael').disabled).toBe(false);
        expect(find(screen, 'equip-piece-r1').disabled).toBe(false);
    });
});

describe('renderEquipment selection mode', () => {
    const selecting = (ids = [], extra = {}) => ({
        ids: new Set(ids), confirming: false, onToggle: vi.fn(), onRarity: vi.fn(), onSubmit: vi.fn(), onCancel: vi.fn(), onConfirm: vi.fn(), onDecline: vi.fn(), ...extra
    });
    const find = (screen, id) => screen.querySelector(`[data-testid="${id}"]`);

    it('shows Vender várias in the bag header when the bag holds a piece and calls onStartSelling', () => {
        const onStartSelling = vi.fn();
        const start = find(renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), onStartSelling }), 'bulk-sell-start');

        expect(start.textContent).toBe('Vender várias');
        expect(start.parentElement.classList.contains('bag-header')).toBe(true);

        start.click();

        expect(onStartSelling).toHaveBeenCalledTimes(1);
    });

    it('shows no Vender várias when every piece is worn', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }) ], heroes, { onSelect: vi.fn() });

        expect(find(screen, 'bulk-sell-start')).toBeNull();
        expect(screen.querySelector('.equip-bag-title').textContent).toBe('Mochila (0)');
    });

    it('shows the bar and hides Vender várias in selection mode', () => {
        const screen = renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), selection: selecting() });

        expect(find(screen, 'bulk-sell-bar')).not.toBeNull();
        expect(find(screen, 'bulk-sell-start')).toBeNull();
        expect(find(screen, 'bulk-sell-summary').textContent).toBe('Selecionadas: 0 · Total: 0 cobre');
    });

    it('a click on a bag tile calls onToggle and not onSelect', () => {
        const onSelect = vi.fn();
        const selection = selecting();

        find(renderEquipment([ ring() ], heroes, { onSelect, selection }), 'equip-piece-r1').click();

        expect(selection.onToggle).toHaveBeenCalledTimes(1);
        expect(selection.onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }));
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('marks a selected tile with is-selected, aria-pressed and a check mark', () => {
        const screen = renderEquipment([ ring(), ring({ id: 'r2' }) ], heroes, { onSelect: vi.fn(), selection: selecting([ 'r1' ]) });
        const selected = find(screen, 'equip-piece-r1');
        const other = find(screen, 'equip-piece-r2');

        expect(selected.classList.contains('is-selected')).toBe(true);
        expect(selected.getAttribute('aria-pressed')).toBe('true');
        expect(selected.querySelector('.piece-check').textContent).toBe('✓');
        expect(other.getAttribute('aria-pressed')).toBe('false');
        expect(other.classList.contains('is-selected')).toBe(false);
        expect(other.querySelector('.piece-check')).toBeNull();
    });

    it('tiles carry no aria-pressed outside selection mode', () => {
        expect(find(renderEquipment([ ring() ], heroes, { onSelect: vi.fn() }), 'equip-piece-r1').getAttribute('aria-pressed')).toBeNull();
    });

    it('sums only the selected bag pieces in the summary', () => {
        const screen = renderEquipment([ ring(), ring({ id: 'r2' }), weapon({ id: 'w2' }) ], heroes, { onSelect: vi.fn(), selection: selecting([ 'r1', 'w2' ]) });

        expect(find(screen, 'bulk-sell-summary').textContent).toBe('Selecionadas: 2 · Total: 8 prata 50 cobre');
    });

    it('disables the worn tiles and hides Transferir conjunto in selection mode', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }), ring() ], [ hero('kael'), hero('lyra') ], { onSelect: vi.fn(), onTransfer: vi.fn(), selection: selecting() });
        const worn = find(screen, 'equip-slot-kael-WEAPON');

        expect(worn.disabled).toBe(true);
        expect(worn.classList.contains('is-locked')).toBe(true);
        expect(find(screen, 'equip-transfer-kael')).toBeNull();
    });

    it('hides the tooltip on hover in selection mode, for a bag tile and for a worn tile', () => {
        const screen = renderEquipment([ weapon({ heroId: 'kael' }), ring() ], [ hero('kael'), hero('lyra') ], { onSelect: vi.fn(), selection: selecting() });

        find(screen, 'equip-piece-r1').dispatchEvent(new Event('pointerenter'));
        expect(find(screen, 'piece-tooltip')).toBeNull();

        find(screen, 'equip-slot-kael-WEAPON').dispatchEvent(new Event('pointerenter'));
        expect(find(screen, 'piece-tooltip')).toBeNull();
    });

    it('passes the state of each rarity to the bar', () => {
        const screen = renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), selection: selecting([ 'r1' ]) });

        expect(find(screen, 'bulk-sell-rarity-COMMON').getAttribute('aria-pressed')).toBe('true');
        expect(find(screen, 'bulk-sell-rarity-LEGENDARY').disabled).toBe(true);
    });

    it('disables the bag tiles and shows the question while confirming', () => {
        const screen = renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), selection: selecting([ 'r1' ], { confirming: true }) });

        expect(find(screen, 'equip-piece-r1').disabled).toBe(true);
        expect(find(screen, 'bulk-sell-question').textContent).toBe('Vender 1 peça por 1 prata?');
    });

    it('shows the sell notice at the top', () => {
        const screen = renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), sellNotice: '2 peças vendidas por 3 prata', stats: { name: 'Kael', lines: [] } });

        expect(find(screen, 'equip-sell-notice').textContent).toBe('2 peças vendidas por 3 prata');
        expect(screen.firstElementChild.getAttribute('data-testid')).toBe('equip-sell-notice');
    });

    it('shows the sell notice with the empty text when no piece is left', () => {
        const screen = renderEquipment([], heroes, { onSelect: vi.fn(), sellNotice: '1 peça vendida por 1 prata' });

        expect(find(screen, 'equip-sell-notice').textContent).toBe('1 peça vendida por 1 prata');
        expect(find(screen, 'equipment-empty').textContent).toBe('Nenhum equipamento ainda. Vença chefes para encontrar peças.');
    });

    it('disables the bar buttons while a request runs', () => {
        const screen = renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), selection: selecting([ 'r1' ]), busy: true });

        expect([ ...screen.querySelectorAll('button') ].every((node) => node.disabled)).toBe(true);
    });
});

describe('renderEquipmentUnavailable', () => {
    it('says the equipment is unavailable', () => {
        const node = renderEquipmentUnavailable();

        expect(node.textContent).toBe('Equipamento indisponível');
        expect(UNAVAILABLE_TEXT).toBe('Equipamento indisponível');
    });
});

describe('renderPieceDetail', () => {
    const actions = () => ({ onEquip: vi.fn(), onUnequip: vi.fn(), onRefine: vi.fn(), onReroll: vi.fn(), onSell: vi.fn() });
    const detail = (piece, wallet = 1_000_000, handlers = actions()) => renderPieceDetail(piece, heroes, wallet, handlers);

    it('shows a weapon with its click damage and its affixes', () => {
        const view = detail(weapon());

        expect(view.querySelector('.hero-name').textContent).toBe('Raro Arma +3');
        expect(text(view, 'piece-line-0')).toBe('Dano de clique: 5.2');
        expect(text(view, 'piece-line-1')).toBe('Dano crítico +27%');
        expect(text(view, 'piece-line-2')).toBe('Tempo extra de chefe +2s');
    });

    it('shows a piece that is not a weapon with its affixes only', () => {
        const view = detail(ring());

        expect(text(view, 'piece-line-0')).toBe('Dano de clique +7%');
        expect(view.querySelector('[data-testid="piece-line-1"]')).toBeNull();
    });

    it('says where the piece is', () => {
        expect(text(detail(ring()), 'piece-worn')).toBe('Na mochila');
        expect(text(detail(ring({ heroId: 'kael' })), 'piece-worn')).toBe('Equipado em Hero kael');
    });

    it('offers to equip the piece on every owned hero and on none that is not owned', () => {
        const view = detail(ring());

        expect(view.querySelector('[data-testid="piece-equip-kael"]').textContent).toBe('Equipar em Hero kael');
        expect(view.querySelector('[data-testid="piece-equip-lyra"]')).not.toBeNull();
        expect(view.querySelector('[data-testid="piece-equip-vex"]')).toBeNull();
        expect(view.querySelector('[data-testid="piece-unequip"]')).toBeNull();
    });

    it('offers Remover and not Equipar for the hero wearing the piece', () => {
        const view = detail(ring({ heroId: 'kael' }));

        expect(text(view, 'piece-unequip')).toBe('Remover');
        expect(view.querySelector('[data-testid="piece-equip-kael"]')).toBeNull();
        expect(view.querySelector('[data-testid="piece-equip-lyra"]')).not.toBeNull();
    });

    it('calls the matching action when a button is clicked', () => {
        const handlers = actions();
        const view = detail(weapon({ refine: 5, rerollCost: 5000, refineCost: 100 }), 1_000_000, handlers);

        view.querySelector('[data-testid="piece-equip-lyra"]').click();
        view.querySelector('[data-testid="piece-refine"]').click();
        view.querySelector('[data-testid="piece-reroll-1"]').click();
        view.querySelector('[data-testid="piece-sell"]').click();

        expect(handlers.onEquip).toHaveBeenCalledWith('lyra');
        expect(handlers.onRefine).toHaveBeenCalledTimes(1);
        expect(handlers.onReroll).toHaveBeenCalledWith(1);
        expect(handlers.onSell).toHaveBeenCalledTimes(1);
    });

    it('calls onUnequip from Remover', () => {
        const handlers = actions();

        detail(ring({ heroId: 'kael' }), 0, handlers).querySelector('[data-testid="piece-unequip"]').click();

        expect(handlers.onUnequip).toHaveBeenCalledTimes(1);
    });

    it('shows the next refine cost in gold, silver and copper', () => {
        expect(text(detail(weapon({ refineCost: 10203 })), 'piece-refine')).toBe('Refinar (1 ouro 2 prata 3 cobre)');
        expect(text(detail(ring()), 'piece-refine')).toBe('Refinar (5 prata)');
    });

    it('disables Refinar while the wallet holds less than the cost and enables it at the cost', () => {
        expect(detail(ring(), 499).querySelector('[data-testid="piece-refine"]').disabled).toBe(true);
        expect(detail(ring(), 500).querySelector('[data-testid="piece-refine"]').disabled).toBe(false);
    });

    it('does not call onRefine from a disabled button', () => {
        const handlers = actions();

        detail(ring(), 0, handlers).querySelector('[data-testid="piece-refine"]').click();

        expect(handlers.onRefine).not.toHaveBeenCalled();
    });

    it('has no Refinar at plus 10 and says the refine is at its maximum', () => {
        const view = detail(weapon({ refine: 10, refineCost: null }));

        expect(view.querySelector('[data-testid="piece-refine"]')).toBeNull();
        expect(text(view, 'piece-max-refine')).toBe('Refino máximo');
    });

    it('has no Rerrolar below plus 5', () => {
        expect(detail(weapon({ refine: 4, rerollCost: null })).querySelector('[data-testid="piece-reroll-0"]')).toBeNull();
    });

    it('gives each affix a Rerrolar with the cost from plus 5', () => {
        const view = detail(weapon({ refine: 5, rerollCost: 5000 }));

        expect(text(view, 'piece-reroll-0')).toBe('Rerrolar Dano crítico +27% (50 prata)');
        expect(text(view, 'piece-reroll-1')).toBe('Rerrolar Tempo extra de chefe +2s (50 prata)');
        expect(view.querySelector('[data-testid="piece-reroll-2"]')).toBeNull();
    });

    it('disables Rerrolar while the wallet holds less than 5000 copper', () => {
        const piece = weapon({ refine: 5, rerollCost: 5000 });

        expect(detail(piece, 4999).querySelector('[data-testid="piece-reroll-0"]').disabled).toBe(true);
        expect(detail(piece, 5000).querySelector('[data-testid="piece-reroll-0"]').disabled).toBe(false);
    });

    it('shows the sell price on Vender', () => {
        expect(text(detail(weapon()), 'piece-sell')).toBe('Vender (7 prata 50 cobre)');
        expect(text(detail(ring()), 'piece-sell')).toBe('Vender (1 prata)');
    });
});
