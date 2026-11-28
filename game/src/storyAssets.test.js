import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { STORY_BACKDROPS, STORY_SCENES } from './domain/story/storyCatalog';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

//  A domain test may not import node:fs (architecture.test.js), so the files of the story catalog are checked here
describe('the story assets', () => {
    it('every file the story catalog names exists under game/public', () => {
        const paths = new Set([
            ...Object.values(STORY_BACKDROPS).map((backdrop) => backdrop.image),
            ...STORY_SCENES.flatMap((scene) => [
                scene.title?.logo,
                ...scene.lines.flatMap((line) => [ line.portrait, line.face, line.audio ])
            ])
        ].filter(Boolean));
        const missing = [ ...paths ].filter((path) => !existsSync(join(PUBLIC, path)));

        expect(missing).toEqual([]);
        expect(paths.size).toBe(22);
    });
});
