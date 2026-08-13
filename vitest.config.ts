import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    envPrefix: 'REACT_APP_',
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
    },
});
