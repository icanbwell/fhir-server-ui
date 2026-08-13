import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    envPrefix: 'REACT_APP_',
    define: {
        'import.meta.env.REACT_APP_FHIR_SERVER_URL': JSON.stringify('http://localhost:8080/fhir'),
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
    },
});
