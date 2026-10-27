import { beforeEach, describe, expect, it } from 'vitest';
import { createAutoClickPreference } from './autoClickPreference';

const broken = () => ({
    getItem: () => { throw new Error('denied'); },
    setItem: () => { throw new Error('denied'); }
});

describe('autoClickPreference', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('is on the first time', () => {
        expect(createAutoClickPreference().enabled()).toBe(true);
    });

    it('stores the switch turned off under infinity-grove.auto-click and restores it in a new preference', () => {
        createAutoClickPreference().setEnabled(false);

        expect(localStorage.getItem('infinity-grove.auto-click')).toBe('off');
        expect(createAutoClickPreference().enabled()).toBe(false);
    });

    it('restores the switch turned on again', () => {
        const preference = createAutoClickPreference();

        preference.setEnabled(false);
        preference.setEnabled(true);

        expect(createAutoClickPreference().enabled()).toBe(true);
    });

    it('is on when storage cannot be read and ignores a failed write', () => {
        const preference = createAutoClickPreference(broken);

        expect(() => preference.setEnabled(false)).not.toThrow();
        expect(preference.enabled()).toBe(true);
    });

    it('is on when touching localStorage itself throws', () => {
        const preference = createAutoClickPreference(() => { throw new Error('SecurityError'); });

        expect(preference.enabled()).toBe(true);
    });
});
