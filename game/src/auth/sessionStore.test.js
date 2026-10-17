import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionStore } from './sessionStore';

const KEY = 'infinity-grove.session';

const session = {
    user: { username: 'yan', createdAt: 1, lastLoginAt: 2 },
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    accessTokenExpiresAt: 1000,
    refreshTokenExpiresAt: 2000
};

describe('sessionStore', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        sessionStore.clear();
    });

    it('load returns null when nothing is stored', () => {
        expect(sessionStore.load()).toBeNull();
    });

    it('save then load returns an equal session and persists it under the storage key', () => {
        sessionStore.save(session);

        expect(sessionStore.load()).toEqual(session);
        expect(JSON.parse(localStorage.getItem(KEY))).toEqual(session);
    });

    it('load returns null and removes the entry when the JSON is invalid', () => {
        localStorage.setItem(KEY, '{not json');

        expect(sessionStore.load()).toBeNull();
        expect(localStorage.getItem(KEY)).toBeNull();
    });

    it.each([
        ['user', 'user'],
        ['accessToken', 'accessToken'],
        ['refreshToken', 'refreshToken'],
        ['accessTokenExpiresAt', 'accessTokenExpiresAt'],
        ['refreshTokenExpiresAt', 'refreshTokenExpiresAt']
    ])('load returns null and removes the entry when %s is missing', (_label, field) => {
        const { [field]: _omitted, ...incomplete } = session;
        localStorage.setItem(KEY, JSON.stringify(incomplete));

        expect(sessionStore.load()).toBeNull();
        expect(localStorage.getItem(KEY)).toBeNull();
    });

    it.each(['accessTokenExpiresAt', 'refreshTokenExpiresAt'])(
        'load returns null and removes the entry when %s is not numeric',
        (field) => {
            localStorage.setItem(KEY, JSON.stringify({ ...session, [field]: 'soon' }));

            expect(sessionStore.load()).toBeNull();
            expect(localStorage.getItem(KEY)).toBeNull();
        }
    );

    it('load returns null for stored JSON that is not an object', () => {
        localStorage.setItem(KEY, 'null');

        expect(sessionStore.load()).toBeNull();
        expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('clear removes the entry', () => {
        sessionStore.save(session);

        sessionStore.clear();

        expect(localStorage.getItem(KEY)).toBeNull();
        expect(sessionStore.load()).toBeNull();
    });

    it('keeps working in memory when localStorage throws on read and write', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denied'); });

        sessionStore.save(session);
        expect(sessionStore.load()).toEqual(session);

        sessionStore.clear();
        expect(sessionStore.load()).toBeNull();
    });

    it('does not resurrect a session that was removed from localStorage by someone else', () => {
        sessionStore.save(session);
        localStorage.removeItem(KEY);

        expect(sessionStore.load()).toBeNull();
    });

    it('fromAuthResponse maps the backend response to the stored shape', () => {
        const response = {
            user: session.user,
            accessToken: 'a',
            refreshToken: 'r',
            accessTokenExpiresAt: 10,
            refreshTokenExpiresAt: 20,
            extra: 'ignored'
        };

        expect(sessionStore.fromAuthResponse(response)).toEqual({
            user: session.user,
            accessToken: 'a',
            refreshToken: 'r',
            accessTokenExpiresAt: 10,
            refreshTokenExpiresAt: 20
        });
    });
});
