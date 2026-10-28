//  What a commit range touches: the backend (any backend/** file) and the game (the paths publish.sh fingerprints, tests left out)
const GAME_DIRS = ['game/src/', 'game/public/', 'game/worker/'];
const GAME_FILES = [
    'game/index.html',
    'game/vite.config.js',
    'game/package.json',
    'game/wrangler.jsonc',
    'game/scripts/deploy.mjs',
    'game/.env',
    'game/.env.pages',
    'game/.env.production'
];

const isGame = (file) =>
    !file.endsWith('.test.js') && (GAME_FILES.includes(file) || GAME_DIRS.some((dir) => file.startsWith(dir)));

export const classify = (files) => ({
    backend: files.some((file) => file.startsWith('backend/')),
    game: files.some(isGame)
});

export const changedFiles = (exec, from, to) =>
{
    const result = exec('git', ['diff', '--name-only', from, to]);

    if (result.status !== 0)
    {
        throw new Error(`git diff --name-only ${from} ${to} falhou: ${result.stderr}`);
    }

    return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
};
