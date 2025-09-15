# API Contracts

This directory contains the API contract definitions for all HTTP APIs exposed by services in the portfolio platform. These contracts define request/response schemas, validation rules, and API versioning strategy.

## Purpose

**REST API Contracts**: OpenAPI/JSON Schema definitions that specify the structure and behavior of HTTP APIs, enabling contract-first development and automated validation.

## Design Principles

### 🎯 **Contract-First Development**
- **Define Before Implement**: API contracts created before implementation
- **Generate Documentation**: API docs auto-generated from contracts
- **Validate Requests**: Runtime validation against contract schemas
- **Mock Services**: Contracts enable API mocking for development

### 🔌 **Service Independence**
- **Per-Service Contracts**: Each microservice defines its own API contracts
- **Versioned APIs**: Multiple API versions supported simultaneously
- **Backward Compatibility**: Older API versions maintained during transitions
- **Clear Dependencies**: API contracts define service integration points

### 📋 **OpenAPI Standards**
- **OpenAPI 3.0+**: Industry standard specification format
- **JSON Schema**: Request/response validation schemas
- **Security Definitions**: Authentication and authorization requirements
- **Error Responses**: Standardized error response formats

## Directory Structure

```
api/
├── accounts/                  # Account service APIs
│   ├── v1/
│   │   ├── accounts.openapi.yml       # Account management API v1
│   │   ├── authentication.openapi.yml # Authentication endpoints
│   │   └── schemas/
│   │       ├── User.schema.json       # User entity schema
│   │       ├── UserProfile.schema.json # User profile schema
│   │       └── ErrorResponse.schema.json # Error response format
│   ├── v2/                            # Future API version
│   └── README.md                      # Service-specific API documentation
├── projects/                  # Project service APIs
│   ├── v1/
│   │   ├── projects.openapi.yml       # Project management API
│   │   ├── visibility.openapi.yml     # Project visibility API
│   │   └── schemas/
│   │       ├── Project.schema.json    # Project entity schema
│   │       ├── ProjectSummary.schema.json # Project list view
│   │       └── VisibilitySettings.schema.json
│   └── README.md
├── contact/                   # Contact service APIs
│   ├── v1/
│   │   ├── contact.openapi.yml        # Contact request API
│   │   └── schemas/
│   │       ├── ContactRequest.schema.json
│   │       └── ContactResponse.schema.json
│   └── README.md
├── shared/                    # Cross-service API elements
│   ├── common.openapi.yml             # Common API elements
│   ├── security.openapi.yml           # Security schemes
│   └── schemas/
│       ├── ErrorResponse.schema.json  # Standard error format
│       ├── PaginationRequest.schema.json # Pagination parameters
│       ├── PaginationResponse.schema.json # Pagination metadata
│       └── ApiResponse.schema.json    # Standard response wrapper
├── gateway/                   # API Gateway configuration
│   ├── routes.yml                     # Route definitions
│   ├── rate-limiting.yml              # Rate limiting rules
│   └── authentication.yml             # Gateway auth config
└── README.md                  # This file
```

## Contract Format

### OpenAPI Specification Structure
```yaml
# accounts/v1/accounts.openapi.yml
openapi: 3.0.3
info:
  title: Portfolio Accounts API
  description: User account management and authentication
  version: 1.0.0
  contact:
    name: Platform Team
    email: platform@tomriddelsdell.com
  license:
    name: Private
    
servers:
  - url: https://api.tomriddelsdell.com/accounts/v1
    description: Production server
  - url: https://staging-api.tomriddelsdell.com/accounts/v1  
    description: Staging server

paths:
  /users:
    get:
      summary: List users
      description: Retrieve a paginated list of users
      operationId: listUsers
      tags:
        - Users
      parameters:
        - $ref: '../shared/schemas/PaginationRequest.schema.json#/components/parameters/page'
        - $ref: '../shared/schemas/PaginationRequest.schema.json#/components/parameters/limit'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
        '400':
          $ref: '../shared/schemas/ErrorResponse.schema.json#/components/responses/BadRequest'
        '401':
          $ref: '../shared/schemas/ErrorResponse.schema.json#/components/responses/Unauthorized'
    post:
      summary: Create user
      description: Register a new user account
      operationId: createUser
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '../shared/schemas/ErrorResponse.schema.json#/components/responses/BadRequest'
        '409':
          $ref: '../shared/schemas/ErrorResponse.schema.json#/components/responses/Conflict'

components:
  schemas:
    User:
      $ref: './schemas/User.schema.json'
    CreateUserRequest:
      $ref: './schemas/CreateUserRequest.schema.json'
    UserListResponse:
      $ref: './schemas/UserListResponse.schema.json'
      
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    ApiKey:
      type: apiKey
      in: header
      name: X-API-Key

security:
  - BearerAuth: []
  - ApiKey: []
```

