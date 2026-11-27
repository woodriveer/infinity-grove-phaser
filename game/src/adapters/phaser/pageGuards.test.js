import { afterEach, describe, expect, it } from 'vitest';
import { installPageGuards, isTextField } from './pageGuards';

const added = [];
const make = (html) =>
{
    const holder = document.createElement('div');
    holder.innerHTML = html;
    const node = holder.firstElementChild;
    document.body.append(node);
    added.push(node);
    return node;
};

const contextmenu = (target) =>
{
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
};

const dragstart = (target) =>
{
    const event = new Event('dragstart', { bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
};

afterEach(() =>
{
    added.splice(0).forEach((node) => node.remove());
});

describe('isTextField', () =>
{
    it('is true for a text input, a password input, an input with no type, a textarea, a select, a contenteditable div and a span inside it', () =>
    {
        expect(isTextField(make('<input type="text">'))).toBe(true);
        expect(isTextField(make('<input type="password">'))).toBe(true);
        expect(isTextField(make('<input>'))).toBe(true);
        expect(isTextField(make('<textarea></textarea>'))).toBe(true);
        expect(isTextField(make('<select><option>a</option></select>'))).toBe(true);
        const editable = make('<div contenteditable="true"><span>text</span></div>');
        expect(isTextField(editable)).toBe(true);
        expect(isTextField(editable.querySelector('span'))).toBe(true);
    });

    it('is false for a checkbox, a radio, a button input, a button, a div, an img, a canvas, null and the document', () =>
    {
        expect(isTextField(make('<input type="checkbox">'))).toBe(false);
        expect(isTextField(make('<input type="radio">'))).toBe(false);
        expect(isTextField(make('<input type="button">'))).toBe(false);
        expect(isTextField(make('<button></button>'))).toBe(false);
        expect(isTextField(make('<div></div>'))).toBe(false);
        expect(isTextField(make('<img alt="">'))).toBe(false);
        expect(isTextField(make('<canvas></canvas>'))).toBe(false);
        expect(isTextField(null)).toBe(false);
        expect(isTextField(document)).toBe(false);
    });
});

describe('installPageGuards', () =>
{
    it('cancels contextmenu on a div, an img and a canvas', () =>
    {
        const remove = installPageGuards(document);
        expect(contextmenu(make('<div></div>')).defaultPrevented).toBe(true);
        expect(contextmenu(make('<img alt="">')).defaultPrevented).toBe(true);
        expect(contextmenu(make('<canvas></canvas>')).defaultPrevented).toBe(true);
        remove();
    });

    it('keeps contextmenu on a text input and a password input', () =>
    {
        const remove = installPageGuards(document);
        expect(contextmenu(make('<input type="text">')).defaultPrevented).toBe(false);
        expect(contextmenu(make('<input type="password">')).defaultPrevented).toBe(false);
        remove();
    });

    it('cancels dragstart on an img and a div', () =>
    {
        const remove = installPageGuards(document);
        expect(dragstart(make('<img alt="">')).defaultPrevented).toBe(true);
        expect(dragstart(make('<div></div>')).defaultPrevented).toBe(true);
        remove();
    });

    it('keeps dragstart on a text input', () =>
    {
        const remove = installPageGuards(document);
        expect(dragstart(make('<input type="text">')).defaultPrevented).toBe(false);
        remove();
    });

    it('the returned function removes both listeners', () =>
    {
        const remove = installPageGuards(document);
        remove();
        const div = make('<div></div>');
        expect(contextmenu(div).defaultPrevented).toBe(false);
        expect(dragstart(div).defaultPrevented).toBe(false);
    });
});
