import { describe, expect, it } from 'vitest';
import { services } from './composition';

describe('composition root', () => {
    it('hands the scenes the session, the user api and one factory per game service', () => {
        expect(Object.keys(services).sort()).toEqual([
            'createCampaignSession', 'createEquipmentCollection', 'createFarmSession', 'createHeroCollection', 'createTalentCollection', 'createWalletSync', 'session', 'users'
        ]);
        expect(typeof services.users.signUp).toBe('function');
        expect(typeof services.session.restore).toBe('function');
    });

    it('builds a fresh hero collection with its own state on every call', () => {
        const first = services.createHeroCollection();
        const second = services.createHeroCollection();

        expect(first).not.toBe(second);
        expect(first.heroes()).toEqual([]);
        expect(typeof first.fuse).toBe('function');
        expect(typeof first.setLeader).toBe('function');
    });

    it('builds a fresh equipment collection with its own state on every call', () => {
        const first = services.createEquipmentCollection();
        const second = services.createEquipmentCollection();

        expect(first).not.toBe(second);
        expect(first.pieces()).toEqual([]);
        expect(first.loaded).toBe(false);
        expect(typeof first.refine).toBe('function');
    });

    it('builds a fresh talent collection with its own state on every call', () => {
        const first = services.createTalentCollection();
        const second = services.createTalentCollection();

        expect(first).not.toBe(second);
        expect(first.talents()).toEqual([]);
        expect(first.loaded).toBe(false);
        expect(typeof first.upgrade).toBe('function');
    });

    it('builds a fresh farm session with its own state on every call', () => {
        const first = services.createFarmSession();
        const second = services.createFarmSession();

        expect(first).not.toBe(second);
        expect(first.bosses()).toEqual([]);
        expect(first.winsLeft()).toBeNull();
        expect(typeof first.win).toBe('function');
    });
});
