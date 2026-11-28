import { describe, expect, it } from 'vitest';
import { STORY_BACKDROPS, STORY_DEFAULT_MOTES, STORY_SCENES, storyScene } from './storyCatalog';
import { validateCatalog } from './storyScenes';
import { lineText } from './storyText';

const [ PROLOGUE, CHAPTER_1 ] = STORY_SCENES;

describe('storyCatalog', () => {
    it('the catalog breaks no rule', () => {
        expect(validateCatalog(STORY_SCENES, STORY_BACKDROPS)).toEqual([]);
    });

    it('the prologue opens at the start of chapter 1 with its title and end cards', () => {
        expect(PROLOGUE.id).toBe('prologue');
        expect(PROLOGUE.label).toBe('Prólogo');
        expect(PROLOGUE.trigger).toEqual({ kind: 'chapter-start', chapter: 1 });
        expect(PROLOGUE.title).toEqual({ logo: 'assets/story/logo.png', kicker: 'Ato 1 — Bosque Desperto · Prólogo', cta: 'Clique para começar' });
        expect(PROLOGUE.end).toEqual({ kicker: 'Fim do Prólogo', title: 'Ato 1 — Bosque Desperto', subtitle: 'Capítulo 1', cta: 'Clique para continuar' });
    });

    it('the prologue has the six lines of the design', () => {
        expect(PROLOGUE.lines.map(({ kind, speaker, face, backdrop, tints, tintAt, audio, duration }) => (
            { kind, speaker, face, backdrop, tints, tintAt, audio, duration }
        ))).toEqual([
            { kind: 'narrator', speaker: 'Narrador', face: undefined, backdrop: 'forest', tints: [], tintAt: undefined, audio: 'assets/story/prologue-01.mp4', duration: 12.36 },
            { kind: 'narrator', speaker: 'Narrador', face: undefined, backdrop: 'forest', tints: [ 'dark' ], tintAt: undefined, audio: 'assets/story/prologue-02.mp4', duration: 3.47 },
            { kind: 'narrator', speaker: 'Narrador', face: undefined, backdrop: 'forest', tints: [ 'dark', 'red' ], tintAt: { red: 6.1 }, audio: 'assets/story/prologue-03.mp4', duration: 7.47 },
            { kind: 'narrator', speaker: 'Narrador', face: undefined, backdrop: 'map', tints: [ 'gold' ], tintAt: undefined, audio: 'assets/story/prologue-04.mp4', duration: 6.11 },
            { kind: 'voice', speaker: 'A Voz', face: undefined, backdrop: 'forest', tints: [ 'dark', 'voice' ], tintAt: undefined, audio: 'assets/story/prologue-05.mp4', duration: 4.05 },
            { kind: 'character', speaker: 'Seraphine', face: 'assets/story/face-seraphine.jpg', backdrop: 'forest', tints: [], tintAt: undefined, audio: 'assets/story/prologue-06.mp4', duration: 6.35 }
        ]);
    });

    it('the prologue lines read the texts of the design', () => {
        expect(PROLOGUE.lines.map(lineText)).toEqual([
            'Eldora sempre respirou pela Grande Árvore. Suas raízes bebem do fundo do mundo, e sua seiva corre por cada folha, cada rio, cada criatura.',
            'Até a noite em que as raízes tremeram.',
            'Do fundo da terra subiu um rumor. E os animais do bosque abriram os olhos... Vermelhos.',
            'A Árvore despertou. E, entre milhares, escolheu cinco guardiões.',
            'Criança... venha. Eu preciso de você.',
            'Vocês também ouviram? Ela está nos chamando. A Árvore... está com medo.'
        ]);
        expect(PROLOGUE.lines.map((line) => lineText(line).length)).toEqual([ 138, 38, 87, 64, 37, 71 ]);
    });

    it('the prologue cue timings are the design\'s', () => {
        expect(PROLOGUE.lines[0].cues[0]).toEqual([ 0.05, 3.51, 'Eldora sempre respirou pela Grande Árvore.' ]);
        expect(PROLOGUE.lines[2].cues[2]).toEqual([ 6.23, 7.3, 'Vermelhos.' ]);
        expect(PROLOGUE.lines[5].cues[3]).toEqual([ 5.19, 6.2, 'está com medo.' ]);
        expect(PROLOGUE.lines.map((line) => line.cues.length)).toEqual([ 5, 2, 3, 3, 3, 4 ]);
    });

    it('the backdrops are the forest that drifts, the map that pans and the clearing with six cameras', () => {
        expect(STORY_BACKDROPS).toEqual({
            forest: { image: 'assets/story/bg-forest.png', motion: 'drift' },
            map: { image: 'assets/story/bg-map.jpg', motion: 'pan' },
            clearing: {
                image: 'assets/story/bg-clearing.jpg',
                motion: 'still',
                cameras: {
                    narr: { x: 0, y: -129, scale: 1.18, ms: 6000 },
                    kael: { x: -551, y: -350, scale: 1.75 },
                    lyra: { x: -934, y: -300, scale: 1.8 },
                    orina: { x: -896, y: -432, scale: 1.7 },
                    sera: { x: -1024, y: -277, scale: 1.8 },
                    vex: { x: -1024, y: -268, scale: 1.8 }
                }
            }
        });
    });

    it('the default motes are the 14 of the prologue design', () => {
        expect(STORY_DEFAULT_MOTES).toHaveLength(14);
        expect(STORY_DEFAULT_MOTES[0]).toEqual([ 608, 480, 1.04, 8.46 ]);
        expect(STORY_DEFAULT_MOTES[13]).toEqual([ 169, 312, 4.05, 7.54 ]);
    });

    it('chapter 1 opens after the chapter 1 boss with its cards', () => {
        expect(CHAPTER_1.id).toBe('chapter-1');
        expect(CHAPTER_1.label).toBe('Capítulo 1');
        expect(CHAPTER_1.trigger).toEqual({ kind: 'chapter-boss', chapter: 1 });
        expect(CHAPTER_1.letterbox).toBe(true);
        expect(CHAPTER_1.motes).toHaveLength(10);
        expect(CHAPTER_1.motes[0]).toEqual([ 120, 520, 0.4, 9.2 ]);
        expect(CHAPTER_1.title).toEqual({
            logo: 'assets/story/logo.png', kicker: 'Capítulo 1 — Final', title: 'A Devoradora da Clareira', cta: 'Clique para começar',
            action: 'Começar a cena', backdrop: 'clearing', tints: [ 'dark' ]
        });
        expect(CHAPTER_1.end).toEqual({
            kicker: 'Fim do Capítulo 1', title: 'A Devoradora da Clareira', subtitle: 'Ao amanhecer, os cinco guardiões avançam.', cta: 'Clique para continuar',
            backdrop: 'clearing', tints: [ 'dark', 'dawn' ]
        });
    });

    it('chapter 1 has the seven lines of its design', () => {
        const face = (hero) => `assets/story/face-${hero}.jpg`;
        const audio = (n) => `assets/story/chapter-01-0${n}.mp4`;
        const row = (kind, speaker, faceHero, camera, tints, n, duration) => (
            { kind, speaker, face: faceHero ? face(faceHero) : undefined, backdrop: 'clearing', camera, tints, audio: audio(n), duration }
        );

        expect(CHAPTER_1.lines.map(({ kind, speaker, face: lineFace, backdrop, camera, tints, audio: lineAudio, duration }) => (
            { kind, speaker, face: lineFace, backdrop, camera, tints, audio: lineAudio, duration }
        ))).toEqual([
            row('narrator', 'Narrador', undefined, 'narr', [ 'veins' ], 1, 6.03),
            row('character', 'Kael', 'kael', 'kael', [], 2, 5.64),
            row('character', 'Lyra', 'lyra', 'lyra', [], 3, 5.49),
            row('character', 'Orina', 'orina', 'orina', [ 'veins' ], 4, 8.91),
            row('character', 'Seraphine', 'seraphine', 'sera', [], 5, 5.25),
            row('character', 'Vex', 'vex', 'vex', [], 6, 4.83),
            row('character', 'Kael', 'kael', 'kael', [ 'dawn' ], 7, 4.05)
        ]);
    });

    it('chapter 1 lines read the texts of the script', () => {
        expect(CHAPTER_1.lines.map(lineText)).toEqual([
            'A Serpente Umbral tomba na clareira, e o veneno roxo escorre de volta para a terra.',
            'Uma serpente desse tamanho, aqui? Isto não é do nosso bosque.',
            'Olha os olhos dela, Kael! Ainda brilham. Vermelho, vermelho, como brasa!',
            'Interessante... As veias roxas pulsam no mesmo ritmo. Como se algo lá embaixo respirasse por elas.',
            'A Árvore diz que isto é só o começo. Precisamos ficar juntos.',
            'Ela diz, é? Sorte a sua. Comigo ninguém conversa.',
            'Deixe de reclamar, espião. Avançamos ao amanhecer!'
        ]);
        expect(CHAPTER_1.lines.map((line) => lineText(line).length)).toEqual([ 83, 61, 72, 98, 61, 49, 50 ]);
    });

    it('chapter 1 cue timings are the design\'s', () => {
        expect(CHAPTER_1.lines[2].cues[1]).toEqual([ 1.7, 2.7, 'Ainda brilham.' ]);
        expect(CHAPTER_1.lines[6].cues).toEqual([ [ 0.05, 1.78, 'Deixe de reclamar, espião.' ], [ 2.14, 3.77, 'Avançamos ao amanhecer!' ] ]);
        expect(CHAPTER_1.lines.map((line) => line.cues.length)).toEqual([ 2, 3, 3, 3, 2, 3, 2 ]);
    });

    it('storyScene finds a scene by id', () => {
        expect(storyScene('prologue')).toBe(STORY_SCENES[0]);
        expect(storyScene('chapter-1')).toBe(STORY_SCENES[1]);
        expect(storyScene('chapter-99')).toBeNull();
    });
});
