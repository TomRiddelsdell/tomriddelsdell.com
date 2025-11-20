import { Page } from '@playwright/test'

/**
 * SEO Testing Utilities
 *
 * Reusable helper functions for testing SEO meta tags, Open Graph,
 * Twitter Cards, and structured data (JSON-LD).
 */

export interface MetaTag {
  name?: string
  property?: string
  content: string
}

export interface StructuredData {
  '@context': string
  '@type': string
  [key: string]: unknown
}

/**
 * Get meta tag content by name attribute
 */
export async function getMetaContent(
  page: Page,
  name: string
): Promise<string | null> {
  return await page.getAttribute(`meta[name="${name}"]`, 'content')
}

/**
 * Get meta tag content by property attribute (for Open Graph)
 */
export async function getMetaProperty(
  page: Page,
  property: string
): Promise<string | null> {
  return await page.getAttribute(`meta[property="${property}"]`, 'content')
}

/**
 * Get all meta tags from the page
 */
export async function getAllMetaTags(page: Page): Promise<MetaTag[]> {
  return await page.evaluate(() => {
    const metaTags = Array.from(document.querySelectorAll('meta'))
    return metaTags.map((tag) => ({
      name: tag.getAttribute('name') || undefined,
      property: tag.getAttribute('property') || undefined,
      content: tag.getAttribute('content') || '',
    }))
  })
}

/**
 * Get page title
 */
export async function getPageTitle(page: Page): Promise<string> {
  return await page.title()
}

/**
 * Get canonical URL
 */
export async function getCanonicalUrl(page: Page): Promise<string | null> {
  return await page.getAttribute('link[rel="canonical"]', 'href')
}

/**
 * Get all JSON-LD structured data scripts
 */
export async function getStructuredData(page: Page): Promise<StructuredData[]> {
  return await page.evaluate(() => {
    const scripts = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    )
    return scripts
      .map((script) => {
        try {
          return JSON.parse(script.textContent || '{}')
        } catch {
          return null
        }
      })
      .filter((data): data is StructuredData => data !== null)
  })
}

/**
 * Validate Open Graph required tags
 */
export interface OpenGraphData {
  title: string | null
  type: string | null
  image: string | null
  url: string | null
  description?: string | null
  siteName?: string | null
  locale?: string | null
}

export async function getOpenGraphData(page: Page): Promise<OpenGraphData> {
  return {
    title: await getMetaProperty(page, 'og:title'),
    type: await getMetaProperty(page, 'og:type'),
    image: await getMetaProperty(page, 'og:image'),
    url: await getMetaProperty(page, 'og:url'),
    description: await getMetaProperty(page, 'og:description'),
    siteName: await getMetaProperty(page, 'og:site_name'),
    locale: await getMetaProperty(page, 'og:locale'),
  }
}

/**
 * Validate Twitter Card tags
 */
export interface TwitterCardData {
  card: string | null
  site: string | null
  creator: string | null
  title: string | null
  description: string | null
  image: string | null
}

export async function getTwitterCardData(page: Page): Promise<TwitterCardData> {
  return {
    card: await getMetaContent(page, 'twitter:card'),
    site: await getMetaContent(page, 'twitter:site'),
    creator: await getMetaContent(page, 'twitter:creator'),
    title: await getMetaContent(page, 'twitter:title'),
    description: await getMetaContent(page, 'twitter:description'),
    image: await getMetaContent(page, 'twitter:image'),
  }
}

/**
 * Validate robots meta tag
 */
export async function getRobotsDirectives(page: Page): Promise<string | null> {
  return await getMetaContent(page, 'robots')
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string | null): boolean {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Check if image URL is accessible
 */
export async function isImageAccessible(
  page: Page,
  imageUrl: string
): Promise<boolean> {
  try {
    const response = await page.request.get(imageUrl)
    return (
      response.ok() && response.headers()['content-type']?.startsWith('image/')
    )
  } catch {
    return false
  }
}

/**
 * Validate structured data against schema.org types
 */
export function validateStructuredDataType(
  data: StructuredData,
  expectedType: string
): boolean {
  return (
    data['@context'] === 'https://schema.org' && data['@type'] === expectedType
  )
}

/**
 * Check for required structured data fields
 */
export function hasRequiredFields(
  data: StructuredData,
  requiredFields: string[]
): boolean {
  return requiredFields.every((field) => {
    const value = data[field]
    return value !== undefined && value !== null && value !== ''
  })
}
