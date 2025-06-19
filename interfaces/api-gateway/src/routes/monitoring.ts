/**
 * Monitoring API routes - System health, metrics, and observability endpoints
 */

import { Router } from 'express';
import { MonitoringService } from '../../../../domains/monitoring/src/monitoring-service';
import { AuthController } from '../auth/auth-controller';

const router = Router();
const monitoringService = new MonitoringService();

/**
 * Get system status overview
 * GET /api/monitoring/status
 */
router.get('/status', AuthController.isAuthenticated, async (req, res) => {
  try {
    const systemStatus = await monitoringService.getSystemStatus();
    res.json(systemStatus);
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get service health checks
 * GET /api/monitoring/health
 */
router.get('/health', AuthController.isAuthenticated, async (req, res) => {
  try {
    const healthService = monitoringService.getHealthService();
    const services = await healthService.checkAllServices();
    res.json({ services });
  } catch (error) {
    console.error('Error fetching service health:', error);
    res.status(500).json({ 
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