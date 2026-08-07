import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), svgr()],
  envPrefix: 'REACT_APP_',
  server: {
    port: 5051,
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@mui/material') || id.includes('@mui/icons-material') || id.includes('@mui/x-date-pickers')) {
            return 'mui';
          }
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('react-router')) {
            return 'vendor';
          }
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'charts';
          }
          if (id.includes('ag-grid-community') || id.includes('ag-grid-react')) {
            return 'grid';
          }
        },
      },
    },
  },
});
