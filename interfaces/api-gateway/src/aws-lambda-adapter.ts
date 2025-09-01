import serverlessExpress from '@vendia/serverless-express';
import { type APIGatewayProxyEvent, type APIGatewayProxyResult, type Context } from 'aws-lambda';
import express from 'express';
import { registerRoutes } from './routes/index';
import { securityHeaders, generalRateLimit, sanitizeInput } from './security';
import { logger } from './logger';
import { getConfig } from '../../../infrastructure/configuration/node-config-service';

// Create Express app
const createApp = () => {
  const app = express();
  
  // Get config only when creating the app (at runtime, not module load)
  const config = getConfig();

  // Security middleware - adapted for Lambda
  app.use(securityHeaders);
  
  // Rate limiting only in production and not for Lambda cold starts
  if (config.environment === 'production' && !config.aws.lambdaFunctionName) {
    app.use(generalRateLimit);
  }
  
  app.use(sanitizeInput);

  // AWS Lambda-specific CORS configuration
  app.use((req, res, next) => {
    const corsConfig = config.security.cors;
    
    // For AWS Lambda, determine allowed origin from CloudFront or direct API Gateway
    const origin = req.headers.origin;
    const host = req.headers.host;
    
    // Allow CloudFront distribution and direct API Gateway access
    if (origin && corsConfig.allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (host?.includes('cloudfront.net') || host?.includes('amazonaws.com')) {
      // Allow AWS infrastructure
      res.header('Access-Control-Allow-Origin', '*');
    } else {
      // Default to configured domain
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

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));

  // Request logging for Lambda
  app.use((req, res, next) => {
    logger.info(`AWS Lambda Request: ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      forwarded: req.get('X-Forwarded-For'),
      requestId: req.get('X-Amzn-RequestId'),
      environment: config.environment
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      environment: config.environment,
      platform: 'AWS Lambda',
      timestamp: new Date().toISOString(),
      region: config.aws.region,
      function: config.aws.lambdaFunctionName
    });
  });

  // Register all domain routes
  registerRoutes(app);

  // 404 handler
  app.use('*', (req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
      error: 'Route not found',
      path: req.path,
      method: req.method
    });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error in AWS Lambda:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      requestId: req.get('X-Amzn-RequestId')
    });

    res.status(500).json({
      error: config.environment === 'production' ? 'Internal server error' : err.message,
      requestId: req.get('X-Amzn-RequestId')
    });
  });

  return app;
};

// Create the Express app
const app = createApp();

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

    // Log Lambda context for monitoring
    logger.info('Lambda invocation started', {
      requestId: context.awsRequestId,
      functionName: context.functionName,
      memoryLimit: context.memoryLimitInMB,
      remainingTime: context.getRemainingTimeInMillis(),
      httpMethod: event.httpMethod,
      path: event.path,
      stage: event.requestContext.stage
    });

    // Call the serverless Express handler with Promise wrapper
    const result = await new Promise<APIGatewayProxyResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Lambda function timeout'));
      }, 25000); // 25 second timeout

      serverlessExpressInstance(event, context, (error, result) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    logger.info('Lambda invocation completed', {
      requestId: context.awsRequestId,
      statusCode: result.statusCode,
      remainingTime: context.getRemainingTimeInMillis()
    });

    return result;
  } catch (error) {
    logger.error('Lambda invocation failed', {
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
