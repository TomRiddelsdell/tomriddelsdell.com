import { test, expect } from '@playwright/test'
import {
  getPageTitle,
  getMetaContent,
  getCanonicalUrl,
  getOpenGraphData,
  getTwitterCardData,
  getStructuredData,
  getRobotsDirectives,
  isValidUrl,
  validateStructuredDataType,
  hasRequiredFields,
} from '../utils/seo-helpers'

/**
 * SEO Tests
 *
 * Comprehensive SEO testing to ensure the landing page follows best practices
 * for search engine optimization and social media sharing.
 *
 * Tests cover:
 * - Basic meta tags (title, description, keywords)
 * - Open Graph tags for social sharing
 * - Twitter Card metadata
 * - Structured data (JSON-LD)
 * - robots.txt and sitemap.xml
 * - Canonical URLs
 */

test.describe('Basic SEO Meta Tags', () => {
  test('should have a valid page title', async ({ page }) => {
    await page.goto('/')

    const title = await getPageTitle(page)
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(10)
    expect(title.length).toBeLessThan(60) // SEO best practice: < 60 characters
    expect(title).toContain('Tom Riddelsdell')
  })

  test('should have a meta description', async ({ page }) => {
    await page.goto('/')

    const description = await getMetaContent(page, 'description')
    expect(description).toBeTruthy()
    expect(description!.length).toBeGreaterThan(50)
    expect(description!.length).toBeLessThan(160) // SEO best practice: 50-160 characters
  })

  test('should have meta keywords', async ({ page }) => {
    await page.goto('/')

    const keywords = await getMetaContent(page, 'keywords')
    expect(keywords).toBeTruthy()
    expect(keywords).toContain('Tom Riddelsdell')
  })

  test('should have author meta tag', async ({ page }) => {
    await page.goto('/')

    const author = await getMetaContent(page, 'author')
    expect(author).toBeTruthy()
    expect(author).toBe('Tom Riddelsdell')
  })

  test('should have viewport meta tag for mobile', async ({ page }) => {
    await page.goto('/')

    const viewport = await getMetaContent(page, 'viewport')
    expect(viewport).toBeTruthy()
    expect(viewport).toContain('width=device-width')
  })

  test('should have a canonical URL', async ({ page }) => {
    await page.goto('/')

    const canonical = await getCanonicalUrl(page)
    expect(canonical).toBeTruthy()
    expect(isValidUrl(canonical)).toBe(true)
    expect(canonical).toMatch(/^https:\/\//)
  })

  test('should have proper robots directives', async ({ page }) => {
    await page.goto('/')

    const robots = await getRobotsDirectives(page)
    // If robots meta exists, it should allow indexing
    if (robots) {
      expect(robots).not.toContain('noindex')
      expect(robots).not.toContain('nofollow')
    }
  })
})

test.describe('Open Graph Meta Tags', () => {
  test('should have all required Open Graph tags', async ({ page }) => {
    await page.goto('/')

    const ogData = await getOpenGraphData(page)

    // Required Open Graph tags
    expect(ogData.title).toBeTruthy()
    expect(ogData.type).toBeTruthy()
    expect(ogData.image).toBeTruthy()
    expect(ogData.url).toBeTruthy()
  })

  test('should have valid Open Graph URLs', async ({ page }) => {
    await page.goto('/')

    const ogData = await getOpenGraphData(page)

    expect(isValidUrl(ogData.url)).toBe(true)
    expect(isValidUrl(ogData.image)).toBe(true)
  })

  test('should have descriptive Open Graph title and description', async ({
    page,
  }) => {
    await page.goto('/')

    const ogData = await getOpenGraphData(page)

    expect(ogData.title!.length).toBeGreaterThan(10)
    expect(ogData.title!.length).toBeLessThan(60)

    if (ogData.description) {
      expect(ogData.description.length).toBeGreaterThan(50)
      expect(ogData.description.length).toBeLessThan(160)
    }
  })

  test('should have og:type set to website', async ({ page }) => {
    await page.goto('/')

    const ogData = await getOpenGraphData(page)
    expect(ogData.type).toBe('website')
  })

  test('should have og:locale', async ({ page }) => {
    await page.goto('/')

    const ogData = await getOpenGraphData(page)
    expect(ogData.locale).toBeTruthy()
    expect(ogData.locale).toMatch(/^[a-z]{2}_[A-Z]{2}$/) // e.g., en_US
  })

  test('should have og:site_name', async ({ page }) => {
    await page.goto('/')

    const ogData = await getOpenGraphData(page)
    expect(ogData.siteName).toBeTruthy()
  })

  test('Open Graph image should be accessible', async ({ page }) => {
    await page.goto('/')

    const ogData = await getOpenGraphData(page)
    expect(ogData.image).toBeTruthy()

    // Verify image URL is accessible
    const imageUrl = ogData.image!.startsWith('http')
      ? ogData.image!
      : new URL(ogData.image!, page.url()).href

    const response = await page.request.get(imageUrl)
    expect(response.ok()).toBe(true)
  })
})

test.describe('Twitter Card Meta Tags', () => {
  test('should have all required Twitter Card tags', async ({ page }) => {
    await page.goto('/')

    const twitterData = await getTwitterCardData(page)

    expect(twitterData.card).toBeTruthy()
    expect(twitterData.title).toBeTruthy()
    expect(twitterData.description).toBeTruthy()
    expect(twitterData.image).toBeTruthy()
  })

  test('should use summary_large_image card type', async ({ page }) => {
    await page.goto('/')

    const twitterData = await getTwitterCardData(page)
    expect(twitterData.card).toBe('summary_large_image')
  })

  test('should have Twitter handle for creator and site', async ({ page }) => {
    await page.goto('/')

    const twitterData = await getTwitterCardData(page)

    if (twitterData.creator) {
      expect(twitterData.creator).toMatch(/^@[a-zA-Z0-9_]+$/)
    }

    if (twitterData.site) {
      expect(twitterData.site).toMatch(/^@[a-zA-Z0-9_]+$/)
    }
  })

  test('Twitter image should be accessible', async ({ page }) => {
    await page.goto('/')

    const twitterData = await getTwitterCardData(page)
    expect(twitterData.image).toBeTruthy()

    const imageUrl = twitterData.image!.startsWith('http')
      ? twitterData.image!
      : new URL(twitterData.image!, page.url()).href

    const response = await page.request.get(imageUrl)
    expect(response.ok()).toBe(true)
  })
})

test.describe('Structured Data (JSON-LD)', () => {
  test('should have JSON-LD structured data', async ({ page }) => {
    await page.goto('/')

    const structuredData = await getStructuredData(page)
    expect(structuredData.length).toBeGreaterThan(0)
  })

  test('should have valid schema.org context', async ({ page }) => {
    await page.goto('/')

    const structuredData = await getStructuredData(page)
    const personData = structuredData.find((data) => data['@type'] === 'Person')

    expect(personData).toBeTruthy()
    expect(validateStructuredDataType(personData!, 'Person')).toBe(true)
  })

  test('Person schema should have required fields', async ({ page }) => {
    await page.goto('/')

    const structuredData = await getStructuredData(page)
    const personData = structuredData.find((data) => data['@type'] === 'Person')

    expect(personData).toBeTruthy()

    const requiredFields = ['name', 'url', 'description']
    expect(hasRequiredFields(personData!, requiredFields)).toBe(true)
  })

  test('Person schema should have professional details', async ({ page }) => {
    await page.goto('/')

    const structuredData = await getStructuredData(page)
    const personData = structuredData.find((data) => data['@type'] === 'Person')

    expect(personData).toBeTruthy()
    expect(personData!.jobTitle).toBeTruthy()
    expect(personData!.knowsAbout).toBeTruthy()
  })

  test('Person schema should have social media links', async ({ page }) => {
    await page.goto('/')

    const structuredData = await getStructuredData(page)
    const personData = structuredData.find((data) => data['@type'] === 'Person')

    expect(personData).toBeTruthy()
    expect(personData!.sameAs).toBeTruthy()
    expect(Array.isArray(personData!.sameAs)).toBe(true)
    expect((personData!.sameAs as string[]).length).toBeGreaterThan(0)
  })

  test('structured data URLs should be valid', async ({ page }) => {
    await page.goto('/')

    const structuredData = await getStructuredData(page)
    const personData = structuredData.find((data) => data['@type'] === 'Person')

    expect(personData).toBeTruthy()
    expect(isValidUrl(personData!.url as string)).toBe(true)

    if (personData!.sameAs && Array.isArray(personData!.sameAs)) {
      for (const url of personData!.sameAs as string[]) {
        expect(isValidUrl(url)).toBe(true)
      }
    }
  })
})

test.describe('robots.txt and sitemap.xml', () => {
  test('robots.txt should be accessible', async ({ page }) => {
    const response = await page.request.get('/robots.txt')
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toContain('text/plain')
  })

  test('robots.txt should reference sitemap', async ({ page }) => {
    const response = await page.request.get('/robots.txt')
    const content = await response.text()

    expect(content).toContain('Sitemap:')
    expect(content).toContain('sitemap.xml')
  })

  test('robots.txt should allow crawling', async ({ page }) => {
    const response = await page.request.get('/robots.txt')
    const content = await response.text()

    expect(content).toContain('User-agent: *')
    expect(content).toContain('Allow: /')
  })

  test('sitemap.xml should be accessible', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml')
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toMatch(/xml/)
  })

  test('sitemap.xml should be valid XML', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml')
    const content = await response.text()

    expect(content).toContain('<?xml version="1.0"')
    expect(content).toContain('<urlset')
    expect(content).toContain(
      'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
    )
    expect(content).toContain('</urlset>')
  })

  test('sitemap.xml should contain homepage URL', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml')
    const content = await response.text()

    expect(content).toContain('<loc>')
    expect(content).toContain('tomriddelsdell.com')
  })

  test('sitemap.xml should have lastmod dates', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml')
    const content = await response.text()

    expect(content).toContain('<lastmod>')
  })
})

