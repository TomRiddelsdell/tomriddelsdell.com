import { Router } from 'express';
import { getConfig } from '../../../../infrastructure/configuration/node-config-service';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/config/auth
 * Returns authentication configuration for frontend use
 */
router.get('/auth', (req, res) => {
  try {
    const config = getConfig();
    
    // Only return safe configuration values to frontend
    const authConfig = {
      cognito: {
        clientId: config.cognito.clientId,
        region: config.cognito.region,
        userPoolId: config.cognito.userPoolId,
        hostedUIDomain: config.cognito.hostedUIDomain,
      },
      urls: {
        baseUrl: config.services.external.baseUrl,
        callbackUrl: config.services.external.callbackUrl,
        logoutUrl: config.services.external.logoutUrl,
      },
    };
    
    // Validate that all required fields are present
    const requiredFields = [
      'cognito.clientId',
      'cognito.region', 
      'cognito.userPoolId',
      'cognito.hostedUIDomain',
      'urls.baseUrl',
      'urls.callbackUrl',
      'urls.logoutUrl'
    ];
    
    for (const field of requiredFields) {
      const value = field.split('.').reduce((obj: any, key: string) => obj?.[key], authConfig);
      if (!value) {
        console.error(`Missing required auth config field: ${field}`);
        return res.status(500).json({ 
          error: 'Authentication configuration incomplete',
          missing: field
        });
      }
    }
    
    res.json(authConfig);
  } catch (error) {
    console.error('Error getting auth config:', error);
    res.status(500).json({ 
      error: 'Failed to get authentication configuration' 
    });
  }
});

/**
 * GET /api/config/health  
 * Returns basic configuration health check
 */
router.get('/health', (req, res) => {
  try {
    const config = getConfig();
    
    const health = {
      environment: config.environment,
      database: {
        connected: !!config.database.url,
      },
      cognito: {
        configured: !!(config.cognito.clientId && config.cognito.userPoolId),
      },
      urls: {
        baseUrl: config.services.external.baseUrl,
      }
    };
    
    res.json(health);
  } catch (error) {
    console.error('Error getting config health:', error);
    res.status(500).json({ 
      error: 'Configuration health check failed' 
    });
  }
});

export default router;
