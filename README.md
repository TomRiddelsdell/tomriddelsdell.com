# tomriddelsdell.com - Personal Website

**Enterprise-grade personal website with pure Domain Driven Design (DDD) architecture**

� **[Development Setup Guide](./DEVELOPMENT_SETUP.md)** | 📖 **[Architecture Documentation](./docs/ARCHITECTURE.md)** | 🔒 **[Security Guide](./docs/SECURITY.md)**

## 🎯 Project Status

✅ **Production Ready** - Full CI/CD pipeline with automated deployments  
✅ **Enterprise Security** - AWS Cognito, OIDC, secret management  
✅ **Cost Optimized** - ~$15-34/month total infrastructure costs  
✅ **Fully Monitored** - Health checks, cost alerts, performance tracking  

## 🏗️ Architecture Overview

### **Domain Driven Design (DDD)**
- **Pure Domain Layer**: Business logic with strict bounded contexts
- **Monorepo Structure**: Organized into domains, interfaces, and infrastructure
- **Clean Architecture**: Clear separation of concerns across all layers

### **Technology Stack**
- **Frontend**: React + TypeScript + Vite + Shadcn/ui
- **Backend**: Express.js + TypeScript with DDD patterns
- **Database**: PostgreSQL + Drizzle ORM (type-safe)
- **Authentication**: AWS Cognito (enterprise-grade)
- **Infrastructure**: AWS Serverless (Lambda + API Gateway + CloudFront)
- **CI/CD**: GitHub Actions with automated deployments

### **Development Environment**
- **MCP Servers**: AWS, Neptune, GitHub automation
- **CLI Tools**: GitHub CLI, AWS CLI, TypeScript, jq
- **Testing**: Vitest, Playwright, comprehensive test coverage
- **Security**: Environment variables, no hardcoded secrets

## 🚀 Quick Start

### **For Development**
```bash
# Clone and setup
git clone https://github.com/TomRiddelsdell/tomriddelsdell.com
cd tomriddelsdell.com

# Install dependencies
npm install

# Setup environment (see DEVELOPMENT_SETUP.md)
cp .env.template .env
# Edit .env with your values

# Start development
npm run dev
```

### **For Production Deployment**
The project includes automated CI/CD:
- **Staging**: Push to `develop` branch → auto-deploys to dev.tomriddelsdell.com
- **Production**: Merge to `main` → manual approval → deploys to tomriddelsdell.com

## 🏢 Domain Architecture

The system follows pure Domain Driven Design with strict bounded contexts:

```
tomriddelsdell.com/
├── domains/                    # Pure Domain Layer (Business Logic)
│   ├── identity/              # User authentication & authorization
│   ├── analytics/             # Data analysis & reporting
│   ├── integration/           # Third-party service integrations
│   ├── notification/          # Multi-channel communication
│   ├── workflow/              # Core business workflows
│   └── shared-kernel/         # Shared domain concepts & events
├── interfaces/               # Interface Layer (External Boundaries)
│   ├── api-gateway/          # Express.js REST API
│   └── web-frontend/         # React SPA with Shadcn/ui
├── infrastructure/           # Infrastructure Layer (Technical Concerns)
│   ├── database/             # PostgreSQL with Drizzle ORM
│   ├── security/             # AWS Cognito integration & RBAC
│   ├── mcp/                  # Model Context Protocol servers
│   └── configuration/        # Environment & system config
└── libs/                     # Shared utilities & testing tools
```

## 💰 Infrastructure Costs

**Total Monthly Cost: ~$15-34**
- **Staging Environment**: $5-9/month
- **Production Environment**: $10-25/month  
- **Includes**: SSL certificates, CloudFront CDN, Lambda execution, S3 storage
- **Monitoring**: Automated cost alerts if >$50/month

## 🛠️ Development Tools

### **CLI Tools (All Configured)**
- GitHub CLI (repository management)
- AWS CLI + CDK (infrastructure deployment)
- TypeScript compiler + tsx execution
- jq (JSON processing)
- dotenv-cli (environment management)

### **MCP Servers (AI-Powered Automation)**
- **AWS MCP** (port 8001): EC2, S3, Lambda management
- **Neptune MCP** (port 8002): Graph database operations  
- **GitHub MCP** (port 8003): Repository automation

### **Essential Scripts**
```bash
# Development & Testing
npm run dev                              # Start development server
npm run build                            # Production build
npm run test                             # Run test suite
./scripts/run-tests.sh [all|watch|ui]    # Advanced test options

# Environment & Deployment
./scripts/verify-dev-environment.sh      # Environment verification
./scripts/pre-deploy.sh                  # Pre-deployment validation
npm run db:push                          # Apply database changes

# AWS Operations
./infrastructure/deployment/aws/scripts/deploy.sh --env staging
./infrastructure/deployment/aws/scripts/aws-cost-calculator.sh
```

