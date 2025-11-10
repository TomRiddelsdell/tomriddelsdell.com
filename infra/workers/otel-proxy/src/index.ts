/**
 * OTLP HTTP Proxy Worker
 * 
 * Forwards OpenTelemetry Protocol (OTLP) HTTP requests from edge applications
 * to Grafana Cloud (or other OTLP backend).
 * 
 * Features:
 * - Authentication via API key
 * - CORS support for browser-based telemetry
 * - Request validation
 * - Error handling with fallback logging
 * - Rate limiting (optional)
 */

export interface Env {
  // Grafana Cloud OTLP endpoint (e.g., "https://otlp-gateway-prod-us-east-0.grafana.net/otlp")
  GRAFANA_CLOUD_OTLP_ENDPOINT: string;
  
  // Grafana Cloud API key (base64 encoded instanceID:token)
  GRAFANA_CLOUD_API_KEY: string;
  
  // API key for authenticating incoming requests
  OTEL_PROXY_API_KEY: string;
  
  // Environment name
  ENVIRONMENT?: string;
}

/**
 * CORS headers for browser-based telemetry
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Validate incoming OTLP request
 */
function validateRequest(request: Request, env: Env): { valid: boolean; error?: string } {
  // Check method
  if (request.method !== 'POST' && request.method !== 'OPTIONS') {
    return { valid: false, error: 'Method not allowed' };
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return { valid: true };
  }

  // Check authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const expectedAuth = `Bearer ${env.OTEL_PROXY_API_KEY}`;
  if (authHeader !== expectedAuth) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check content type
  const contentType = request.headers.get('Content-Type');
  if (!contentType || !contentType.includes('application/json')) {
    return { valid: false, error: 'Content-Type must be application/json' };
  }

  return { valid: true };
}

/**
 * Forward OTLP request to Grafana Cloud
 */
async function forwardToGrafana(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  
  // Validate path (must be /v1/traces, /v1/metrics, or /v1/logs)
  if (!url.pathname.startsWith('/v1/')) {
    return new Response(
      JSON.stringify({ error: 'Invalid OTLP path. Must be /v1/traces, /v1/metrics, or /v1/logs' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }

  // Construct Grafana Cloud URL
  const grafanaUrl = `${env.GRAFANA_CLOUD_OTLP_ENDPOINT}${url.pathname}`;

  try {
    // Forward request to Grafana Cloud
    const upstreamResponse = await fetch(grafanaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${env.GRAFANA_CLOUD_API_KEY}`,
        // Forward original headers that might be useful
        ...(request.headers.get('User-Agent') && { 'User-Agent': request.headers.get('User-Agent')! }),
      },
      body: request.body,
    });

    // Return response with CORS headers
    const response = new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: {
        'Content-Type': upstreamResponse.headers.get('Content-Type') || 'application/json',
        ...CORS_HEADERS,
      },
    });

    return response;
  } catch (error) {
    console.error('Failed to forward OTLP request to Grafana Cloud:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Failed to forward telemetry data',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Validate request
    const validation = validateRequest(request, env);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: validation.error === 'Invalid API key' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        }
      );
    }

    // Check if Grafana Cloud is configured
    if (!env.GRAFANA_CLOUD_OTLP_ENDPOINT || !env.GRAFANA_CLOUD_API_KEY) {
      console.error('Grafana Cloud credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Observability backend not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        }
      );
    }

    // Forward to Grafana Cloud
    return forwardToGrafana(request, env);
  },
};
