import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.js'],
        unstubEnvs: true,
        //  `npm run test:coverage`: production code of the game only, the tests themselves are not counted
        coverage: {
            provider: 'v8',
            include: ['src/**/*.js'],
            exclude: ['src/**/*.test.js'],
            reporter: ['text-summary', 'json-summary', 'json', 'html'],
            reportsDirectory: './coverage/unit'
        }
    }
});
