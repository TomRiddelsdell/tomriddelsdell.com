import dotenv from 'dotenv';

// Load environment variables immediately
dotenv.config({ override: true });

// Force environment-based configuration to avoid ES module compatibility issues
process.env.FORCE_ENV_CONFIG = 'true';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeTemplates } from "../../../infrastructure/database/initTemplates";
import { securityHeaders, generalRateLimit, sanitizeInput } from "./security";
import { logger } from "./logger";
import { getConfig } from "../../../infrastructure/configuration/node-config-service";

const app = express();

// Trust proxy for Replit environment
app.set('trust proxy', true);

// Security middleware
app.use(securityHeaders);
if (process.env.NODE_ENV === 'production') {
  app.use(generalRateLimit);
}
app.use(sanitizeInput);

// Secure CORS configuration using centralized config
app.use((req, res, next) => {
  const config = getConfig();
  const corsConfig = config.security.cors;
  
  // Determine allowed origin
  const origin = req.headers.origin;
  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (corsConfig.allowedOrigins.length === 0) {
    // Development mode - allow current domain
    const currentDomain = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000';
    res.header('Access-Control-Allow-Origin', currentDomain);
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

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Validate configuration on startup
    console.log('🔧 Validating configuration...');
    const config = getConfig();
    console.log(`✅ Configuration validated for ${config.environment} environment`);
    
    // Initialize templates
    console.log('🗃️ Initializing database templates...');
    await initializeTemplates();
    console.log('✅ Database templates initialized');
    
    const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error:', { error: err.message, stack: err.stack });
    
    const status = err.status || err.statusCode || 500;
    const message = config.environment === 'production' ? 'Internal Server Error' : err.message || "Internal Server Error";

    if (!res.headersSent) {
      res.status(status).json({ message, status: 'error' });
    }
  });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log('Starting Vite setup...');
      await setupVite(app, server);
      console.log('Vite setup completed');
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server started successfully on port ${port}`);
      console.log(`🌐 Environment: ${config.environment}`);
      console.log(`📍 Base URL: ${config.services.external.baseUrl}`);
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
      
      // Log specific configuration errors
      if (error.message?.includes('Configuration')) {
        console.error('💡 Hint: Check your environment variables and ensure all required configuration is set');
        console.error('💡 Run: tsx scripts/validate-environment.ts to check configuration');
      }
    }
    
    process.exit(1);
  }
})();
