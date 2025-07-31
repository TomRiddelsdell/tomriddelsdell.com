# 📚 Documentation Hub - tomriddelsdell.com

**Enterprise-grade documentation for production deployment and operations**

## 🚀 Quick Navigation

### **🔧 Setup & Development**
- **[DEVELOPMENT_SETUP.md](../DEVELOPMENT_SETUP.md)** - Complete dev environment setup
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and DDD patterns
- **[DOMAINS.md](DOMAINS.md)** - Domain boundaries and responsibilities

### **☁️ AWS Deployment**
- **[AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)** - Complete AWS serverless deployment
- **[GITHUB_ACTIONS_CICD.md](GITHUB_ACTIONS_CICD.md)** - CI/CD pipeline configuration
- **[SECURITY.md](SECURITY.md)** - Security practices and compliance

### **🐛 Operations & Monitoring**
- **[Bugs.md](Bugs.md)** - Active bug tracking and resolutions
- **[LOGGING_GUIDE.md](LOGGING_GUIDE.md)** - Logging strategy and monitoring
- **[BUILD_ANALYSIS.md](BUILD_ANALYSIS.md)** - Performance optimization

### **🌊 Neptune Graph Database (Optional)**
- **[NEPTUNE_DEPLOYMENT_GUIDE.md](NEPTUNE_DEPLOYMENT_GUIDE.md)** - Graph database setup
- **[NEPTUNE_COST_WARNING.md](NEPTUNE_COST_WARNING.md)** - Cost controls and limits
- **[NEPTUNE_COST_ANALYSIS.md](NEPTUNE_COST_ANALYSIS.md)** - Detailed cost analysis

### **🤖 MCP Integration**
- **[MCP_SETUP.md](MCP_SETUP.md)** - Model Context Protocol servers setup

## 🎯 System Status

### **✅ Production Ready**
- **Architecture**: Pure DDD with bounded contexts
- **Security**: Enterprise-grade with AWS Cognito + OIDC
- **Performance**: Optimized build (818KB total)
- **Testing**: 75/75 tests passing (100% success)
- **Monitoring**: Comprehensive health checks
- **Cost**: ~$15-34/month total infrastructure

### **🔄 CI/CD Pipeline**
- **Staging**: Auto-deploys from `develop` branch
- **Production**: Manual approval from `main` branch
- **Monitoring**: Cost alerts, health checks, performance tracking
- **Security**: No long-lived credentials, OIDC authentication

## 📊 Documentation Status

| Document | Status | Last Updated | Purpose |
|----------|---------|--------------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | ✅ Current | Jul 29 | System design & patterns |
| [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) | ✅ Current | Jul 31 | AWS serverless setup |
| [GITHUB_ACTIONS_CICD.md](GITHUB_ACTIONS_CICD.md) | ✅ Current | Jul 31 | CI/CD configuration |
| [SECURITY.md](SECURITY.md) | ✅ Current | Jul 31 | Security practices |
| [Bugs.md](Bugs.md) | ✅ Active | Jul 31 | Bug tracking |
| [DOMAINS.md](DOMAINS.md) | ✅ Current | Jul 29 | Domain structure |

## 🛠️ Essential Scripts

### **Quick Commands**
```bash
# Environment verification
./scripts/verify-dev-environment.sh

# Pre-deployment validation
./scripts/pre-deploy.sh

# Test execution (all modes)
./scripts/run-tests.sh [all|watch|ui]

# AWS deployment
./infrastructure/deployment/aws/scripts/deploy.sh --env staging

# Cost estimation
./infrastructure/deployment/aws/scripts/aws-cost-calculator.sh
```

### **Script Documentation**
| Script | Purpose | Location |
|--------|---------|----------|
| `verify-dev-environment.sh` | Environment validation | [DEVELOPMENT_SETUP.md](../DEVELOPMENT_SETUP.md#script-details) |
| `pre-deploy.sh` | Deployment validation | [DEVELOPMENT_SETUP.md](../DEVELOPMENT_SETUP.md#script-details) |
| `deploy.sh` | AWS deployment | [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) |
| `run-tests.sh` | Test execution | [DEVELOPMENT_SETUP.md](../DEVELOPMENT_SETUP.md#script-details) |

### Health Check Endpoints
- **Load Balancer**: `GET /health` - Simple uptime check
- **System Health**: `GET /api/monitoring/health-check` - Comprehensive status
- **Detailed Metrics**: `GET /api/monitoring/status` - Authenticated monitoring

## Support Information

### Technical Specifications
- **Frontend Bundle**: 296KB JavaScript + 48KB CSS
- **Backend Bundle**: 191KB optimized server
- **Database**: PostgreSQL with performance indexing
- **Authentication**: AWS Cognito with secure session management
- **Monitoring**: Real-time health and performance tracking

### Database Options

#### Neon Serverless PostgreSQL (Current)
- **Cost**: $0-20/month for typical usage
- **Features**: Database branching, time travel, generous free tier
- **Use Case**: Development and small production workloads
- **Portal**: [console.neon.tech](https://console.neon.tech) for status monitoring
- **Focus**: Developer experience and modern workflows

#### AWS RDS Serverless v2 PostgreSQL (Not currently used due to cost)
- **Cost**: $50-200+/month typical enterprise usage
- **Features**: Enterprise-grade reliability, AWS ecosystem integration
- **Use Case**: Large-scale production with high availability requirements
- **Portal**: AWS Console for comprehensive management
- **Focus**: Enterprise reliability and AWS service integration

### Performance Targets Achieved
- Page load time: <2 seconds
- API response time: <500ms
- Database queries: <100ms (optimized)
- Memory usage: <512MB per instance
- Uptime target: 99.9%

---

All documentation has been validated for production deployment. The platform meets enterprise standards for security, performance, and operational excellence.