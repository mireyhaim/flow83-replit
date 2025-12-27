# Flow 83 - Business Operating System

## Overview

Flow 83 is a lightweight business operating system designed for mentors, therapists, and method creators. The platform enables them to transform existing knowledge into 7-day digital transformational journeys, delivered as personalized, daily, AI-powered experiences. The core value proposition is helping practitioners move from 1:1 work to scalable digital offerings.

**Key MVP Goals:**
- End-to-end journey creation and delivery
- Human, non-generic participant experience
- Automated selling and delivery of transformation
- Mentor flexibility, experimentation, and editing

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: React Query for server state, custom Zustand-like store for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

**Design Pattern**: The frontend follows a page-based architecture with shared components. Pages are in `client/src/pages/`, reusable components in `client/src/components/`, and utilities in `client/src/lib/`.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON API with routes prefixed `/api/`
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

**Design Pattern**: The server uses a storage interface pattern (`IStorage`) implemented by `DatabaseStorage` for database operations, making it easy to swap implementations if needed.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod integration for schema validation
- **Schema Location**: `shared/schema.ts` contains all database tables and types
- **Migrations**: Managed via `drizzle-kit push`

**Core Data Models:**
- `users` - User accounts from Replit Auth
- `journeys` - Multi-day transformational journeys created by mentors
- `journeySteps` - Individual days/steps within a journey
- `journeyBlocks` - Content blocks within steps (text, questions, tasks, meditations, videos)
- `participants` - Users enrolled in journeys
- `sessions` - Authentication session storage
- `externalPaymentSessions` - Token-based payment tracking for external payment links

### Payment System

Flow 83 supports two payment methods for paid journeys:

1. **Stripe Connect** - Integrated checkout where payments go directly to mentor's Stripe account
2. **External Payment Links** - Mentors can use their own payment links (PayPal, Stripe Payment Links, etc.)

**External Payment Flow:**
1. Mentor configures `externalPaymentUrl` in journey settings (publish modal)
2. When participant joins, API creates an `externalPaymentSession` with unique token
3. Participant is redirected to mentor's external payment link (opens in new tab)
4. Participant returns to `/payment/external-success?token=xxx`
5. Token is verified, session is marked complete, and participant gains access

This approach allows mentors from any country to receive payments directly through their preferred payment provider.

### Key Architectural Decisions

1. **Shared Schema Pattern**: Database schema and types are defined once in `shared/schema.ts` and used by both frontend and backend, ensuring type safety across the stack.

2. **Full-Stack TypeScript**: Both client and server use TypeScript for consistency and type safety.

3. **Monorepo Structure**: Single repository with `client/`, `server/`, and `shared/` directories for tight integration.

4. **API Client Pattern**: The frontend uses a typed API client (`client/src/lib/api.ts`) that wraps fetch calls with proper error handling.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable

### Authentication
- **Replit Auth**: OpenID Connect-based authentication requiring `REPL_ID`, `ISSUER_URL`, and `SESSION_SECRET` environment variables

### UI Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Lucide React**: Icon library
- **Framer Motion**: Animation library for participant view

### Development Tools
- **Vite**: Development server and build tool
- **Drizzle Kit**: Database migration and schema management
- **esbuild**: Server-side bundling for production