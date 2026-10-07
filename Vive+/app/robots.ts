import { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://vivemas.es';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin-actividades',
        '/admin-codigos',
        '/admin-organizaciones',
        '/admin-salud',
        '/admin-anuncios',
        '/admin-planes',
        '/admin-marketplace',
        '/admin-cuidadores',
        '/panel-cuidador',
        '/onboarding',
        '/mis-chats',
        '/api/',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
