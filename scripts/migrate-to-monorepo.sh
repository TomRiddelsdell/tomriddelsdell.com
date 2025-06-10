#!/bin/bash

# FlowCreate Platform - DDD Monorepo Migration Script
# This script helps migrate from the current structure to the new DDD monorepo architecture

set -e

echo "🚀 Starting DDD Monorepo Migration..."

# Backup current structure
echo "📦 Creating backup of current structure..."
cp -r . ../flowcreate-backup-$(date +%Y%m%d-%H%M%S)

# Install monorepo tooling
echo "🔧 Installing monorepo dependencies..."
npm install -g nx lerna

# Copy package files
echo "📝 Setting up monorepo package structure..."
cp package.monorepo.json package.json
cp README.monorepo.md README.md

# Create workspace package.json files
echo "📦 Creating workspace package.json files..."

# Domains
for domain in identity workflow integration analytics notification shared-kernel; do
  cat > domains/$domain/package.json << EOF
{
  "name": "@flowcreate/domain-$domain",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src/"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^0.34.0",
    "eslint": "^8.0.0"
  }
}
EOF
done

# Services
for service in identity-service workflow-service integration-service analytics-service notification-service; do
  cat > services/$service/package.json << EOF
{
  "name": "@flowcreate/service-${service%-service}",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^3.12.0",
    "vitest": "^0.34.0",
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0"
  }
}
EOF
done

# Interfaces
cat > interfaces/web-frontend/package.json << EOF
{
  "name": "@flowcreate/web-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "wouter": "^2.11.0"
  },
  "devDependencies": {
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

# Libraries
for lib in logging monitoring http-client validation testing-utils; do
  cat > libs/$lib/package.json << EOF
{
  "name": "@flowcreate/lib-$lib",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src/"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^0.34.0"
  }
}
EOF
done

# Create TypeScript configuration
echo "⚙️ Setting up TypeScript configuration..."
cat > tsconfig.base.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@flowcreate/domain-*": ["../domains/*/src"],
      "@flowcreate/lib-*": ["../libs/*/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF

# Create nx.json for monorepo management
echo "🔧 Setting up Nx configuration..."
cat > nx.json << EOF
{
  "extends": "nx/presets/npm.json",
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"]
    },
    "test": {
      "outputs": ["{projectRoot}/coverage"]
    }
  },
  "defaultProject": "web-frontend"
}
EOF

# Install dependencies
echo "📦 Installing workspace dependencies..."
npm install

echo "✅ Migration to DDD Monorepo structure completed!"
echo ""
echo "Next steps:"
echo "1. Review the new structure in each domain and service"
echo "2. Update import paths to use the new monorepo structure"
echo "3. Run 'make dev' to start the development environment"
echo "4. Update CI/CD pipelines to work with the new structure"
echo ""
echo "📚 See README.md for detailed documentation"