import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAccountReset } from './accountReset';
import { ApiError } from '../ApiError';

const START = { chapter: 1, stage: 1, encounter: 'PHASE', phase: 1, completed: false };
const STORED = { chapter: 4, stage: 1, encounter: 'PHASE', phase: 1, completed: false };
const ANSWER = { reward: 3, crystals: 7, resets: 1, progress: START };

describe('accountReset', () => {
    let gateway;
    let session;
    let autoClick;
    let talents;
    let accountReset;

    beforeEach(() => {
        gateway = { reset: vi.fn().mockResolvedValue(ANSWER) };
        session = { chapter: 3, restart: vi.fn() };
        autoClick = { adoptReset: vi.fn() };
        talents = { load: vi.fn().mockResolvedValue([]) };
        accountReset = createAccountReset({ gateway, session, autoClick, talents });
    });

    it('sends the reset from the chapter of the session', async () => {
        await accountReset.reset();

        expect(gateway.reset).toHaveBeenCalledWith(3);
    });

    it('restarts the campaign at the answered progress, hands the crystals and resets to the auto click and reads the talents again', async () => {
        await expect(accountReset.reset()).resolves.toEqual(ANSWER);

        expect(session.restart).toHaveBeenCalledWith(START);
        expect(autoClick.adoptReset).toHaveBeenCalledWith(ANSWER);
        expect(talents.load).toHaveBeenCalledTimes(1);
    });

    it('still resolves when the talents cannot be read again', async () => {
        talents.load.mockRejectedValue(new ApiError('down'));

        await expect(accountReset.reset()).resolves.toEqual(ANSWER);
    });

    it('restarts the campaign at the stored progress of a chapter mismatch and rejects, leaving the crystals alone', async () => {
        const refusal = new ApiError('mismatch', { status: 409, code: 'RESET_CHAPTER_MISMATCH', body: { code: 'RESET_CHAPTER_MISMATCH', progress: STORED } });
        gateway.reset.mockRejectedValue(refusal);

        await expect(accountReset.reset()).rejects.toBe(refusal);

        expect(session.restart).toHaveBeenCalledWith(STORED);
        expect(autoClick.adoptReset).not.toHaveBeenCalled();
        expect(talents.load).not.toHaveBeenCalled();
    });

    it('rejects a locked reset without touching the campaign', async () => {
        const refusal = new ApiError('locked', { status: 409, code: 'RESET_LOCKED', body: { code: 'RESET_LOCKED' } });
        gateway.reset.mockRejectedValue(refusal);

        await expect(accountReset.reset()).rejects.toBe(refusal);

        expect(session.restart).not.toHaveBeenCalled();
        expect(autoClick.adoptReset).not.toHaveBeenCalled();
    });

    it('rejects a network failure and changes nothing', async () => {
        gateway.reset.mockRejectedValue(new ApiError('Cannot reach the server. Try again later.'));

        await expect(accountReset.reset()).rejects.toThrow('Cannot reach the server');

        expect(session.restart).not.toHaveBeenCalled();
        expect(autoClick.adoptReset).not.toHaveBeenCalled();
        expect(talents.load).not.toHaveBeenCalled();
    });
});
