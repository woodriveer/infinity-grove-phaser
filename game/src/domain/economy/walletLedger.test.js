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

describe('WalletLedger starting a sync', () => {
    it('has nothing to send before any drop was taken', () => {
        expect(loaded().beginSync()).toBeNull();
    });

    it('sends the unreported kills per level', () => {
        const ledger = loaded(wallet(), { 1: [3, 1, 5], 2: [9, 8] });
        ledger.takeDrop(1);
        ledger.takeDrop(1);
        ledger.takeDrop(2);

        expect(ledger.beginSync()).toEqual({ 1: 2, 2: 1 });
    });

    it('does not count a kill that dropped nothing', () => {
        const ledger = loaded(wallet(), { 1: [] });
        ledger.takeDrop(1);

        expect(ledger.beginSync()).toBeNull();
    });

    it('starts no second sync while one is in flight', () => {
        const ledger = loaded();
        ledger.takeDrop(1);
        expect(ledger.beginSync()).toEqual({ 1: 1 });

        ledger.takeDrop(1);

        expect(ledger.beginSync()).toBeNull();
    });
});

describe('WalletLedger completing a sync', () => {
    const response = (coins, drops) => ({ wallet: coins, accepted: {}, drops });

    it('settles the sent kills and takes the server wallet as the new base', () => {
        const ledger = loaded(wallet(0, 0, 10));
        landAll(ledger, ledger.takeDrop(1));
        ledger.beginSync();

        ledger.completeSync(response(wallet(0, 0, 13), { 1: [1, 5] }));

        expect(ledger.display()).toEqual(wallet(0, 0, 13));
        expect(ledger.hasUnreported()).toBe(false);
    });

    it('replaces the queue with the server queue minus the drops taken since the request', () => {
        const ledger = loaded(wallet(), { 1: [3, 1, 5, 2, 4] });
        ledger.takeDrop(1);
        ledger.takeDrop(1);
        ledger.beginSync();
        ledger.takeDrop(1);

        ledger.completeSync(response(wallet(0, 0, 4), { 1: [5, 2, 4, 6, 7] }));

        expect(ledger.takeDrop(1).value).toBe(2);
        expect(ledger.takeDrop(1).value).toBe(4);
    });

    it('treats a level missing from the response as an empty queue', () => {
        const ledger = loaded(wallet(), { 1: [3], 2: [9, 8] });
        ledger.takeDrop(1);
        ledger.beginSync();

        ledger.completeSync(response(wallet(0, 0, 3), { 1: [4] }));

        expect(ledger.takeDrop(2)).toBeNull();
        expect(ledger.takeDrop(1).value).toBe(4);
    });

    it('allows a new sync afterwards', () => {
        const ledger = loaded();
        ledger.takeDrop(1);
        ledger.beginSync();
        ledger.completeSync(response(wallet(0, 0, 3), { 1: [1, 5] }));

        ledger.takeDrop(1);

        expect(ledger.beginSync()).toEqual({ 1: 1 });
    });

    it('counts a kill made while the sync was in flight for the next sync, not the current one', () => {
        const ledger = loaded();
        ledger.takeDrop(1);
        expect(ledger.beginSync()).toEqual({ 1: 1 });
        ledger.takeDrop(1);

        ledger.completeSync(response(wallet(0, 0, 3), { 1: [1, 5, 2] }));

        expect(ledger.hasUnreported()).toBe(true);
        expect(ledger.beginSync()).toEqual({ 1: 1 });
    });

    it('does not count the coins of a covered drop again when they land after the response', () => {
        const ledger = loaded(wallet(0, 0, 10), { 1: [3] });
        const drop = ledger.takeDrop(1);
        ledger.beginSync();

        ledger.completeSync(response(wallet(0, 0, 13), { 1: [] }));
        landAll(ledger, drop);

        expect(ledger.display()).toEqual(wallet(0, 0, 13));
    });

    it('adds the landed coins of drops the response does not cover on top of the server wallet', () => {
        const ledger = loaded(wallet(0, 0, 10), { 1: [2, 1, 4] });
        landAll(ledger, ledger.takeDrop(1));
        ledger.beginSync();
        const later = ledger.takeDrop(1);
        landAll(ledger, later);

        ledger.completeSync(response(wallet(0, 0, 12), { 1: [1, 4] }));

        expect(ledger.display()).toEqual(wallet(0, 0, 13));
    });

    it('snaps to the server wallet when the server credited less than was shown', () => {
        const ledger = loaded(wallet(0, 0, 10), { 1: [1, 1] });
        landAll(ledger, ledger.takeDrop(1));
        landAll(ledger, ledger.takeDrop(1));
        expect(ledger.display()).toEqual(wallet(0, 0, 12));
        ledger.beginSync();

        ledger.completeSync(response(wallet(0, 0, 10), { 1: [3] }));

        expect(ledger.display()).toEqual(wallet(0, 0, 10));
    });

    it('syncs a drop larger than 5 copper like any other', () => {
        const ledger = loaded(wallet(), { 1: [250] });
        ledger.takeDrop(1);

        expect(ledger.beginSync()).toEqual({ 1: 1 });
        ledger.completeSync(response(wallet(0, 2, 50), { 1: [1] }));

        expect(ledger.display()).toEqual(wallet(0, 2, 50));
    });
});

describe('WalletLedger failing a sync', () => {
    it('keeps every kill unreported and sends them with newer ones on the next sync', () => {
        const ledger = loaded();
        ledger.takeDrop(1);
        ledger.beginSync();
        ledger.takeDrop(1);

        ledger.failSync();

        expect(ledger.hasUnreported()).toBe(true);
        expect(ledger.beginSync()).toEqual({ 1: 2 });
    });

    it('keeps the queue and the landed coins as they were', () => {
        const ledger = loaded(wallet(0, 0, 10), { 1: [3, 1] });
        landAll(ledger, ledger.takeDrop(1));
        ledger.beginSync();

        ledger.failSync();

        expect(ledger.display()).toEqual(wallet(0, 0, 13));
        expect(ledger.takeDrop(1).value).toBe(1);
    });
});
