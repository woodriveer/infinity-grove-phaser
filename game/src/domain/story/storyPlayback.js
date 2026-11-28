//  The rules of a playing story scene (spec story-scenes): the state machine, the labels, the dots, the look and the stage scale.
//  The state is { phase: 'title' | 'line' | 'end' | 'done', index, complete }. Pure JavaScript: no Phaser, no timers; every function returns a new value.

//  The fixed stage the scene is drawn on, scaled to the viewport
export const STORY_STAGE = { width: 1280, height: 720 };

//  How long a complete line waits (after its audio ended) before the next one starts
export const AUTO_ADVANCE_MS = 1200;

const DEFAULT_CAMERA_MS = 1800;
const WIDE = { x: 0, y: 0, scale: 1, ms: DEFAULT_CAMERA_MS };

//  The first state of a scene: its title card, or line 1 when it has none
export const startStory = (scene) => ({ phase: scene.title ? 'title' : 'line', index: 0, complete: false });

//  A click on the scene (or the auto-advance on a complete line)
export const advanceStory = (scene, state) =>
{
    if (state.phase === 'title')
    {
        return { phase: 'line', index: 0, complete: false };
    }

    if (state.phase === 'line')
    {
        if (!state.complete)
        {
            return { ...state, complete: true };
        }

        if (state.index + 1 < scene.lines.length)
        {
            return { phase: 'line', index: state.index + 1, complete: false };
        }

        return { phase: scene.end ? 'end' : 'done', index: state.index, complete: false };
    }

    if (state.phase === 'end')
    {
        return { phase: 'done', index: state.index, complete: false };
    }

    return state;
};

//  The audio ended, or the clock reached the duration: a typing line is complete
export const endLine = (state) => (state.phase === 'line' && !state.complete ? { ...state, complete: true } : state);

//  Pular
export const skipStory = (state) => ({ ...state, phase: 'done' });

//  The accessible name of the button that covers the scene
export const hitLabel = (state, scene) =>
{
    if (state.phase === 'title')
    {
        return scene.title.action ?? 'Começar a história';
    }

    if (state.phase === 'line')
    {
        return state.complete ? 'Próxima fala' : 'Mostrar fala completa';
    }

    return state.phase === 'end' ? 'Continuar' : '';
};

//  One flag per line: lit up to the current line while a line plays
export const progressDots = (scene, state) => scene.lines.map((line, i) => state.phase === 'line' && i <= state.index);

//  The backdrop, the tints and the camera of a state at `t` seconds into the line
export const sceneLook = (scene, state, t) =>
{
    if (state.phase === 'line')
    {
        const line = scene.lines[state.index];

        return {
            backdrop: line.backdrop,
            tints: line.tints.filter((tint) => line.tintAt?.[tint] === undefined || state.complete || t >= line.tintAt[tint]),
            camera: line.camera ?? 'wide'
        };
    }

    const card = (state.phase === 'title' ? scene.title : scene.end) ?? {};

    return { backdrop: card.backdrop ?? 'forest', tints: card.tints ?? [ 'dark' ], camera: 'wide' };
};

//  The camera preset a look names: the identity for `wide` or an unknown name; `ms` defaults to 1800
export const cameraOf = (backdrops, look) =>
{
    const camera = look.camera === 'wide' ? undefined : backdrops[look.backdrop]?.cameras?.[look.camera];

    return camera ? { ...camera, ms: camera.ms ?? DEFAULT_CAMERA_MS } : { ...WIDE };
};

//  The CSS transform of a camera
export const cameraTransform = ({ x, y, scale }) => `translate(${x}px, ${y}px) scale(${scale})`;

//  The scale that fits the 1280x720 stage inside the viewport
export const storyScale = (width, height) => Math.min(width / STORY_STAGE.width, height / STORY_STAGE.height);
