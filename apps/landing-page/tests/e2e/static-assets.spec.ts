import { test, expect } from '@playwright/test'

/**
 * Static Assets Tests
 *
 * These tests ensure that all static assets (CSS, images, fonts) are:
 * 1. Accessible (HTTP 200)
 * 2. Have correct content types
 * 3. Actually load and apply to the page
 *
 * Critical for catching deployment issues like the missing assets configuration
 * that caused the CSS 404 issue on 2025-11-18.
 */
test.describe('Static Assets', () => {
  test('CSS files should load with HTTP 200', async ({ page }) => {
    // Navigate to the page
    await page.goto('/')

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle')

    // Get all CSS link elements
    const cssLinks = await page.locator('link[rel="stylesheet"]').all()
    expect(cssLinks.length).toBeGreaterThan(0)

    // Verify each CSS file returns HTTP 200
    for (const link of cssLinks) {
      const href = await link.getAttribute('href')
      if (href) {
        const response = await page.request.get(
          href.startsWith('http') ? href : `${page.url()}${href}`
        )
        expect(response.status(), `CSS file ${href} should return 200`).toBe(
          200
        )
        expect(response.headers()['content-type']).toContain('text/css')
      }
    }
  })

  test('CSS should be applied (background color check)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check that the body has a background color (proves CSS is applied)
    const body = page.locator('body')
    const backgroundColor = await body.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    )

    // Should not be the browser default (rgba(0, 0, 0, 0) or empty)
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(backgroundColor).toBeTruthy()
  })

  test('navigation should have proper styling', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check nav has expected Tailwind classes applied
    const nav = page.locator('nav').first()
    const position = await nav.evaluate(
      (el) => window.getComputedStyle(el).position
    )

    // Nav should be fixed (from 'fixed' Tailwind class)
    expect(position).toBe('fixed')
  })

  test('images should load successfully', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Find all images on the page
    const images = await page.locator('img').all()
    expect(images.length).toBeGreaterThan(0)

    // Verify each image loads
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const src = await img.getAttribute('src')
      const alt = await img.getAttribute('alt')

      // Verify image has src and alt
      expect(src, `Image ${i} should have src attribute`).toBeTruthy()
      expect(alt, `Image ${i} should have alt attribute`).toBeTruthy()

      if (src && !src.startsWith('data:')) {
        // For non-data URLs, verify the image loads
        const imgUrl = src.startsWith('http')
          ? src
          : new URL(src, page.url()).href
        const response = await page.request.get(imgUrl)
        expect(response.status(), `Image ${src} should return 200`).toBe(200)

        const contentType = response.headers()['content-type']
        expect(
          contentType,
          `Image ${src} should have image content type`
        ).toMatch(/^image\//)
      }

      // Verify image is visible and has loaded
      await expect(img).toBeVisible()

      // Check if image has natural dimensions (proves it loaded)
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth
      )
      expect(
        naturalWidth,
        `Image ${src} should have loaded (naturalWidth > 0)`
      ).toBeGreaterThan(0)
    }
  })

  test('background image should load', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for elements with background images
    const heroSection = page.locator('section#home').first()
    const bgDiv = heroSection.locator('div').first()

    const backgroundImage = await bgDiv.evaluate(
      (el) => window.getComputedStyle(el).backgroundImage
    )

    // If there's a background image URL, verify it loads
    if (backgroundImage && backgroundImage !== 'none') {
      const urlMatch = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)
      if (urlMatch && urlMatch[1]) {
        const bgUrl = urlMatch[1]
        if (!bgUrl.startsWith('data:')) {
          const fullUrl = bgUrl.startsWith('http')
            ? bgUrl
            : new URL(bgUrl, page.url()).href
          const response = await page.request.get(fullUrl)
          expect(
            response.status(),
            `Background image ${bgUrl} should return 200`
          ).toBe(200)
        }
      }
    }
  })

  test('JavaScript chunks should load', async ({ page }) => {
    const scriptErrors: string[] = []

    // Listen for script load errors
    page.on('pageerror', (error) => {
      scriptErrors.push(error.message)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Get all script elements
    const scripts = await page.locator('script[src]').all()
    expect(scripts.length).toBeGreaterThan(0)

    // Verify each script returns HTTP 200
    for (const script of scripts) {
      const src = await script.getAttribute('src')
      if (src && !src.startsWith('data:')) {
        const scriptUrl = src.startsWith('http')
          ? src
          : new URL(src, page.url()).href
        const response = await page.request.get(scriptUrl)
        expect(response.status(), `Script ${src} should return 200`).toBe(200)
      }
    }

    // Verify no script errors occurred
    expect(
      scriptErrors.length,
      `No JavaScript errors should occur: ${scriptErrors.join(', ')}`
    ).toBe(0)
  })

  test('all network requests should succeed (no 404s)', async ({ page }) => {
    const failedRequests: Array<{ url: string; status: number }> = []

    // Monitor all requests
    page.on('response', (response) => {
      const status = response.status()
      const url = response.url()

      // Track 4xx and 5xx errors
      if (status >= 400) {
        failedRequests.push({ url, status })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify no failed requests
    if (failedRequests.length > 0) {
      const failureDetails = failedRequests
        .map((r) => `${r.url} (HTTP ${r.status})`)
        .join('\n  ')
      throw new Error(`Failed requests detected:\n  ${failureDetails}`)
    }

    expect(failedRequests.length).toBe(0)
  })
})
