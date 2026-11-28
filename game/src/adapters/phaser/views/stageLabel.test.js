import { describe, expect, it } from 'vitest';
import { renderStageLabel } from './stageLabel';

describe('renderStageLabel', () => {
    it('writes a campaign label as one text', () => {
        const node = document.createElement('div');

        renderStageLabel(node, 'Estágio 3/10  Miniboss');

        expect(node.textContent).toBe('Estágio 3/10  Miniboss');
        expect(node.childNodes.length).toBe(1);
        expect(node.querySelector('.stage-hud-chapter')).toBeNull();
    });

    it('writes a current chapter farm label as one text', () => {
        const node = document.createElement('div');

        renderStageLabel(node, 'Rever chefe: Chefe do capítulo');

        expect(node.textContent).toBe('Rever chefe: Chefe do capítulo');
        expect(node.querySelector('.stage-hud-chapter')).toBeNull();
    });

    it('puts the chapter of an earlier chapter miniboss on its own line', () => {
        const node = document.createElement('div');

        renderStageLabel(node, 'Rever chefe: Miniboss 3 (Capítulo 2)');

        expect(node.textContent).toBe('Rever chefe: Miniboss 3 (Capítulo 2)');
        expect(node.childNodes.length).toBe(2);
        expect(node.firstChild.nodeValue).toBe('Rever chefe: Miniboss 3');
        expect(node.querySelector('.stage-hud-chapter').textContent).toBe(' (Capítulo 2)');
    });

    it('puts a two digit chapter of an earlier chapter boss on its own line', () => {
        const node = document.createElement('div');

        renderStageLabel(node, 'Rever chefe: Chefe do capítulo (Capítulo 14)');

        expect(node.firstChild.nodeValue).toBe('Rever chefe: Chefe do capítulo');
        expect(node.querySelector('.stage-hud-chapter').textContent).toBe(' (Capítulo 14)');
    });

    it('replaces the two lines when the next label has no chapter', () => {
        const node = document.createElement('div');

        renderStageLabel(node, 'Rever chefe: Miniboss 3 (Capítulo 2)');
        renderStageLabel(node, 'Estágio 1/10  Fase 1/5');

        expect(node.textContent).toBe('Estágio 1/10  Fase 1/5');
        expect(node.childNodes.length).toBe(1);
        expect(node.querySelector('.stage-hud-chapter')).toBeNull();
    });

    it('leaves no child for an empty label', () => {
        const node = document.createElement('div');

        renderStageLabel(node, 'Rever chefe: Miniboss 3 (Capítulo 2)');
        renderStageLabel(node, '');

        expect(node.childNodes.length).toBe(0);
    });
});
