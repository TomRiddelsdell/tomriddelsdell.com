-- FlowCreate Database Production Optimization Script
-- Run these queries to optimize database performance for production

-- =====================================================
-- INDEXES for Performance Optimization
-- =====================================================

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_cognito_id ON users(cognito_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Workflows table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_created_at ON workflows(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_updated_at ON workflows(updated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_last_run ON workflows(last_run);

-- Workflow executions table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_executions_user_id ON workflow_executions(user_id);

-- Workflow templates table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_templates_is_active ON workflow_templates(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_templates_created_at ON workflow_templates(created_at);

-- Monitoring tables indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_metrics_metric_type ON system_metrics(metric_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_health_service_name ON service_health(service_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_health_timestamp ON service_health(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_health_status ON service_health(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_configuration_status_category ON configuration_status(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_configuration_status_timestamp ON configuration_status(timestamp);

-- =====================================================
-- COMPOSITE INDEXES for Complex Queries
-- =====================================================

-- User activity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_login ON users(is_active, last_login) WHERE is_active = true;

-- Workflow user queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_user_status ON workflows(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_user_updated ON workflows(user_id, updated_at);

-- Execution monitoring queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_workflow_started ON workflow_executions(workflow_id, started_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_status_started ON workflow_executions(status, started_at);

-- Performance monitoring queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_endpoint_time ON performance_metrics(endpoint, timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user_time ON audit_logs(user_id, timestamp);

-- =====================================================
-- CONSTRAINTS for Data Integrity
-- =====================================================

-- Ensure email uniqueness (case-insensitive)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique_lower ON users(LOWER(email));

-- Ensure username uniqueness (case-insensitive)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_unique_lower ON users(LOWER(username));

-- Ensure cognito_id uniqueness when not null
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_cognito_id_unique ON users(cognito_id) WHERE cognito_id IS NOT NULL;

-- =====================================================
-- PARTIAL INDEXES for Optimization
-- =====================================================

-- Active users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_only ON users(id, username, email) WHERE is_active = true;

-- Recent workflows only (last 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_recent ON workflows(id, user_id, status) 
WHERE updated_at >= (NOW() - INTERVAL '30 days');

-- Failed executions only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_failed ON workflow_executions(workflow_id, started_at) 
WHERE status = 'failed';

-- Recent performance metrics (last 7 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_recent ON performance_metrics(endpoint, response_time, timestamp) 
WHERE timestamp >= (NOW() - INTERVAL '7 days');

-- =====================================================
-- STATISTICS UPDATE for Query Optimization
-- =====================================================

-- Update table statistics for better query planning
ANALYZE users;
ANALYZE workflows;
ANALYZE workflow_executions;
ANALYZE workflow_templates;
ANALYZE system_metrics;
ANALYZE service_health;
ANALYZE performance_metrics;
ANALYZE audit_logs;
ANALYZE configuration_status;

-- =====================================================
-- VACUUM for Storage Optimization
-- =====================================================

-- Full vacuum for production optimization (run during maintenance window)
-- VACUUM FULL users;
-- VACUUM FULL workflows;
-- VACUUM FULL workflow_executions;

-- Regular vacuum (safe for production)
VACUUM ANALYZE users;
VACUUM ANALYZE workflows;
VACUUM ANALYZE workflow_executions;
VACUUM ANALYZE workflow_templates;
VACUUM ANALYZE system_metrics;
VACUUM ANALYZE service_health;
VACUUM ANALYZE performance_metrics;
VACUUM ANALYZE audit_logs;
VACUUM ANALYZE configuration_status;

-- =====================================================
-- DATABASE SETTINGS for Production
-- =====================================================

-- Connection and memory settings (adjust based on your server capacity)
-- These should be set in postgresql.conf or via database provider settings

/*
Recommended PostgreSQL production settings:

max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
*/

-- =====================================================
-- MONITORING QUERIES for Production
-- =====================================================

-- Query to check index usage
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read + idx_tup_fetch DESC;
*/

-- Query to check table sizes
/*
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/

-- Query to check slow queries
/*
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;
*/