test.describe('SEO Best Practices', () => {
  test('should have HTML lang attribute', async ({ page }) => {
    await page.goto('/')

    const lang = await page.getAttribute('html', 'lang')
    expect(lang).toBeTruthy()
    expect(lang).toBe('en')
  })

  test('should have exactly one h1 tag', async ({ page }) => {
    await page.goto('/')

    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })

  test('all images should have alt attributes', async ({ page }) => {
    await page.goto('/')

    const images = await page.locator('img').all()

    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
      expect(alt!.length).toBeGreaterThan(0)
    }
  })

  test('should not have duplicate meta tags', async ({ page }) => {
    await page.goto('/')

    const metaTags = await page.evaluate(() => {
      const tags = Array.from(document.querySelectorAll('meta'))
      return tags.map(
        (tag) =>
          tag.getAttribute('name') ||
          tag.getAttribute('property') ||
          tag.getAttribute('charset')
      )
    })

    const uniqueTags = new Set(metaTags.filter((tag) => tag !== null))
    expect(metaTags.filter((tag) => tag !== null).length).toBe(uniqueTags.size)
  })

  test('page should load quickly for SEO', async ({ page }) => {
    const start = Date.now()
    await page.goto('/')
    const duration = Date.now() - start

    // Page should load in under 3 seconds for good SEO
    expect(duration).toBeLessThan(3000)
  })
})
