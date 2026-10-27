import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAutoClickState } from './autoClickState';
import { ApiError } from '../ApiError';

const LEVEL_0 = { level: 0, maxLevel: 4, intervalMs: 500, crystals: 30, next: { level: 1, intervalMs: 250, price: 10 } };
const LEVEL_1 = { level: 1, maxLevel: 4, intervalMs: 250, crystals: 20, next: { level: 2, intervalMs: 150, price: 25 } };
const LEVEL_2 = { level: 2, maxLevel: 4, intervalMs: 150, crystals: 0, next: { level: 3, intervalMs: 100, price: 50 } };

describe('autoClickState', () => {
    const gateway = { get: vi.fn(), upgrade: vi.fn() };
    let autoClick;

    beforeEach(() => {
        gateway.get.mockReset();
        gateway.upgrade.mockReset();
        autoClick = createAutoClickState({ gateway });
    });

    it('runs at 500 ms with no state before the first load', () => {
        expect(autoClick.intervalMs()).toBe(500);
        expect(autoClick.state()).toBeNull();
        expect(autoClick.loaded).toBe(false);
    });

    it('takes the state and the interval the backend answers', async () => {
        gateway.get.mockResolvedValue(LEVEL_1);

        await autoClick.load();

        expect(autoClick.state()).toEqual(LEVEL_1);
        expect(autoClick.intervalMs()).toBe(250);
        expect(autoClick.loaded).toBe(true);
    });

    it('keeps 500 ms and no state when the load fails', async () => {
        gateway.get.mockRejectedValue(new ApiError('down'));

        await expect(autoClick.load()).rejects.toThrow('down');

        expect(autoClick.state()).toBeNull();
        expect(autoClick.intervalMs()).toBe(500);
    });

    it('upgrades from the level it holds and takes the answered interval', async () => {
        gateway.get.mockResolvedValue(LEVEL_0);
        gateway.upgrade.mockResolvedValue(LEVEL_1);
        await autoClick.load();

        await autoClick.upgrade();

        expect(gateway.upgrade).toHaveBeenCalledWith(0);
        expect(autoClick.state()).toEqual(LEVEL_1);
        expect(autoClick.intervalMs()).toBe(250);
    });

    it('tells the listeners after a load and after an upgrade', async () => {
        const listener = vi.fn();

        autoClick.onChange(listener);
        gateway.get.mockResolvedValue(LEVEL_0);
        gateway.upgrade.mockResolvedValue(LEVEL_1);
        await autoClick.load();
        await autoClick.upgrade();

        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('adopts the state a 409 mismatch carries and still rejects', async () => {
        gateway.get.mockResolvedValue(LEVEL_0);
        await autoClick.load();
        gateway.upgrade.mockRejectedValue(new ApiError('stale', { status: 409, code: 'AUTO_CLICK_LEVEL_MISMATCH', body: { autoClick: LEVEL_2 } }));

        await expect(autoClick.upgrade()).rejects.toMatchObject({ code: 'AUTO_CLICK_LEVEL_MISMATCH' });

        expect(autoClick.state()).toEqual(LEVEL_2);
        expect(autoClick.intervalMs()).toBe(150);
    });

    it('reloads after another 409 and still rejects', async () => {
        gateway.get.mockResolvedValueOnce(LEVEL_0).mockResolvedValueOnce({ ...LEVEL_0, crystals: 5 });
        await autoClick.load();
        gateway.upgrade.mockRejectedValue(new ApiError('poor', { status: 409, code: 'NOT_ENOUGH_CRYSTALS', body: {} }));

        await expect(autoClick.upgrade()).rejects.toMatchObject({ code: 'NOT_ENOUGH_CRYSTALS' });

        expect(gateway.get).toHaveBeenCalledTimes(2);
        expect(autoClick.state().crystals).toBe(5);
        expect(autoClick.intervalMs()).toBe(500);
    });

    it('keeps the state when the upgrade cannot reach the backend', async () => {
        gateway.get.mockResolvedValue(LEVEL_0);
        await autoClick.load();
        gateway.upgrade.mockRejectedValue(new ApiError('Cannot reach the server. Try again later.'));

        await expect(autoClick.upgrade()).rejects.toThrow('Cannot reach');

        expect(autoClick.state()).toEqual(LEVEL_0);
        expect(gateway.get).toHaveBeenCalledTimes(1);
    });

    it('takes the crystals and the reset count of a reset and keeps the rest of the state', async () => {
        gateway.get.mockResolvedValue({ ...LEVEL_1, resets: 0 });
        await autoClick.load();
        const onChange = vi.fn();
        autoClick.onChange(onChange);

        autoClick.adoptReset({ reward: 3, crystals: 23, resets: 1 });

        expect(autoClick.state()).toEqual({ ...LEVEL_1, crystals: 23, resets: 1 });
        expect(autoClick.intervalMs()).toBe(250);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('reads the state when a reset arrives before the first load', async () => {
        gateway.get.mockResolvedValue({ ...LEVEL_0, crystals: 3, resets: 1 });

        autoClick.adoptReset({ reward: 3, crystals: 3, resets: 1 });
        await vi.waitFor(() => expect(autoClick.loaded).toBe(true));

        expect(gateway.get).toHaveBeenCalledTimes(1);
        expect(autoClick.state()).toEqual({ ...LEVEL_0, crystals: 3, resets: 1 });
    });
});
