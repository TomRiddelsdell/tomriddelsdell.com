import './globals.css'
import type { Metadata } from 'next'

const siteConfig = {
  name: 'Tom Riddelsdell',
  title: 'Tom Riddelsdell - Software Engineer & Portfolio',
  description:
    'Personal portfolio and project showcase of Tom Riddelsdell - Software Engineer specializing in cloud architecture, event-driven systems, and modern web technologies.',
  url: 'https://tomriddelsdell.com',
  siteName: 'Tom Riddelsdell Portfolio',
  locale: 'en_US',
  type: 'website' as const,
  author: 'Tom Riddelsdell',
  keywords: [
    'Tom Riddelsdell',
    'Software Engineer',
    'Portfolio',
    'Cloud Architecture',
    'Event Sourcing',
    'Domain Driven Design',
    'Next.js',
    'Cloudflare Workers',
    'TypeScript',
    'React',
  ],
  ogImage: {
    url: '/me.webp',
    width: 1200,
    height: 630,
    alt: 'Tom Riddelsdell - Software Engineer',
  },
  twitter: {
    handle: '@tomriddelsdell',
    site: '@tomriddelsdell',
  },
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  publisher: siteConfig.author,

  // Open Graph metadata for social sharing
  openGraph: {
    type: siteConfig.type,
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.siteName,
    images: [
      {
        url: siteConfig.ogImage.url,
        width: siteConfig.ogImage.width,
        height: siteConfig.ogImage.height,
        alt: siteConfig.ogImage.alt,
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    creator: siteConfig.twitter.handle,
    site: siteConfig.twitter.site,
    images: [siteConfig.ogImage.url],
  },

  // Additional SEO metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification tags (add your verification codes when available)
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },

  // Alternate languages (add when multilingual support is added)
  alternates: {
    canonical: siteConfig.url,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // JSON-LD structured data for person/professional
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.author,
    url: siteConfig.url,
    image: `${siteConfig.url}${siteConfig.ogImage.url}`,
    description: siteConfig.description,
    jobTitle: 'Software Engineer',
    sameAs: [
      `https://twitter.com/${siteConfig.twitter.handle.replace('@', '')}`,
      `https://github.com/TomRiddelsdell`,
      `https://linkedin.com/in/tomriddelsdell`,
    ],
    knowsAbout: [
      'Software Engineering',
      'Cloud Architecture',
      'Event Sourcing',
      'Domain Driven Design',
      'TypeScript',
      'React',
      'Next.js',
    ],
  }

  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
