import { el } from './dom';

//  The auto click box of the HUD (spec auto-click): the `Auto clique` switch, the interval it runs at and, once the backend answered, the
//  crystals and the next upgrade with its price. `state` is null when the state did not load: no crystals and no button then. The button is
//  disabled while the crystals are short of the price or an upgrade is on its way.
export const autoClickIntervalText = (intervalMs) => `${intervalMs} ms`;

export const autoClickCrystalsText = (crystals) => `Cristais: ${crystals}`;

export const autoClickUpgradeText = ({ intervalMs, price }) => `Melhorar: ${intervalMs} ms (${price} cristais)`;

export const renderAutoClick = ({ enabled, intervalMs, state, busy = false }) =>
{
    const toggle = el('label', 'auto-click-toggle');
    const input = el('input', '', '', { type: 'checkbox', testid: 'auto-click-toggle' });

    input.checked = enabled;
    toggle.append(input, ' Auto clique');

    const nodes = [ toggle, el('span', 'auto-click-interval', autoClickIntervalText(intervalMs), { testid: 'auto-click-interval' }) ];

    if (state)
    {
        nodes.push(el('span', 'auto-click-crystals', autoClickCrystalsText(state.crystals), { testid: 'auto-click-crystals' }));
    }

    if (state?.next)
    {
        const button = el('button', 'auto-click-upgrade', autoClickUpgradeText(state.next), { type: 'button', testid: 'auto-click-upgrade' });

        button.disabled = busy || state.crystals < state.next.price;
        nodes.push(button);
    }

    return nodes;
};
