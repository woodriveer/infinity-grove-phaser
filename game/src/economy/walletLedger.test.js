import { describe, expect, it } from 'vitest';
import { WalletLedger } from './walletLedger';

const wallet = (gold = 0, silver = 0, copper = 0) => ({ gold, silver, copper });

const loaded = (coins = wallet(), drops = { 1: [3, 1, 5, 2] }) => {
    const ledger = new WalletLedger();

    ledger.load({ wallet: coins, drops });
    return ledger;
};

//  Lands every coin of a taken drop, as the scene does when the tweens end
const landAll = (ledger, drop) => {
    for (let i = 0; i < drop.value; i++)
    {
        ledger.land(drop.id);
    }
};

describe('WalletLedger loading', () => {
    it('is not loaded at first, shows zero and drops nothing', () => {
        const ledger = new WalletLedger();

        expect(ledger.loaded).toBe(false);
        expect(ledger.takeDrop(1)).toBeNull();
        expect(ledger.display()).toEqual(wallet());
    });

    it('is loaded after load and shows the loaded wallet', () => {
        const ledger = loaded(wallet(2, 14, 37));

        expect(ledger.loaded).toBe(true);
        expect(ledger.display()).toEqual(wallet(2, 14, 37));
    });
});

describe('WalletLedger drops', () => {
    it('hands out the queued values of the level in order', () => {
        const ledger = loaded();

        expect(ledger.takeDrop(1).value).toBe(3);
        expect(ledger.takeDrop(1).value).toBe(1);
        expect(ledger.takeDrop(1).value).toBe(5);
    });

    it('gives each taken drop its own id', () => {
        const ledger = loaded();

        expect(ledger.takeDrop(1).id).not.toBe(ledger.takeDrop(1).id);
    });

    it('reads the queue by level whether the level is a number or a string', () => {
        const ledger = loaded(wallet(), { 2: [9] });

        expect(ledger.takeDrop('2').value).toBe(9);
    });

    it('returns null and changes nothing when the queue of the level is empty', () => {
        const ledger = loaded(wallet(), { 1: [] });

        expect(ledger.takeDrop(1)).toBeNull();
        expect(ledger.hasUnreported()).toBe(false);
    });

    it('returns null when the level is missing from the loaded queues', () => {
        const ledger = loaded(wallet(), { 1: [4] });

        expect(ledger.takeDrop(7)).toBeNull();
        expect(ledger.takeDrop(1).value).toBe(4);
    });

    it('runs dry after the last queued value', () => {
        const ledger = loaded(wallet(), { 1: [2] });
        ledger.takeDrop(1);

        expect(ledger.takeDrop(1)).toBeNull();
    });

    it('does not change the display until the coins land', () => {
        const ledger = loaded(wallet(0, 0, 10));

        ledger.takeDrop(1);

        expect(ledger.display()).toEqual(wallet(0, 0, 10));
    });
});

describe('WalletLedger landing coins', () => {
    it('adds 1 copper for each landed coin', () => {
        const ledger = loaded(wallet(0, 0, 10));
        const drop = ledger.takeDrop(1);

        ledger.land(drop.id);
        expect(ledger.display()).toEqual(wallet(0, 0, 11));

        ledger.land(drop.id);
        ledger.land(drop.id);
        expect(ledger.display()).toEqual(wallet(0, 0, 13));
    });

    it('ignores landings beyond the value of the drop', () => {
        const ledger = loaded(wallet(), { 1: [2] });
        const drop = ledger.takeDrop(1);

        landAll(ledger, drop);
        ledger.land(drop.id);

        expect(ledger.display()).toEqual(wallet(0, 0, 2));
    });

    it('ignores a landing for an unknown id', () => {
        const ledger = loaded(wallet(0, 0, 10));

        ledger.land(999);

        expect(ledger.display()).toEqual(wallet(0, 0, 10));
    });

    it('turns 100 copper into 1 silver: 99 copper plus a drop of 2 shows 1 silver and 1 copper', () => {
        const ledger = loaded(wallet(0, 0, 99), { 1: [2] });
        const drop = ledger.takeDrop(1);

        ledger.land(drop.id);
        expect(ledger.display()).toEqual(wallet(0, 1, 0));

        ledger.land(drop.id);
        expect(ledger.display()).toEqual(wallet(0, 1, 1));
    });

    it('turns 100 silver into 1 gold', () => {
        const ledger = loaded(wallet(3, 99, 99), { 1: [1] });

        landAll(ledger, ledger.takeDrop(1));

        expect(ledger.display()).toEqual(wallet(4, 0, 0));
    });

    it('keeps adding gold with no cap', () => {
        const ledger = loaded(wallet(5_000_000_000, 99, 99), { 1: [1] });

        landAll(ledger, ledger.takeDrop(1));

        expect(ledger.display()).toEqual(wallet(5_000_000_001, 0, 0));
    });

    it('lands a drop larger than 5 copper like any other', () => {
        const ledger = loaded(wallet(), { 1: [250] });

        landAll(ledger, ledger.takeDrop(1));

        expect(ledger.display()).toEqual(wallet(0, 2, 50));
    });
});
