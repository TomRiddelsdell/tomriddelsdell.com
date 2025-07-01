# Centralized Logging for Issue Reproduction Guide

This guide shows you how to use the centralized logging system to investigate and reproduce issues in your workflow automation platform.

## Quick Start: Investigating Issues

### 1. User Reports a Problem

**Example Scenario**: User says "My workflow keeps failing randomly"

**Information you need**:
- When did it happen? (timestamp)
- Which user? (user ID) 
- Which workflow? (workflow ID)
- What were they trying to do?

### 2. Collect Related Logs

```typescript
// Get logs around the incident time
const incidentLogs = await reproductionService.collectIncidentLogs(
  incidentTime,        // When the issue occurred
  30,                  // Look 30 minutes before/after
  {
    userId: 'user_123',
    workflowId: 'workflow_456'
  }
);
```

**What you'll see**:
```
Found 23 relevant log entries
Recent error logs:
  2024-06-11T14:28:30Z [ERROR] Database connection timeout: Connection could not be established within 5000ms
    Request: req_789
  2024-06-11T14:30:15Z [ERROR] Database connection timeout: Connection pool exhausted
    Request: req_790
```

### 3. Analyze Error Patterns

```typescript
// Look for patterns in the errors
const errorAnalysis = await reproductionService.analyzeErrorPattern(incidentTime, 60);
```

**What you'll discover**:
```
Total errors in last hour: 12
Error types:
  Database connection timeout: 8 occurrences
  Memory allocation failed: 2 occurrences
  Request timeout: 2 occurrences

Affected users: 3
Critical errors: 4
```

### 4. Trace User Journey

```typescript
// See what the user was doing before the problem
const userJourney = await reproductionService.traceUserJourney('user_123', incidentTime, 120);
```

**User's actions leading to failure**:
```
  → Workflow started
  → Step 1 completed: data_fetch
  → Database connection slow (warning)
  → Workflow restarted by user (attempt 2)
  → Workflow restarted by user (attempt 3)

First error occurred: 2024-06-11T14:28:30Z
Error: Database connection timeout: Connection could not be established within 5000ms
```

### 5. Find the Root Cause

```typescript
// Correlate logs with system metrics
const correlation = await reproductionService.correlateWithMetrics(incidentTime, 15);
```

**System correlation**:
```
Found 2 high correlations with system metrics
  📈 cpu_usage_percent: 95 (4 related logs)
  📈 db_connection_pool_usage: 100 (8 related logs)
```

## Real Investigation Examples

### Example 1: Database Performance Issue

**Problem**: Workflows timing out randomly

**Investigation Steps**:

1. **Collect logs** around failure time
2. **Pattern shows**: Multiple database timeouts
3. **User journey**: User tried 3 times before giving up
4. **System metrics**: Database connection pool at 100% capacity
5. **Root cause**: Database connection pool too small for peak usage

**Solution**: Increase database connection pool size from 20 to 50 connections

### Example 2: Memory Leak Investigation

**Problem**: Application getting slower throughout the day

**Investigation Steps**:

1. **Time range**: Look at full day of logs
2. **Pattern shows**: Memory warnings increasing over time
3. **Correlation**: Memory usage climbing from 60% to 95%
4. **User impact**: Response times getting slower (2s → 8s)
5. **Root cause**: Memory not being freed after workflow completion

**Solution**: Fix memory cleanup in workflow execution engine

### Example 3: Security Incident

**Problem**: Multiple failed login attempts detected

**Investigation Steps**:

1. **Security logs**: Filter for authentication events
2. **Pattern shows**: 15 failed attempts in 10 minutes
3. **Source**: All from same IP address (192.168.1.100)
4. **Targeted accounts**: admin, user123, testuser
5. **Response**: Automatic IP blocking after 10 attempts

**Evidence collected**: Complete audit trail with timestamps and user agents

## Key Investigation Techniques

### Time-Based Analysis
- **Incident window**: Look 30-60 minutes around the reported time
- **Pattern analysis**: Check for error spikes or gradual degradation
- **Timeline reconstruction**: Trace exact sequence of events

### Context Correlation
- **User context**: What was the user doing?
- **System context**: What was happening with system resources?
- **Request context**: Which specific requests failed?

### Multi-Dimensional Filtering
```typescript
// Filter by multiple criteria
const logs = await collectIncidentLogs(incidentTime, 30, {
  userId: 'user_123',      // Specific user
  workflowId: 'wf_456',    // Specific workflow  
  component: 'database',   // Specific component
  requestId: 'req_789'     // Specific request
});
```

### Error Progression Tracking
```typescript
// See how errors evolved over time
const errorProgression = errorAnalysis.errorProgression;
// Shows error count in 5-minute buckets:
// 14:20-14:25: 0 errors
// 14:25-14:30: 3 errors  
// 14:30-14:35: 8 errors ← Problem spike
```

## Automated Investigation Features

### Incident Reports
```typescript
// Generate comprehensive report
const report = await reproductionService.generateIncidentReport(
  incidentTime,
  'Workflow failures due to database timeouts',
  ['user_123', 'user_456'],  // Affected users
  ['workflow_789']           // Affected workflows
);
```

**Report includes**:
- Root cause hypotheses based on patterns
- Recommended actions to prevent recurrence
- Complete timeline of events
- User journey analysis
- System metric correlations

### Smart Pattern Detection
- **Database issues**: Detects connection timeouts, slow queries
- **Memory issues**: Identifies memory leaks, allocation failures
- **Performance issues**: Spots gradual degradation patterns
- **Security issues**: Recognizes attack patterns, suspicious activity

## Best Practices

### When Investigating Issues:

1. **Start broad, then narrow**: Begin with wide time window, then focus
2. **Follow the timeline**: Events in chronological order tell the story
3. **Correlate everything**: Logs + metrics + user actions = complete picture
4. **Look for patterns**: Single incidents vs systemic problems
5. **Consider user impact**: How many users were affected?

### What to Log for Better Investigations:

- **Request IDs**: Track requests across services
- **User context**: Always include user ID when available
- **Timing information**: Response times, durations
- **Resource usage**: Memory, CPU, database connections
- **Error details**: Full error messages with context

### Setting Up Alerts:

```typescript
// Proactive monitoring to catch issues early
Alert.databaseTimeout(5000);        // Alert if DB queries > 5s
Alert.highErrorRate(10);           // Alert if >10 errors/minute
Alert.memoryUsage(85);             // Alert if memory >85%
Alert.cpuUsage(90);                // Alert if CPU >90%
```

## Troubleshooting Common Issues

### "Can't find relevant logs"
- Expand time window (try 60-120 minutes)
- Check if filters are too restrictive
- Verify timestamp format and timezone

### "Too many logs to analyze"
- Filter by error level (ERROR, FATAL only)
- Focus on specific component or user
- Use error pattern analysis instead of raw logs

### "Logs don't show the problem"
- Check if logging level is sufficient (DEBUG vs INFO)
- Verify all components are logging properly
- Look at system metrics for correlation

The centralized logging system transforms debugging from guesswork into systematic investigation. Every issue leaves a trail - the logs help you follow it to the root cause.