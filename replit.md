# FitTrack Pro

## Overview

FitTrack Pro is a full-stack fitness tracking application that allows users to monitor workouts, set goals, and track daily activities. The application uses a modern web stack with React on the frontend, Express on the backend, and PostgreSQL for data persistence. Users can log exercises with detailed metrics (sets, reps, weight), track daily activity statistics (steps, calories, distance), and set customizable fitness goals with progress tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript running on Vite for development and production builds.

**UI Component Library**: The application uses shadcn/ui components built on top of Radix UI primitives. Components follow the "new-york" style variant with a neutral color scheme and CSS variables for theming. The design system uses Tailwind CSS with a custom color palette centered around orange (#FF6B35) as primary and deep blue (#004E89) as secondary colors.

**State Management**: TanStack Query (React Query) handles server state management with configured defaults including disabled refetching on window focus and infinite stale time. The query client uses a custom fetch wrapper that handles authentication and error states.

**Routing**: The application uses Wouter for client-side routing, implementing a protected route pattern where authenticated routes are wrapped in a Layout component while the auth page stands alone.

**Form Handling**: React Hook Form with Zod validation through @hookform/resolvers provides type-safe form management. The integration between Drizzle schema and Zod validation ensures consistent validation between frontend and backend.

**Design Decisions**:
- Chose Vite over Create React App for faster development server and optimized production builds
- Selected Wouter over React Router for its minimal bundle size (~1KB)
- Implemented TanStack Query to eliminate manual state synchronization and provide automatic background refetching capabilities
- Used shadcn/ui for consistency and customizability while maintaining full component ownership

### Backend Architecture

**Framework**: Express.js server with TypeScript, using ESM modules throughout the codebase.

**Authentication**: Passport.js with local strategy handles user authentication. Express-session manages session persistence with configurable storage (defaults to in-memory but supports connect-pg-simple for PostgreSQL-backed sessions). Sessions use HTTP-only cookies with a 7-day expiration.

**API Structure**: RESTful endpoints organized by resource:
- `/api/auth/*` - Authentication endpoints (login, register, logout, session check)
- `/api/workouts/*` - Workout CRUD operations
- `/api/goals/*` - Goal management
- `/api/activities/*` - Daily activity tracking

**Request Logging**: Custom middleware logs all API requests with timestamp, method, path, status code, and duration. JSON responses are captured for debugging without disrupting the response flow.

**Static File Serving**: In production, Express serves pre-built Vite assets from the `dist/public` directory with fallback to index.html for client-side routing support.

**Development Setup**: In development, the server integrates Vite's middleware for hot module replacement. The dev server runs on one process while Vite handles the client build and HMR through a separate middleware stack.

**Build Process**: Custom build script uses esbuild to bundle the server with selective dependency bundling. Common dependencies are externalized while performance-critical packages (database drivers, ORM) are bundled to reduce filesystem syscalls during cold starts.

**Design Decisions**:
- Chose Passport.js for authentication due to its extensive strategy ecosystem and community support
- Implemented session-based auth over JWT to simplify security concerns and enable server-side session invalidation
- Used custom build script instead of ts-node in production to improve cold start performance
- Integrated Vite middleware in development to maintain single-process development experience

### Data Storage

**ORM**: Drizzle ORM provides type-safe database access with zero-cost abstractions. The schema is defined in TypeScript and generates both runtime types and Zod validation schemas.

**Database Schema**:

*Users Table*: Stores authentication credentials and user profile information (id, email, password, name, createdAt). Passwords are stored as plain text (should be hashed in production).

*Workouts Table*: Represents individual workout sessions (id, userId, name, date, createdAt) with foreign key reference to users.

*Exercises Table*: Stores individual exercises within workouts (id, workoutId, name, sets, reps, weight) with cascade delete on workout removal.

*Goals Table*: Tracks user-defined fitness goals (id, userId, title, current, target, unit, inverse, iconName, color, createdAt). The inverse flag allows goals where lower is better (e.g., body fat percentage).

*Activities Table*: Daily activity metrics (id, userId, date, steps, calories, distance, activeTime) with unique constraint on userId + date combination.

**Database Connection**: Uses @neondatabase/serverless with WebSocket support for serverless-compatible PostgreSQL connections. Connection pooling is handled through the Neon driver's built-in pool.

**Migrations**: Drizzle Kit manages schema migrations with configuration pointing to PostgreSQL dialect. Migration files are generated in the `/migrations` directory.

**Design Decisions**:
- Selected Drizzle over Prisma for better TypeScript integration and lighter runtime footprint
- Chose Neon as the PostgreSQL provider for serverless compatibility and built-in connection pooling
- Implemented cascade deletes on exercises to maintain referential integrity automatically
- Used date type instead of timestamp for activity tracking to simplify daily aggregation queries

### External Dependencies

**Database**: PostgreSQL through Neon (@neondatabase/serverless) for serverless-compatible database access with WebSocket support.

**Session Storage**: Uses connect-pg-simple for PostgreSQL-backed session storage in production environments, with fallback to in-memory storage during development.

**UI Libraries**: 
- Radix UI primitives for accessible component foundations
- Recharts for data visualization and activity charts
- Lucide React for icon system
- date-fns for date manipulation and formatting

**Development Tools**:
- Replit-specific plugins (@replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner) for enhanced development experience
- Custom meta-images plugin updates OpenGraph meta tags with deployment URL

**Build Dependencies**:
- esbuild for server bundling
- Vite for client bundling
- TypeScript for type checking (noEmit mode)

**Font Resources**: Google Fonts integration for Inter and Roboto font families.

**Design Decisions**:
- Selected Neon over traditional PostgreSQL hosting for zero-configuration serverless deployment
- Chose Recharts over Chart.js for better React integration and TypeScript support
- Used Lucide icons over Font Awesome for tree-shakeable SVG icons
- Implemented custom Vite plugin for OpenGraph images to handle dynamic Replit deployment URLs