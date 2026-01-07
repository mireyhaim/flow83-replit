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

Flow 83 has a dual payment structure:

**1. Platform Subscriptions (LemonSqueezy)**
Mentors pay Flow 83 platform fees via LemonSqueezy:
- Starter: $26/mo (21-day trial, 1 Flow, 60 users)
- Pro: $83/mo (5 Flows, 300 users)
- Business: $188/mo (10 Flows, 1000 users)

Subscription management via webhook at `/api/webhooks/lemonsqueezy`:
- Handles: subscription_created, subscription_updated, subscription_cancelled, subscription_expired
- Handles: subscription_payment_success, subscription_payment_failed, subscription_paused
- Requires `LEMONSQUEEZY_WEBHOOK_SECRET` environment variable

**2. Participant Payments (External)**
Participants pay mentors directly via mentor's own payment links:
- Mentor configures `externalPaymentUrl` in journey settings
- Supports PayPal, Stripe Payment Links, or any payment provider
- Flow tracks payment sessions with unique tokens

**External Payment Flow:**
1. Mentor configures `externalPaymentUrl` in journey settings (publish modal)
2. When participant joins, API creates an `externalPaymentSession` with unique token
3. Participant is redirected to mentor's external payment link (opens in new tab)
4. Participant returns to `/payment/external-success?token=xxx`
5. Token is verified, session is marked complete, and participant gains access

This approach allows mentors from any country to receive payments directly through their preferred payment provider.

### Admin Dashboard

Internal admin dashboard for platform monitoring (accessible at `/admin`):

**Access Control:**
- Only users with `role = 'super_admin'` can access
- Protected by `isAdmin` middleware on all `/api/admin/*` routes

**Features:**
- **Dashboard**: KPI cards showing total users, active users (7d), mentors, active flows, journeys started/completed (30d)
- **Users**: Table of all participants with status (Active/Stuck/Completed), flow name, current day, last activity
- **Mentors**: Table of all users showing name, email, role, creation date
- **Flows**: Table of all journeys with mentor, participant counts, completion rate, drop-off rate
- **Errors**: System error log showing AI failures, payment errors, runtime issues

**Data Models:**
- `systemErrors` table stores platform errors for monitoring
- `role` field on users table (`user` | `super_admin`)

### Journey Creation Wizard

The journey creation experience uses a modern conversational wizard design (similar to Linear/Vercel onboarding):

**Component**: `client/src/components/journey/ConversationalJourneyWizard.tsx`

**Design:**
- Split-screen layout: vertical timeline sidebar (desktop) + centered question area
- Gradient mesh background with glassmorphism panels
- Violet/indigo color scheme with smooth Framer Motion animations

**Steps:**
1. `language` - Choose Hebrew or English
2. `duration` - Select 3 or 7 day journey
3. `journeyName` - Enter journey name
4. `targetAudience` - Define target audience
5. `mainGoal` - Specify transformation goal
6. `tone` - Select tone of voice (warm, professional, etc.)
7. `content` - Upload teaching materials (PDF, Word, text)

**Key Features:**
- Clickable timeline steps to edit previous answers (works on desktop and mobile)
- Live preview panel showing journey structure as it's built
- Progress bar during AI generation phase
- Mobile-responsive with interactive step icons at bottom
- All inputs pre-populate when editing previous steps

**Files:**
- `client/src/components/journey/ConversationalJourneyWizard.tsx` - Main wizard component
- `client/src/pages/journey-create.tsx` - Page wrapper

### Conversation Phase System

The chat experience uses a state machine to create authentic 1:1 mentor conversations (not content delivery):

**Phases:**
- `intro` - Welcome and opening question ("How are you arriving today?")
- `reflection` - Mirror user's emotions, ask deeper questions
- `task` - Present ONE specific task for the day
- `integration` - Acknowledge work done, close the day warmly

**Phase Transitions (Rule-Based):**
- intro → reflection: User sends message > 10 characters
- reflection → task: User shows emotional engagement (keywords like "feel", "good", "hard") or message > 30 chars
- task → integration: User indicates completion (keywords like "done", "finished", "tried") or message > 50 chars
- integration → Day Complete: Triggers day summary generation, resets to `intro` for next day

**AI Response Constraints:**
- Max 120 words per response
- One intention per message (don't ask multiple questions)
- Conversational Hebrew tone matching mentor's voice
- No bullet points or structured formats

**Database:**
- `participants.currentPhase` stores current phase (default: 'intro')
- Phase resets to 'intro' when day is completed

**Key Files:**
- `server/ai.ts`: getPhaseSpecificPrompt(), generateChatResponse(), detectPhaseTransition()
- `server/routes.ts`: Chat endpoint with phase handling at `/api/participants/:participantId/steps/:stepId/messages`

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

### Internationalization (i18n)

The application supports Hebrew and English languages with RTL layout:

**Library**: react-i18next with i18next

**Configuration**: `client/src/lib/i18n.ts`

**Translation Files Location**: `client/src/locales/`
- `en/` - English translations
- `he/` - Hebrew translations

**Namespaces**:
- `common` - Shared UI elements (buttons, labels, errors)
- `dashboard` - Mentor dashboard and journey management
- `participant` - Participant experience and chat
- `landing` - Landing pages and marketing
- `auth` - Login and registration

**Language Toggle**: Available in navigation header and dashboard sidebar
- Persists choice in localStorage
- Automatically sets `document.dir` to 'rtl' for Hebrew

**RTL Support**: CSS rules in `client/src/index.css` handle:
- Text direction and alignment
- Margin/padding direction swap
- Border and positioning adjustments
- Input text alignment

**Usage in Components**:
```typescript
import { useTranslation } from 'react-i18next';

// Load multiple namespaces
const { t } = useTranslation(['dashboard', 'common']);

// Use with namespace prefix
{t('dashboard:title')}
{t('common:save')}
```