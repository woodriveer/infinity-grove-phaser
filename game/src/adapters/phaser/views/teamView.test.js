import { describe, expect, it, vi } from 'vitest';
import { renderTeam, teamModel } from './teamView';

const IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const NAMES = { kael: 'Kael', lyra: 'Lyra', orina: 'Orina', seraphine: 'Seraphine', vex: 'Vex' };
const PRICES = [ 10000, 20000, 30000, 40000 ];
const ACTIVE = { chapter: 5, completed: false };

const heroes = (overrides = {}) => IDS.map((id) => ({ id, name: NAMES[id], stars: 0, owned: true, leaderBonus: 'Bonus', ...(overrides[id] ?? {}) }));
const teamOf = (overrides = {}) => ({ unlocked: true, openSlots: 2, boughtSlots: 1, slotPrices: PRICES, allies: [ 'lyra', null, null, null ], ...overrides });
const modelOf = (overrides = {}) => teamModel({ team: teamOf(), heroes: heroes(), leaderId: 'kael', position: ACTIVE, ...overrides });
const handlersOf = () => ({ onSlot: vi.fn(), onPick: vi.fn(), onRemove: vi.fn(), onMakeLeader: vi.fn(), onConfirmBuy: vi.fn(), onCancelBuy: vi.fn() });
const screenOf = (overrides = {}, handlers = handlersOf()) => renderTeam(modelOf(overrides), handlers);
const byId = (node, id) => node.querySelector(`[data-testid="${id}"]`);
const cardText = (node, id, selector) => byId(node, id).querySelector(selector)?.textContent;

describe('teamModel', () => {
    it('the model of a team with Lyra in slot 1 and slot 2 buyable', () => {
        const model = modelOf();

        expect(model.slots[0]).toMatchObject({ slot: 1, state: 'filled', dpsText: 'Dano: 2/s', passiveLine: 'Olho do Falcão: +10 de chance de crítico' });
        expect(model.slots[1]).toMatchObject({ slot: 2, state: 'buyable', priceGold: 2 });
        expect(model.slots[2]).toMatchObject({ slot: 3, state: 'locked', chapter: 7 });
        expect(model.teamDpsText).toBe('Dano da equipe: 2/s');
        expect(model.leader).toMatchObject({ id: 'kael', name: 'Kael', bonusText: 'Bonus (em breve)' });
    });

    it('Seraphine raises every shown damage by 1.25', () => {
        const model = modelOf({ team: teamOf({ openSlots: 2, boughtSlots: 2, allies: [ 'lyra', 'seraphine', null, null ] }) });

        expect([ model.slots[0].dpsText, model.slots[1].dpsText ]).toEqual([ 'Dano: 2.5/s', 'Dano: 2.5/s' ]);
        expect(model.teamDpsText).toBe('Dano da equipe: 5/s');
    });

    it('the shown damage of a 9 star Lyra with a 624 click weapon reads 12.5K', () => {
        const pieces = [ { id: 'w', slot: 'WEAPON', clickDamage: 624, affixes: [], heroId: 'lyra' } ];
        const model = modelOf({ heroes: heroes({ lyra: { stars: 9 } }), pieces });

        expect(model.slots[0].dpsText).toBe('Dano: 12.5K/s');
    });

    it('no ally reads Dano da equipe: 0/s', () => {
        expect(modelOf({ team: teamOf({ boughtSlots: 0, allies: [ null, null, null, null ] }) }).teamDpsText).toBe('Dano da equipe: 0/s');
    });

    it('canPick is true with an empty bought slot and false when every bought slot is full and none is selected', () => {
        const empty = teamOf({ openSlots: 2, boughtSlots: 2, allies: [ 'lyra', null, null, null ] });

        expect(modelOf({ team: empty }).canPick).toBe(true);
        expect(modelOf({ team: teamOf() }).canPick).toBe(false);
    });

    it('canPick is true with a filled slot selected', () => {
        expect(modelOf({ selected: 1 }).canPick).toBe(true);
    });

    it('canAct is true only with a filled slot selected and no request running', () => {
        const team = teamOf({ openSlots: 2, boughtSlots: 2, allies: [ 'lyra', null, null, null ] });

        expect(modelOf({ team, selected: 1 }).canAct).toBe(true);
        expect(modelOf({ team, selected: 2 }).canAct).toBe(false);
        expect(modelOf({ team, selected: 1, busy: true }).canAct).toBe(false);
        expect(modelOf({ team }).canAct).toBe(false);
    });

    it('asking reads the price and whether the wallet pays it', () => {
        const team = teamOf({ openSlots: 1, boughtSlots: 0, allies: [ null, null, null, null ] });

        expect(modelOf({ team, asking: 1, walletCopper: 9999 }).asking).toEqual({ slot: 1, priceGold: 1, affordable: false });
        expect(modelOf({ team, asking: 1, walletCopper: 10000 }).asking).toEqual({ slot: 1, priceGold: 1, affordable: true });
        expect(modelOf({ team }).asking).toBeNull();
    });
});

