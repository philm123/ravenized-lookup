import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Momentum',
    short_name: 'Momentum',
    description: 'Know the homeowner before you knock.',
    start_url: '/',
    display: 'standalone',
    background_color: '#08070C',
    theme_color: '#08070C',
    orientation: 'portrait',
    icons: [
      { src: '/api/icons/192', sizes: '192x192', type: 'image/png' },
      { src: '/api/icons/512', sizes: '512x512', type: 'image/png' },
    ],
  };
}
