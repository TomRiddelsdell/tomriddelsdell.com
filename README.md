# tomriddelsdell.com - Personal Website

**Enterprise-grade personal website with pure Domain Driven Design (DDD) architecture**

🚀 **[Quick Start Guide](./docs/QUICK_START.md)** | 🛠️ **[Development Guide](./docs/DEVELOPMENT.md)** | ☁️ **[Deployment Guide](./docs/DEPLOYMENT.md)** | 🏗️ **[Architecture](./docs/ARCHITECTURE.md)** | 🔒 **[Security](./docs/SECURITY.md)**

## 🎯 Project Overview

✅ **Production Ready** - Modern AWS infrastructure with automated CI/CD  
✅ **Enterprise Security** - AWS Cognito, OIDC, comprehensive security validation  
✅ **Cost Optimized** - ~$15-34/month total infrastructure costs  
✅ **Developer Friendly** - 5-minute setup, comprehensive documentation  

### **What This Project Is**
- **Modern Portfolio Website**: Clean, professional design with contact forms
- **Enterprise Architecture**: Domain Driven Design with proper bounded contexts
- **Full-Stack TypeScript**: Type safety from database to frontend
- **AWS Serverless**: Scalable infrastructure with minimal maintenance
- **Developer Template**: Fork-ready for your own portfolio or business site

### **Perfect For**
- **Developers**: Showcase your work with modern tech stack
- **Freelancers**: Professional presence with contact forms and analytics
- **Small Businesses**: Cost-effective website with enterprise features
- **Students**: Learn modern architecture patterns and AWS deployment  

## 🏗️ Technology Stack

### **Frontend**
- **React 18** + **TypeScript** - Modern UI development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** + **Shadcn/ui** - Beautiful, responsive design
- **React Query** - Server state management

### **Backend** 
- **Express.js** + **TypeScript** - Type-safe API development
- **Domain Driven Design** - Clean architecture patterns
- **Drizzle ORM** - Type-safe database operations
- **Zod** - Runtime type validation

### **Infrastructure**
- **AWS Lambda** - Serverless compute
- **API Gateway** - HTTP API management
- **CloudFront** - Global CDN
- **PostgreSQL** - Reliable database (Neon recommended)
- **AWS Cognito** - Enterprise authentication

### **Development**
- **GitHub Actions** - Automated CI/CD
- **Vitest** - Fast unit testing
- **ESLint** + **Prettier** - Code quality
- **VS Code Dev Container** - Consistent development environment

## 🚀 Quick Start

**For Developers wanting to use this as a template:**

### **1-Minute Setup**
```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/tomriddelsdell.com.git
cd tomriddelsdell.com
npm install

# 2. Configure environment
cp .env.template .env
# Edit .env with your database URL and basic settings

# 3. Start development
npm run dev
# 🎉 App running at http://localhost:3000
```

### **5-Minute Deployment**
```bash
# Option 1: GitHub Actions (Recommended)
# 1. Fork repo → Add AWS secrets → Push to main → Auto-deploy!

# Option 2: Manual deployment
npm run build
./infrastructure/deployment/aws/scripts/deploy-production.sh
```

