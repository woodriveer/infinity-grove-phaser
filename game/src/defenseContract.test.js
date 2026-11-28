import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

//  Spec defense-contract (DEF-04 AC 5, DEF-05 AC 1): the game reads `defense` only, so no file under game/ builds an enemy with the old
//  fields except the test cases that pin that the game ignores them (design § Legacy Payload Tests), and the unused asset is gone.
const GAME = join(dirname(fileURLToPath(import.meta.url)), '..');

const SKIPPED_DIRECTORIES = [ 'node_modules', 'dist', 'coverage', '.nyc_output', 'test-results', 'playwright-report', '.vite' ];
const TEXT_FILE = /\.(js|mjs|cjs|css|html|json|md)$/;

const filesUnder = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
{
    const path = join(directory, entry.name);

    if (entry.isDirectory())
    {
        return SKIPPED_DIRECTORIES.includes(entry.name) ? [] : filesUnder(path);
    }

    return TEXT_FILE.test(entry.name) ? [ path ] : [];
});

const posix = (path) => relative(GAME, path).split(sep).join('/');

const LEGACY_PAYLOAD_FILES = [
    'src/domain/combat/monster.js',
    'src/domain/combat/monster.test.js',
    'src/domain/combat/damage.test.js',
    'src/domain/combat/fight.test.js',
    'src/domain/combat/monsterAffix.test.js',
    'src/domain/talents/talents.test.js',
    'src/adapters/phaser/ClickerGame.test.js',
    'e2e/heroTeamCombat.spec.js',
    'e2e/unifiedDamage.spec.js',
    'src/defenseContract.test.js'
];

const OLD_FIELDS = new RegExp([ 'physical', 'magical' ].map((kind) => `${kind}Defense`).join('|'));
const OLD_ASSET = [ 'talent-break', 'magical' ].join('-');

describe('defense contract: the game reads defense only', () =>
{
    const files = filesUnder(GAME);

    it('scans the game sources, the e2e specs and the review shots', () =>
    {
        const paths = files.map(posix);

        expect(paths.some((path) => path.startsWith('src/domain/'))).toBe(true);
        expect(paths.some((path) => path.startsWith('e2e/') && path.endsWith('.spec.js'))).toBe(true);
        expect(paths.some((path) => path.startsWith('ui-review/') && path.endsWith('.shots.js'))).toBe(true);
    });

    it('only the legacy payload tests and the monster.js comment name physicalDefense or magicalDefense', () =>
    {
        const naming = files.filter((file) => OLD_FIELDS.test(readFileSync(file, 'utf8'))).map(posix).sort();

        expect(naming.filter((path) => !LEGACY_PAYLOAD_FILES.includes(path))).toEqual([]);
    });

    it('the unused magical break icon is gone and no file under game/ names it', () =>
    {
        expect(existsSync(join(GAME, 'public', 'assets', `${OLD_ASSET}.png`))).toBe(false);

        const naming = files.filter((file) => readFileSync(file, 'utf8').includes(OLD_ASSET)).map(posix);

        expect(naming.filter((path) => path !== 'src/defenseContract.test.js')).toEqual([]);
    });
});
