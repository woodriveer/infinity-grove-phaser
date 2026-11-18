import { beforeEach, describe, expect, it } from 'vitest';
import { VERSION_TESTID, mountVersionLabel, versionText } from './versionLabel';

const labels = () => document.querySelectorAll('[data-testid="game-version"]');

describe('versionText', () => {
    it('writes v before the version', () => {
        expect(versionText('0.4.1')).toBe('v0.4.1');
    });

    it('writes v0.0.0 for the unreleased version', () => {
        expect(versionText('0.0.0')).toBe('v0.0.0');
    });

    it('drops the whitespace around the version', () => {
        expect(versionText(' 0.4.1 ')).toBe('v0.4.1');
    });

    it('gives no text for an empty version', () => {
        expect(versionText('')).toBeNull();
    });

    it('gives no text for a version of spaces', () => {
        expect(versionText('   ')).toBeNull();
    });

    it('gives no text for an undefined version', () => {
        expect(versionText(undefined)).toBeNull();
    });

    it('gives no text for a null version', () => {
        expect(versionText(null)).toBeNull();
    });

    it('gives no text for a version that is not a string', () => {
        expect(versionText(41)).toBeNull();
    });
});

describe('mountVersionLabel', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('appends one label with the version text after the elements of the body', () => {
        document.body.innerHTML = '<div id="app"></div>';

        const label = mountVersionLabel('0.4.1');

        expect(label).toBe(document.body.lastElementChild);
        expect(document.body.children[0].id).toBe('app');
        expect(label.tagName).toBe('DIV');
        expect(label.className).toBe('game-version');
        expect(label.getAttribute('data-testid')).toBe('game-version');
        expect(label.textContent).toBe('v0.4.1');
        expect(labels().length).toBe(1);
    });

    it('rewrites the text of the label on a second mount and adds none', () => {
        const first = mountVersionLabel('0.4.0');
        const second = mountVersionLabel('0.4.1');

        expect(second).toBe(first);
        expect(first.textContent).toBe('v0.4.1');
        expect(labels().length).toBe(1);
    });

    it('adds no label for an empty version', () => {
        expect(mountVersionLabel('')).toBeNull();
        expect(labels().length).toBe(0);
    });

    it('adds no label for an undefined version', () => {
        expect(mountVersionLabel(undefined)).toBeNull();
        expect(labels().length).toBe(0);
    });

    it('adds no label for a version of spaces', () => {
        expect(mountVersionLabel('   ')).toBeNull();
        expect(labels().length).toBe(0);
    });

    it('names the test id game-version', () => {
        expect(VERSION_TESTID).toBe('game-version');
    });
});
