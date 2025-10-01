# WritWay

A multi-tenant SaaS platform for paralegals and small legal practices that automates documentation workflows, client communication, and case management while providing CRM, tasks, pipeline, billing, and analytics.

## 🏗️ Architecture Overview

WritWay is built as a modern, scalable SaaS platform with the following architecture:

### Tech Stack
- **Backend**: Node.js (API-first, modular service design)
- **Frontend**: Next.js (App Router, dashboard UI)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Google Workspace OAuth2
- **Billing**: Stripe API
- **File Handling**: PDF generation + storage (S3 or equivalent)
- **Email Service**: Google API (correspondence + workflows)

### Project Structure
```
/backend     → Node.js services & REST API layer
/frontend    → Next.js app (dashboards, client portal)
/database    → Prisma schema, migrations, seeds
/infra       → Infrastructure-as-Code, CI/CD, environment configs
/docs        → .cursor/rules/*.mdc files (guidelines & conventions)
```

### Security & Multi-Tenancy
- **Multi-tenancy**: Row-level isolation per tenant
- **Role-based access control**:
  - Super Admin → global view across tenants
  - Org Admin → manage org, billing, settings, team
  - Staff/User → limited per role
- **Data Protection**: HTTPS enforced, secure cookies, TLS in transit, encryption at rest

## 🚀 Getting Started

### Prerequisites
- Node.js (latest LTS)
- PostgreSQL
- Redis (for queues)
- Google Workspace API credentials
- Stripe API keys

### Development Setup
1. Clone the repository
2. Install dependencies in `/backend` and `/frontend`
3. Set up environment variables (see `.env.example` files)
4. Run database migrations: `prisma migrate dev`
5. Seed the database: `prisma db seed`
6. Start development servers

## 📋 Development Guidelines

This project follows strict development guidelines defined in Cursor rules. These rules ensure consistency, security, and maintainability across the entire codebase.

### Cursor Rules Documentation

The project uses Cursor AI with comprehensive rules located in `.cursor/rules/`:

#### Core Architecture Rules
- **[Architecture Guidelines](.cursor/rules/archetecture.mdc)** - System overview, tech stack, security layer, and integration points
- **[Backend Guidelines](.cursor/rules/backend.mdc)** - Node.js API layer rules, REST conventions, authentication, and testing
- **[Database Guidelines](.cursor/rules/database.mdc)** - PostgreSQL + Prisma design, multi-tenancy, migrations, and naming conventions
- **[Frontend Guidelines](.cursor/rules/frontend.mdc)** - Next.js App Router, routing, SEO, and API consumption patterns
- **[UI Guidelines](.cursor/rules/ui.mdc)** - shadcn/ui + Tailwind design system, components, and accessibility

#### Key Development Principles

**Backend (Node.js + Express)**
- API-first design with standardized REST endpoints
- Strict layering: Controllers → Services → Repositories
- Multi-tenant data isolation via Prisma middleware
- Comprehensive validation with Zod schemas
- OpenAPI documentation for all endpoints

**Frontend (Next.js)**
- App Router with route groups for public/dashboard areas
- Type-safe API consumption via generated SDKs
- React Query for data fetching and caching
- SEO-optimized public pages with SSR/ISR
- Role-based access control with middleware

**Database (PostgreSQL + Prisma)**
- UUID primary keys throughout
- Snake_case naming conventions
- Mandatory tenant_id for multi-tenancy
- Audit logging for compliance
- Safe migration practices

**UI (shadcn/ui + Tailwind)**
- Design token-based theming
- Consistent component usage
- WCAG 2.1 AA accessibility compliance
- Mobile-first responsive design

### API Design Standards

All APIs follow these conventions:
- Base path: `/api/v1`
- Standard response envelope with success/error structure
- Comprehensive error codes registry
- Pagination with meta information
- Idempotency support for mutations

### Security Requirements

- All database queries scoped by tenant_id
- JWT-based authentication with refresh token rotation
- Rate limiting on all endpoints
- Input validation and sanitization
- Audit logging for compliance-critical actions
- Principle of least privilege for all services

### Testing Strategy

- Unit tests for services and utilities (≥80% coverage target)
- Integration tests for API routes
- Contract tests against OpenAPI specifications
- E2E tests for critical user flows
- Mocked external API dependencies

## 🔧 Development Workflow

1. **Feature Development**: Follow the layered architecture and use the appropriate Cursor rules
2. **API Development**: Implement with OpenAPI documentation and comprehensive testing
3. **Database Changes**: Use Prisma migrations with proper rollback support
4. **UI Development**: Use shadcn/ui components with Tailwind theme tokens
5. **Testing**: Write tests according to the testing strategy
6. **Documentation**: Update relevant rule documents for significant changes

## 📚 Additional Resources

- [Architecture Overview](.cursor/rules/archetecture.mdc)
- [Backend API Rules](.cursor/rules/backend.mdc)
- [Database Schema Guidelines](.cursor/rules/database.mdc)
- [Frontend Development Guide](.cursor/rules/frontend.mdc)
- [UI Component System](.cursor/rules/ui.mdc)

## 🤝 Contributing

1. Follow the established Cursor rules and guidelines
2. Ensure all tests pass
3. Update documentation for significant changes
4. Follow the Definition of Done criteria in each rule document

## 📄 License

[Add your license information here]