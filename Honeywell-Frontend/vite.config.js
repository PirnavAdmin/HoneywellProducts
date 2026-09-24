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

function solutionsDevMockPlugin() {
  return {
    name: 'solutions-dev-mock-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'GET' && (req.url === '/api/solutions' || req.url?.startsWith('/api/solutions?'))) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            data: [
              {
                id: 'home',
                title: 'Residential & Smart Home Security',
                description: 'Complete home surveillance and access control for modern residences.',
                application: 'Residential Security',
                categoryId: 'cctv-cameras',
                image: '/assets/images/catalog/solution-residential.jpg',
                features: ['Smart Wi-Fi Cameras', 'Doorbell Integration', 'Mobile Motion Alerts']
              },
              {
                id: 'office',
                title: 'Corporate Office & Facility Protection',
                description: 'Access control, time attendance, and IP video surveillance for modern workplaces.',
                application: 'Office Security',
                categoryId: 'networking',
                image: '/assets/images/catalog/solution-office.jpg',
                features: ['Biometric Entry Control', 'Centralized NVR Recording', 'Visitor Management']
              },
              {
                id: 'retail',
                title: 'Retail Store & Loss Prevention',
                description: 'High-definition video monitoring to prevent shoplifting and audit cashier points.',
                application: 'Retail & POS Security',
                categoryId: 'dome-camera',
                image: '/assets/images/catalog/solution-retail.jpg',
                features: ['POS Cashier Overlay', 'Foot-Traffic Analytics', '360° Dome Coverage']
              },
              {
                id: 'factory',
                title: 'Industrial & Manufacturing Safety',
                description: 'Heavy-duty explosion-proof cameras and perimeter intrusion monitoring.',
                application: 'Industrial Security',
                categoryId: 'ip-camera',
                image: '/assets/images/catalog/solution-industrial.jpg',
                features: ['Thermal Perimeter Monitoring', 'Heavy Duty Enclosures', 'Automated AI Alerts']
              }
            ]
          }));
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), sites(), staticSiteWorker(), solutionsDevMockPlugin()],
  server: { 
    host: '127.0.0.1', 
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://snowplow-mummy-diligent.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
      '/uploads': {
        target: 'https://snowplow-mummy-diligent.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    },
  },
});

