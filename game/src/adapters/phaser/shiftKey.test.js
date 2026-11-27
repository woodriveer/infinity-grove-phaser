import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createShiftKey } from './shiftKey';

describe('createShiftKey', () => {
    let win;
    let doc;
    let onChange;
    let shift;

    const keydown = (key, extra = {}) => win.dispatchEvent(new KeyboardEvent('keydown', { key, ...extra }));
    const keyup = (key, extra = {}) => win.dispatchEvent(new KeyboardEvent('keyup', { key, ...extra }));

    beforeEach(() => {
        win = new EventTarget();
        doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
        onChange = vi.fn();
        shift = createShiftKey({ win, doc, onChange });
    });

    it('starts off', () => {
        expect(shift.held()).toBe(false);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('a Shift keydown turns it on once, auto-repeat included', () => {
        keydown('Shift', { shiftKey: true });

        expect(shift.held()).toBe(true);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(true);

        keydown('Shift', { shiftKey: true, repeat: true });

        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('a Shift keyup turns it off', () => {
        keydown('Shift', { shiftKey: true });
        keyup('Shift', { shiftKey: false });

        expect(shift.held()).toBe(false);
        expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it('another key sets it from its shiftKey', () => {
        keydown('a', { shiftKey: true });

        expect(shift.held()).toBe(true);

        keyup('a', { shiftKey: false });

        expect(shift.held()).toBe(false);
    });

    it('a pointer move or press sets it from its shiftKey', () => {
        win.dispatchEvent(new MouseEvent('pointermove', { shiftKey: true }));

        expect(shift.held()).toBe(true);

        win.dispatchEvent(new MouseEvent('pointerdown', { shiftKey: false }));

        expect(shift.held()).toBe(false);
    });

    it('blur turns it off', () => {
        keydown('Shift', { shiftKey: true });
        win.dispatchEvent(new Event('blur'));

        expect(shift.held()).toBe(false);
    });

    it('a hidden document turns it off and a visible one does not', () => {
        keydown('Shift', { shiftKey: true });

        doc.visibilityState = 'visible';
        doc.dispatchEvent(new Event('visibilitychange'));

        expect(shift.held()).toBe(true);

        doc.visibilityState = 'hidden';
        doc.dispatchEvent(new Event('visibilitychange'));

        expect(shift.held()).toBe(false);
    });

    it('releasing one of two held Shift keys turns it off', () => {
        keydown('Shift', { shiftKey: true });
        keydown('Shift', { shiftKey: true });
        keyup('Shift', { shiftKey: true });

        expect(shift.held()).toBe(false);
    });

    it('dispose removes every listener', () => {
        shift.dispose();

        keydown('Shift', { shiftKey: true });
        win.dispatchEvent(new MouseEvent('pointermove', { shiftKey: true }));

        expect(shift.held()).toBe(false);
        expect(onChange).not.toHaveBeenCalled();
    });
});
