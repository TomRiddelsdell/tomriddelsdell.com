import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')

    // Check if the page loads correctly
    await expect(page).toHaveTitle(/Landing Page/)

    // Check for main content
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check that content is still visible
    await expect(page.locator('h1')).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should meet accessibility standards', async ({ page }) => {
    await page.goto('/')

    // Check for proper heading structure
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)

    // Check for alt text on images (if any)
    const images = page.locator('img')
    const imageCount = await images.count()

    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })
})
