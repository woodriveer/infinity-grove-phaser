import { beforeEach, describe, expect, it } from 'vitest';
import { createStorySeen } from './storySeen';

const KEY = 'infinity-grove.story-seen';
const broken = () => ({
    getItem: () => { throw new Error('denied'); },
    setItem: () => { throw new Error('denied'); }
});

describe('storySeen', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('is empty the first time', () => {
        expect(createStorySeen().seen()).toEqual([]);
    });

    it('stores a scene under infinity-grove.story-seen and a new instance reads it', () => {
        createStorySeen().markSeen('prologue');

        expect(localStorage.getItem(KEY)).toBe('["prologue"]');
        expect(createStorySeen().seen()).toEqual([ 'prologue' ]);
    });

    it('appends a second scene after the first', () => {
        localStorage.setItem(KEY, '["chapter-1"]');

        createStorySeen().markSeen('prologue');

        expect(localStorage.getItem(KEY)).toBe('["chapter-1","prologue"]');
    });

    it('does not store a scene twice', () => {
        const seen = createStorySeen();

        seen.markSeen('prologue');
        seen.markSeen('prologue');

        expect(localStorage.getItem(KEY)).toBe('["prologue"]');
    });

    it('reads a value that is not JSON as empty and rewrites it on the next mark', () => {
        localStorage.setItem(KEY, '{');
        const seen = createStorySeen();

        expect(seen.seen()).toEqual([]);

        seen.markSeen('prologue');

        expect(localStorage.getItem(KEY)).toBe('["prologue"]');
    });

    it('reads JSON that is not an array as empty', () => {
        localStorage.setItem(KEY, '{"x":1}');
        expect(createStorySeen().seen()).toEqual([]);

        localStorage.setItem(KEY, '"prologue"');
        expect(createStorySeen().seen()).toEqual([]);
    });

    it('drops the entries that are not strings', () => {
        localStorage.setItem(KEY, '[1,"prologue",null]');

        expect(createStorySeen().seen()).toEqual([ 'prologue' ]);
    });

    it('keeps the list in memory when storage cannot be written', () => {
        const seen = createStorySeen(broken);

        expect(() => seen.markSeen('prologue')).not.toThrow();
        expect(seen.seen()).toEqual([ 'prologue' ]);
        expect(createStorySeen(broken).seen()).toEqual([]);
    });

    it('keeps the list in memory when the storage is writable but not readable', () => {
        const store = {};
        const seen = createStorySeen(() => ({ getItem: () => null, setItem: (key, value) => { store[key] = value; } }));

        seen.markSeen('prologue');
        seen.markSeen('chapter-1');

        expect(seen.seen()).toEqual([ 'prologue', 'chapter-1' ]);
        expect(store[KEY]).toBe('["prologue","chapter-1"]');
    });

    it('reads empty when touching localStorage throws', () => {
        expect(createStorySeen(() => { throw new Error('SecurityError'); }).seen()).toEqual([]);
    });

    it('seen returns a copy', () => {
        const seen = createStorySeen();

        seen.markSeen('prologue');
        seen.seen().push('chapter-1');

        expect(seen.seen()).toEqual([ 'prologue' ]);
    });
});
