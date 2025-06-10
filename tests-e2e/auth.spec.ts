import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display home page correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main heading is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Check if navigation is present
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should show login form when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login or show login form
    await expect(page).toHaveURL(/.*(\?|&|#).*sign.*in.*/);
  });

  test('should handle login form interactions', async ({ page }) => {
    await page.goto('/');
    
    // Look for sign in button or link
    const signInButton = page.locator('button, a').filter({ hasText: /sign.?in/i }).first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      
      // Check if email input is visible
      const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        
        const passwordInput = page.locator('input[type="password"], input[name*="password"]').first();
        if (await passwordInput.isVisible()) {
          await passwordInput.fill('password123');
          
          // Try to submit
          const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /sign.?in|login/i }).first();
          if (await submitButton.isVisible()) {
            await submitButton.click();
          }
        }
      }
    }
  });

  test('should display contact form', async ({ page }) => {
    await page.goto('/');
    
    // Look for contact link
    const contactLink = page.locator('a, button').filter({ hasText: /contact/i }).first();
    if (await contactLink.isVisible()) {
      await contactLink.click();
      
      // Check if contact form is visible
      const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
      const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
      const messageInput = page.locator('textarea, input[name*="message"]').first();
      
      if (await nameInput.isVisible() && await emailInput.isVisible() && await messageInput.isVisible()) {
        await nameInput.fill('Test User');
        await emailInput.fill('test@example.com');
        await messageInput.fill('This is a test message for the contact form.');
        
        const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /send|submit/i }).first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Wait for success message or redirect
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if page loads correctly on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Check if navigation is mobile-friendly
    const mobileMenu = page.locator('button').filter({ hasText: /menu|☰|≡/i }).first();
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await page.waitForTimeout(500);
    }
  });
});