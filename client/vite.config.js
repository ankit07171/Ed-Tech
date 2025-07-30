import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 1845,
    proxy: {
      '/api': ['https://ed-tech-44mp.onrender.com',"http://localhost:7171"],
    },
  },
});
