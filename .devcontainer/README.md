# Development Container Configuration

This directory contains the VS Code dev container configuration for the Portfolio Platform project.

## 🏗️ Architecture

**Simplified Single-Container Setup**
- Uses official Microsoft TypeScript-Node base image
- Includes all necessary CLI tools for the platform
- Configured for Event-Sourced Microservices development
- Optimized for our tech stack: TypeScript, Next.js, PostgreSQL, Kafka

## 🔧 What's Included

### CLI Tools (Installed via setup.sh)
- **Doppler CLI**: Centralized secrets management
- **Wrangler CLI**: Cloudflare Workers deployment
- **Terraform CLI**: Infrastructure as Code
- **Neon CLI**: PostgreSQL database management  
- **Confluent CLI**: Apache Kafka management
- **AWS CLI**: AWS services integration

### VS Code Extensions
- GitHub Copilot & Chat
- TypeScript/JavaScript development
- React/Next.js support
- Testing (Playwright, Vitest)
- Database tools (PostgreSQL)
- Infrastructure (Terraform, Docker)
- Documentation (Markdown)

### MCP Server Integration
- **GitHub MCP**: Official @modelcontextprotocol/server-github
- **Neon MCP**: Official @neondatabase/mcp-server-neon
- **AWS CLI MCP**: Official @modelcontextprotocol/server-aws-cli

## 🚀 Getting Started

1. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Fill in your actual values in .env
   ```

2. **Open in Dev Container**:
   - Use VS Code Command Palette
   - Run: "Dev Containers: Reopen in Container"

3. **Post-Setup Commands** (run automatically):
   ```bash
   # The setup.sh script installs all CLI tools
   # and creates necessary directories
   ```

4. **Verify Installation**:
   ```bash
   doppler --version
   wrangler --version
   terraform --version
   neonctl --version
   confluent version
   ```

## 📁 Directory Structure Created

The setup script creates the standard monorepo structure:
- `packages/` - Shared libraries and components
- `services/` - Domain microservices 
- `apps/` - Frontend applications
- `contracts/` - API and event contracts
- `tests/` - All test types
- `infra/` - Infrastructure as code

## 🔐 Environment Variables

All sensitive values are loaded from the host environment or Doppler.
See `.env.example` for required variables.

## 🗑️ Removed Components

**Previous Complex Setup** (backed up as *.backup):
- Multi-container Docker Compose setup
- Custom MCP server containers
- Complex environment variable duplication
- Unnecessary service dependencies

**Why Simplified**:
- Official MCP servers are more reliable
- Single container is faster to start
- Less configuration complexity
- Easier troubleshooting
- Better VS Code integration

## 🎯 Ready for Phase 0

This configuration supports the implementation plan:
- All required CLI tools
- Proper MCP server integration  
- Environment variable management
- Infrastructure deployment tools
- Database and message bus clients

Perfect foundation for executing the 8-12 week implementation roadmap!
