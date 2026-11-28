//  The rules of the story catalog (spec story-scenes): which scenes are well formed, which one a chapter move opens and which ones
//  the Mapa lists. Pure JavaScript: no Phaser, no storage.

export const LINE_KINDS = [ 'narrator', 'voice', 'character' ];
//  In drawing order; `veins` is drawn on the camera layer
export const TINTS = [ 'dawn', 'dark', 'red', 'gold', 'voice', 'veins' ];
export const TRIGGERS = [ 'chapter-start', 'chapter-boss' ];
export const MOTIONS = [ 'drift', 'pan', 'still' ];

const isText = (value) => typeof value === 'string' && value !== '';
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

//  The error messages of one card (title or end): its backdrop and tints must exist
const cardErrors = (card, name, id, backdrops) =>
{
    if (card === undefined)
    {
        return [];
    }

    const badBackdrop = card.backdrop !== undefined && !Object.hasOwn(backdrops, card.backdrop);
    const badTints = card.tints !== undefined && (!Array.isArray(card.tints) || card.tints.some((tint) => !TINTS.includes(tint)));

    return badBackdrop || badTints ? [ `${id}: ${name} backdrop or tints are unknown` ] : [];
};

const cueErrors = (line, prefix) =>
{
    const errors = [];
    let previousEnd = 0;
    //  a duration that is itself broken has its own message, so the cues are not also blamed for it
    const limit = isNumber(line.duration) && line.duration > 0 ? line.duration : Infinity;

    line.cues.forEach((cue, i) =>
    {
        const [ start, end, text ] = Array.isArray(cue) ? cue : [];
        const valid = isNumber(start) && isNumber(end) && start >= 0 && start < end && end <= limit && start >= previousEnd && isText(text);

        if (!valid)
        {
            errors.push(`${prefix} cue ${i + 1}: cues must be in order, inside the duration and carry text`);
        }
        else
        {
            previousEnd = end;
        }
    });

    return errors;
};

const lineErrors = (line, n, id, backdrops) =>
{
    const prefix = `${id} line ${n}`;
    const errors = [];

    if (!LINE_KINDS.includes(line.kind))
    {
        errors.push(`${prefix}: kind must be narrator, voice or character`);
    }

    if ((line.kind === 'voice' || line.kind === 'character') && !isText(line.speaker))
    {
        errors.push(`${prefix}: speaker is missing`);
    }

    if (line.kind === 'character')
    {
        const portrait = isText(line.portrait);
        const face = isText(line.face);

        if (!portrait && !face)
        {
            errors.push(`${prefix}: a character line needs a portrait or a face`);
        }
        else if (portrait && face)
        {
            errors.push(`${prefix}: a character line takes a portrait or a face, not both`);
        }
    }

    const backdropKnown = Object.hasOwn(backdrops, line.backdrop);

    if (!backdropKnown)
    {
        errors.push(`${prefix}: unknown backdrop ${line.backdrop}`);
    }

    const tints = Array.isArray(line.tints) ? line.tints : [];

    tints.filter((tint) => !TINTS.includes(tint)).forEach((tint) => errors.push(`${prefix}: unknown tint ${tint}`));

    if (line.camera !== undefined && line.camera !== 'wide' && !(backdropKnown && Object.hasOwn(backdrops[line.backdrop].cameras ?? {}, line.camera)))
    {
        errors.push(`${prefix}: unknown camera ${line.camera} for backdrop ${line.backdrop}`);
    }

    Object.keys(line.tintAt ?? {}).filter((tint) => !tints.includes(tint)).forEach((tint) => errors.push(`${prefix}: tintAt names a tint the line does not use: ${tint}`));

    if (!isText(line.audio))
    {
        errors.push(`${prefix}: audio is missing`);
    }

    if (!(isNumber(line.duration) && line.duration > 0))
    {
        errors.push(`${prefix}: duration must be above 0`);
    }

    if (!Array.isArray(line.cues) || line.cues.length < 1)
    {
        errors.push(`${prefix}: a line needs at least one cue`);
    }
    else
    {
        errors.push(...cueErrors(line, prefix));
    }

    return errors;
};

