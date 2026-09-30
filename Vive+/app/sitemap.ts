import { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://vivemas.es';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/salud`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/recursos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/organizaciones`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/comunidad`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/sobre-nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
