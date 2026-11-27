//  Whether Shift is held (spec ui-polish UIP-10). No keyup reaches the page when Shift is released outside the window, so blur and a hidden tab end it and every key or pointer event resets it from its shiftKey.
//  Ports:
//    win       { addEventListener, removeEventListener }  the window: keydown, keyup, pointermove, pointerdown and blur, in the capture phase
//    doc       { visibilityState, addEventListener, removeEventListener }  the document: visibilitychange
//    onChange  (held) => void  called only when the value changes
export const createShiftKey = ({ win = window, doc = document, onChange = () => {} } = {}) =>
{
    let held = false;

    const set = (value) =>
    {
        if (value === held)
        {
            return;
        }

        held = value;
        onChange(value);
    };

    const onKeyDown = (event) => set(event.key === 'Shift' ? true : event.shiftKey === true);
    const onKeyUp = (event) => set(event.key === 'Shift' ? false : event.shiftKey === true);
    const onPointer = (event) => set(event.shiftKey === true);
    //  A capture listener also sees the blur of every element inside the page; only the window losing focus ends Shift
    const onBlur = (event) => set(event.target === win ? false : held);
    const onVisibility = () =>
    {
        if (doc.visibilityState === 'hidden')
        {
            set(false);
        }
    };

    win.addEventListener('keydown', onKeyDown, true);
    win.addEventListener('keyup', onKeyUp, true);
    win.addEventListener('pointermove', onPointer, true);
    win.addEventListener('pointerdown', onPointer, true);
    win.addEventListener('blur', onBlur, true);
    doc.addEventListener('visibilitychange', onVisibility);

    return {
        held: () => held,

        dispose: () =>
        {
            win.removeEventListener('keydown', onKeyDown, true);
            win.removeEventListener('keyup', onKeyUp, true);
            win.removeEventListener('pointermove', onPointer, true);
            win.removeEventListener('pointerdown', onPointer, true);
            win.removeEventListener('blur', onBlur, true);
            doc.removeEventListener('visibilitychange', onVisibility);
        }
    };
};
