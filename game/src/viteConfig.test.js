// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import viteConfig from '../vite.config.js';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

describe('vite config', () => {
    it('defines __GAME_VERSION__ as the package.json version for the dev server', () => {
        const config = viteConfig({ mode: 'development', command: 'serve' });

        expect(config.define).toEqual({ __GAME_VERSION__: JSON.stringify(version) });
    });

    it('defines __GAME_VERSION__ as the package.json version for the Worker build', () => {
        const config = viteConfig({ mode: 'pages', command: 'build' });

        expect(config.define).toEqual({ __GAME_VERSION__: JSON.stringify(version) });
    });

    it('keeps the istanbul plugin and the dev server port', () => {
        const config = viteConfig({ mode: 'development', command: 'serve' });

        expect(config.plugins.length).toBe(1);
        expect(config.server.port).toBe(8081);
    });
});
