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

**TL;DR for Contributors:**
1. Fork → Clone → `npm install`
2. `cp .env.template .env` → edit with development values
3. Set up a database (local PostgreSQL or free cloud DB)
4. `npm run dev` → start coding!

**🔒 Security Note**: This project uses centralized configuration management. You only need basic development credentials - no production secrets required!

### **For New Contributors**

#### **1. Fork and Clone**
```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/tomriddelsdell.com
cd tomriddelsdell.com

# Add upstream remote for syncing
git remote add upstream https://github.com/TomRiddelsdell/tomriddelsdell.com
```

#### **2. Install Dependencies**
```bash
npm install
```

#### **3. Setup Your Environment**
**⚠️ Important: Never commit real credentials!**

```bash
# Copy the environment template
cp .env.template .env
```

Edit `.env` with your **development values** (not production!):

**📋 Required for Development:**
```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/tomriddelsdell_dev
SESSION_SECRET=your-dev-session-secret-32-chars-minimum
```

**🔧 Optional Integrations** (leave empty to disable):
```bash
# GitHub Integration - only needed for GitHub script testing
GITHUB_TOKEN=              # Personal Access Token (optional)
GITHUB_OWNER=YourUsername  # Your GitHub username
GITHUB_REPO=your-fork-name # Your fork name

# AWS Services - only needed for AWS feature development
AWS_ACCESS_KEY_ID=         # Leave empty to skip AWS features
AWS_SECRET_ACCESS_KEY=     # Leave empty to skip AWS features
AWS_ACCOUNT_ID=            # Leave empty to skip AWS features

# Email Service - disabled by default
EMAIL_PROVIDER=none        # Set to 'none' to disable emails
SENDGRID_API_KEY=          # Leave empty when provider is 'none'

# Feature Flags - control what's enabled
FEATURE_EMAIL_ENABLED=false
DEBUG_MODE=true
MAINTENANCE_MODE=false
```

**💡 Pro Tip**: The `.env.template` file shows all available options with safe development defaults. Most can be left empty for basic development!

#### **4. Database Setup**
Choose one option:

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL locally
# Create development database
psql -c "CREATE DATABASE tomriddelsdell_dev;"

# Update .env
DATABASE_URL=postgresql://username:password@localhost:5432/tomriddelsdell_dev
```

**Option B: Cloud Database (Recommended)**
```bash
# Use free tier from Neon, Supabase, or Railway
# Get connection string and update .env
DATABASE_URL=postgresql://user:pass@hostname:5432/database
```

#### **5. Start Development**
```bash
# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

**🎉 You're ready to contribute!**

### **For Development Testing**
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- infrastructure/tests/unit/

# Run with coverage
npm run test:coverage
```

### **Development Workflow**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### **For Existing Development**
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

## 🔐 Security Guidelines for Contributors

### **Environment Configuration**
This project uses a **centralized configuration service** to manage all environment variables securely:

- **✅ DO**: Use `.env.template` as your starting point
- **✅ DO**: Set development/testing values in your local `.env`
- **✅ DO**: Leave optional services empty during development
- **❌ DON'T**: Commit your `.env` file (it's in `.gitignore`)
- **❌ DON'T**: Hardcode any credentials in code
- **❌ DON'T**: Use production values in development

### **Configuration Service Features**
This project uses a **centralized configuration service** instead of scattered `process.env` calls:

- **🏗️ Centralized Management**: All environment variables managed through Node Config service
- **✅ Schema Validation**: Automatic validation with clear error messages using Zod
- **🌍 Environment-Specific**: Different defaults for development/staging/production
- **🔧 Optional Services**: Many integrations can be disabled for development
- **📝 Type Safety**: Full TypeScript support with proper typing
- **🧪 Test Friendly**: Isolated configuration for testing environments

**How it works:**
```typescript
// Instead of: process.env.DATABASE_URL
// Use: 
import { getConfig } from './infrastructure/configuration/node-config-service';
const config = getConfig();
const dbUrl = config.database.url;
```

**Benefits for contributors:**
- Clear error messages if configuration is missing
- IntelliSense autocomplete for all config options
- Automatic validation prevents common setup mistakes
- Environment-specific defaults reduce configuration burden

### **Minimal Development Setup**
You only need these for basic development:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://...
SESSION_SECRET=your-development-secret
```

All other services (GitHub, AWS, SendGrid) are optional and can be left empty.

## 🆘 Troubleshooting for Contributors

### **Common Setup Issues**

**❌ "Configuration error: Missing required fields"**
```bash
# Solution: Check your .env file has required fields
cp .env.template .env
# Edit .env with at minimum: DATABASE_URL, SESSION_SECRET
```

**❌ "Database connection failed"**
```bash
# Solution: Verify your DATABASE_URL format
DATABASE_URL=postgresql://username:password@host:port/database_name
```

**❌ "GITHUB_TOKEN errors in scripts"**
```bash
# Solution: GitHub integration is optional for most development
# Leave GITHUB_TOKEN empty in .env unless testing GitHub features
GITHUB_TOKEN=
```

**❌ "AWS credential errors"**
```bash
# Solution: AWS features are optional for frontend development
# Leave AWS fields empty unless testing AWS integrations
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

**❌ "Tests failing"**
```bash
# Run tests to see specific failures
npm test

# Check if your .env has conflicting values
# Tests use their own isolated configuration
```

### **Getting Help**
- 📖 **Full Setup Guide**: See `docs/DEVELOPMENT_SETUP.md`
- 🏗️ **Architecture Guide**: See `docs/ARCHITECTURE.md`
- 🔒 **Security Guide**: See `docs/SECURITY.md`
- 🐛 **Issues**: Create a GitHub issue with your setup details
- 💬 **Discussions**: Use GitHub Discussions for questions

## 🤝 Contributing Guidelines

### **Before You Start**
1. **Fork the repository** to your GitHub account
2. **Read the documentation** in the `docs/` folder
3. **Set up your development environment** following the guide above
4. **Check existing issues** and discussions

### **Development Standards**
- **TypeScript**: Strict mode enabled, no `any` types
- **Testing**: Write tests for new features
- **Commits**: Use conventional commit format (`feat:`, `fix:`, `docs:`)
- **Security**: Never commit credentials or sensitive data
- **Code Style**: ESLint and Prettier configured (run `npm run lint`)

### **Pull Request Process**
1. **Create feature branch**: `git checkout -b feature/description`
2. **Make changes**: Follow existing patterns and documentation
3. **Run tests**: `npm test` and `npm run lint`
4. **Update documentation**: If adding features or changing APIs
5. **Commit with clear messages**: `feat: add user profile component`
6. **Push to your fork**: `git push origin feature/description`
7. **Create pull request**: Use the PR template, link related issues

### **Types of Contributions Welcome**
- 🐛 **Bug fixes**: Fix issues or improve error handling
- ✨ **Features**: Add new functionality (discuss in issues first)
- 📝 **Documentation**: Improve setup guides, API docs, or examples
- 🧪 **Tests**: Add test coverage or improve test quality
- 🎨 **UI/UX**: Improve design, accessibility, or user experience
- ⚡ **Performance**: Optimize queries, reduce bundle size, etc.

### **What You DON'T Need**
- ❌ Production AWS account or credentials
- ❌ Real SendGrid API keys or email service
- ❌ GitHub personal access tokens (unless testing GitHub features)
- ❌ Production database access
- ❌ Domain or SSL certificates

**The development environment is designed to work with minimal external dependencies!**

### **For Production Deployment**
**Note**: Only project maintainers have access to production credentials.

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