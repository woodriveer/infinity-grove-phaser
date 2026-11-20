import { describe, expect, it } from 'vitest';
import { GIFT_NOTICE, GIFT_NOTICE_MS, SPECIALS, specialOf } from './specials';

describe('specials', () => {
    it('the staff is named Cajado da Consciência Negra, uses its own icon and gives +200 % against Escuridão', () => {
        expect(SPECIALS.BLACK_AWARENESS_STAFF).toEqual({
            name: 'Cajado da Consciência Negra',
            icon: 'staff_black_awares_day',
            darknessDamagePct: 200,
            line: 'Especial: +200% de dano contra Escuridão'
        });
    });

    it('specialOf returns the staff for a piece with special BLACK_AWARENESS_STAFF', () => {
        expect(specialOf({ special: 'BLACK_AWARENESS_STAFF' })).toBe(SPECIALS.BLACK_AWARENESS_STAFF);
    });

    it('specialOf returns null for no special, null and an unknown special', () => {
        expect(specialOf({})).toBeNull();
        expect(specialOf({ special: null })).toBeNull();
        expect(specialOf({ special: 'FROST_RUNE' })).toBeNull();
    });

    it('specialOf returns null for inherited names', () => {
        expect(specialOf({ special: 'toString' })).toBeNull();
        expect(specialOf({ special: '__proto__' })).toBeNull();
    });

    it('the gift notice reads the text of the spec and lasts 6000 ms', () => {
        expect(GIFT_NOTICE).toBe('Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!');
        expect(GIFT_NOTICE_MS).toBe(6000);
    });
});
