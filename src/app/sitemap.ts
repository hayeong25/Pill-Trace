import { MetadataRoute } from 'next';

const POPULAR_DRUGS = [
  '타이레놀', '게보린', '후시딘', '판피린',
  '아세트아미노펜', '이부프로펜', '덱스트로메토르판',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pill-trace.vercel.app';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...POPULAR_DRUGS.map(drug => ({
      url: `${baseUrl}/?q=${encodeURIComponent(drug)}&mode=drug`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
