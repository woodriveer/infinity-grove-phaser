//  The story of the game (spec story-scenes): the backdrops and the scenes. A content feature adds a scene here and its files
//  under game/public/assets/story/; storyCatalog.test.js validates it and storyAssets.test.js checks every file.

//  A backdrop: the image (path under game/public) and its slow motion; `cameras` aim at the faces of the painting (`wide` always exists)
export const STORY_BACKDROPS = {
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
};

//  The motes of a scene that lists none: [left px, top px, delay s, duration s]
export const STORY_DEFAULT_MOTES = [
    [ 608, 480, 1.04, 8.46 ], [ 550, 453, 0.71, 12.27 ], [ 731, 405, 2.56, 11.69 ], [ 815, 238, 4.49, 8.41 ], [ 833, 279, 5.04, 9.92 ],
    [ 218, 225, 8.45, 12.82 ], [ 150, 422, 8.6, 8.13 ], [ 520, 475, 6.05, 8.68 ], [ 211, 693, 4.01, 8.4 ], [ 678, 365, 1.38, 11.64 ],
    [ 436, 375, 0.72, 12.56 ], [ 296, 642, 4.24, 8.42 ], [ 748, 401, 6.83, 10.92 ], [ 169, 312, 4.05, 7.54 ]
];

export const STORY_SCENES = [
    {
        id: 'prologue',
        label: 'Prólogo',
        trigger: { kind: 'chapter-start', chapter: 1 },
        title: { logo: 'assets/story/logo.png', kicker: 'Ato 1 — Bosque Desperto · Prólogo', cta: 'Clique para começar' },
        end: { kicker: 'Fim do Prólogo', title: 'Ato 1 — Bosque Desperto', subtitle: 'Capítulo 1', cta: 'Clique para continuar' },
        lines: [
            {
                kind: 'narrator', speaker: 'Narrador', backdrop: 'forest', tints: [], audio: 'assets/story/prologue-01.mp4', duration: 12.36,
                cues: [ [ 0.05, 3.51, 'Eldora sempre respirou pela Grande Árvore.' ], [ 4.11, 6.73, 'Suas raízes bebem do fundo do mundo,' ],
                    [ 7.25, 9.65, 'e sua seiva corre por cada folha,' ], [ 10.0, 10.7, 'cada rio,' ], [ 11.15, 12.2, 'cada criatura.' ] ]
            },
            {
                kind: 'narrator', speaker: 'Narrador', backdrop: 'forest', tints: [ 'dark' ], audio: 'assets/story/prologue-02.mp4', duration: 3.47,
                cues: [ [ 0.05, 2.23, 'Até a noite em que as raízes' ], [ 2.6, 3.4, 'tremeram.' ] ]
            },
            {
                kind: 'narrator', speaker: 'Narrador', backdrop: 'forest', tints: [ 'dark', 'red' ], tintAt: { red: 6.1 }, audio: 'assets/story/prologue-03.mp4', duration: 7.47,
                cues: [ [ 0.05, 2.28, 'Do fundo da terra subiu um rumor.' ], [ 2.98, 5.24, 'E os animais do bosque abriram os olhos...' ], [ 6.23, 7.3, 'Vermelhos.' ] ]
            },
            {
                kind: 'narrator', speaker: 'Narrador', backdrop: 'map', tints: [ 'gold' ], audio: 'assets/story/prologue-04.mp4', duration: 6.11,
                cues: [ [ 0.05, 1.53, 'A Árvore despertou.' ], [ 2.08, 3.66, 'E, entre milhares,' ], [ 4.06, 6.0, 'escolheu cinco guardiões.' ] ]
            },
            {
                kind: 'voice', speaker: 'A Voz', backdrop: 'forest', tints: [ 'dark', 'voice' ], audio: 'assets/story/prologue-05.mp4', duration: 4.05,
                cues: [ [ 0.05, 1.03, 'Criança...' ], [ 1.39, 2.04, 'venha.' ], [ 2.57, 3.9, 'Eu preciso de você.' ] ]
            },
            {
                kind: 'character', speaker: 'Seraphine', face: 'assets/story/face-seraphine.jpg', backdrop: 'forest', tints: [], audio: 'assets/story/prologue-06.mp4', duration: 6.35,
                cues: [ [ 0.05, 1.46, 'Vocês também ouviram?' ], [ 2.1, 3.4, 'Ela está nos chamando.' ], [ 4.02, 4.82, 'A Árvore...' ], [ 5.19, 6.2, 'está com medo.' ] ]
            }
        ]
    },
    {
        id: 'chapter-1',
        label: 'Capítulo 1',
        trigger: { kind: 'chapter-boss', chapter: 1 },
        letterbox: true,
        motes: [
            [ 120, 520, 0.4, 9.2 ], [ 260, 380, 2.1, 11 ], [ 430, 600, 4.3, 8.4 ], [ 590, 300, 1.2, 10.6 ], [ 720, 560, 5.6, 9.8 ],
            [ 860, 420, 3.2, 12.1 ], [ 990, 640, 6.4, 8.8 ], [ 1110, 350, 0.9, 10.2 ], [ 1210, 520, 7.3, 9.4 ], [ 340, 250, 8.1, 11.6 ]
        ],
        title: {
            logo: 'assets/story/logo.png', kicker: 'Capítulo 1 — Final', title: 'A Devoradora da Clareira', cta: 'Clique para começar',
            action: 'Começar a cena', backdrop: 'clearing', tints: [ 'dark' ]
        },
        end: {
            kicker: 'Fim do Capítulo 1', title: 'A Devoradora da Clareira', subtitle: 'Ao amanhecer, os cinco guardiões avançam.', cta: 'Clique para continuar',
            backdrop: 'clearing', tints: [ 'dark', 'dawn' ]
        },
        lines: [
            {
                kind: 'narrator', speaker: 'Narrador', backdrop: 'clearing', camera: 'narr', tints: [ 'veins' ], audio: 'assets/story/chapter-01-01.mp4', duration: 6.03,
                cues: [ [ 0.05, 2.51, 'A Serpente Umbral tomba na clareira,' ], [ 2.93, 5.78, 'e o veneno roxo escorre de volta para a terra.' ] ]
            },
            {
                kind: 'character', speaker: 'Kael', face: 'assets/story/face-kael.jpg', backdrop: 'clearing', camera: 'kael', tints: [], audio: 'assets/story/chapter-01-02.mp4', duration: 5.64,
                cues: [ [ 0.05, 2.23, 'Uma serpente desse tamanho,' ], [ 2.5, 3.13, 'aqui?' ], [ 3.64, 5.34, 'Isto não é do nosso bosque.' ] ]
            },
            {
                kind: 'character', speaker: 'Lyra', face: 'assets/story/face-lyra.jpg', backdrop: 'clearing', camera: 'lyra', tints: [], audio: 'assets/story/chapter-01-03.mp4', duration: 5.49,
                cues: [ [ 0.05, 1.7, 'Olha os olhos dela, Kael!' ], [ 1.7, 2.7, 'Ainda brilham.' ], [ 2.7, 5.2, 'Vermelho, vermelho, como brasa!' ] ]
            },
            {
                kind: 'character', speaker: 'Orina', face: 'assets/story/face-orina.jpg', backdrop: 'clearing', camera: 'orina', tints: [ 'veins' ], audio: 'assets/story/chapter-01-04.mp4', duration: 8.91,
                cues: [ [ 0.05, 1.29, 'Interessante...' ], [ 2.38, 4.99, 'As veias roxas pulsam no mesmo ritmo.' ], [ 5.71, 8.8, 'Como se algo lá embaixo respirasse por elas.' ] ]
            },
            {
                kind: 'character', speaker: 'Seraphine', face: 'assets/story/face-seraphine.jpg', backdrop: 'clearing', camera: 'sera', tints: [], audio: 'assets/story/chapter-01-05.mp4', duration: 5.25,
                cues: [ [ 0.05, 2.83, 'A Árvore diz que isto é só o começo.' ], [ 3.24, 5.2, 'Precisamos ficar juntos.' ] ]
            },
            {
                kind: 'character', speaker: 'Vex', face: 'assets/story/face-vex.jpg', backdrop: 'clearing', camera: 'vex', tints: [], audio: 'assets/story/chapter-01-06.mp4', duration: 4.83,
                cues: [ [ 0.05, 1.06, 'Ela diz, é?' ], [ 1.8, 2.66, 'Sorte a sua.' ], [ 3.06, 4.49, 'Comigo ninguém conversa.' ] ]
            },
            {
                kind: 'character', speaker: 'Kael', face: 'assets/story/face-kael.jpg', backdrop: 'clearing', camera: 'kael', tints: [ 'dawn' ], audio: 'assets/story/chapter-01-07.mp4', duration: 4.05,
                cues: [ [ 0.05, 1.78, 'Deixe de reclamar, espião.' ], [ 2.14, 3.77, 'Avançamos ao amanhecer!' ] ]
            }
        ]
    }
];

export const storyScene = (id) => STORY_SCENES.find((scene) => scene.id === id) ?? null;
