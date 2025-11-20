import { test, expect } from '@playwright/test'

/**
 * Visual Regression Tests
 *
 * These tests capture screenshots and compare them to baseline images
 * to detect unintended visual changes. Critical for catching CSS issues
 * like the recent assets configuration problem.
 *
 * Note: First run will create baseline screenshots.
 * Subsequent runs will compare against baselines.
 */
test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('homepage should match visual snapshot', async ({ page }) => {
    // Wait for images to load
    await page.waitForLoadState('load')

    // Hide dynamic elements (like current year in footer)
    await page.evaluate(() => {
      // Hide any time-based or dynamic content
      const timeElements = document.querySelectorAll(
        '[data-testid="current-year"]'
      )
      timeElements.forEach(
        (el) => ((el as HTMLElement).style.visibility = 'hidden')
      )
    })

    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow small differences for anti-aliasing
    })
  })

  test('hero section should match visual snapshot', async ({ page }) => {
    const heroSection = page.locator('section#home')
    await expect(heroSection).toBeVisible()

    await expect(heroSection).toHaveScreenshot('hero-section.png', {
      maxDiffPixels: 50,
    })
  })

  test('navigation should match visual snapshot', async ({ page }) => {
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()

    await expect(nav).toHaveScreenshot('navigation.png', {
      maxDiffPixels: 20,
    })
  })

  test('mobile homepage should match visual snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
    })
  })

  test('tablet homepage should match visual snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      maxDiffPixels: 100,
    })
  })
})

test.describe('CSS Application Verification', () => {
  test('hero background should have correct styles', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const heroSection = page.locator('section#home')

    // Verify section is visible
    await expect(heroSection).toBeVisible()

    // Verify minimum height
    const minHeight = await heroSection.evaluate(
      (el) => window.getComputedStyle(el).minHeight
    )
    expect(minHeight).toContain('100vh')

    // Verify position is relative
    const position = await heroSection.evaluate(
      (el) => window.getComputedStyle(el).position
    )
    expect(position).toBe('relative')
  })

  test('images should have correct dimensions', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check profile image dimensions
    const profileImg = page
      .locator('img[alt*="Tom Riddelsdell"], img[alt*="riddelsdell"]')
      .first()
    if ((await profileImg.count()) > 0) {
      const boundingBox = await profileImg.boundingBox()
      expect(boundingBox).toBeTruthy()

      if (boundingBox) {
        // Image should have reasonable dimensions (not oversized)
        expect(boundingBox.width).toBeGreaterThan(50)
        expect(boundingBox.width).toBeLessThan(1000)
        expect(boundingBox.height).toBeGreaterThan(50)
        expect(boundingBox.height).toBeLessThan(1000)
      }
    }
  })

  test('text should be readable (proper font sizes)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check h1 font size
    const h1 = page.locator('h1').first()
    const fontSize = await h1.evaluate(
      (el) => window.getComputedStyle(el).fontSize
    )

    // Parse font size (e.g., "48px" -> 48)
    const fontSizeNum = parseFloat(fontSize)

    // H1 should be large (at least 32px on mobile)
    expect(fontSizeNum).toBeGreaterThan(32)
  })

  test('colors should be applied correctly', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check that nav has expected background
    const nav = page.locator('nav').first()
    const bgColor = await nav.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    )

    // Should have a white-ish background (not default/transparent)
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(bgColor).toBeTruthy()
  })
})
