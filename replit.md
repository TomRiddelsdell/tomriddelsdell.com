# tomriddelsdell.com

## Overview

tomriddelsdell.com is a personal website providing secure access to sub-projects with a pure Domain Driven Design (DDD) architecture. The system prioritizes enterprise-grade reliability, separation of concerns, and clean architecture principles. Its core capabilities include user management, workflow execution, external service integrations, analytics, and multi-channel notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The system is built on a pure Domain Driven Design (DDD) architecture, organized as a monorepo with distinct domains, services, interfaces, and infrastructure layers. TypeScript is used throughout for type safety.

### UI/UX Decisions
The web frontend utilizes React with Vite for development and Shadcn/ui components with Tailwind CSS for styling, ensuring a modern and responsive user experience.

### Technical Implementation
- **Architecture Pattern**: Domain Driven Design (DDD) with clear separation of concerns.
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations and schema management.
- **Authentication**: AWS Cognito for robust identity management.
- **Backend**: Express.js for the API Gateway, handling HTTP requests and authentication.
- **Testing**: Comprehensive testing suite including Vitest for unit tests, and Playwright for E2E tests.

### Feature Specifications
- **Identity Domain**: Manages user authentication and authorization, integrated with AWS Cognito.
- **Workflow Domain**: Handles core workflow logic, execution, and validation.
- **Integration Domain**: Manages external service integrations and data transformations.
- **Analytics Domain**: Collects metrics, logs data, and supports issue reproduction.
- **Notification Domain**: Provides multi-channel notifications via SendGrid.
- **Shared Kernel**: Contains common value objects, domain events, and base patterns.

### System Design Choices
- **Monorepo Structure**: Organized for maintainability and scalability, separating concerns into logical domains.
- **Layered Architecture**: Enforces strict separation between domain, application, infrastructure, and interface layers for clean architecture.
- **Data Flow**: Defined flows for authentication (via AWS Cognito and API Gateway) and workflow execution (frontend to API Gateway, then through services).
- **Data Persistence**: All domain entities are persisted via Drizzle ORM, with schema managed through migrations.

## External Dependencies

The project integrates with the following external services and APIs:

-   **AWS Cognito**: Used for user authentication, identity management, and authorization.
-   **PostgreSQL**: The primary database for data persistence.
-   **SendGrid**: An optional service used for sending emails and multi-channel notifications.
```