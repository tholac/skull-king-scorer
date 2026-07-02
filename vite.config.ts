import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'prompt',
      manifest: {
        name: 'Skore King: Skull King Scorer',
        short_name: 'Skore King',
        description: 'The Skull King scorer with mid-game player management',
        theme_color: '#1d232a',
        background_color: '#1d232a',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'] },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
  },
});