### **Script Documentation**
All scripts are fully documented in [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md#essential-scripts) with usage examples and integration details.

### Quick Deployment
```bash
# Option 2: Manual
npm run build
NODE_ENV=production npm start
```

### Complete Documentation
See **[docs/](docs/)** for comprehensive deployment guides:
- **[DEPLOYMENT_SUMMARY.md](docs/DEPLOYMENT_SUMMARY.md)** - Executive overview
- **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Step-by-step procedures
- **[SECURITY_CONFIG.md](docs/SECURITY_CONFIG.md)** - Security configuration
- **[BUILD_ANALYSIS.md](docs/BUILD_ANALYSIS.md)** - Performance details

### Database Operations

The application uses Drizzle ORM for database operations:

- Schema definitions in `shared/schema.ts`
- Database operations in `server/DatabaseStorage.ts`
- Migrations handled automatically

### Authentication Flow

1. **AWS Cognito Integration**: Users authenticate via AWS Cognito
2. **Session Management**: Server-side sessions with secure cookies
3. **Role-based Access**: Admin and user roles supported
4. **Password Reset**: Email-based password recovery

## Testing

### Test Types

- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Full user journey testing

### Running Tests

```bash
# Run all DDD tests
npm run test

# Current test status: 31/39 passing
# ✅ Identity Domain: 19/19 tests passing
# ✅ Shared Kernel: 9/10 tests passing
# ⚠️  Infrastructure Layer: 3/10 tests passing
```

### Test Coverage

- **Domain Layer**: Pure business logic testing with comprehensive coverage
- **Value Objects**: Email, UserId, CognitoId validation and behavior
- **Aggregates**: UserAggregate business rules and domain logic
- **Domain Events**: Event publishing and cross-domain communication
- **Business Rules**: User authentication, authorization, profile management
- **Anti-Corruption Layer**: External service integration testing

## Security Features

- **Rate Limiting**: Configurable request limits
- **Input Sanitization**: XSS protection
- **Security Headers**: CSRF, clickjacking protection
- **Environment Validation**: Zod schema validation
- **Error Handling**: Structured error responses
- **Logging**: Comprehensive security logging

## API Documentation

### Authentication Endpoints

- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User sign out
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/reset-password` - Password reset

### Dashboard Endpoints

- `GET /api/dashboard/stats` - User dashboard statistics
- `GET /api/connected-apps` - Connected applications
- `GET /api/templates` - Automation templates

### Contact

- `POST /api/contact` - Contact form submission

## Deployment

### Production Build

```bash
npm run build
```

This creates:
- Frontend build in `dist/`
- Backend bundle in `dist/index.js`

### Environment Setup

1. **Set Production Environment Variables**
2. **Configure Database Connection**
3. **Set up AWS Cognito**
4. **Configure SendGrid (optional)**

### Security Considerations

- Enable HTTPS in production
- Set secure session cookies
- Configure CORS appropriately
- Use production database credentials
- Enable error logging and monitoring

### Deployment Platforms

The application is optimized for deployment on:
- Replit Deployments (recommended)
- Vercel
- Railway
- Heroku
- AWS/Digital Ocean

## Monitoring and Logging

- Structured logging with different levels
- Request/response logging
- Authentication event tracking
- Error monitoring and alerting
- Database query performance tracking

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check network connectivity
   - Ensure database is running

2. **Authentication Issues**
   - Verify AWS Cognito configuration
   - Check environment variables
   - Validate redirect URIs

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript errors with `npm run check`
   - Verify environment variables

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and debug logging.

## Contributing

1. **Code Standards**: TypeScript strict mode, ESLint rules
2. **Testing**: All new features require tests
3. **Security**: Follow security best practices
4. **Documentation**: Update documentation for changes
5. **Bug Tracking**: Report issues in [`docs/Bugs.md`](./docs/Bugs.md)

## Known Issues

See [`docs/Bugs.md`](./docs/Bugs.md) for current known issues, workarounds, and ongoing investigations.

## Performance Optimization

- **Frontend**: Code splitting, lazy loading
- **Backend**: Database query optimization
- **Caching**: Redis integration ready
- **CDN**: Static asset optimization
- **Monitoring**: Performance metrics tracking

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the test suite for examples
3. Check environment variable configuration
4. Verify database schema is up to date