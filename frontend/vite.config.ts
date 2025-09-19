import { defineConfig } from 'vite'
import angular from '@analogjs/vite-plugin-angular'

export default defineConfig({
  plugins: [angular()],
  server: {
    port: 4200,
  },
  build: {
    target: 'ES2022',
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
