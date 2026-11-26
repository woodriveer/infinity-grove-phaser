import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createResetLegacy } from './resetLegacy';
import { ApiError } from '../ApiError';

const NONE = { chapters: [], best: null, afterReset: null };
const FIVE = { chapters: [{ chapter: 5, percent: 50 }], best: { chapter: 5, percent: 50 }, afterReset: null };

describe('resetLegacy', () => {
    let gateway;
    let resetLegacy;

    beforeEach(() => {
        gateway = { legacy: vi.fn().mockResolvedValue(FIVE) };
        resetLegacy = createResetLegacy({ gateway });
    });

    it('load keeps the answer', async () => {
        await expect(resetLegacy.load()).resolves.toEqual(FIVE);

        expect(resetLegacy.state()).toEqual(FIVE);
    });

    it('a failed load keeps the last value', async () => {
        await resetLegacy.load();
        gateway.legacy.mockRejectedValue(new ApiError('down'));

        await expect(resetLegacy.load()).resolves.toEqual(FIVE);

        expect(resetLegacy.state()).toEqual(FIVE);
    });

    it('a failed first load leaves null, a 404 of an old backend included', async () => {
        gateway.legacy.mockRejectedValue(new ApiError('not found', { status: 404 }));

        await expect(resetLegacy.load()).resolves.toBeNull();

        expect(resetLegacy.state()).toBeNull();
    });

    it('clear drops the legacy of the previous player, and a failed load of the next one leaves null', async () => {
        await resetLegacy.load();
        resetLegacy.clear();

        expect(resetLegacy.state()).toBeNull();

        gateway.legacy.mockRejectedValue(new ApiError('not found', { status: 404 }));

        await expect(resetLegacy.load()).resolves.toBeNull();
    });

    it('a load that answers after a clear belongs to the previous player and is dropped', async () => {
        let answer;
        gateway.legacy.mockReturnValue(new Promise((resolve) => { answer = resolve; }));

        const loading = resetLegacy.load();

        resetLegacy.clear();
        answer(FIVE);

        await expect(loading).resolves.toBeNull();
        expect(resetLegacy.state()).toBeNull();
    });

    it('a load started after the clear keeps its answer', async () => {
        resetLegacy.clear();

        await resetLegacy.load();

        expect(resetLegacy.state()).toEqual(FIVE);
    });

    it('adopt takes a valid payload and ignores a malformed one', () => {
        resetLegacy.adopt(NONE);
        expect(resetLegacy.state()).toEqual(NONE);

        resetLegacy.adopt({ chapters: 'none' });
        resetLegacy.adopt(undefined);

        expect(resetLegacy.state()).toEqual(NONE);
    });
});
