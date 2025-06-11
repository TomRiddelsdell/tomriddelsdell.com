# FlowCreate - Workflow Automation Platform

A professional TypeScript-based workflow automation platform built with pure Domain Driven Design (DDD) architecture, focusing on intelligent workflow creation and enterprise-grade reliability.

📖 **[Complete Architecture Documentation](./ARCHITECTURE.md)**

## Technologies

- **Frontend**: TypeScript React with Vite
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: AWS Cognito
- **UI Components**: Shadcn/ui with Tailwind CSS
- **Testing**: Vitest, Playwright, Testing Library
- **Email**: SendGrid integration

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- AWS Cognito User Pool
- SendGrid account (optional, for email functionality)

## Environment Variables

Create the following environment variables in your Replit Secrets:

### Required Variables
```
DATABASE_URL=postgresql://username:password@host:port/database
VITE_AWS_COGNITO_CLIENT_ID=your_cognito_client_id
VITE_AWS_COGNITO_REGION=your_aws_region
VITE_AWS_COGNITO_USER_POOL_ID=your_user_pool_id
AWS_COGNITO_CLIENT_SECRET=your_cognito_client_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### Optional Variables
```
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SESSION_SECRET=your_session_secret_minimum_32_chars
```

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   ```bash
   npm run db:push
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Pure DDD Architecture

```
FlowCreate/
├── domains/                    # Pure Domain Layer
│   ├── identity/              # User authentication & authorization
│   ├── workflow/              # Workflow creation & execution
│   ├── analytics/             # Data analysis & reporting
│   ├── integration/           # Third-party connections
│   ├── notification/          # Communication services
│   └── shared-kernel/         # Shared domain concepts
├── services/                  # Application Services
│   ├── identity-service/      # Identity workflows
│   ├── workflow-service/      # Workflow orchestration
│   └── notification-service/  # Event handling
├── infrastructure/            # Infrastructure Layer
│   ├── database/             # Data persistence
│   ├── security/             # Auth & authorization
│   └── anti-corruption-layer/ # External service adapters
├── interfaces/               # Interface Layer
│   ├── api-gateway/          # REST API
│   ├── web-frontend/         # React UI
│   └── admin-dashboard/      # Admin interface
└── libs/                     # Shared utilities
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

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
- **End-to-End Tests**: Full user workflow testing

### Running Tests

```bash
# Run all DDD tests
npm run test

# Current test status: 52/60 passing
# ✅ Identity Domain: 19/19 tests passing
# ✅ Workflow Domain: 21/21 tests passing  
# ✅ Shared Kernel: 9/10 tests passing
# ⚠️  Infrastructure Layer: 3/10 tests passing
```

### Test Coverage

- **Domain Layer**: Pure business logic testing with comprehensive coverage
- **Value Objects**: Email, UserId, CognitoId validation and behavior
- **Aggregates**: UserAggregate and WorkflowAggregate business rules
- **Domain Events**: Event publishing and cross-domain communication
- **Business Rules**: Workflow activation, action validation, status transitions
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
- `GET /api/workflows` - User workflows
- `GET /api/connected-apps` - Connected applications
- `GET /api/templates` - Workflow templates

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