### JSON Schema Structure
```json
// accounts/v1/schemas/User.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://contracts.tomriddelsdell.com/api/accounts/User",
  "title": "User",
  "description": "A user in the portfolio platform",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique user identifier"
    },
    "email": {
      "type": "string",
      "format": "email", 
      "description": "User's email address"
    },
    "profile": {
      "$ref": "./UserProfile.schema.json",
      "description": "User's profile information"
    },
    "role": {
      "type": "string",
      "enum": ["USER", "ADMIN", "MODERATOR"],
      "description": "User's role in the platform"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "When the user account was created"
    },
    "updatedAt": {
      "type": "string", 
      "format": "date-time",
      "description": "When the user account was last updated"
    }
  },
  "required": ["id", "email", "profile", "role", "createdAt"],
  "additionalProperties": false,
  "examples": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "profile": {
        "displayName": "John Doe",
        "preferences": {
          "theme": "dark",
          "notifications": true
        }
      },
      "role": "USER",
      "createdAt": "2025-09-14T10:30:00Z",
      "updatedAt": "2025-09-14T10:30:00Z"
    }
  ]
}
```

## API Versioning Strategy

### Version Management
- **Semantic Versioning**: API versions follow semver (v1.0.0, v1.1.0, v2.0.0)
- **URL Versioning**: Version included in URL path (`/api/v1/users`)
- **Multiple Versions**: Support multiple API versions simultaneously
- **Deprecation Policy**: Older versions deprecated with 6-month notice

### Backward Compatibility Rules
```yaml
# Backward compatible changes (minor version)
- Add new optional request fields
- Add new response fields  
- Add new endpoints
- Add new enum values
- Expand field validation (less restrictive)

# Breaking changes (major version)
- Remove request/response fields
- Change field types or formats
- Remove endpoints
- Remove enum values
- Restrict field validation (more restrictive)
- Change error response formats
```

## Code Generation

### Client SDK Generation
```bash
# Generate TypeScript client
openapi-generator generate 
  -i contracts/api/accounts/v1/accounts.openapi.yml 
  -g typescript-axios 
  -o packages/api-clients/accounts

# Generate Python client
openapi-generator generate 
  -i contracts/api/accounts/v1/accounts.openapi.yml 
  -g python 
  -o clients/python/accounts
```

### Server Code Generation
```bash
# Generate TypeScript server stubs
openapi-generator generate 
  -i contracts/api/accounts/v1/accounts.openapi.yml 
  -g nodejs-express-server 
  -o services/accounts/generated

# Generate validation middleware
openapi-generator generate 
  -i contracts/api/accounts/v1/accounts.openapi.yml 
  -g typescript-express-middleware 
  -o services/accounts/middleware
```

## Integration with Services

### Request Validation
```typescript
// Generated validation middleware
import { validateRequest } from '@portfolio/api-contracts/accounts';

app.post('/users', 
  validateRequest('createUser'),
  async (req: CreateUserRequest, res: Response) => {
    // Request automatically validated against schema
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  }
);
```

