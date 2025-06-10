import { test, expect, Page } from '@playwright/test';

test.describe('Authentication Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should display sign in button when not authenticated', async ({ page }) => {
    // Check that the sign in button is visible
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Check that logged in status is not shown
    await expect(page.getByText('Logged In')).not.toBeVisible();
  });

  test('should redirect to Cognito when clicking sign in', async ({ page }) => {
    // Click the sign in button
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for navigation to Cognito
    await page.waitForURL(/.*amazoncognito\.com.*/, { timeout: 10000 });
    
    // Verify we're on the Cognito login page
    expect(page.url()).toContain('amazoncognito.com');
    expect(page.url()).toContain('login');
  });

  test('should handle authentication callback successfully', async ({ page }) => {
    // Mock a successful authentication callback
    await page.route('/api/auth/callback', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          displayName: 'Test User',
          cognitoId: 'test-cognito-id'
        })
      });
    });

    // Mock the /api/auth/me endpoint to return authenticated user
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          displayName: 'Test User',
          cognitoId: 'test-cognito-id'
        })
      });
    });

    // Navigate to auth callback with a test code
    await page.goto('/auth/callback?code=test-auth-code');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify we're on the dashboard
    expect(page.url()).toContain('/dashboard');
  });

  test('should display user info when authenticated', async ({ page }) => {
    // Mock authenticated state
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          displayName: 'Test User',
          cognitoId: 'test-cognito-id'
        })
      });
    });

    // Mock dashboard data
    await page.route('/api/dashboard/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activeWorkflows: 3,
          connectedApps: 2,
          tasksAutomated: 150,
          automationSavings: 75
        })
      });
    });

    await page.route('/api/workflows/recent', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('/api/connected-apps', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('/api/templates/popular', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Reload the page to trigger auth check
    await page.reload();
    
    // Check that user info is displayed in sidebar
    await expect(page.getByText('Test User')).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
    
    // Check that logout button is visible
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  test('should handle sign out flow correctly', async ({ page }) => {
    // Mock authenticated state first
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          displayName: 'Test User',
          cognitoId: 'test-cognito-id'
        })
      });
    });

    // Mock sign out endpoint
    await page.route('/api/auth/signout', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Signed out successfully',
          cognitoLogoutUrl: 'https://test-cognito.auth.us-east-1.amazoncognito.com/logout?client_id=test&logout_uri=http://localhost:5173'
        })
      });
    });

    // Load authenticated state
    await page.reload();
    
    // Wait for user info to be visible
    await expect(page.getByText('Test User')).toBeVisible();
    
    // Click the logout button
    await page.getByRole('button', { name: 'Sign out' }).click();
    
    // Verify redirect to Cognito logout
    await page.waitForURL(/.*amazoncognito\.com.*logout.*/, { timeout: 10000 });
    expect(page.url()).toContain('logout');
  });

  test('should protect dashboard route when not authenticated', async ({ page }) => {
    // Mock unauthenticated state
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not authenticated' })
      });
    });

    // Try to access dashboard
    await page.goto('/dashboard');
    
    // Should be redirected to home or see unauthenticated state
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should maintain session across page reloads', async ({ page }) => {
    // Mock authenticated state
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          displayName: 'Test User',
          cognitoId: 'test-cognito-id'
        })
      });
    });

    // Mock dashboard endpoints
    await page.route('/api/dashboard/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activeWorkflows: 3,
          connectedApps: 2,
          tasksAutomated: 150,
          automationSavings: 75
        })
      });
    });

    await page.route('/api/workflows/recent', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('/api/connected-apps', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('/api/templates/popular', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Load authenticated state
    await page.reload();
    
    // Verify user is authenticated
    await expect(page.getByText('Test User')).toBeVisible();
    
    // Reload the page
    await page.reload();
    
    // User should still be authenticated
    await expect(page.getByText('Test User')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error for auth check
    await page.route('/api/auth/me', async route => {
      await route.abort('failed');
    });

    // Reload page to trigger auth check
    await page.reload();
    
    // Should show sign in button (fallback to unauthenticated state)
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should display correct navigation for authenticated users', async ({ page }) => {
    // Mock authenticated state
    await page.route('/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          displayName: 'Test User',
          cognitoId: 'test-cognito-id'
        })
      });
    });

    // Navigate to home page
    await page.goto('/');
    
    // Should show authenticated navigation
    await expect(page.getByText('Logged In')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Career' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tasks' })).toBeVisible();
  });
});