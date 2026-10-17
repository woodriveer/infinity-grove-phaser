import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    //  Empty prefix loads non-VITE_ vars too; those stay server-side (dev proxy only).
    const env = loadEnv(mode, process.cwd(), '');

    return {
        server: {
            port: 8081,
            proxy: env.API_PROXY_TARGET
                ? {
                    [env.VITE_API_BASE_URL]: {
                        target: env.API_PROXY_TARGET,
                        changeOrigin: true,
                        rewrite: (path) => path.replace(new RegExp(`^${env.VITE_API_BASE_URL}`), '')
                    }
                }
                : undefined
        }
    };
});
