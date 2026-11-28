import { describe, expect, it } from 'vitest';
import { resetLegacy, services, sessionManager } from './composition';
import { STORY_SCENES } from './domain/story/storyCatalog';

describe('composition root', () => {
    it('hands the scenes the session, the user api and one factory per game service', () => {
        expect(Object.keys(services).sort()).toEqual([
            'autoClickPreference', 'backend', 'createAccountReset', 'createAutoClickState', 'createCampaignSession', 'createEquipmentCollection', 'createFarmSession', 'createHeroCollection', 'createTalentCollection', 'createWalletSync', 'gifts', 'playStory', 'resetLegacy', 'session', 'storyScenes', 'storySeen', 'users'
        ]);
        expect(typeof services.gifts.claim).toBe('function');
        expect(typeof services.users.signUp).toBe('function');
        expect(typeof services.session.restore).toBe('function');
        expect(typeof services.backend.wake).toBe('function');
    });

    it('hands the scenes the story catalog, the seen list and the player', () => {
        expect(services.storyScenes).toBe(STORY_SCENES);
        expect(typeof services.storySeen.seen).toBe('function');
        expect(typeof services.storySeen.markSeen).toBe('function');
        expect(typeof services.playStory).toBe('function');
    });

    it('drops the reset legacy of the previous player on a login', () => {
        const legacy = { chapters: [ { chapter: 5, percent: 50 } ], best: { chapter: 5, percent: 50 }, afterReset: null };
        const login = { user: { username: 'yan' }, accessToken: 'a', refreshToken: 'r', accessTokenExpiresAt: 1, refreshTokenExpiresAt: 2 };

        resetLegacy.adopt(legacy);
        sessionManager.start(login);
        expect(resetLegacy.state()).toBeNull();
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

    it('builds a fresh auto click state on every call and hands the switch preference', () => {
        const first = services.createAutoClickState();
        const second = services.createAutoClickState();

        expect(first).not.toBe(second);
        expect(first.state()).toBeNull();
        expect(first.intervalMs()).toBe(500);
        expect(typeof first.upgrade).toBe('function');
        expect(typeof services.autoClickPreference.enabled).toBe('function');
    });

    it('builds an account reset over the services of the scene that asks for it', async () => {
        const session = { chapter: 3, restart: () => {} };

        expect(typeof services.createAccountReset({ session, autoClick: {}, talents: {} }).reset).toBe('function');
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
