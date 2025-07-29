/**
 * Monitoring API routes - System health, metrics, and observability endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { MonitoringService } from '../../../../domains/monitoring/src/monitoring-service';
import { AuthController } from '../auth/auth-controller';

const router = Router();
const monitoringService = new MonitoringService();

// Security headers middleware for monitoring routes
router.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

/**
 * Get basic health check (public)
 * GET /api/monitoring/health-check
 */
router.get('/health-check', async (req, res) => {
  try {
    const monitoringService = new MonitoringService();
    const healthService = monitoringService.getHealthService();
    const services = await healthService.checkAllServices();
    const metrics = await healthService.getSystemMetrics();
    
    res.json({ 
      status: 'ok',
      services: services.map(s => ({ service: s.service, status: s.status, responseTime: s.responseTime })),
      metrics: {
        cpu: metrics.cpu,
        memory: { percentage: metrics.memory.percentage }
      }
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Health check failed'
    });
  }
});

/**
 * Get system status overview (PUBLIC - no auth required for health checks)
 * GET /api/monitoring/status
 */
router.get('/status', async (req, res) => {
  try {
    const systemStatus = await monitoringService.getSystemStatus();
    
    // Extract status from system status for compatibility with tests
    const allHealthy = systemStatus.services.every(s => s.status === 'healthy' || s.status === 'degraded');
    const status = allHealthy ? 'healthy' : 'unhealthy';
    
    res.json({
      status,
      ...systemStatus
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to fetch system status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get service health checks (PUBLIC - no auth required for health checks)
 * GET /api/monitoring/health
 */
router.get('/health', async (req, res) => {
  try {
    const healthService = monitoringService.getHealthService();
    const services = await healthService.checkAllServices();
    
    // If no health checks are registered, assume system is healthy for basic monitoring
    if (services.length === 0) {
      return res.json({ 
        status: 'healthy',
        services: [],
        message: 'No health checks registered - system operational'
      });
    }
    
    // Check if all services are healthy (consider degraded as acceptable)
    const allHealthy = services.every(s => s.status === 'healthy' || s.status === 'degraded');
    const status = allHealthy ? 'healthy' : 'unhealthy';
    
    // Include database info in the response for compatibility
    const dbService = services.find(s => s.service === 'database');
    
    res.json({ 
      status,
      services,
      database: dbService ? {
        status: dbService.status,
        responseTime: dbService.responseTime
      } : undefined
    });
  } catch (error) {
    console.error('Error fetching service health:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to fetch service health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get system metrics
 * GET /api/monitoring/metrics
 */
router.get('/metrics', AuthController.isAuthenticated, async (req, res) => {
  try {
    const healthService = monitoringService.getHealthService();
    const metrics = await healthService.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get dashboard statistics
 * GET /api/monitoring/dashboard-stats
 */
router.get('/dashboard-stats', AuthController.isAuthenticated, async (req, res) => {
  try {
    const metricsService = monitoringService.getMetricsService();
    const stats = metricsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get performance metrics
 * GET /api/monitoring/performance?start=<timestamp>&end=<timestamp>
 */
router.get('/performance', AuthController.isAuthenticated, async (req, res) => {
  try {
    const { start, end } = req.query;
    const metricsService = monitoringService.getMetricsService();
    
    const startTime = start ? new Date(start as string) : undefined;
    const endTime = end ? new Date(end as string) : undefined;
    
    const metrics = metricsService.getPerformanceMetrics(startTime, endTime);
    const endpointStats = metricsService.getEndpointPerformance();
    
    res.json({ 
      metrics,
      endpointStats,
      summary: {
        totalRequests: metrics.length,
        timeRange: { start: startTime, end: endTime }
      }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get activity logs
 * GET /api/monitoring/activity?start=<timestamp>&end=<timestamp>
 */
router.get('/activity', AuthController.isAuthenticated, async (req, res) => {
  try {
    const { start, end } = req.query;
    const metricsService = monitoringService.getMetricsService();
    
    const startTime = start ? new Date(start as string) : undefined;
    const endTime = end ? new Date(end as string) : undefined;
    
    const logs = metricsService.getActivityLogs(startTime, endTime);
    
    res.json({ 
      logs,
      summary: {
        totalActivities: logs.length,
        timeRange: { start: startTime, end: endTime }
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch activity logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get configuration status
 * GET /api/monitoring/config-status
 */
router.get('/config-status', AuthController.isAdmin, async (req, res) => {
  try {
    const configStatus = await monitoringService.getConfigurationStatus();
    res.json({ configurations: configStatus });
  } catch (error) {
    console.error('Error fetching configuration status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch configuration status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;