describe('renderTeam', () => {
    it('the screen shows the leader card with its label, name, stars and bonus', () => {
        const screen = screenOf();
        const card = byId(screen, 'team-slot-0');

        expect(card.getAttribute('data-state')).toBe('leader');
        expect(cardText(screen, 'team-slot-0', '.team-slot-label')).toBe('Líder');
        expect(cardText(screen, 'team-slot-0', '.team-name')).toBe('Kael');
        expect(cardText(screen, 'team-slot-0', '.team-stars')).toBe('0★');
        expect(cardText(screen, 'team-slot-0', '.team-bonus')).toBe('Bonus (em breve)');
        expect(card.querySelector('img.team-portrait').getAttribute('src')).toBe('assets/heroes/kael_sprite.png');
    });

    it('the screen shows a filled ally card with its damage and passive', () => {
        const screen = screenOf();

        expect(byId(screen, 'team-slot-1').getAttribute('data-state')).toBe('filled');
        expect(cardText(screen, 'team-slot-1', '.team-slot-label')).toBe('Aliado 1');
        expect(cardText(screen, 'team-slot-1', '.team-dps-line')).toBe('Dano: 2/s');
        expect(cardText(screen, 'team-slot-1', '.team-passive')).toBe('Olho do Falcão: +10 de chance de crítico');
    });

    it('an empty bought slot shows vazio', () => {
        const screen = screenOf({ team: teamOf({ openSlots: 2, boughtSlots: 2, allies: [ 'lyra', null, null, null ] }) });

        expect(byId(screen, 'team-slot-2').getAttribute('data-state')).toBe('empty');
        expect(cardText(screen, 'team-slot-2', '.team-empty')).toBe('vazio');
    });

    it('a buyable slot shows the coin and the price and is enabled', () => {
        const screen = screenOf();

        expect(byId(screen, 'team-slot-2').getAttribute('data-state')).toBe('buyable');
        expect(byId(screen, 'team-slot-2').querySelector('.team-coin')).not.toBeNull();
        expect(cardText(screen, 'team-slot-2', '.team-price')).toBe('2');
        expect(byId(screen, 'team-slot-2').disabled).toBe(false);
    });

    it('a locked slot shows Chefe do capítulo 7 and is disabled', () => {
        const screen = screenOf();

        expect(byId(screen, 'team-slot-3').getAttribute('data-state')).toBe('locked');
        expect(cardText(screen, 'team-slot-3', '.team-lock-text')).toBe('Chefe do capítulo 7');
        expect(byId(screen, 'team-slot-3').disabled).toBe(true);
    });

    it('a waiting slot shows the coin and the price without a chapter and is disabled', () => {
        const screen = screenOf({ team: teamOf({ openSlots: 3, boughtSlots: 0, allies: [ null, null, null, null ] }) });
        const card = byId(screen, 'team-slot-2');

        expect(card.getAttribute('data-state')).toBe('waiting');
        expect(card.querySelector('.team-coin')).not.toBeNull();
        expect(card.querySelector('.team-price').textContent).toBe('2');
        expect(card.querySelector('.team-lock-text')).toBeNull();
        expect(card.disabled).toBe(true);
    });

    it('the selected slot carries data-selected true and the others false', () => {
        const screen = screenOf({ selected: 1 });

        expect([ 0, 1, 2, 3, 4 ].map((slot) => byId(screen, `team-slot-${slot}`).getAttribute('data-selected'))).toEqual([ 'false', 'true', 'false', 'false', 'false' ]);
    });

    it('the slot just bought carries data-flash true', () => {
        const screen = screenOf({ flashSlot: 2 });

        expect(byId(screen, 'team-slot-2').getAttribute('data-flash')).toBe('true');
        expect(byId(screen, 'team-slot-1').hasAttribute('data-flash')).toBe(false);
    });

    it('a click on a slot calls onSlot with its number', () => {
        const handlers = handlersOf();
        const screen = screenOf({}, handlers);

        byId(screen, 'team-slot-2').click();

        expect(handlers.onSlot).toHaveBeenCalledWith(2);
    });

    it('the status line shows only while the team is inactive', () => {
        const inactive = byId(screenOf({ position: { chapter: 4, completed: false } }), 'team-status');
        const active = byId(screenOf({ position: { chapter: 5, completed: false } }), 'team-status');

        expect(inactive.textContent).toBe('A equipe luta a partir do capítulo 5.');
        expect(inactive.hidden).toBe(false);
        expect(active.hidden).toBe(true);
    });

    it('the notice shows its text and hides without one', () => {
        const shown = byId(screenOf({ notice: 'Vaga de aliado comprada!' }), 'team-notice');
        const none = byId(screenOf({ notice: null }), 'team-notice');

        expect(shown.textContent).toBe('Vaga de aliado comprada!');
        expect(shown.hidden).toBe(false);
        expect(none.hidden).toBe(true);
    });

    it('the dialog asks Comprar a vaga 1 por 1 ouro? with Comprar and Cancelar', () => {
        const handlers = handlersOf();
        const team = teamOf({ openSlots: 1, boughtSlots: 0, allies: [ null, null, null, null ] });
        const screen = screenOf({ team, asking: 1, walletCopper: 10000 }, handlers);

        expect(byId(screen, 'team-buy-question').textContent).toBe('Comprar a vaga 1 por 1 ouro?');
        expect(byId(screen, 'team-buy-confirm').textContent).toBe('Comprar');
        expect(byId(screen, 'team-buy-confirm').disabled).toBe(false);
        expect(byId(screen, 'team-buy-cancel').textContent).toBe('Cancelar');
        expect(screen.querySelector('.team-buy-short')).toBeNull();

        byId(screen, 'team-buy-confirm').click();
        byId(screen, 'team-buy-cancel').click();

        expect(handlers.onConfirmBuy).toHaveBeenCalledTimes(1);
        expect(handlers.onCancelBuy).toHaveBeenCalledTimes(1);
    });

    it('a dialog the wallet does not pay disables Comprar and shows Moedas insuficientes', () => {
        const team = teamOf({ openSlots: 1, boughtSlots: 0, allies: [ null, null, null, null ] });
        const screen = screenOf({ team, asking: 1, walletCopper: 9999 });

        expect(byId(screen, 'team-buy-confirm').disabled).toBe(true);
        expect(byId(screen, 'team-buy-cancel').disabled).toBe(false);
        expect(screen.querySelector('.team-buy-short').textContent).toBe('Moedas insuficientes');
    });

    it('there is no dialog without asking', () => {
        expect(byId(screenOf(), 'team-buy-dialog')).toBeNull();
    });

    it('Remover and Tornar líder are disabled unless a filled slot is selected and call their handlers', () => {
        const idle = screenOf();

        expect(byId(idle, 'team-remove').disabled).toBe(true);
        expect(byId(idle, 'team-make-leader').disabled).toBe(true);
        expect(byId(idle, 'team-remove').textContent).toBe('Remover');
        expect(byId(idle, 'team-make-leader').textContent).toBe('Tornar líder');

        const handlers = handlersOf();
        const selected = screenOf({ selected: 1 }, handlers);

        expect(byId(selected, 'team-remove').disabled).toBe(false);
        expect(byId(selected, 'team-make-leader').disabled).toBe(false);

        byId(selected, 'team-remove').click();
        byId(selected, 'team-make-leader').click();

        expect(handlers.onRemove).toHaveBeenCalledTimes(1);
        expect(handlers.onMakeLeader).toHaveBeenCalledTimes(1);
    });

    it('the available heroes list the owned heroes outside the team', () => {
        const handlers = handlersOf();
        const screen = screenOf({ heroes: heroes({ seraphine: { owned: false } }), team: teamOf({ openSlots: 2, boughtSlots: 2, allies: [ 'lyra', null, null, null ] }) }, handlers);
        const ids = [ ...byId(screen, 'team-available').querySelectorAll('.team-hero') ].map((entry) => entry.getAttribute('data-testid'));

        expect(ids).toEqual([ 'team-available-orina', 'team-available-vex' ]);
        expect(cardText(screen, 'team-available-orina', '.team-hero-name')).toBe('Orina');
        expect(cardText(screen, 'team-available-orina', '.team-hero-stars')).toBe('0★');
        expect(cardText(screen, 'team-available-orina', '.team-hero-passive')).toBe('Erosão Arcana');
        expect(cardText(screen, 'team-available-vex', '.team-hero-passive')).toBe('Lâminas Sombrias');

        byId(screen, 'team-available-orina').click();

        expect(handlers.onPick).toHaveBeenCalledWith('orina');
    });

    it('an empty available list says Todos os heróis estão na equipe.', () => {
        const team = teamOf({ openSlots: 4, boughtSlots: 4, allies: [ 'lyra', 'orina', 'seraphine', 'vex' ] });
        const screen = screenOf({ team });

        expect(screen.querySelector('.team-available-empty').textContent).toBe('Todos os heróis estão na equipe.');
        expect(screen.querySelectorAll('.team-hero')).toHaveLength(0);
    });

    it('a running request disables every slot, entry and action', () => {
        const team = teamOf({ openSlots: 3, boughtSlots: 2, allies: [ 'lyra', null, null, null ] });
        const screen = screenOf({ team, busy: true, selected: 1, asking: 3, walletCopper: 100000 });
        const buttons = [ ...screen.querySelectorAll('button') ];

        expect(buttons.length).toBeGreaterThan(0);
        expect(buttons.every((button) => button.disabled)).toBe(true);
    });

    it('the blocks come in the order of the spec', () => {
        const classes = (screen) => [ ...screen.children ].map((child) => child.className);

        expect(classes(screenOf())).toEqual([ 'team-status', 'team-notice', 'team-dps', 'team-slots', 'team-actions', 'team-available-title', 'team-available' ]);

        const team = teamOf({ openSlots: 1, boughtSlots: 0, allies: [ null, null, null, null ] });

        expect(classes(screenOf({ team, asking: 1 }))).toEqual([
            'team-status', 'team-notice', 'team-dps', 'team-slots', 'team-buy-dialog', 'team-actions', 'team-available-title', 'team-available'
        ]);
    });
});
