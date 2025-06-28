import { describe, it, expect, beforeEach } from 'vitest';
import { Integration, IntegrationConfig } from '../../src/domains/integration/domain/entities/Integration';
import { DataMapping } from '../../src/domains/integration/domain/entities/DataMapping';
import { SyncJob } from '../../src/domains/integration/domain/entities/SyncJob';
import { IntegrationId } from '../../src/domains/integration/domain/value-objects/IntegrationId';
import { ApiEndpoint } from '../../src/domains/integration/domain/value-objects/ApiEndpoint';
import { AuthCredentials } from '../../src/domains/integration/domain/value-objects/AuthCredentials';
import { DataSchema } from '../../src/domains/integration/domain/value-objects/DataSchema';

describe.skip('Integration Domain - Phase 3', () => {
  describe('Value Objects', () => {
    describe('IntegrationId', () => {
      it('should create valid integration ID', () => {
        const id = IntegrationId.fromNumber(123);
        expect(id.getValue()).toBe(123);
        expect(id.toString()).toBe('123');
      });

      it('should reject invalid integration ID', () => {
        expect(() => IntegrationId.fromNumber(0)).toThrow('IntegrationId must be a positive number');
        expect(() => IntegrationId.fromNumber(-1)).toThrow('IntegrationId must be a positive number');
      });

      it('should compare integration IDs correctly', () => {
        const id1 = IntegrationId.fromNumber(123);
        const id2 = IntegrationId.fromNumber(123);
        const id3 = IntegrationId.fromNumber(456);

        expect(id1.equals(id2)).toBe(true);
        expect(id1.equals(id3)).toBe(false);
      });
    });

    describe('ApiEndpoint', () => {
      it('should create valid API endpoint', () => {
        const endpoint = ApiEndpoint.create('https://api.example.com/users', 'GET');
        
        expect(endpoint.getUrl()).toBe('https://api.example.com/users');
        expect(endpoint.getMethod()).toBe('GET');
        expect(endpoint.getTimeout()).toBe(30000);
      });

      it('should validate URL format', () => {
        expect(() => ApiEndpoint.create('invalid-url')).toThrow('Invalid URL format');
        expect(() => ApiEndpoint.create('')).toThrow('URL is required and must be a string');
      });

      it('should validate HTTP method', () => {
        expect(() => ApiEndpoint.create('https://api.example.com', 'INVALID')).toThrow('Invalid HTTP method');
      });

      it('should add headers immutably', () => {
        const endpoint = ApiEndpoint.create('https://api.example.com');
        const withHeader = endpoint.withHeader('Authorization', 'Bearer token');
        
        expect(endpoint.getHeaders()).toEqual({});
        expect(withHeader.getHeaders()).toEqual({ 'Authorization': 'Bearer token' });
      });
    });

    describe('AuthCredentials', () => {
      it('should create API key credentials', () => {
        const auth = AuthCredentials.createApiKey('secret-key');
        
        expect(auth.getType()).toBe('api_key');
        expect(auth.getCredentials()).toEqual({ apiKey: 'secret-key' });
        expect(auth.toAuthHeader()).toEqual({ 'X-API-Key': 'secret-key' });
      });

      it('should create OAuth2 credentials', () => {
        const expiresAt = new Date(Date.now() + 3600000);
        const auth = AuthCredentials.createOAuth2('access-token', 'refresh-token', expiresAt);
        
        expect(auth.getType()).toBe('oauth2');
        expect(auth.isRefreshable()).toBe(true);
        expect(auth.getExpiresAt()).toEqual(expiresAt);
        expect(auth.toAuthHeader()).toEqual({ 'Authorization': 'Bearer access-token' });
      });

      it('should detect expired credentials', () => {
        const expiredDate = new Date(Date.now() - 1000);
        const auth = AuthCredentials.createOAuth2('token', 'refresh', expiredDate);
        
        expect(auth.isExpired()).toBe(true);
      });

      it('should refresh OAuth2 credentials', () => {
        const auth = AuthCredentials.createOAuth2('old-token', 'refresh-token');
        const newExpiresAt = new Date(Date.now() + 3600000);
        const refreshed = auth.refreshWith('new-token', newExpiresAt);
        
        expect(refreshed.getCredentials().accessToken).toBe('new-token');
        expect(refreshed.getExpiresAt()).toEqual(newExpiresAt);
      });
    });

    describe('DataSchema', () => {
      it('should create valid data schema', () => {
        const fields = [
          { name: 'id', type: 'number' as const, required: true },
          { name: 'name', type: 'string' as const, required: true },
          { name: 'email', type: 'string' as const, required: false }
        ];
        
        const schema = DataSchema.create('User', '1.0', fields);
        
        expect(schema.getName()).toBe('User');
        expect(schema.getVersion()).toBe('1.0');
        expect(schema.getFields()).toHaveLength(3);
        expect(schema.getRequiredFields()).toHaveLength(2);
      });

      it('should validate data against schema', () => {
        const fields = [
          { name: 'id', type: 'number' as const, required: true },
          { name: 'name', type: 'string' as const, required: true }
        ];
        const schema = DataSchema.create('User', '1.0', fields);
        
        const validData = { id: 123, name: 'John Doe' };
        const invalidData = { name: 'John Doe' }; // missing required id
        
        expect(schema.validateData(validData).isValid).toBe(true);
        expect(schema.validateData(invalidData).isValid).toBe(false);
        expect(schema.validateData(invalidData).errors).toContain("Required field 'id' is missing");
      });

      it('should add fields to schema', () => {
        const schema = DataSchema.create('User', '1.0', [
          { name: 'id', type: 'number' as const, required: true }
        ]);
        
        const updatedSchema = schema.addField({
          name: 'email',
          type: 'string',
          required: false
        });
        
        expect(updatedSchema.getFields()).toHaveLength(2);
        expect(updatedSchema.getField('email')).toBeDefined();
      });
    });
  });

  describe('Integration Entity', () => {
    let integrationConfig: IntegrationConfig;
    let integrationId: IntegrationId;

    beforeEach(() => {
      integrationId = IntegrationId.fromNumber(1);
      integrationConfig = {
        type: 'api',
        endpoints: [ApiEndpoint.create('https://api.example.com')],
        auth: AuthCredentials.createApiKey('test-key'),
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerHour: 1000
        },
        retryPolicy: {
          maxAttempts: 3,
          backoffMultiplier: 2,
          maxDelay: 30000
        },
        timeout: 30000
      };
    });

    it('should create integration with valid configuration', () => {
      const integration = Integration.create(
        integrationId,
        1,
        'Test Integration',
        'A test integration',
        integrationConfig
      );

      expect(integration.getId()).toEqual(integrationId);
      expect(integration.getUserId()).toBe(1);
      expect(integration.getName()).toBe('Test Integration');
      expect(integration.getStatus()).toBe('draft');
      expect(integration.canExecute()).toBe(false); // draft status
    });

    it('should activate integration with valid configuration', () => {
      const integration = Integration.create(
        integrationId,
        1,
        'Test Integration',
        'Description',
        integrationConfig
      );

      integration.activate();

      expect(integration.getStatus()).toBe('active');
      expect(integration.isActive()).toBe(true);
      expect(integration.canExecute()).toBe(true);
    });

    it('should prevent activation with expired credentials', () => {
      const expiredAuth = AuthCredentials.createOAuth2(
        'token',
        'refresh',
        new Date(Date.now() - 1000)
      );
      
      const configWithExpiredAuth = {
        ...integrationConfig,
        auth: expiredAuth
      };

      const integration = Integration.create(
        integrationId,
        1,
        'Test Integration',
        'Description',
        configWithExpiredAuth
      );

      expect(() => integration.activate()).toThrow('Cannot activate integration with expired credentials');
    });

    it('should record execution metrics', () => {
      const integration = Integration.create(
        integrationId,
        1,
        'Test Integration',
        'Description',
        integrationConfig
      );

      integration.activate();
      integration.recordExecution(true, 250);
      integration.recordExecution(false, 500, 'Network error');

      const metrics = integration.getMetrics();
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(1);
      expect(metrics.averageResponseTime).toBe(375); // (250 + 500) / 2
      expect(metrics.uptime).toBe(50); // 1 success out of 2 total
    });

    it('should manage tags', () => {
      const integration = Integration.create(
        integrationId,
        1,
        'Test Integration',
        'Description',
        integrationConfig
      );

      integration.addTag('API');
      integration.addTag('External');
      integration.addTag('api'); // Should not add duplicate (case insensitive)

      expect(integration.getTags()).toEqual(['api', 'external']);

      integration.removeTag('API');
      expect(integration.getTags()).toEqual(['external']);
    });

    it('should get health status', () => {
      const integration = Integration.create(
        integrationId,
        1,
        'Test Integration',
        'Description',
        integrationConfig
      );

      integration.activate();
      
      // Record some failures - 2 failures out of 3 requests = 66% failure rate (critical)
      integration.recordExecution(false, 1000, 'Error 1');
      integration.recordExecution(false, 1000, 'Error 2');
      integration.recordExecution(true, 500);

      const health = integration.getHealthStatus();
      expect(health.status).toBe('critical'); // High failure rate (66% > 50%)
      expect(health.issues.length).toBeGreaterThan(0);
    });

    it('should clone integration without credentials', () => {
      const integration = Integration.create(
        integrationId,
        1,
        'Original Integration',
        'Original description',
        integrationConfig
      );

      integration.addTag('original');

      const newId = IntegrationId.fromNumber(2);
      const cloned = integration.clone(newId, 'Cloned Integration');

      expect(cloned.getId()).toEqual(newId);
      expect(cloned.getName()).toBe('Cloned Integration');
      expect(cloned.getDescription()).toBe('Copy of Original description');
      expect(cloned.getStatus()).toBe('draft');
      // Credentials should be empty placeholder for security
      expect(Object.keys(cloned.getConfig().auth.getCredentials())).toHaveLength(0);
    });
  });

  describe('DataMapping Entity', () => {
    let sourceSchema: DataSchema;
    let targetSchema: DataSchema;

    beforeEach(() => {
      sourceSchema = DataSchema.create('Source', '1.0', [
        { name: 'id', type: 'number', required: true },
        { name: 'first_name', type: 'string', required: true },
        { name: 'last_name', type: 'string', required: true },
        { name: 'email', type: 'string', required: false }
      ]);

      targetSchema = DataSchema.create('Target', '1.0', [
        { name: 'userId', type: 'number', required: true },
        { name: 'fullName', type: 'string', required: true },
        { name: 'emailAddress', type: 'string', required: false }
      ]);
    });

    it('should create data mapping', () => {
      const mapping = DataMapping.create(
        'mapping-1',
        'integration-1',
        'User Mapping',
        'Maps user data between systems',
        sourceSchema,
        targetSchema
      );

      expect(mapping.getId()).toBe('mapping-1');
      expect(mapping.getName()).toBe('User Mapping');
      expect(mapping.getSourceSchema()).toEqual(sourceSchema);
      expect(mapping.getTargetSchema()).toEqual(targetSchema);
    });

    it('should add and manage field mappings', () => {
      const mapping = DataMapping.create(
        'mapping-1',
        'integration-1',
        'User Mapping',
        'Description',
        sourceSchema,
        targetSchema
      );

      const fieldMapping = {
        id: 'map-1',
        type: 'field' as const,
        sourceField: 'id',
        targetField: 'userId',
        transformation: 'direct' as const,
        required: true
      };

      mapping.addMapping(fieldMapping);

      expect(mapping.getMappings()).toHaveLength(1);
      expect(mapping.getMappings()[0]).toEqual(fieldMapping);
    });

    it('should prevent duplicate target field mappings', () => {
      const mapping = DataMapping.create(
        'mapping-1',
        'integration-1',
        'User Mapping',
        'Description',
        sourceSchema,
        targetSchema
      );

      mapping.addMapping({
        id: 'map-1',
        type: 'field',
        sourceField: 'id',
        targetField: 'userId',
        transformation: 'direct',
        required: true
      });

      expect(() => mapping.addMapping({
        id: 'map-2',
        type: 'field',
        sourceField: 'email',
        targetField: 'userId', // Duplicate target
        transformation: 'direct',
        required: false
      })).toThrow("Target field 'userId' is already mapped");
    });

    it('should validate mapping completeness', () => {
      const mapping = DataMapping.create(
        'mapping-1',
        'integration-1',
        'User Mapping',
        'Description',
        sourceSchema,
        targetSchema
      );

      // Add mapping for required field
      mapping.addMapping({
        id: 'map-1',
        type: 'field',
        sourceField: 'id',
        targetField: 'userId',
        transformation: 'direct',
        required: true
      });

      const validation = mapping.validateMapping();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Required target field 'fullName' is not mapped");
    });

    it('should transform data according to mappings', () => {
      const mapping = DataMapping.create(
        'mapping-1',
        'integration-1',
        'User Mapping',
        'Description',
        sourceSchema,
        targetSchema
      );

      // Add complete mappings
      mapping.addMapping({
        id: 'map-1',
        type: 'field',
        sourceField: 'id',
        targetField: 'userId',
        transformation: 'direct',
        required: true
      });

      mapping.addMapping({
        id: 'map-2',
        type: 'field',
        sourceField: 'first_name',
        targetField: 'fullName',
        transformation: 'direct',
        required: true
      });

      const sourceData = {
        id: 123,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      };

      const transformed = mapping.transformData(sourceData);

      expect(transformed.userId).toBe(123);
      expect(transformed.fullName).toBe('John');
    });
  });

  describe('SyncJob Entity', () => {
    let integrationId: IntegrationId;
    let sourceSchema: DataSchema;
    let targetSchema: DataSchema;

    beforeEach(() => {
      integrationId = IntegrationId.fromNumber(1);
      sourceSchema = DataSchema.create('Source', '1.0', [
        { name: 'id', type: 'number', required: true }
      ]);
      targetSchema = DataSchema.create('Target', '1.0', [
        { name: 'id', type: 'number', required: true }
      ]);
    });

    it('should create sync job with schedule', () => {
      const schedule = {
        type: 'interval' as const,
        interval: 3600000, // 1 hour
        enabled: true
      };

      const syncJob = SyncJob.create(
        'job-1',
        integrationId,
        'Hourly Sync',
        'Syncs data every hour',
        'pull',
        sourceSchema,
        targetSchema,
        schedule
      );

      expect(syncJob.getId()).toBe('job-1');
      expect(syncJob.getName()).toBe('Hourly Sync');
      expect(syncJob.getDirection()).toBe('pull');
      expect(syncJob.getSchedule()).toEqual(schedule);
      expect(syncJob.getStatus()).toBe('pending');
    });

    it('should start and track sync job execution', () => {
      const schedule = {
        type: 'manual' as const,
        enabled: true
      };

      const syncJob = SyncJob.create(
        'job-1',
        integrationId,
        'Manual Sync',
        'Description',
        'pull',
        sourceSchema,
        targetSchema,
        schedule
      );

      expect(syncJob.canRun()).toBe(true);

      syncJob.start();
      expect(syncJob.getStatus()).toBe('running');
      expect(syncJob.getLastRunAt()).toBeInstanceOf(Date);
    });

    it('should complete sync job with results', () => {
      const schedule = { type: 'manual' as const, enabled: true };
      const syncJob = SyncJob.create(
        'job-1',
        integrationId,
        'Test Sync',
        'Description',
        'pull',
        sourceSchema,
        targetSchema,
        schedule
      );

      syncJob.start();

      const result = {
        recordsProcessed: 100,
        recordsSucceeded: 95,
        recordsFailed: 5,
        recordsSkipped: 0,
        conflicts: 0,
        errors: [],
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(),
        duration: 60000
      };

      syncJob.complete(result);

      expect(syncJob.getStatus()).toBe('completed');
      expect(syncJob.getResults()).toHaveLength(1);
      expect(syncJob.getResults()[0]).toEqual(result);
    });

    it('should handle sync job failures with retry logic', () => {
      const schedule = { type: 'manual' as const, enabled: true };
      const syncJob = SyncJob.create(
        'job-1',
        integrationId,
        'Test Sync',
        'Description',
        'pull',
        sourceSchema,
        targetSchema,
        schedule
      );

      syncJob.start();

      const errors = [{
        errorType: 'connection',
        message: 'Network timeout',
        severity: 'error' as const
      }];

      // First failure should retry
      syncJob.fail(errors);
      expect(syncJob.getStatus()).toBe('pending'); // Will retry
      expect(syncJob.getRetryCount()).toBe(1);

      // Continue failing until max retries reached
      syncJob.start();
      syncJob.fail(errors);
      expect(syncJob.getRetryCount()).toBe(2);
      
      syncJob.start();
      syncJob.fail(errors);
      expect(syncJob.getRetryCount()).toBe(3);

      expect(syncJob.getStatus()).toBe('failed');
    });

    it('should calculate execution statistics', () => {
      const schedule = { type: 'manual' as const, enabled: true };
      const syncJob = SyncJob.create(
        'job-1',
        integrationId,
        'Test Sync',
        'Description',
        'pull',
        sourceSchema,
        targetSchema,
        schedule
      );

      // Add some execution results
      const successResult = {
        recordsProcessed: 100,
        recordsSucceeded: 100,
        recordsFailed: 0,
        recordsSkipped: 0,
        conflicts: 0,
        errors: [],
        startTime: new Date(Date.now() - 120000),
        endTime: new Date(Date.now() - 60000),
        duration: 60000
      };

      const failureResult = {
        recordsProcessed: 50,
        recordsSucceeded: 0,
        recordsFailed: 50,
        recordsSkipped: 0,
        conflicts: 0,
        errors: [],
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(),
        duration: 60000
      };

      syncJob['results'] = [successResult, failureResult];

      const stats = syncJob.getExecutionStatistics();
      expect(stats.totalRuns).toBe(2);
      expect(stats.successfulRuns).toBe(1);
      expect(stats.failedRuns).toBe(1);
      expect(stats.successRate).toBe(50);
      expect(stats.averageDuration).toBe(60000);
      expect(stats.averageRecordsProcessed).toBe(75);
    });
  });
});