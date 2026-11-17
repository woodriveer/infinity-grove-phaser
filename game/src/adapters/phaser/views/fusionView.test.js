import { describe, expect, it } from 'vitest';
import { renderFusionResult } from './fusionView';

describe('renderFusionResult', () => {
    it('shows the hero and the stars of the new card', () => {
        const result = renderFusionResult({ heroName: 'Kael Raizférrea', stars: 2 });

        expect(result.getAttribute('data-testid')).toBe('fusion-result');
        expect(result.textContent).toBe('Nova carta: Kael Raizférrea 2★');
    });

    it('the result of a fusion to 4 to 9 stars names the raised skill and its level', () => {
        expect(renderFusionResult({ heroName: 'Kael Raizférrea', stars: 4, skillName: 'Corte Dimensional', level: 2 }).textContent)
            .toBe('Nova carta: Kael Raizférrea 4★ · Corte Dimensional no nível 2');
        expect(renderFusionResult({ heroName: 'Kael Raizférrea', stars: 9, skillName: 'Brado Aterrador', level: 3 }).textContent)
            .toBe('Nova carta: Kael Raizférrea 9★ · Brado Aterrador no nível 3');
    });

    it('the result of a fusion to 1 to 3 stars reads as before', () => {
        expect(renderFusionResult({ heroName: 'Kael Raizférrea', stars: 3, skillName: 'Brado Aterrador', level: 1 }).textContent)
            .toBe('Nova carta: Kael Raizférrea 3★');
    });

    it('a 4 star result without a skill name reads only the card', () => {
        expect(renderFusionResult({ heroName: 'Kael Raizférrea', stars: 4, level: 2 }).textContent).toBe('Nova carta: Kael Raizférrea 4★');
    });
});
