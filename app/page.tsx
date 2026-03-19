import type { Metadata } from 'next';
import HomePage from '@/components/HomePage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://resumeintelligence.ai';

export const metadata: Metadata = {
  title: 'AI Resume Analyzer for ATS Optimization',
  description:
    'Analyze your resume with AI, improve ATS score, identify skill gaps, and get recommendations that increase interview chances.',
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Resume Intelligence AI',
        url: siteUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/ml-tools`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Resume Intelligence AI',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description:
          'AI resume analyzer that improves ATS compatibility with scoring and actionable suggestions.',
        url: siteUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePage />
    </>
  );
}