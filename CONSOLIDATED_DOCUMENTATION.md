# TomRiddelsdell.com - Consolidated Documentation

**Date Created:** September 2, 2025  
**Purpose:** Complete documentation consolidation before fresh start  
**Project:** Personal website and portfolio for Tom Riddelsdell  

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Summary](#architecture-summary)
3. [Technology Stack](#technology-stack)
4. [Development Environment](#development-environment)
5. [Deployment Lessons Learned](#deployment-lessons-learned)
6. [Fresh Start Requirements](#fresh-start-requirements)
7. [Home Page Assets and Components](#home-page-assets-and-components)
8. [Key Configuration Files](#key-configuration-files)

## Project Overview

TomRiddelsdell.com is a personal website and portfolio showcasing professional work, skills, and experience. The project evolved from a simple static site to a complex full-stack application with AWS integration.

### Core Features (Implemented)
- Responsive home page with professional portfolio layout
- Modern React frontend with TypeScript
- Express.js backend API
- AWS Cognito authentication
- Database integration with Neon PostgreSQL
- Multi-environment deployment (staging/production)

### Key Challenges Encountered
- AWS Lambda cold start optimization (10+ second timeouts)
- Complex infrastructure management across multiple AWS services
- Authentication integration complexity
- Database connection management in serverless environment
- API Gateway V2 routing challenges

## Architecture Summary

### Domain-Driven Design Structure
The project was organized using Domain-Driven Design principles:

```
domains/
├── analytics/          # User activity tracking
├── identity/           # User management and authentication
├── integration/        # External service integrations
├── monitoring/         # System health and metrics
├── notification/       # Email and messaging services
└── shared-kernel/      # Common utilities and types
```

### Infrastructure Components
- **Frontend:** React/TypeScript with Vite build system
- **Backend:** Express.js with serverless deployment
- **Database:** Neon PostgreSQL with Drizzle ORM
- **Authentication:** AWS Cognito with OAuth2 flow
- **Storage:** AWS S3 for static assets
- **CDN:** CloudFront for content delivery
- **API Gateway:** AWS API Gateway V2 for routing
- **Compute:** AWS Lambda for serverless functions

## Technology Stack

### Frontend Dependencies
```json
{
  "core": ["react", "react-dom", "typescript"],
  "ui": ["@radix-ui/*", "tailwindcss", "framer-motion"],
  "routing": ["wouter"],
  "forms": ["react-hook-form", "@hookform/resolvers"],
  "state": ["@tanstack/react-query"],
  "icons": ["lucide-react", "react-icons"]
}
```

### Backend Dependencies
```json
{
  "core": ["express", "typescript"],
  "database": ["drizzle-orm", "@neondatabase/serverless"],
  "auth": ["aws-amplify", "amazon-cognito-identity-js"],
  "aws": ["@aws-sdk/*", "@vendia/serverless-express"],
  "validation": ["zod", "drizzle-zod"],
  "session": ["express-session", "connect-pg-simple"]
}
```

### Build and Development Tools
```json
{
  "build": ["vite", "esbuild"],
  "testing": ["vitest", "@testing-library/*", "playwright"],
  "development": ["tsx", "config"],
  "linting": ["typescript"]
}
```

## Development Environment

### Environment Configuration
The project used a sophisticated configuration system:

```
config/
├── default.js          # Base configuration
├── development.js      # Local development
├── staging.js          # Staging environment
└── production.js       # Production environment
```

### Key Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
COGNITO_USER_POOL_ID=eu-west-2_...
SESSION_SECRET=...

# AWS Infrastructure
STATIC_ASSETS_BUCKET=...
CORS_ORIGINS=...

# Environment Control
NODE_ENV=staging|production
FORCE_ENV_CONFIG=true
```

## Deployment Lessons Learned

### AWS Lambda Optimization Insights
1. **Cold Start Issues:** Module-level imports cause 10+ second delays
2. **Lazy Loading Solution:** Implement comprehensive lazy loading for all heavy modules
3. **Express Bypass:** Direct responses for simple endpoints (health, root)
4. **Database Connections:** Avoid eager database initialization

### Infrastructure Complexity
1. **Multiple Services:** CloudFormation, Lambda, API Gateway, S3, CloudFront, Cognito
2. **Configuration Management:** Complex environment-specific settings
3. **Deployment Coordination:** Requires careful orchestration of multiple components

### Authentication Challenges
1. **Cognito Integration:** Complex OAuth2 flow setup
2. **Session Management:** Database-backed sessions in serverless environment
3. **CORS Configuration:** Cross-origin issues with multiple domains

## Fresh Start Requirements

### Core Home Page Assets
- `interfaces/web-frontend/public/background.jpg` - Hero background image
- `interfaces/web-frontend/public/me.jpg` - Profile photo
- Home page React components and styling
- Basic navigation and responsive layout

### Essential Configuration Files
- `package.json` - Dependencies and scripts (simplified)
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Styling framework
- `tsconfig.json` - TypeScript configuration
- `components.json` - UI component configuration

### Documentation to Preserve
- This consolidated documentation
- Architecture decisions and lessons learned
- Technology stack information
- Deployment insights for future reference

## Home Page Assets and Components

### Key Frontend Files for Home Page
```
interfaces/web-frontend/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── main.tsx               # Entry point
│   ├── index.css              # Global styles
│   ├── components/            # Reusable components
│   │   ├── ui/               # Basic UI components
│   │   └── layout/           # Layout components
│   ├── pages/                # Page components
│   │   └── HomePage.tsx      # Main home page
│   └── assets/               # Static assets
├── public/
│   ├── background.jpg        # Hero background
│   └── me.jpg               # Profile photo
├── index.html               # HTML template
└── dist/                    # Built assets
```

### Essential Home Page Content
The home page should showcase:
- Professional header with name and title
- Hero section with background image
- About section with profile photo
- Skills and experience summary
- Contact information
- Clean, responsive design

## Key Configuration Files

### package.json (Simplified for Fresh Start)
```json
{
  "name": "tomriddelsdell-com",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.5.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "typescript": "5.6.3",
    "vite": "^6.3.5"
  }
}
```

### Next Steps for Fresh Start
1. Create new feature branch `fresh-start`
2. Remove all complex infrastructure code
3. Keep only home page components and assets
4. Simplify to static site generation
5. Use simple hosting solution (Netlify, Vercel, or GitHub Pages)
6. Gradually add features as needed with simpler architecture

---

**Note:** This documentation preserves all the valuable lessons learned and architectural decisions made during the initial development phase. It serves as a reference for future development decisions and helps avoid repeating the same mistakes.
