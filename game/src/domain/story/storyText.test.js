import { describe, expect, it } from 'vitest';
import { charsAt, lineText } from './storyText';

const LINE_2 = { cues: [ [ 0.05, 2.23, 'Até a noite em que as raízes' ], [ 2.6, 3.4, 'tremeram.' ] ] };
const LINE_1 = {
    cues: [ [ 0.05, 3.51, 'Eldora sempre respirou pela Grande Árvore.' ], [ 4.11, 6.73, 'Suas raízes bebem do fundo do mundo,' ],
        [ 7.25, 9.65, 'e sua seiva corre por cada folha,' ], [ 10.0, 10.7, 'cada rio,' ], [ 11.15, 12.2, 'cada criatura.' ] ]
};
const ONE = { cues: [ [ 0, 2, 'Olá.' ] ] };

describe('storyText', () => {
    it('lineText joins the cue texts with one space', () => {
        expect(lineText(LINE_2)).toBe('Até a noite em que as raízes tremeram.');
        expect(lineText(LINE_2)).toHaveLength(38);
    });

    it.each([
        [ -1, 0 ], [ 0, 0 ], [ 0.05, 0 ], [ 1.14, 14 ], [ 2.23, 29 ], [ 2.4, 29 ], [ 3.0, 33 ], [ 3.4, 38 ], [ 10, 38 ]
    ])('charsAt of prologue line 2 at %s s is %s', (t, expected) => {
        expect(charsAt(LINE_2, t)).toBe(expected);
    });

    it('charsAt of prologue line 1 is 43 at the end of the first cue, 61 halfway through the second and 138 at the end', () => {
        expect(charsAt(LINE_1, 3.51)).toBe(43);
        expect(charsAt(LINE_1, 5.42)).toBe(61);
        expect(charsAt(LINE_1, 12.2)).toBe(138);
    });

    it('the last cue brings no trailing space', () => {
        expect(charsAt(ONE, 1)).toBe(2);
        expect(charsAt(ONE, 2)).toBe(4);
        expect(charsAt(ONE, 5)).toBe(4);
    });
});
