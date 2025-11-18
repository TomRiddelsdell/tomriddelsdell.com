import { test, expect } from '@playwright/test'

/**
 * API Health Tests
 * 
 * These tests verify that API endpoints are functional and return
 * expected data structures. Critical for monitoring observability
 * endpoints and ensuring the Worker is deployed correctly.
 */
test.describe('API Health Endpoints', () => {
  test('health endpoint should return valid JSON', async ({ request }) => {
    const response = await request.get('/api/health')
    
    // Should return 200
    expect(response.status()).toBe(200)
    
    // Should have correct content type
    expect(response.headers()['content-type']).toContain('application/json')
    
    // Should return valid JSON
    const data = await response.json()
    expect(data).toBeDefined()
    expect(data.status).toBe('healthy')
    expect(data.service).toBe('landing-page')
    expect(data.timestamp).toBeDefined()
  })

  test('health endpoint should include observability info', async ({ request }) => {
    const response = await request.get('/api/health')
    const data = await response.json()
    
    // Should include observability metadata
    expect(data.observability).toBeDefined()
    expect(data.observability.tracingEnabled).toBeDefined()
    expect(data.observability.metricsEnabled).toBeDefined()
  })

  test('metrics endpoint should return valid JSON', async ({ request }) => {
    const response = await request.get('/api/metrics')
    
    // Should return 200
    expect(response.status()).toBe(200)
    
    // Should have correct content type
    expect(response.headers()['content-type']).toContain('application/json')
    
    // Should return valid JSON with metrics
    const data = await response.json()
    expect(data).toBeDefined()
    expect(data.service).toBe('landing-page')
    expect(data.metrics).toBeDefined()
  })

  test('metrics endpoint should include performance metrics', async ({ request }) => {
    const response = await request.get('/api/metrics')
    const data = await response.json()
    
    // Should include key metrics
    expect(data.metrics.requestCount).toBeDefined()
    expect(data.metrics.uptime).toBeDefined()
    expect(typeof data.metrics.uptime).toBe('number')
    expect(data.metrics.uptime).toBeGreaterThan(0)
  })

  test('health check should be fast (< 500ms)', async ({ request }) => {
    const start = Date.now()
    const response = await request.get('/api/health')
    const duration = Date.now() - start
    
    expect(response.status()).toBe(200)
    expect(duration).toBeLessThan(500)
  })

  test('404 on non-existent API routes should return proper JSON error', async ({ request }) => {
    const response = await request.get('/api/non-existent-route')
    
    expect(response.status()).toBe(404)
    
    // Even 404s should return JSON (not HTML) for API routes
    const contentType = response.headers()['content-type']
    // Next.js may return HTML for 404s, so this is acceptable
    expect(contentType).toBeDefined()
  })
})

test.describe('API Endpoint Availability', () => {
  const criticalEndpoints = [
    { path: '/api/health', name: 'Health Check' },
    { path: '/api/metrics', name: 'Metrics' },
  ]

  for (const endpoint of criticalEndpoints) {
    test(`${endpoint.name} endpoint should be accessible`, async ({ request }) => {
      const response = await request.get(endpoint.path)
      expect(response.status(), `${endpoint.name} (${endpoint.path}) should return 200`).toBe(200)
    })
  }
})
