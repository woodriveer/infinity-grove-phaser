import { describe, expect, it } from 'vitest';
import { legacyDetailText, legacyLineText, legacyOf, resetLegacyText } from './resetLegacy';

const legacy = ({ chapters = [], best = null, afterReset = null }) => ({ chapters, best, afterReset });

describe('legacyOf', () => {
    it('keeps a valid payload', () => {
        const payload = legacy({
            chapters: [{ chapter: 5, percent: 100 }, { chapter: 10, percent: 50 }],
            best: { chapter: 10, percent: 50 },
            afterReset: { chapter: 12, percent: 50, best: { chapter: 12, percent: 50 } }
        });

        expect(legacyOf(payload)).toEqual(payload);
        expect(legacyOf(legacy({}))).toEqual(legacy({}));
    });

    it('gives null for a payload that is missing or malformed', () => {
        expect(legacyOf(undefined)).toBeNull();
        expect(legacyOf(null)).toBeNull();
        expect(legacyOf({})).toBeNull();
        expect(legacyOf(legacy({ chapters: 'none' }))).toBeNull();
        expect(legacyOf(legacy({ best: { chapter: '5', percent: 50 } }))).toBeNull();
        expect(legacyOf(legacy({ chapters: [{ chapter: 5 }] }))).toBeNull();
        expect(legacyOf(legacy({ afterReset: { chapter: 3, percent: 50, best: { chapter: 3 } } }))).toBeNull();
    });
});

describe('legacyLineText', () => {
    it('reads nenhum without a best legacy', () => {
        expect(legacyLineText(legacy({}))).toBe('Legado: nenhum');
    });

    it('names the percent and the chapter of the best legacy', () => {
        expect(legacyLineText(legacy({ best: { chapter: 10, percent: 50 } }))).toBe('Legado: 50% do capítulo 10');
    });
});

describe('legacyDetailText', () => {
    it('explains the best legacy', () => {
        expect(legacyDetailText(legacy({ best: { chapter: 10, percent: 50 } })))
            .toBe('Cada abate rende mais 50% das moedas do capítulo 10, e cada peça tem 50% de chance de vir com a raridade do capítulo 10.');
    });

    it('invites the player to reset without a legacy', () => {
        expect(legacyDetailText(legacy({}))).toBe('Resete a conta para ganhar moedas e peças melhores nas próximas jornadas.');
    });
});

describe('resetLegacyText', () => {
    it('case A with no legacy: the reset makes its chapter the best', () => {
        const text = resetLegacyText(legacy({ afterReset: { chapter: 3, percent: 50, best: { chapter: 3, percent: 50 } } }));

        expect(text).toBe('Legado depois do reset: 50% do capítulo 3 (hoje: nenhum).');
    });

    it('case A with a best legacy: it names the best of today', () => {
        const text = resetLegacyText(legacy({
            chapters: [{ chapter: 5, percent: 50 }],
            best: { chapter: 5, percent: 50 },
            afterReset: { chapter: 10, percent: 50, best: { chapter: 10, percent: 50 } }
        }));

        expect(text).toBe('Legado depois do reset: 50% do capítulo 10 (hoje: 50% do capítulo 5).');
    });

    it('case B: the chapter rises but another stays the best', () => {
        const text = resetLegacyText(legacy({
            chapters: [{ chapter: 10, percent: 50 }],
            best: { chapter: 10, percent: 50 },
            afterReset: { chapter: 5, percent: 50, best: { chapter: 10, percent: 50 } }
        }));

        expect(text).toBe('Este reset sobe o legado do capítulo 5 para 50%. O melhor legado continua 50% do capítulo 10.');
    });

    it('case C: the chapter is already at 100', () => {
        const text = resetLegacyText(legacy({
            chapters: [{ chapter: 5, percent: 100 }],
            best: { chapter: 5, percent: 100 },
            afterReset: { chapter: 5, percent: 100, best: { chapter: 5, percent: 100 } }
        }));

        expect(text).toBe('O legado do capítulo 5 já está em 100%: este reset não muda o seu legado.');
    });

    it('case C wins over case A when the chapter is the best at 100', () => {
        const text = resetLegacyText(legacy({
            chapters: [{ chapter: 15, percent: 100 }],
            best: { chapter: 15, percent: 100 },
            afterReset: { chapter: 15, percent: 100, best: { chapter: 15, percent: 100 } }
        }));

        expect(text).toBe('O legado do capítulo 15 já está em 100%: este reset não muda o seu legado.');
    });

    it('is null while the reset is closed', () => {
        expect(resetLegacyText(legacy({ afterReset: null }))).toBeNull();
    });
});
