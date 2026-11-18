import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import istanbul from 'vite-plugin-istanbul';

//  The version of the game (spec game-version): read when the dev server starts or the build runs, so a built Worker shows the
//  version of the commit it was built from. gitops sets it in every release commit. src/main.js shows it in the corner of the page.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig(({ mode }) => {
    //  Empty prefix loads non-VITE_ vars too; those stay server-side (dev proxy only).
    const env = loadEnv(mode, process.cwd(), '');

    const proxy = env.API_PROXY_TARGET
        ? {
            [env.VITE_API_BASE_URL]: {
                target: env.API_PROXY_TARGET,
                changeOrigin: true,
                rewrite: (path) => path.replace(new RegExp(`^${env.VITE_API_BASE_URL}`), '')
            }
        }
        : undefined;

    return {
        //  __GAME_VERSION__ becomes the string literal of the version in every game module (a missing version becomes '', which shows no label)
        define: {
            __GAME_VERSION__: JSON.stringify(version ?? '')
        },
        //  The e2e coverage run (`npm run test:e2e:coverage`) sets VITE_COVERAGE=true: the dev server then instruments the game code and
        //  the pages expose window.__coverage__. Any other run, and every build, serves the code as it is.
        plugins: [
            istanbul({ include: 'src/**/*.js', exclude: ['src/**/*.test.js'], extension: ['.js'], requireEnv: true })
        ],
        server: {
            port: 8081,
            proxy
        },
        //  `vite preview` serves the built game, e.g. behind a Cloudflare quick tunnel (random *.trycloudflare.com host)
        preview: {
            proxy,
            allowedHosts: true
        }
    };
});
