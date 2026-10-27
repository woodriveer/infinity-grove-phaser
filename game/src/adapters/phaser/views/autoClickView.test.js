import { describe, expect, it } from 'vitest';
import { renderAutoClick } from './autoClickView';

const LEVEL_0 = { level: 0, maxLevel: 4, intervalMs: 500, crystals: 0, next: { level: 1, intervalMs: 250, price: 10 } };

const box = (props) =>
{
    const root = document.createElement('div');

    root.append(...renderAutoClick(props));
    return root;
};

describe('renderAutoClick', () => {
    it('shows the Auto clique switch checked when enabled', () => {
        const root = box({ enabled: true, intervalMs: 500, state: LEVEL_0 });

        expect(root.querySelector('.auto-click-toggle').textContent).toBe(' Auto clique');
        expect(root.querySelector('[data-testid="auto-click-toggle"]').checked).toBe(true);
    });

    it('shows the switch unchecked when disabled', () => {
        expect(box({ enabled: false, intervalMs: 500, state: LEVEL_0 }).querySelector('[data-testid="auto-click-toggle"]').checked).toBe(false);
    });

    it('shows 500 ms, Cristais: 0 and a disabled Melhorar: 250 ms (10 cristais) at level 0 with no crystals', () => {
        const root = box({ enabled: true, intervalMs: 500, state: LEVEL_0 });
        const button = root.querySelector('[data-testid="auto-click-upgrade"]');

        expect(root.querySelector('[data-testid="auto-click-interval"]').textContent).toBe('500 ms');
        expect(root.querySelector('[data-testid="auto-click-crystals"]').textContent).toBe('Cristais: 0');
        expect(button.textContent).toBe('Melhorar: 250 ms (10 cristais)');
        expect(button.disabled).toBe(true);
    });

    it('enables the button when the crystals reach the price', () => {
        const button = box({ enabled: true, intervalMs: 500, state: { ...LEVEL_0, crystals: 10 } }).querySelector('[data-testid="auto-click-upgrade"]');

        expect(button.disabled).toBe(false);
    });

    it('keeps the button disabled while an upgrade is on its way', () => {
        const button = box({ enabled: true, intervalMs: 500, state: { ...LEVEL_0, crystals: 10 }, busy: true }).querySelector('[data-testid="auto-click-upgrade"]');

        expect(button.disabled).toBe(true);
    });

    it('shows no button at level 4', () => {
        const root = box({ enabled: true, intervalMs: 50, state: { level: 4, maxLevel: 4, intervalMs: 50, crystals: 3, next: null } });

        expect(root.querySelector('[data-testid="auto-click-interval"]').textContent).toBe('50 ms');
        expect(root.querySelector('[data-testid="auto-click-crystals"]').textContent).toBe('Cristais: 3');
        expect(root.querySelector('[data-testid="auto-click-upgrade"]')).toBeNull();
    });

    it('shows only the switch and 500 ms when the state did not load', () => {
        const root = box({ enabled: true, intervalMs: 500, state: null });

        expect(root.querySelector('[data-testid="auto-click-interval"]').textContent).toBe('500 ms');
        expect(root.querySelector('[data-testid="auto-click-crystals"]')).toBeNull();
        expect(root.querySelector('[data-testid="auto-click-upgrade"]')).toBeNull();
    });
});
