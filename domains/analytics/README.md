# Analytics Domain

## Overview
The Analytics Domain provides comprehensive insights, metrics, and reporting capabilities for the FlowCreate platform. It collects, processes, and presents data about workflow performance, system usage, and user behavior to enable data-driven decision making and performance optimization.

## Domain Responsibilities

### Primary Responsibilities
- **Metrics Collection**: Gathering performance and usage data from all platform components
- **Real-time Analytics**: Processing and aggregating metrics in real-time
- **Dashboard Management**: Creating and managing custom analytics dashboards
- **Report Generation**: Automated and on-demand report creation
- **Alert Management**: Threshold-based alerting and notification triggers
- **Performance Monitoring**: System health and performance tracking

### Business Invariants
- Metrics must have valid timestamps and values
- Dashboards belong to specific users with appropriate permissions
- Reports must have defined time ranges and valid filters
- Alert thresholds must be within reasonable bounds
- Data retention policies must be enforced

## Domain Model

### Entities
- **Metric**: Individual performance measurements with timestamp and context
- **Dashboard**: Custom analytics views for users
- **Report**: Generated analytics reports with filters and time ranges
- **Alert**: Threshold-based monitoring and notification rules

### Value Objects
- **MetricValue**: Typed measurement values (counter, gauge, timer, percentage, bytes)
- **TimeRange**: Temporal query boundaries with validation
- **Dimension**: Categorization and filtering dimensions
- **DimensionCollection**: Grouped dimensions for complex queries
- **Threshold**: Alert trigger conditions with comparison operators

### Domain Events
- **MetricCollectedEvent**: Published when new metrics are recorded
- **ThresholdExceededEvent**: Published when alert conditions are met
- **ReportGeneratedEvent**: Published when reports are created
- **DashboardCreatedEvent**: Published when new dashboards are built

## Metric Types

### Counter Metrics
Track cumulative values that only increase:
```typescript
const workflowExecutions = MetricValue.counter(142, 'executions');
const userRegistrations = MetricValue.counter(89, 'users');
```

### Gauge Metrics
Track current values that can increase or decrease:
```typescript
const activeUsers = MetricValue.gauge(245, 'users');
const memoryUsage = MetricValue.gauge(1024, 'MB');
```

### Timer Metrics
Track duration measurements:
```typescript
const executionTime = MetricValue.timer(1500, 'ms');
const apiResponseTime = MetricValue.timer(250, 'ms');
```

### Percentage Metrics
Track ratio measurements:
```typescript
const successRate = MetricValue.percentage(95.5, '%');
const errorRate = MetricValue.percentage(2.1, '%');
```

### Byte Metrics
Track data size measurements:
```typescript
const dataProcessed = MetricValue.bytes(2048576); // 2MB
const storageUsed = MetricValue.bytes(1073741824); // 1GB
```

## Time Range Management

### Predefined Ranges
```typescript
const last24Hours = TimeRange.last24Hours();
const last7Days = TimeRange.last7Days();
const last30Days = TimeRange.last30Days();
const thisMonth = TimeRange.thisMonth();
```

### Custom Ranges
```typescript
const customRange = TimeRange.custom(
    new Date('2024-01-01'),
    new Date('2024-01-31')
);
```

### Granularity Detection
```typescript
const granularity = timeRange.getOptimalGranularity();
// Returns: 'minute', 'hour', 'day', 'week', 'month'
```

## Dimension System

### Basic Dimensions
```typescript
const userDimension = Dimension.user('user123');
const workflowDimension = Dimension.workflow('workflow456');
const appDimension = Dimension.app('gmail');
```

### Dimension Collections
```typescript
const filters = new DimensionCollection([
    Dimension.user('user123'),
    Dimension.timeframe('last_7_days'),
    Dimension.status('success')
]);
```

## Alert Management

### Threshold Types
```typescript
// Simple comparison thresholds
const highCpuAlert = Threshold.greaterThan(80, 'critical');
const lowDiskAlert = Threshold.lessThan(10, 'warning');

// Range-based thresholds
const responseTimeAlert = Threshold.range(0, 1000, 'normal');
```

### Alert Configuration
```typescript
const alert = Alert.create(
    'high-error-rate',
    Threshold.greaterThan(5, 'critical'),
    {
        channels: ['email', 'slack'],
        cooldownMinutes: 30,
        description: 'Workflow error rate is too high'
    }
);
```

