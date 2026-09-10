import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sites } from '@openai/sites-vite-plugin';
import { mkdir, writeFile } from 'node:fs/promises';

function staticSiteWorker() {
  return {
    name: 'static-site-worker',
    apply: 'build',
    async closeBundle() {
      await mkdir('dist/server', { recursive: true });
      await writeFile('dist/server/index.js', `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') return response;

    const url = new URL(request.url);
    if (url.pathname.includes('.')) return response;

    return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
  },
};
`);
    },
  };
}

export default defineConfig({
  plugins: [react(), sites(), staticSiteWorker()],
  server: { 
    host: '127.0.0.1', 
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://wildlife-unwieldy-devotee.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
      '/uploads': {
        target: 'https://wildlife-unwieldy-devotee.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    },
  },
});

