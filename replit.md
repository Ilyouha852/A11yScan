# Accessibility Checker Application

## Overview
This is a fullstack web application for checking website accessibility compliance with WCAG AA standards and HTML validation. The application analyzes websites using Puppeteer and Axe-core to identify accessibility violations and provides detailed reports.

## Tech Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: SQLite with Drizzle ORM
- **Testing**: Puppeteer for automated browser testing, Axe-core for accessibility testing
- **Routing**: Wouter (client-side)

## Project Structure
- `client/` - React frontend application
  - `src/pages/` - Application pages (home, history, not-found)
  - `src/components/` - Reusable UI components (shadcn/ui)
  - `src/lib/` - Utility functions and client configuration
- `server/` - Express backend
  - `index.ts` - Main server entry point
  - `routes.ts` - API route handlers
  - `db.ts` - Database connection and configuration
  - `storage.ts` - Storage interface and implementation
  - `accessibility-analyzer.ts` - Core accessibility checking logic
  - `html-validator.ts` - HTML validation functionality
- `shared/` - Shared types and schemas (used by both frontend and backend)
- `migrations/` - Database migration files
- `database.sqlite` - SQLite database file

## Key Features
1. **Accessibility Analysis**: Automated WCAG 2.1 compliance checking using Axe-core
2. **WCAG Conformance Levels**: Calculates and displays overall conformance level (A, AA, AAA, or fail) based on violation analysis
3. **HTML Validation**: Validates HTML markup for standards compliance
4. **Extended Checks**: Additional accessibility checks including:
   - Viewport configuration
   - Autoplay media detection
   - Tab order analysis
   - Focus visibility
   - Timing functions
   - HTML lang attribute (WCAG 3.1.1)
   - Media captions and transcripts (WCAG 1.2.1, 1.2.2)
   - iframe title attributes (WCAG 4.1.2)
   - Empty links detection (WCAG 2.4.4)
   - Placeholder-only form labels (WCAG 3.3.2)
   - Table headers (WCAG 1.3.1)
   - Redundant ARIA usage
5. **Results History**: Stores and displays previous accessibility checks with conformance levels
6. **Dark Mode**: Full theme support with light/dark mode toggle
7. **Internationalization**: Russian language interface

## Database Configuration
The application uses SQLite for data persistence. The database is configured to:
- Store in `database.sqlite` at the project root
- Ignore PostgreSQL DATABASE_URL environment variables (intentionally uses SQLite)
- Auto-create tables on first run via migrations

## Development
- **Port**: Application runs on port 5000 (both frontend and backend)
- **Hot Reload**: Vite HMR enabled for frontend development
- **Database**: SQLite with automatic migrations on startup

## Deployment
The application is configured for Replit's autoscale deployment:
- **Build**: `npm run build` - Builds both frontend and backend
- **Start**: `npm start` - Runs production server
- **Target**: Autoscale (stateless deployment suitable for web apps)

## Recent Changes (November 15, 2025)
### Initial Setup
- Imported from GitHub repository
- Fixed database path resolution to use `process.cwd()` instead of relative paths
- Configured to ignore PostgreSQL DATABASE_URL and use SQLite
- Set up Replit workflow and deployment configuration
- Added `fileMustExist: false` option to better-sqlite3 for automatic database creation

### WCAG 2.1 Enhanced Coverage
- Added 7 new extended accessibility checks:
  - HTML lang attribute validation (WCAG 3.1.1)
  - Media captions and transcripts detection (WCAG 1.2.1, 1.2.2)
  - iframe title attribute verification (WCAG 4.1.2)
  - Empty links detection (WCAG 2.4.4)
  - Placeholder-only form labels detection (WCAG 3.3.2)
  - Table headers validation (WCAG 1.3.1)
  - Redundant ARIA usage detection
- Implemented WCAG conformance level calculation (A, AA, AAA, fail)
  - Uses violation WCAG tags (wcag2a/wcag21a, wcag2aa/wcag21aa, wcag2aaa/wcag21aaa)
  - Correctly determines overall conformance based on highest level violated
- Added `wcag_level` field to database schema with migration
- Created prominent WCAG level badge display on frontend results page
  - Color-coded badges (green=AAA, blue=AA, yellow=A, red=fail)
  - Descriptive text explaining conformance level
  - Large visual indicator for quick assessment

## Notes
- The application uses in-memory caching for performance
- Puppeteer runs headless browser instances for website analysis
- All accessibility checks are logged and stored in the database for historical analysis
