import serverlessExpress from '@vendia/serverless-express';
import { type APIGatewayProxyEvent, type APIGatewayProxyResult, type Context } from 'aws-lambda';
import express from 'express';

// Very basic logger for minimal startup
const log = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, data ? JSON.stringify(data) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, data ? JSON.stringify(data) : '');
  }
};

// Track route registration to ensure it only happens once
let routesRegistered = false;

// Absolutely minimal app - no external imports during initialization
const createUltraMinimalApp = () => {
  const app = express();
  
  // Strip API Gateway stage prefix - FIRST middleware
  app.use((req, res, next) => {
    if (req.url.startsWith('/staging')) {
      req.url = req.url.replace('/staging', '') || '/';
    }
    next();
  });

  // Basic request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));

  // Ultra basic CORS - no dependencies
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Minimal request logging
  app.use((req, res, next) => {
    log.info(`Request: ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    next();
  });

  // Ultra minimal health check - no external dependencies
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      environment: process.env.NODE_ENV || 'staging',
      platform: 'AWS Lambda',
      timestamp: new Date().toISOString(),
      note: 'Ultra minimal startup'
    });
  });

  // Ultra minimal root endpoint - no external dependencies  
  app.get('/', (req, res) => {
    res.json({
      service: 'tomriddelsdell.com API Gateway',
      status: 'running',
      environment: process.env.NODE_ENV || 'staging',
      platform: 'AWS Lambda',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      note: 'Ultra minimal startup - routes load on demand'
    });
  });

  // Load full app only for API routes
  app.use('/api/*', async (req, res, next) => {
    if (!routesRegistered) {
      try {
        log.info('Loading full application...', { path: req.path });
        
        // Import logger module
        const { logger } = await import('./logger');
        
        // Import and register all routes
        const { registerRoutes } = await import('./routes/index');
        const { securityHeaders, sanitizeInput } = await import('./security');
        const { getConfig } = await import('../../../infrastructure/configuration/node-config-service');
        
        log.info('Modules imported successfully');
        
        // Get configuration
        const config = getConfig();
        log.info('Configuration loaded');
        
        // Apply security middleware
        app.use(securityHeaders);
        app.use(sanitizeInput);
        
        // Enhanced CORS configuration
        app.use((req, res, next) => {
          const corsConfig = config.security.cors;
          const origin = req.headers.origin;
          const host = req.headers.host;
          
          if (origin && corsConfig.allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
          } else if (host?.includes('cloudfront.net') || host?.includes('amazonaws.com')) {
            res.header('Access-Control-Allow-Origin', '*');
          } else {
            res.header('Access-Control-Allow-Origin', `https://${config.domain.name}`);
          }
          
          res.header('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
          res.header('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
          res.header('Access-Control-Allow-Credentials', corsConfig.allowCredentials.toString());
          
          if (req.method === 'OPTIONS') {
            res.sendStatus(200);
          } else {
            next();
          }
        });
        
        // Register all application routes
        await registerRoutes(app);
        
        routesRegistered = true;
        log.info('Full routes registered successfully');
        
      } catch (error) {
        log.error('Error loading full routes', {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: req.path,
          stack: error instanceof Error ? error.stack : undefined
        });
        return res.status(500).json({
          error: 'Service initialization error',
          path: req.path
        });
      }
    }
    
    next();
  });

  // 404 handler
  app.use('*', (req, res) => {
    log.warn(`404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
      error: 'Route not found',
      path: req.path,
      method: req.method
    });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    log.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });

    res.status(500).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
  });

  return app;
};

// Create the ultra minimal Express app
const app = createUltraMinimalApp();

// Create serverless Express handler
const serverlessExpressInstance = serverlessExpress({ app });

/**
 * AWS Lambda handler for API Gateway proxy integration
 * Adapts the DDD Express.js application to run in AWS Lambda
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Configure Lambda context to not wait for empty event loop
    context.callbackWaitsForEmptyEventLoop = false;

    // Quick health check bypass for debugging - with correct path property for API Gateway V2
    const requestPath = event.rawPath || event.path;
    
    // Log basic request info
    log.info('Lambda invocation started', {
      requestId: context.awsRequestId,
      requestPath,
      method: event.httpMethod,
      remainingTime: context.getRemainingTimeInMillis()
    });
    
    // Bypass serverless-express for health check
    if (requestPath === '/staging/health' || requestPath === '/health') {
      log.info('Health check bypass triggered');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          status: 'healthy',
          environment: process.env.NODE_ENV || 'staging',
          platform: 'AWS Lambda',
          timestamp: new Date().toISOString(),
          path: requestPath,
          note: 'Direct bypass - no Express'
        })
      };
    }

    // Bypass serverless-express for root endpoint too
    if (requestPath === '/staging/' || requestPath === '/') {
      log.info('Root endpoint bypass triggered');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          service: 'tomriddelsdell.com API Gateway',
          status: 'running',
          environment: process.env.NODE_ENV || 'staging',
          platform: 'AWS Lambda',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          path: requestPath,
          note: 'Direct bypass - no Express overhead'
        })
      };
    }

    // For all other routes, use serverless-express with timeout
    log.info('Using serverless-express for path', { path: requestPath });
    
    const result = await new Promise<APIGatewayProxyResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Lambda function timeout'));
      }, 25000);

      serverlessExpressInstance(event, context, (error: any, result: any) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    log.info('Lambda invocation completed', {
      requestId: context.awsRequestId,
      statusCode: result.statusCode,
      remainingTime: context.getRemainingTimeInMillis()
    });

    return result;
  } catch (error) {
    log.error('Lambda invocation failed', {
      requestId: context.awsRequestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: context.awsRequestId
      })
    };
  }
};

// Export the Express app for local development
export { app };
