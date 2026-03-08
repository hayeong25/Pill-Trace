import { MetadataRoute } from 'next';

const POPULAR_DRUGS = [
  '타이레놀', '게보린', '후시딘', '판피린', '베아제', '지르텍',
  '마데카솔', '가스활명수', '활명수', '부루펜', '탁센', '센시아',
  '아스피린', '판콜', '쏘팔메토', '둘코락스', '스트렙실', '에어탈',
];
const POPULAR_INGREDIENTS = [
  '아세트아미노펜', '이부프로펜', '덱스트로메토르판', '로라타딘',
  '세티리진', '아스피린', '나프록센', '판토프라졸', '오메프라졸',
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
      url: `${baseUrl}/?q=${encodeURIComponent(drug)}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...POPULAR_INGREDIENTS.map(ingredient => ({
      url: `${baseUrl}/?q=${encodeURIComponent(ingredient)}&mode=ingredient`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
