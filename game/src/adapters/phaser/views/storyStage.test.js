import { describe, expect, it, vi } from 'vitest';
import { STORY_BACKDROPS, STORY_SCENES } from '../../../domain/story/storyCatalog';
import { createStoryStage } from './storyStage';

const [ PROLOGUE, CH1 ] = STORY_SCENES;
const TITLE = { phase: 'title', index: 0, complete: false };
const END = { phase: 'end', index: 5, complete: false };
const line = (index, complete = false) => ({ phase: 'line', index, complete });

const build = (scene = PROLOGUE) =>
{
    const callbacks = { onHit: vi.fn(), onSkip: vi.fn(), onMute: vi.fn() };
    const stage = createStoryStage({ scene, backdrops: STORY_BACKDROPS, ...callbacks });
    const paint = (state, { shown = 0, t = 0, muted = false } = {}) => stage.update({ state, shown, t, muted });
    const q = (selector) => stage.root.querySelector(selector);
    const all = (selector) => [ ...stage.root.querySelectorAll(selector) ];
    const id = (testid) => q(`[data-testid="${testid}"]`);

    return { ...callbacks, stage, paint, q, all, id };
};

describe('storyStage', () => {
    it('the overlay is a modal dialog named after the scene', () => {
        const { stage } = build();

        expect(stage.root.dataset.testid).toBe('story-overlay');
        expect(stage.root.getAttribute('role')).toBe('dialog');
        expect(stage.root.getAttribute('aria-modal')).toBe('true');
        expect(stage.root.getAttribute('aria-label')).toBe('História: Prólogo');
    });

    it('draws one backdrop per entry with its image and motion', () => {
        const { all, q } = build();

        expect(all('.story-backdrop')).toHaveLength(3);
        expect(q('[data-backdrop="forest"]').classList.contains('is-drift')).toBe(true);
        expect(q('[data-backdrop="forest"]').style.backgroundImage).toContain('assets/story/bg-forest.png');
        expect(q('[data-backdrop="map"]').classList.contains('is-pan')).toBe(true);
        expect(q('[data-backdrop="map"]').style.backgroundImage).toContain('assets/story/bg-map.jpg');
    });

    it('draws the six tints and fourteen motes', () => {
        const { all, id, stage } = build();
        const order = [ ...stage.stage.children ].filter((node) => node.classList.contains('story-tint')).map((node) => node.className.replace('story-tint ', ''));

        expect(order).toEqual([ 'is-dawn', 'is-dark', 'is-red', 'is-gold', 'is-voice' ]);
        expect(stage.stage.children[0]).toBe(id('story-camera'));
        expect(id('story-camera').querySelectorAll('.story-tint.is-veins')).toHaveLength(1);
        expect(all('.story-mote')).toHaveLength(14);
        expect(all('.story-mote')[0].style.left).toBe('608px');
        expect(all('.story-mote')[0].style.top).toBe('480px');
        expect(all('.story-mote')[0].style.animationDelay).toBe('1.04s');
        expect(all('.story-mote')[0].style.animationDuration).toBe('8.46s');
    });

    it('the prologue has no letterbox bars and the chapter-start class', () => {
        const { all, stage } = build();

        expect(all('.story-bar')).toHaveLength(0);
        expect(stage.root.classList.contains('is-chapter-start')).toBe(true);
    });

    it('the chapter 1 overlay has bars, ten motes and the chapter-boss class', () => {
        const { all, stage } = build(CH1);

        expect(all('.story-bar').map((bar) => bar.classList.contains('is-top') ? 'is-top' : 'is-bottom')).toEqual([ 'is-top', 'is-bottom' ]);
        expect(all('.story-mote')).toHaveLength(10);
        expect(all('.story-mote')[0].style.left).toBe('120px');
        expect(stage.root.classList.contains('is-chapter-boss')).toBe(true);
    });

    it('the bars are on while a line plays and off on the cards', () => {
        const { all, paint } = build(CH1);
        const lit = () => all('.story-bar.is-on').length;

        paint(TITLE);
        expect(lit()).toBe(0);

        paint(line(0));
        expect(lit()).toBe(2);

        paint({ phase: 'end', index: 6, complete: false });
        expect(lit()).toBe(0);
    });

    it('the chapter 1 title card shows its kicker, title, call and action', () => {
        const { id, paint, q } = build(CH1);

        paint(TITLE);

        expect(q('.story-kicker').textContent).toBe('Capítulo 1 — Final');
        expect(q('.story-cardtitle').textContent).toBe('A Devoradora da Clareira');
        expect(q('.story-cta').textContent).toBe('Clique para começar');
        expect(id('story-hit').getAttribute('aria-label')).toBe('Começar a cena');
        expect(q('[data-backdrop="clearing"]').classList.contains('is-on')).toBe(true);
        expect(q('.story-tint.is-dark').classList.contains('is-on')).toBe(true);

        const prologue = build();

        prologue.paint(TITLE);
        expect(prologue.q('.story-cardtitle')).toBeNull();
    });

    it('the chapter 1 end card shows its texts and the dawn', () => {
        const { id, paint, q } = build(CH1);

        paint({ phase: 'end', index: 6, complete: false });

        expect(q('.story-kicker').textContent).toBe('Fim do Capítulo 1');
        expect(q('.story-endtitle').textContent).toBe('A Devoradora da Clareira');
        expect(q('.story-endsub').textContent).toBe('Ao amanhecer, os cinco guardiões avançam.');
        expect(q('.story-cta').textContent).toBe('Clique para continuar');
        expect(id('story-hit').getAttribute('aria-label')).toBe('Continuar');
        expect(q('.story-tint.is-dark').classList.contains('is-on')).toBe(true);
        expect(q('.story-tint.is-dawn').classList.contains('is-on')).toBe(true);
    });

    it('the camera moves to the line\'s preset', () => {
        const { id, paint } = build(CH1);
        const camera = () => [ id('story-camera').style.transform, id('story-camera').style.transitionDuration ];

        paint(line(1));
        expect(camera()).toEqual([ 'translate(-551px, -350px) scale(1.75)', '1800ms' ]);

        paint(line(0));
        expect(camera()).toEqual([ 'translate(0px, -129px) scale(1.18)', '6000ms' ]);

        paint(TITLE);
        expect(camera()[0]).toBe('translate(0px, 0px) scale(1)');
    });

    it('a repaint of the same line does not rewrite the camera', () => {
        const { id, paint } = build(CH1);

        paint(line(1), { t: 0.5 });
        id('story-camera').style.transitionDuration = '999ms';
        paint(line(1), { t: 1.0 });

        expect(id('story-camera').style.transitionDuration).toBe('999ms');
    });

    it('the prologue camera stays wide', () => {
        const { id, paint } = build();

        [ TITLE, line(0), line(3), line(5, true), END ].forEach((state) =>
        {
            paint(state);
            expect(id('story-camera').style.transform).toBe('translate(0px, 0px) scale(1)');
        });
    });

    it('a face line shows the round face inside the wide box', () => {
        const { id, paint, q } = build(CH1);

        paint(line(1));

        expect(id('story-face').getAttribute('src')).toBe('assets/story/face-kael.jpg');
        expect(id('story-face').getAttribute('alt')).toBe('Kael');
        expect(q('.story-box').classList.contains('is-face')).toBe(true);
        expect(id('story-speaker').textContent).toBe('Kael');
        expect(id('story-portrait')).toBeNull();
    });

    it('the veins show on lines 1 and 4 and the dawn on line 7', () => {
        const { paint, q } = build(CH1);
        const on = (name) => q(`.story-tint.is-${name}`).classList.contains('is-on');

        paint(line(0));
        expect(on('veins')).toBe(true);

        paint(line(3));
        expect(on('veins')).toBe(true);

        paint(line(1));
        expect(on('veins')).toBe(false);

        paint(line(6));
        expect(on('dawn')).toBe(true);
        expect(on('veins')).toBe(false);
    });

    it('the title card shows the logo, the kicker and the call', () => {
        const { id, paint, q } = build();

        paint(TITLE);

        expect(q('.story-logo').getAttribute('src')).toBe('assets/story/logo.png');
        expect(q('.story-logo').getAttribute('alt')).toBe('Infinity Grove');
        expect(q('.story-kicker').textContent).toBe('Ato 1 — Bosque Desperto · Prólogo');
        expect(q('.story-cta').textContent).toBe('Clique para começar');
        expect(id('story-hit').getAttribute('aria-label')).toBe('Começar a história');
    });

    it('the title card shows the dark forest and no dots', () => {
        const { all, paint, q } = build();

        paint(TITLE);

        expect(q('[data-backdrop="forest"]').classList.contains('is-on')).toBe(true);
        expect(q('[data-backdrop="map"]').classList.contains('is-on')).toBe(false);
        expect(all('.story-tint.is-on').map((node) => node.className)).toEqual([ 'story-tint is-dark is-on' ]);
        expect(q('.story-dots').hidden).toBe(true);
    });

    it('a typing narrator line splits its text at the shown count', () => {
        const { id, paint, q } = build();

        paint(line(1), { shown: 14 });

        expect(id('story-text').classList.contains('story-narr')).toBe(true);
        expect(q('.story-shown').textContent).toBe('Até a noite em');
        expect(q('.story-ghost').textContent).toBe(' que as raízes tremeram.');
        expect(q('.story-next').hidden).toBe(true);
        expect(id('story-speaker')).toBeNull();
        expect(id('story-hit').getAttribute('aria-label')).toBe('Mostrar fala completa');
    });

    it('a complete line shows the next arrow and the next label', () => {
        const { id, paint, q } = build();

        paint(line(1, true), { shown: 38 });

        expect(q('.story-next').hidden).toBe(false);
        expect(id('story-hit').getAttribute('aria-label')).toBe('Próxima fala');
    });

    it('lights the dots up to the current line', () => {
        const { all, paint, q } = build();

        paint(line(2));

        expect(all('.story-dot')).toHaveLength(6);
        expect(all('.story-dot.is-on')).toHaveLength(3);
        expect(q('.story-dots').hidden).toBe(false);
    });

    it('the voice line shows the orb, the plate and italic text', () => {
        const { id, paint, q } = build();

        paint(line(4));

        expect(id('story-orb')).not.toBeNull();
        expect(id('story-speaker').textContent).toBe('A Voz');
        expect(q('.story-box').classList.contains('is-voice')).toBe(true);
        expect(id('story-text').className).toBe('story-line is-italic');
    });

    it('the character line shows the portrait, the plate and upright text', () => {
        const { id, paint, q } = build();

        paint(line(5));

        expect(id('story-portrait').getAttribute('src')).toBe('assets/story/portrait-seraphine.png');
        expect(id('story-portrait').getAttribute('alt')).toBe('Seraphine');
        expect(id('story-speaker').textContent).toBe('Seraphine');
        expect(q('.story-box').classList.contains('is-character')).toBe(true);
        expect(id('story-text').classList.contains('is-italic')).toBe(false);
    });

    it('the end card shows its texts and the Continuar label', () => {
        const { id, paint, q } = build();

        paint(END);

        expect(q('.story-kicker').textContent).toBe('Fim do Prólogo');
        expect(q('.story-endtitle').textContent).toBe('Ato 1 — Bosque Desperto');
        expect(q('.story-endsub').textContent).toBe('Capítulo 1');
        expect(q('.story-cta').textContent).toBe('Clique para continuar');
        expect(id('story-hit').getAttribute('aria-label')).toBe('Continuar');
        expect(q('.story-dots').hidden).toBe(true);
    });

    it('line 3 turns the red tint on at 6.1 s', () => {
        const { paint, q } = build();
        const tint = (name) => q(`.story-tint.is-${name}`).classList.contains('is-on');

        paint(line(2), { t: 6.0 });
        expect(tint('red')).toBe(false);
        expect(tint('dark')).toBe(true);

        paint(line(2), { t: 6.1 });
        expect(tint('red')).toBe(true);
    });

    it('line 4 shows the map and the gold tint', () => {
        const { paint, q } = build();

        paint(line(3));

        expect(q('[data-backdrop="map"]').classList.contains('is-on')).toBe(true);
        expect(q('[data-backdrop="forest"]').classList.contains('is-on')).toBe(false);
        expect(q('.story-tint.is-gold').classList.contains('is-on')).toBe(true);
    });

    it('keeps the content node while the line does not change', () => {
        const { paint, q } = build();

        paint(line(1), { shown: 5 });
        const first = q('.story-content').firstChild;

        paint(line(1), { shown: 20 });

        expect(q('.story-content').firstChild).toBe(first);
    });

    it('rebuilds the content node on the next line', () => {
        const { paint, q } = build();

        paint(line(1));
        const first = q('.story-content').firstChild;

        paint(line(2));

        expect(q('.story-content').firstChild).not.toBe(first);
    });

    it('the mute button reads Silenciar, then Ativar som when muted', () => {
        const { id, paint } = build();

        paint(TITLE, { muted: false });
        expect(id('story-mute').getAttribute('aria-label')).toBe('Silenciar');
        expect(id('story-mute').getAttribute('aria-pressed')).toBe('false');

        paint(TITLE, { muted: true });
        expect(id('story-mute').getAttribute('aria-label')).toBe('Ativar som');
        expect(id('story-mute').getAttribute('aria-pressed')).toBe('true');
        expect(id('story-mute').querySelector('svg')).not.toBeNull();
    });

    it('the Pular button reads Pular', () => {
        const { id } = build();

        expect(id('story-skip').textContent).toBe('Pular');
        expect(id('story-skip').type).toBe('button');
        expect(id('story-skip').className).toBe('story-skip');
    });

    it('a click on the hit button calls onHit once and no other callback', () => {
        const { id, onHit, onMute, onSkip } = build();

        id('story-hit').click();

        expect(onHit).toHaveBeenCalledTimes(1);
        expect(onSkip).not.toHaveBeenCalled();
        expect(onMute).not.toHaveBeenCalled();
    });

    it('a click on Pular calls onSkip once and no other callback', () => {
        const { id, onHit, onMute, onSkip } = build();

        id('story-skip').click();

        expect(onSkip).toHaveBeenCalledTimes(1);
        expect(onHit).not.toHaveBeenCalled();
        expect(onMute).not.toHaveBeenCalled();
    });

    it('a click on the mute button calls onMute once and no other callback', () => {
        const { id, onHit, onMute, onSkip } = build();

        id('story-mute').click();

        expect(onMute).toHaveBeenCalledTimes(1);
        expect(onHit).not.toHaveBeenCalled();
        expect(onSkip).not.toHaveBeenCalled();
    });
});
