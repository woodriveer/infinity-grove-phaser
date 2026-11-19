import { allyDamagePerSecond } from '../../../domain/combat/allyAttacker';
import { formatDamage } from '../../../domain/combat/damage';
import { wornBy } from '../../../domain/equipment/equipment';
import { leaderBonusText } from '../../../domain/heroes/leaderBonus';
import { activePassives, availableHeroes, passiveLine, passiveOf, slotStates, teamActive } from '../../../domain/heroes/team';
import { el, sprite, starsText } from './dom';

export const TEAM_INACTIVE_TEXT = 'A equipe luta a partir do capítulo 5.';

//  The model of the Equipe screen (spec hero-team). `selected` is the selected ally slot or null; `asking` the slot of the purchase
//  dialog or null; `notice` a text or null; `flashSlot` the slot just bought or null; `walletCopper` the copper the player holds.
//  Returns { leader: { id, name, stars, bonusText } | null, slots: [ { slot, state, hero, dpsText, passiveLine, priceGold, chapter } ],
//  selected, available: [ { id, name, stars, passiveName } ], teamDpsText, active, busy, canPick, canAct,
//  asking: { slot, priceGold, affordable } | null, notice, flashSlot }
export const teamModel = ({ team, heroes, leaderId, pieces = [], position, selected = null, busy = false, asking = null, notice = null, flashSlot = null, walletCopper = 0 }) =>
{
    const leaderHero = heroes.find((hero) => hero.id === leaderId);
    const { allyFactor } = activePassives({ team, heroes, leaderId, position });
    let teamDps = 0;

    const slots = slotStates(team).map((state) =>
    {
        const hero = state.state === 'filled' ? heroes.find((candidate) => candidate.id === state.heroId) : undefined;

        //  A hero the catalog does not list cannot be shown: the slot reads as empty
        if (state.state === 'filled' && !hero)
        {
            return { ...state, state: 'empty', heroId: null, hero: null, dpsText: '', passiveLine: '' };
        }

        if (!hero)
        {
            return { ...state, hero: null, dpsText: '', passiveLine: '' };
        }

        const damage = allyDamagePerSecond({ ally: hero, pieces: wornBy(pieces, hero.id), allyFactor });

        teamDps += damage;

        return { ...state, hero, dpsText: `Dano: ${formatDamage(damage)}/s`, passiveLine: passiveLine(hero.id) };
    });
    const selectedState = selected ? slots[selected - 1]?.state : null;
    const slotAsked = asking ? slots[asking - 1] : null;

    return {
        leader: leaderHero ? { id: leaderHero.id, name: leaderHero.name, stars: leaderHero.stars, bonusText: leaderBonusText(leaderHero) } : null,
        slots,
        selected,
        available: availableHeroes({ team, heroes, leaderId }).map((hero) => ({
            id: hero.id, name: hero.name, stars: hero.stars, passiveName: passiveOf(hero.id)?.name ?? ''
        })),
        teamDpsText: `Dano da equipe: ${formatDamage(teamDps)}/s`,
        active: teamActive(position),
        busy,
        canPick: !busy && (selectedState === 'filled' || selectedState === 'empty' || slots.some(({ state }) => state === 'empty')),
        canAct: !busy && selectedState === 'filled',
        asking: slotAsked ? { slot: asking, priceGold: slotAsked.priceGold, affordable: walletCopper >= team.slotPrices[asking - 1] } : null,
        notice,
        flashSlot
    };
};

//  The card of the leader: label, sprite, name, stars and the leader bonus
const renderLeaderCard = (leader) =>
{
    const card = el('div', 'team-slot', '', { testid: 'team-slot-0', 'data-state': 'leader', 'data-selected': 'false' });

    card.append(el('span', 'team-slot-label', 'Líder'));

    if (leader)
    {
        card.append(
            sprite(leader.id, leader.name, 'team-portrait'),
            el('span', 'team-name', leader.name),
            el('span', 'team-stars', starsText(leader.stars)),
            el('span', 'team-bonus', leader.bonusText)
        );
    }

    return card;
};

