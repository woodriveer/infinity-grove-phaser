import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MAP_IMAGE, MAP_STOPS } from './adapters/phaser/views/mapLayout';

//  The Gemini prompt of the map and the layout of the screen must name the same 11 positions, or the stops would not sit on the clearings
const prompt = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'PROMPTS_ASSETS_UI.md'), 'utf8');

const rowOf = (label) => prompt.split('\n').find((line) => line.startsWith(`| ${label} |`));

describe('the map prompt', () => {
    it('names the file of the map, the one the screen loads', () => {
        expect(MAP_IMAGE).toBe('assets/ui/boss-map.jpg');
        expect(prompt).toContain('boss-map.jpg');
    });

    it('carries the position of every stop of the layout table', () => {
        const rows = [ ...Array.from({ length: 10 }, (_, index) => [ `Fase ${index + 1}`, `miniboss-${index + 1}` ]), [ 'Chefe', 'chapter-boss' ] ];

        rows.forEach(([ label, id ]) =>
        {
            const [ , , x, y ] = rowOf(label).split('|').map((cell) => cell.trim());

            expect({ id, x: Number(x), y: Number(y) }).toEqual({ id, ...MAP_STOPS[id] });
        });
    });

    it('asks for ten identical empty clearings and a larger boss gate at 16:9', () => {
        expect(prompt).toContain('exactly 10 identical round stone clearings');
        expect(prompt).toContain('16:9');
    });
});