//  Every broken rule of one scene, in rule order; [] when the scene is valid
export const validateScene = (scene, backdrops) =>
{
    const id = typeof scene.id === 'string' ? scene.id : '?';
    const errors = [];

    if (typeof scene.id !== 'string' || !/^[a-z0-9-]+$/.test(scene.id))
    {
        errors.push(`${id}: id must be lowercase letters, digits and dashes`);
    }

    if (!isText(scene.label))
    {
        errors.push(`${id}: label is missing`);
    }

    const trigger = scene.trigger;

    if (!trigger || !TRIGGERS.includes(trigger.kind) || !Number.isInteger(trigger.chapter) || trigger.chapter < 1)
    {
        errors.push(`${id}: trigger must be chapter-start or chapter-boss with a chapter of at least 1`);
    }

    if (scene.title !== undefined && !(isText(scene.title.kicker) && isText(scene.title.cta)))
    {
        errors.push(`${id}: title needs kicker and cta`);
    }

    if (scene.end !== undefined && ![ 'kicker', 'title', 'subtitle', 'cta' ].every((key) => isText(scene.end[key])))
    {
        errors.push(`${id}: end needs kicker, title, subtitle and cta`);
    }

    errors.push(...cardErrors(scene.title, 'title', id, backdrops), ...cardErrors(scene.end, 'end', id, backdrops));

    if (scene.letterbox !== undefined && typeof scene.letterbox !== 'boolean')
    {
        errors.push(`${id}: letterbox must be true or false`);
    }

    const moteOk = (mote) => Array.isArray(mote) && mote.length === 4 && mote.every(isNumber) && mote[3] > 0;

    if (scene.motes !== undefined && !(Array.isArray(scene.motes) && scene.motes.every(moteOk)))
    {
        errors.push(`${id}: motes must be [left, top, delay, duration] numbers`);
    }

    if (!Array.isArray(scene.lines) || scene.lines.length < 1)
    {
        errors.push(`${id}: a scene needs at least one line`);

        return errors;
    }

    scene.lines.forEach((line, i) => errors.push(...lineErrors(line, i + 1, id, backdrops)));

    return errors;
};

const backdropErrors = (backdrops) => Object.entries(backdrops).flatMap(([ key, backdrop ]) =>
{
    const errors = [];

    if (!isText(backdrop.image))
    {
        errors.push(`backdrop ${key}: image is missing`);
    }

    if (!MOTIONS.includes(backdrop.motion))
    {
        errors.push(`backdrop ${key}: motion must be drift, pan or still`);
    }

    Object.entries(backdrop.cameras ?? {}).forEach(([ name, camera ]) =>
    {
        if (name === 'wide')
        {
            errors.push(`backdrop ${key} camera wide: wide is reserved`);
        }
        else if (!(isNumber(camera.x) && isNumber(camera.y) && isNumber(camera.scale) && camera.scale > 0 && (camera.ms === undefined || (isNumber(camera.ms) && camera.ms > 0))))
        {
            errors.push(`backdrop ${key} camera ${name}: needs x, y and a scale above 0`);
        }
    });

    return errors;
});

//  Each value that shows up more than once, once, in the order of its second copy
const repeated = (values) => [ ...new Set(values.filter((value, i) => values.indexOf(value) !== i)) ];

//  The backdrop rules, then each scene's errors, then the duplicate ids and triggers
export const validateCatalog = (scenes, backdrops) => [
    ...backdropErrors(backdrops),
    ...scenes.flatMap((scene) => validateScene(scene, backdrops)),
    ...repeated(scenes.map((scene) => scene.id)).map((id) => `duplicate scene id ${id}`),
    ...repeated(scenes.map((scene) => `${scene.trigger.kind} ${scene.trigger.chapter}`)).map((trigger) => `two scenes share the trigger ${trigger}`)
];

//  The scene a move from chapter `from` (null on the first encounter) to chapter `to` (null when the campaign is completed) opens,
//  unless it is in `seen`
export const sceneToPlay = (scenes, { from, to, seen }) =>
{
    let scene;

    if (from === null && to !== null)
    {
        scene = scenes.find((candidate) => candidate.trigger.kind === 'chapter-start' && candidate.trigger.chapter === to);
    }
    else if (from !== null && (to === from + 1 || to === null))
    {
        scene = scenes.find((candidate) => candidate.trigger.kind === 'chapter-boss' && candidate.trigger.chapter === from);
    }

    return scene && !seen.includes(scene.id) ? scene : null;
};

//  The scenes the Mapa lists, in catalog order: the chapter-start scenes, and each chapter-boss scene already seen or already passed
//  by the campaign (`position` is { chapter, completed }, or null before it loads)
export const replayableScenes = (scenes, seen, position) => scenes.filter((scene) =>
{
    if (scene.trigger.kind === 'chapter-start')
    {
        return true;
    }

    const chapter = scene.trigger.chapter;

    return seen.includes(scene.id) || (position !== null && (position.chapter > chapter || (position.completed && position.chapter >= chapter)));
});
