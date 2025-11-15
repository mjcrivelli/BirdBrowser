# Aves da Cachoeira da Toca - Bird Watching Application

## Overview

This is a bilingual (Portuguese) web application for bird watching at Cachoeira da Toca. Users can browse a catalog of local birds, mark birds they've spotted, view detailed information about each species, and generate PDF reports of their sightings. The application also includes an interactive memory matching game featuring bird images.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing:**
- Built with React 18+ and TypeScript
- Client-side routing using Wouter (lightweight alternative to React Router)
- Vite as the build tool and development server

**UI Components:**
- Radix UI component library for accessible, unstyled primitives
- Tailwind CSS for styling with custom design tokens
- shadcn/ui component patterns
- Custom theme configuration via `theme.json` (professional variant with green primary color)

**State Management:**
- TanStack Query (React Query) for server state management
- Local React state for UI interactions
- Custom hooks (`useBirds`, `useBirdSightings`) abstract data fetching logic

**Key Pages:**
1. **BirdGrid** (`/`) - Main bird catalog with filtering (all/seen/unseen birds)
2. **Memoria** (`/memoria`) - Memory matching game using bird images
3. **Not Found** - 404 error page

**Accessibility Features:**
- ARIA labels and live regions throughout
- Keyboard navigation support
- Screen reader announcements for dynamic content
- Skip links and focus management
- Portuguese language semantic HTML

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- ESM modules (not CommonJS)
- Session management using `connect-pg-simple`

**API Design:**
- RESTful endpoints under `/api` prefix
- CORS enabled for cross-origin requests
- JSON request/response format
- Endpoints:
  - `GET /api/birds` - List all birds (with optional `?userId=` for seen status)
  - `GET /api/birds/:id` - Get single bird details
  - `POST /api/birds/:id/seen` - Mark bird as seen
  - `DELETE /api/birds/:id/seen` - Unmark bird as seen

**Data Flow:**
- Bird data seeded from `bird_data.json` on startup
- In-memory storage implementation (`MemStorage`) used as default
- Designed to support database migration (schema defined but not actively used)

### Database Schema

**ORM & Migrations:**
- Drizzle ORM configured for PostgreSQL
- Schema defined in `shared/schema.ts`
- Migration configuration in `drizzle.config.ts`
- Uses Neon serverless Postgres driver

**Tables:**
1. **birds** - Core bird information (name, scientific name, description, habitat, diet, images, Wikipedia links)
2. **users** - User accounts (username, password)
3. **bird_sightings** - Junction table tracking which users have seen which birds

**Type Safety:**
- Zod schemas for validation (`insertBirdSchema`, `insertUserSchema`, `insertBirdSightingSchema`)
- TypeScript types derived from Drizzle schema
- Shared types between client and server via `@shared` path alias

**Current State:**
- Database schema is defined but application currently uses in-memory storage
- Bird data loaded from JSON file on server startup
- Future migration path to PostgreSQL is prepared

### External Dependencies

**Third-Party Services:**
- **Wikipedia/Wikimedia Commons** - Bird images and reference links sourced from Wikipedia articles
- **WikiAves** - Alternative bird image source (Brazilian bird database)

**Image Handling:**
- Protocol-relative URLs (`//upload.wikimedia.org/...`) converted to HTTPS
- Lazy loading with blur-up effect using `react-lazy-load-image-component`
- Fallback image handling for broken URLs
- Python scripts for scraping and fixing image URLs from external sources

**PDF Generation:**
- jsPDF library for PDF creation
- html2canvas for rendering DOM content to PDF
- Generates personalized bird sighting reports

**Data Sources:**
- Excel file (`attached_assets/aves_Toca_v2 (1).xlsx`) as original bird data source
- Python scripts for data extraction and transformation to JSON format

**Development Tools:**
- Replit-specific plugins for cartographer and runtime error overlay
- VS Code launch configuration for Chrome debugging
- PostCSS with Tailwind and Autoprefixer

**UI Libraries:**
- Lucide React for icons
- date-fns for date formatting
- class-variance-authority (CVA) for component variants
- clsx and tailwind-merge for className utilities

**Font Configuration:**
- Google Fonts: Montserrat (headings), Open Sans (body text)
- Configured in Tailwind and loaded globally