**📖 Detailed guides:** See [docs/QUICK_START.md](./docs/QUICK_START.md), [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md), and [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## � Cost & Performance

### **Infrastructure Costs**
- **Development**: $0-5/month (within AWS free tier)
- **Small Production**: $10-25/month 
- **High Traffic**: $25-50/month
- **Includes**: SSL certificates, CDN, serverless compute, database hosting

### **Performance Metrics**
- **Build Size**: 818KB total (excellent)
- **API Response**: <250ms average
- **Page Load**: <2 seconds target
- **Test Coverage**: 75/75 tests passing (100% success rate)
- **Database**: Optimized with Drizzle ORM indexes and queries

## 🔧 Development Features

### **5-Minute Developer Setup**
- **One Command Install**: `npm install` handles everything
- **Environment Template**: `.env.template` with safe defaults
- **Hot Reload**: Frontend and backend auto-refresh
- **Type Safety**: Full TypeScript across the stack
- **Automated Testing**: Tests run on every change

### **Production-Grade Security**
- **Zero Vulnerabilities**: Comprehensive security scanning
- **Enterprise Auth**: AWS Cognito with OIDC
- **Secrets Management**: Environment-based configuration
- **Input Validation**: Runtime type checking with Zod
- **Rate Limiting**: Configurable API protection

### **Deployment Options**
- **GitHub Actions**: Push to deploy (recommended)
- **Manual Deployment**: Single command AWS deployment
- **Development**: Local development with hot reload
- **Staging**: Automatic staging environment

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
# Problem: "The security token included in the request is invalid"
# Solution 1: Configure AWS credentials on your HOST machine (not in container)
aws configure  # Run this on your host machine

# Solution 2: Check if credentials are properly mounted
ls -la ~/.aws/  # Should show config and credentials files

# Solution 3: Verify credentials are working
aws sts get-caller-identity  # Should show your AWS account info

# Solution 4: If credentials keep reverting after rebuild
# Make sure you configured AWS on HOST machine, not in container
# The dev container mounts ~/.aws/ from your host
```

**❌ "AWS MCP server not working"**
```bash
# Solution: AWS MCP requires valid AWS credentials
# 1. Configure AWS on host: aws configure  
# 2. Rebuild dev container
# 3. Test: ./scripts/check-mcp-status.sh
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

## 📁 Project Structure

### **Domain Driven Design Architecture**
```
tomriddelsdell.com/
├── domains/                    # Business Logic (Pure Domain Layer)
│   ├── identity/              # User authentication & authorization
│   ├── analytics/             # Data analysis & reporting
│   ├── integration/           # Third-party service integrations
│   ├── notification/          # Multi-channel communication
│   └── shared-kernel/         # Shared domain concepts & events
├── interfaces/               # External Boundaries (API & UI)
│   ├── api-gateway/          # Express.js REST API
│   └── web-frontend/         # React SPA with Shadcn/ui
├── infrastructure/           # Technical Concerns
│   ├── database/             # PostgreSQL with Drizzle ORM
│   ├── security/             # AWS Cognito integration
│   ├── deployment/           # AWS deployment scripts
│   └── configuration/        # Environment & system config
└── docs/                     # Comprehensive documentation
```

### **Key Features**
- **Clean Architecture**: Strict separation of business logic and technical concerns
- **Type Safety**: Full TypeScript coverage from database to frontend
- **Modern Stack**: Latest versions of React, Express, and AWS services
- **Developer Experience**: Hot reload, comprehensive testing, clear documentation
- **Production Ready**: Enterprise security, monitoring, and deployment automation

## 💰 Infrastructure Costs

**Total Monthly Cost: ~$15-34**
- **Staging Environment**: $5-9/month
- **Production Environment**: $10-25/month  
- **Includes**: SSL certificates, CloudFront CDN, Lambda execution, S3 storage
- **Monitoring**: Automated cost alerts if >$50/month

## 🤝 Contributing

### **Quick Contributing Guide**
1. **Fork** the repository on GitHub
2. **Clone** your fork and install dependencies: `npm install`
3. **Create** environment: `cp .env.template .env` (edit with development values)
4. **Start** development: `npm run dev`
5. **Make** your changes following the existing patterns
6. **Test** your changes: `npm test` and `npm run lint`
7. **Submit** a pull request with clear description

### **Development Standards**
- **TypeScript**: Strict mode enabled, no `any` types
- **Testing**: Write tests for new features  
- **Commits**: Use conventional commit format (`feat:`, `fix:`, `docs:`)
- **Security**: Never commit credentials or sensitive data
- **Code Style**: ESLint and Prettier configured (auto-fix available)

### **What You Need vs. Don't Need**

**✅ You DO Need:**
- Node.js 18+ and npm
- A database (local PostgreSQL or free cloud database)
- Basic development environment

**❌ You DON'T Need:**
- Production AWS credentials
- Real SendGrid API keys  
- GitHub tokens (unless testing GitHub features)
- Domain or SSL certificates
- Production database access

**The development environment works with minimal external dependencies!**

### **Types of Contributions Welcome**
- 🐛 **Bug fixes** and error handling improvements
- ✨ **New features** (discuss in issues first for larger changes)
- 📝 **Documentation** improvements and examples
- 🧪 **Test coverage** and test quality improvements
- 🎨 **UI/UX** enhancements and accessibility
- ⚡ **Performance** optimizations and code quality

For detailed setup instructions, see [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)

## 📚 Documentation

### **Essential Guides**
- **[QUICK_START.md](./docs/QUICK_START.md)** - Get running in 5 minutes
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Complete development setup
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Deploy to AWS with automated CI/CD
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design and patterns  
- **[SECURITY.md](./docs/SECURITY.md)** - Security configuration and best practices

### **Detailed Documentation** 
For comprehensive information, see the [docs/](./docs) directory which contains detailed guides for architecture, deployment procedures, security configuration, and troubleshooting.

## 📄 License

MIT License - see LICENSE file for details. Feel free to fork and adapt for your own projects!

## 🆘 Support

**Need help?**
- 📖 **Documentation**: Check the guides in [docs/](./docs) directory
- 🐛 **Issues**: [Create a GitHub issue](https://github.com/TomRiddelsdell/tomriddelsdell.com/issues) with details
- 💬 **Discussions**: [GitHub Discussions](https://github.com/TomRiddelsdell/tomriddelsdell.com/discussions) for questions
- 🔍 **Search**: Check existing issues and discussions first

**Common solutions:**
- **Setup issues**: See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) troubleshooting section
- **Deployment problems**: Check [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) common issues
- **Security questions**: Review [docs/SECURITY.md](./docs/SECURITY.md) guidelines