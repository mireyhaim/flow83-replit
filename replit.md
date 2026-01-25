# Flow 83 - Business Operating System

## Overview

Flow 83 is a lightweight business operating system designed for mentors, therapists, and method creators. It enables them to transform existing knowledge into 7-day digital transformational journeys, delivered as personalized, daily, AI-powered experiences. The platform's core purpose is to help practitioners scale their offerings beyond 1:1 work.

Key capabilities include end-to-end journey creation and delivery, a human-centric participant experience, automated selling and delivery of transformations, and providing mentors with flexibility for experimentation and editing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: React Query for server state, custom Zustand-like store for local state
- **UI Components**: shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS with custom CSS variables
- **Build Tool**: Vite
- **Design Pattern**: Page-based architecture with shared components.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON API (`/api/` prefix)
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Design Pattern**: Storage interface (`IStorage`) with `DatabaseStorage` implementation for flexibility.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod for schema validation
- **Schema**: Defined in `shared/schema.ts`
- **Security**: Row Level Security (RLS) enabled on all tables for defense-in-depth, restricting data access at the database level. RLS policies grant full access when `app.role='service'` for API operations and restrict direct database access.

### Core Data Models
- `users`: User accounts.
- `journeys`: Multi-day transformational journeys.
- `journeySteps`: Individual steps within a journey.
- `journeyBlocks`: Content blocks within steps.
- `participants`: Users enrolled in journeys.
- `sessions`: Authentication session storage.
- `externalPaymentSessions`: Token-based payment tracking.

### Payment System
Flow 83 supports a dual payment structure:
1.  **Platform Subscriptions**: Mentors pay Flow 83 fees via LemonSqueezy, managed by a webhook at `/api/webhooks/lemonsqueezy`.
2.  **Participant Payments**: Participants pay mentors directly using the mentor's configured external payment links (e.g., PayPal, Stripe Payment Links). The system tracks payment sessions with unique tokens and verifies identity before granting journey access.

### Admin Dashboard
An internal admin dashboard (`/admin`) for platform monitoring.
- **Access Control**: Limited to users with `role = 'super_admin'`.
- **Features**: KPIs, user management, mentor oversight, journey analytics, and system error logging.

### Journey Creation Wizard
A conversational wizard for creating journeys.
- **Design**: Split-screen layout with a vertical timeline and centered question area, featuring a gradient mesh background and glassmorphism panels.
- **Steps**: Guides mentors through language, duration, name, target audience, goal, tone, and content upload.
- **Features**: Clickable timeline for editing, live preview, progress bar during AI generation, and mobile responsiveness.

### Two-Phase Participant Onboarding
Participant onboarding personalizes the chat experience in two phases:
-   **Phase A (Pre-Chat UI Configuration)**: Participants configure `addressing_style` and `tone_preference` via UI.
-   **Phase B (Intent Anchoring)**: The bot asks an open-ended question to capture the `userIntentAnchor` for journey context.
-   **Style Adaptation**: Preferences influence Hebrew grammar and conversational tone.
-   **Bot Conversation Guidelines**: The bot speaks as the mentor, limits message length, asks one question at a time, reflects user input, and provides short, focused, actionable instructions.

### Progressive Web App (PWA) Features
The participant experience supports PWA installation:
-   **Dynamic Manifest**: `/api/manifest/:journeyId` endpoint generates journey-specific PWA manifests with journey name and icon.
-   **Add to Home Screen**: Mobile users see a prompt to add the journey to their home screen after 2 seconds.
-   **iOS/Android Instructions**: Platform-specific installation guides in Hebrew.
-   **Access Token Integration**: For external participants, the manifest includes their access token in `start_url` for correct PWA launch.
-   **One-Time Popup**: Dismissal is saved to localStorage per journey (`a2hs_dismissed_{journeyId}`).

### Conversation Director System
A Conversation Director controls the chat experience, where deterministic logic manages conversation flow, and AI only phrases responses.
-   **Pipeline**: Director analyzes messages, selects actions; PromptBuilder creates action-specific prompts; AI phrases responses; Sanitizer filters artificial phrases.
-   **Phases**: `intro`, `reflection`, `task`, `integration`.
-   **Actions**: `reflect`, `ask_question`, `validate`, `micro_task`, `give_task`, `silence`, `close_day`.
-   **Mentor Profiles**: Base action weights and tone modifiers shape the conversation style.
-   **Blacklist System**: Filters artificial therapeutic phrases.
-   **State Persistence**: `currentPhase`, `messageCountInPhase`, `questionsAskedInPhase` track conversation progress.

### Key Architectural Decisions
-   **Shared Schema Pattern**: Database schema and types are defined once in `shared/schema.ts` for type safety across the stack.
-   **Full-Stack TypeScript**: Consistent use of TypeScript for type safety.
-   **Monorepo Structure**: Single repository (`client/`, `server/`, `shared/`) for tight integration.
-   **API Client Pattern**: Frontend uses a typed API client for robust communication.

## External Dependencies

### Database
-   **PostgreSQL**: Primary data store.

### Authentication
-   **Replit Auth**: OpenID Connect-based authentication.

### UI Libraries
-   **Radix UI**: Headless component primitives.
-   **Lucide React**: Icon library.
-   **Framer Motion**: Animation library.

### Development Tools
-   **Vite**: Development server and build tool.
-   **Drizzle Kit**: Database migration and schema management.
-   **esbuild**: Server-side bundling.

### AI Integrations
-   **Conversation Management**: Google Gemini 2.5 Flash via Replit AI Integrations for participant chat experience.
-   **Journey Generation**: OpenAI GPT for journey content creation and wizard assistance.
-   **Image Generation**: Gemini 2.5 Flash Image model for visual content.

### Internationalization (i18n)
-   **Library**: react-i18next with i18next for Hebrew and English support, including RTL layout.
-   **Translation Files**: Located in `client/src/locales/` with namespaces for different application areas.