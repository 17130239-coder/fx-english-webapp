import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FX English — Subtitle & Vocab Studio',
    short_name: 'FX English',
    description: 'Học từ vựng tiếng Anh qua phim với phụ đề thông minh, 3D Flashcards và thuật toán lặp lại ngắt quãng SRS',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0B',
    theme_color: '#0A0A0B',
    orientation: 'portrait-primary',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/icons/icon192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