### Response Validation
```typescript
// Generated response types
import { User, UserListResponse } from '@portfolio/api-contracts/accounts';

export class UserController {
  async getUsers(req: Request): Promise<UserListResponse> {
    const users = await this.userService.findUsers(req.query);
    
    // TypeScript ensures response matches contract
    return {
      data: users,
      pagination: {
        page: req.query.page || 1,
        limit: req.query.limit || 20,
        total: users.length
      }
    };
  }
}
```

### API Documentation
```bash
# Generate interactive documentation
redoc-cli serve contracts/api/accounts/v1/accounts.openapi.yml

# Generate static documentation site
swagger-codegen generate 
  -i contracts/api/accounts/v1/accounts.openapi.yml 
  -l html2 
  -o docs/api/accounts
```

## Testing Integration

### Contract Testing
```typescript
// Contract validation tests
import { validateContract } from '@portfolio/testing-utils';

describe('Accounts API Contract', () => {
  it('should validate user creation request', () => {
    const request = {
      email: 'user@example.com',
      profile: {
        displayName: 'Test User'
      }
    };
    
    expect(request).toMatchOpenAPISchema(
      'accounts/v1/accounts.openapi.yml',
      '#/components/schemas/CreateUserRequest'
    );
  });
});
```

### API Mock Server
```javascript
// Generate mock server for development
const mockServer = require('@portfolio/api-mocks');

mockServer.start({
  port: 3001,
  contracts: [
    'contracts/api/accounts/v1/accounts.openapi.yml',
    'contracts/api/projects/v1/projects.openapi.yml'
  ]
});
```

## Quality Standards

### ✅ **Contract Quality Requirements**
- **Complete Documentation**: All endpoints, parameters, and responses documented
- **Example Data**: All schemas include realistic example data
- **Error Handling**: All error cases defined with appropriate HTTP status codes
- **Security Definition**: Authentication and authorization requirements specified

### 🔒 **Security Standards**
- **Authentication**: All protected endpoints require authentication
- **Authorization**: Role-based access control defined where applicable
- **Input Validation**: All user inputs validated against strict schemas
- **Rate Limiting**: API rate limits defined for all endpoints

### 📊 **Performance Standards**
- **Response Times**: Expected response time ranges documented
- **Payload Sizes**: Maximum request/response sizes defined
- **Caching**: Cacheable responses identified with appropriate headers
- **Compression**: Large responses support gzip compression

## Deployment Integration

### API Gateway Configuration
```yaml
# gateway/routes.yml
routes:
  - path: /api/accounts/v1/*
    service: accounts-service
    version: v1
    rate_limit: 100/minute
    auth_required: true
  
  - path: /api/projects/v1/*
    service: projects-service  
    version: v1
    rate_limit: 200/minute
    auth_required: true
```

### Service Mesh Integration
```yaml
# Service discovery and routing
apiVersion: v1
kind: Service
metadata:
  name: accounts-api
  annotations:
    contract.version: "1.0.0"
    contract.path: "/contracts/api/accounts/v1/accounts.openapi.yml"
spec:
  selector:
    app: accounts-service
  ports:
    - port: 80
      targetPort: 3000
```

## Architecture Compliance

### RESTful Design
- **Resource-Oriented**: URLs represent resources, not actions
- **HTTP Methods**: Proper use of GET, POST, PUT, DELETE, PATCH
- **Status Codes**: Appropriate HTTP status codes for all responses
- **Stateless**: No server-side session state required

### Microservices Integration
- **Service Boundaries**: APIs respect bounded context boundaries
- **Independent Deployment**: API versions allow independent service deployment
- **Contract Testing**: Automated testing prevents breaking changes
- **Service Discovery**: APIs support service mesh integration

### Domain-Driven Design
- **Ubiquitous Language**: API terminology matches domain language
- **Bounded Context Alignment**: APIs align with domain model boundaries
- **Anti-Corruption Layer**: APIs provide clean interface to domain services

---

**API Specification**: OpenAPI 3.0+  
**Schema Format**: JSON Schema Draft 7  
**Maintained By**: Service Teams  
**Review Required**: API Design Review for all changes  
**Last Updated**: September 14, 2025