//  The card of an ally slot: a button that selects it, buys it or does nothing by its state
const renderSlotCard = (slot, model, { onSlot }) =>
{
    const attributes = {
        type: 'button', testid: `team-slot-${slot.slot}`, 'data-state': slot.state, 'data-selected': String(model.selected === slot.slot)
    };

    if (model.flashSlot === slot.slot)
    {
        attributes['data-flash'] = 'true';
    }

    const card = el('button', 'team-slot', '', attributes);

    card.append(el('span', 'team-slot-label', `Aliado ${slot.slot}`));

    if (slot.state === 'filled')
    {
        card.append(
            sprite(slot.hero.id, slot.hero.name, 'team-portrait'),
            el('span', 'team-name', slot.hero.name),
            el('span', 'team-stars', starsText(slot.hero.stars)),
            el('span', 'team-dps-line', slot.dpsText),
            el('span', 'team-passive', slot.passiveLine)
        );
    }
    else if (slot.state === 'empty')
    {
        card.append(el('span', 'team-empty', 'vazio'));
    }
    else
    {
        card.append(el('span', 'team-coin'), el('span', 'team-price', String(slot.priceGold)));

        if (slot.state === 'locked')
        {
            card.append(el('span', 'team-lock-text', `Chefe do capítulo ${slot.chapter}`));
        }
    }

    card.disabled = model.busy || slot.state === 'waiting' || slot.state === 'locked';
    card.addEventListener('click', () => onSlot(slot.slot));

    return card;
};

//  The question of a slot purchase: Comprar and Cancelar
const renderBuyDialog = ({ asking, busy }, { onConfirmBuy, onCancelBuy }) =>
{
    const dialog = el('div', 'team-buy-dialog', '', { testid: 'team-buy-dialog' });
    const actions = el('div', 'team-buy-actions');
    const confirm = el('button', 'fusion-button', 'Comprar', { type: 'button', testid: 'team-buy-confirm' });
    const cancel = el('button', 'fusion-button is-secondary', 'Cancelar', { type: 'button', testid: 'team-buy-cancel' });

    confirm.disabled = busy || !asking.affordable;
    cancel.disabled = busy;
    confirm.addEventListener('click', () => onConfirmBuy());
    cancel.addEventListener('click', () => onCancelBuy());
    dialog.append(el('p', 'team-buy-question', `Comprar a vaga ${asking.slot} por ${asking.priceGold} ouro?`, { testid: 'team-buy-question' }));

    if (!asking.affordable)
    {
        dialog.append(el('p', 'team-buy-short', 'Moedas insuficientes'));
    }

    actions.append(confirm, cancel);
    dialog.append(actions);

    return dialog;
};

//  An owned hero outside the team; a click puts it in the selected slot or the first empty one
const renderAvailable = (hero, { canPick }, { onPick }) =>
{
    const entry = el('button', 'team-hero', '', { type: 'button', testid: `team-available-${hero.id}` });
    const text = el('span', 'team-hero-text');

    text.append(
        el('span', 'team-hero-name', hero.name),
        el('span', 'team-hero-stars', starsText(hero.stars)),
        el('span', 'team-hero-passive', hero.passiveName)
    );
    entry.append(sprite(hero.id, hero.name, 'team-hero-portrait'), text);
    entry.disabled = !canPick;
    entry.addEventListener('click', () => onPick(hero.id));

    return entry;
};

//  The Equipe screen of `model`; `handlers` = { onSlot(slot), onPick(heroId), onRemove(), onMakeLeader(), onConfirmBuy(), onCancelBuy() }
export const renderTeam = (model, handlers) =>
{
    const root = el('div', 'team-screen', '', { testid: 'team-screen' });
    const status = el('p', 'team-status', TEAM_INACTIVE_TEXT, { testid: 'team-status' });
    const notice = el('p', 'team-notice', model.notice ?? '', { testid: 'team-notice' });
    const slots = el('div', 'team-slots', '', { testid: 'team-slots' });
    const actions = el('div', 'team-actions');
    const remove = el('button', 'fusion-button is-secondary', 'Remover', { type: 'button', testid: 'team-remove' });
    const makeLeader = el('button', 'fusion-button is-secondary', 'Tornar líder', { type: 'button', testid: 'team-make-leader' });
    const available = el('div', 'team-available', '', { testid: 'team-available' });

    status.hidden = model.active;
    notice.hidden = model.notice === null;
    slots.append(renderLeaderCard(model.leader), ...model.slots.map((slot) => renderSlotCard(slot, model, handlers)));

    remove.disabled = !model.canAct;
    makeLeader.disabled = !model.canAct;
    remove.addEventListener('click', () => handlers.onRemove());
    makeLeader.addEventListener('click', () => handlers.onMakeLeader());
    actions.append(remove, makeLeader);

    if (model.available.length === 0)
    {
        available.append(el('p', 'team-available-empty', 'Todos os heróis estão na equipe.'));
    }
    else
    {
        available.append(...model.available.map((hero) => renderAvailable(hero, model, handlers)));
    }

    root.append(status, notice, el('p', 'team-dps', model.teamDpsText, { testid: 'team-dps' }), slots);

    if (model.asking)
    {
        root.append(renderBuyDialog(model, handlers));
    }

    root.append(actions, el('h3', 'team-available-title', 'Heróis disponíveis'), available);

    return root;
};
