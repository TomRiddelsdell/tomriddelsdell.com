# 🛠️ Development Guide

**Set up your development environment in under 5 minutes**

## Quick Start

### Prerequisites
```bash
# Required software
node --version    # v18+ required
npm --version     # v8+ required
git --version     # v2+ required
```

### 1-Minute Setup
```bash
# 1. Clone and install
git clone https://github.com/TomRiddelsdell/tomriddelsdell.com.git
cd tomriddelsdell.com
npm install

# 2. Configure environment
cp .env.template .env
# Edit .env with your local database URL

# 3. Start development
npm run dev

# 🎉 App running at http://localhost:3000
```

## Environment Variables

### Required (.env)
```bash
# Core Configuration
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/tomriddelsdell_dev
SESSION_SECRET=development-secret-32-characters

# Development Features
DEBUG=app:*
HOT_RELOAD=true
```

### Optional (.env)
```bash
# GitHub Integration (for portfolio features)
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=yourusername
GITHUB_REPO=yourrepo

# Email Testing (for contact forms)
EMAIL_PROVIDER=console  # Logs emails to console
SMTP_DEBUG=true
```

## Database Setup

### Option 1: Local PostgreSQL
```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql
createdb tomriddelsdell_dev

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb tomriddelsdell_dev

# Connection string
DATABASE_URL=postgresql://postgres@localhost:5432/tomriddelsdell_dev
```

### Option 2: Docker
```bash
# Run PostgreSQL in Docker
docker run --name postgres-dev \
  -e POSTGRES_DB=tomriddelsdell_dev \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 -d postgres:15

# Connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/tomriddelsdell_dev
```

### Option 3: Neon (Cloud)
```bash
# 1. Create free account at console.neon.tech
# 2. Create database
# 3. Copy connection string to .env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Development Scripts

### Common Commands
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test
npm run test:watch    # Watch mode
npm run test:coverage # With coverage

# Database operations
npm run db:migrate    # Run migrations
npm run db:seed      # Seed test data
npm run db:reset     # Reset database

# Code quality
npm run lint         # ESLint
npm run lint:fix     # Auto-fix issues
npm run type-check   # TypeScript check
npm run format       # Prettier formatting
```

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --grep "user authentication"

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Project Structure

### Key Directories
```
├── interfaces/
│   ├── api-gateway/           # API routes and middleware
│   └── web-frontend/          # React components and pages
├── domains/
│   ├── identity/              # User authentication
│   ├── analytics/             # Analytics and tracking
│   └── shared-kernel/         # Shared utilities
├── infrastructure/
│   ├── database/              # Database schemas and migrations
│   ├── configuration/         # Environment configuration
│   └── deployment/            # AWS deployment scripts
└── tests/                     # Test utilities and fixtures
```

### Configuration Files
```
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Build configuration
├── vitest.config.ts          # Test configuration
├── tailwind.config.ts        # CSS framework
└── drizzle.config.ts         # Database ORM
```

## Code Quality

### Linting and Formatting
```bash
# Fix all auto-fixable issues
npm run lint:fix

# Format all code
npm run format

# Type check
npm run type-check
```

### Pre-commit Hooks
```bash
# Install pre-commit hooks (recommended)
npm run prepare

# Manual pre-commit check
npm run pre-commit
```

## Development Features

### Hot Reload
- **Frontend**: Instant updates on file changes
- **Backend**: Automatic server restart
- **Database**: Schema changes with migrations

### Debug Mode
```bash
# Enable debug logging
DEBUG=app:* npm run dev

# Specific debug categories
DEBUG=app:auth,app:database npm run dev
```

### Development Tools
- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Vitest**: Fast unit testing
- **Drizzle**: Type-safe database queries

## API Development

### Creating New Endpoints
```typescript
// interfaces/api-gateway/routes/api/example.ts
import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  // Your endpoint logic
  res.json({ message: 'Hello, World!' });
});

export default router;
```

### Database Queries
```typescript
// Use Drizzle ORM for type-safe queries
import { db } from '@/infrastructure/database';
import { users } from '@/infrastructure/database/schema';

const user = await db.select().from(users).where(eq(users.id, userId));
```

## Frontend Development

### Component Structure
```typescript
// interfaces/web-frontend/components/Example.tsx
import React from 'react';

interface ExampleProps {
  title: string;
}

export function Example({ title }: ExampleProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}
```

### Styling with Tailwind
```typescript
// Use Tailwind CSS classes
<div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
  Content here
</div>
```

## Testing

### Unit Tests
```typescript
// tests/example.test.ts
import { describe, it, expect } from 'vitest';
import { calculateSum } from '@/utils/math';

describe('Math utilities', () => {
  it('should calculate sum correctly', () => {
    expect(calculateSum(2, 3)).toBe(5);
  });
});
```

### Integration Tests
```typescript
// tests/api/auth.test.ts
import request from 'supertest';
import { app } from '@/interfaces/api-gateway/app';

describe('Authentication API', () => {
  it('should login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    expect(response.status).toBe(200);
  });
});
```

## Troubleshooting

### Common Issues

❌ **"Port 3000 is already in use"**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

❌ **"Database connection failed"**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql

# Verify connection
psql $DATABASE_URL -c "SELECT 1;"
```

❌ **"Module not found"**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

❌ **"TypeScript errors"**
```bash
# Check TypeScript configuration
npm run type-check

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Debug Logging
```bash
# Enable specific debug categories
DEBUG=app:database npm run dev
DEBUG=app:auth npm run dev
DEBUG=app:* npm run dev
```

## VS Code Setup

### Recommended Extensions
- **TypeScript**: Enhanced TypeScript support
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Tailwind CSS IntelliSense**: CSS class suggestions
- **Thunder Client**: API testing
- **PostgreSQL**: Database management

### Settings
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Performance Tips

### Development Speed
- **Use hot reload**: Don't restart manually
- **Run tests in watch mode**: Continuous feedback
- **Use TypeScript**: Catch errors early
- **Enable debug logging**: Only for specific areas

### Build Optimization
```bash
# Analyze bundle size
npm run build
npm run analyze

# Check for unused dependencies
npx depcheck
```

## Getting Help

### Resources
- **Project Documentation**: Check `/docs` directory
- **API Documentation**: Auto-generated from code
- **Code Examples**: Look in `/tests` for usage examples

### Community
- **GitHub Issues**: Report bugs or ask questions
- **GitHub Discussions**: General discussions and help
- **Stack Overflow**: Tag with project name

### Debugging
- **Console Logs**: Use `DEBUG=app:*` environment variable
- **VS Code Debugger**: Set breakpoints and step through code
- **Network Tab**: Monitor API requests in browser dev tools
- **Database Queries**: Enable query logging with `DEBUG=app:database`
