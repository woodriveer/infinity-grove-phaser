import { defineConfig, loadEnv } from 'vite';
import istanbul from 'vite-plugin-istanbul';

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
