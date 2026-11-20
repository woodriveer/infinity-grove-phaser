import { describe, expect, it, vi } from 'vitest';
import { claimGift } from './giftClaim';

const STAFF = { id: 's', special: 'BLACK_AWARENESS_STAFF' };

const setup = (claim) => {
    const gateway = { claim };
    const equipment = { applyDrop: vi.fn() };
    const onGift = vi.fn();

    return { gateway, equipment, onGift, run: () => claimGift({ gateway, equipment, onGift }) };
};

describe('claimGift', () => {
    it('a granted gift joins the equipment list, calls onGift once and resolves the piece', async () => {
        const { equipment, onGift, run } = setup(vi.fn().mockResolvedValue({ granted: true, gift: 'BLACK_AWARENESS_STAFF', piece: STAFF }));

        await expect(run()).resolves.toBe(STAFF);
        expect(equipment.applyDrop).toHaveBeenCalledTimes(1);
        expect(equipment.applyDrop).toHaveBeenCalledWith({ piece: STAFF, sold: false });
        expect(onGift).toHaveBeenCalledTimes(1);
        expect(onGift).toHaveBeenCalledWith(STAFF);
    });

    it('granted false adds nothing, calls no notice and resolves null', async () => {
        const { equipment, onGift, run } = setup(vi.fn().mockResolvedValue({ granted: false }));

        await expect(run()).resolves.toBeNull();
        expect(equipment.applyDrop).not.toHaveBeenCalled();
        expect(onGift).not.toHaveBeenCalled();
    });

    it('granted true without a piece adds nothing and resolves null', async () => {
        const { equipment, onGift, run } = setup(vi.fn().mockResolvedValue({ granted: true, gift: 'BLACK_AWARENESS_STAFF' }));

        await expect(run()).resolves.toBeNull();
        expect(equipment.applyDrop).not.toHaveBeenCalled();
        expect(onGift).not.toHaveBeenCalled();
    });

    it('a failing claim resolves null and adds nothing', async () => {
        const { equipment, onGift, run } = setup(vi.fn().mockRejectedValue(new Error('offline')));

        await expect(run()).resolves.toBeNull();
        expect(equipment.applyDrop).not.toHaveBeenCalled();
        expect(onGift).not.toHaveBeenCalled();
    });

    it('one call claims exactly once', async () => {
        const claim = vi.fn().mockResolvedValue({ granted: false });

        await setup(claim).run();

        expect(claim).toHaveBeenCalledTimes(1);
    });
});