## Reporting System

### Report Types
- **Performance Reports**: Workflow execution metrics and trends
- **Usage Reports**: User activity and platform utilization
- **Error Reports**: System errors and failure analysis
- **Custom Reports**: User-defined analytics queries

### Report Generation
```typescript
const report = Report.create(
    'monthly-performance',
    'performance',
    TimeRange.thisMonth(),
    [
        Dimension.status('all'),
        Dimension.user('all')
    ]
);
```

### Scheduled Reports
```typescript
const scheduledReport = Report.scheduled(
    'weekly-summary',
    'summary',
    TimeRange.last7Days(),
    filters,
    { frequency: 'weekly', day: 'monday', time: '09:00' }
);
```

## Dashboard Management

### Dashboard Creation
```typescript
const dashboard = Dashboard.create(
    'workflow-performance',
    userId,
    {
        widgets: [
            {
                type: 'chart',
                metric: 'execution_time',
                timeRange: TimeRange.last24Hours()
            },
            {
                type: 'counter',
                metric: 'total_executions',
                timeRange: TimeRange.today()
            }
        ]
    }
);
```

## Domain Events Flow

```
Metric Collection:
1. MetricCollectedEvent → Real-time processing
2. MetricCollectedEvent → Dashboard updates
3. MetricCollectedEvent → Alert evaluation

Threshold Exceeded:
1. ThresholdExceededEvent → Notification Domain (alerts)
2. ThresholdExceededEvent → Workflow Domain (auto-scaling)

Report Generation:
1. ReportGeneratedEvent → Notification Domain (delivery)
2. ReportGeneratedEvent → Storage (archival)
```

## Business Rules

### Metric Validation
```typescript
// Percentage values must be between 0 and 100
if (percentage < 0 || percentage > 100) {
    throw new DomainException('Percentage values must be between 0 and 100');
}

// Timer values must be positive
if (duration <= 0) {
    throw new DomainException('Timer values must be positive');
}
```

### Report Constraints
```typescript
// Reports must have valid time ranges
if (startDate >= endDate) {
    throw new DomainException('Start date must be before end date');
}

// Report names must be unique per user
if (await reportExists(name, userId)) {
    throw new DomainException('Report name already exists');
}
```

### Dashboard Permissions
```typescript
// Users can only access their own dashboards unless shared
if (dashboard.userId !== requestingUserId && !dashboard.isSharedWith(requestingUserId)) {
    throw new DomainException('Access denied to dashboard');
}
```

## Implementation Status

### 🚧 Partially Implemented
- Basic domain structure and value objects
- Metric type definitions
- Time range management
- Threshold and alert framework
- Test structure (comprehensive test suite ready)

### 📋 Planned Features
- Real-time metric collection
- Dashboard widget implementation
- Report generation engine
- Alert notification integration
- Data aggregation and storage
- Performance optimization

## Integration Patterns

### Event-Driven Metrics
```typescript
// Metrics are collected via domain events from other domains
class MetricCollectionService {
    @EventHandler(WorkflowExecutedEvent)
    async handleWorkflowExecution(event: WorkflowExecutedEvent) {
        await this.recordMetric(
            MetricValue.counter(1, 'workflow_executions'),
            [Dimension.workflow(event.workflowId)]
        );
    }
}
```

### Repository Pattern
```typescript
interface IMetricRepository {
    save(metric: Metric): Promise<void>;
    findByDimensions(dimensions: DimensionCollection, timeRange: TimeRange): Promise<Metric[]>;
    aggregate(metricType: string, timeRange: TimeRange): Promise<MetricValue[]>;
}
```

## Usage Examples

### Recording Metrics
```typescript
const metric = Metric.create(
    'workflow-execution-time',
    MetricValue.timer(1500, 'ms'),
    [
        Dimension.workflow('workflow123'),
        Dimension.user('user456')
    ]
);

await metricRepository.save(metric);
```

### Querying Analytics
```typescript
const metrics = await metricRepository.findByDimensions(
    new DimensionCollection([
        Dimension.timeframe('last_7_days'),
        Dimension.status('success')
    ]),
    TimeRange.last7Days()
);
```

This domain provides the foundation for comprehensive analytics and monitoring capabilities, enabling data-driven insights and proactive system management across the FlowCreate platform.