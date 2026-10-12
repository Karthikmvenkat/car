# CAR — Premium Automotive Platform

A full-stack premium automotive marketplace built with Next.js 14, NestJS, PostgreSQL, and Prisma.

## Tech Stack

**Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + GSAP animations
**Backend:** NestJS 10 + TypeScript + Swagger/OpenAPI
**Database:** PostgreSQL + Prisma ORM
**Auth:** JWT with Passport.js

## Project Structure

```
car/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── api/          # NestJS backend (port 4000)
├── prisma/
│   ├── schema.prisma # Database schema
│   └── seed.ts       # Demo data seeder
├── .env              # Environment variables
└── package.json      # Monorepo root (npm workspaces)
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Create database and run migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start frontend (http://localhost:3000)
npm run dev

# Start backend (http://localhost:4000) — in another terminal
npm run dev:api
```

### Demo Credentials

| Role     | Email                  | Password   |
|----------|------------------------|------------|
| Admin    | admin@trycar.com    | admin123   |
| Customer | demo@trycar.com     | customer123|

## Frontend Routes

### Customer-Facing
- `/` — Homepage with GSAP cinematic animations
- `/vehicles` — Browse/search vehicles with filters
- `/vehicles/[slug]` — Vehicle detail page with gallery
- `/how-it-works` — 4-step buying process
- `/about` — About CAR
- `/stories` — Customer stories
- `/contact` — Contact form
- `/enquire?vehicle=...` — Vehicle enquiry form
- `/test-drive?vehicle=...` — Test drive booking
- `/signin` / `/register` / `/forgot-password`
- `/get-started` — Onboarding guide
- `/privacy` / `/terms` / `/faq`

### Admin Dashboard (`/admin`)
- `/admin` — Dashboard overview with metrics
- `/admin/vehicles` — Vehicle inventory management
- `/admin/vehicles/new` — Add new vehicle
- `/admin/enquiries` — Enquiry/lead management
- `/admin/bookings` — Test drive bookings
- `/admin/customers` — Customer list
- `/admin/brands` — Brand & model management
- `/admin/content` — Homepage content editor
- `/admin/testimonials` — Testimonial management
- `/admin/faqs` — FAQ management
- `/admin/users` — User roles & permissions
- `/admin/settings` — Site settings
- `/admin/login` — Admin authentication

## Backend API

The API runs on `http://localhost:4000` with the `/api` prefix.

**Swagger docs:** http://localhost:4000/api/docs

### Endpoints

| Module     | Public Routes                    | Protected Routes (JWT)           |
|------------|----------------------------------|----------------------------------|
| Auth       | POST /auth/register, /auth/login | GET /auth/me                     |
| Vehicles   | GET /vehicles, /vehicles/featured, /vehicles/:slug | POST, PUT, DELETE (admin) |
| Enquiries  | POST /enquiries                  | GET /enquiries, /enquiries/:id   |
| Bookings   | POST /bookings                   | GET /bookings, /bookings/:id     |
| Users      | —                                | GET /users, /users/:id           |
| Brands     | GET /brands, /brands/:id         | POST, PUT, DELETE (admin)        |
| Content    | GET /content/testimonials, /content/faqs, /content/pages/:key | POST/PUT/DELETE (admin) |
| Health     | GET /health                      | —                                |

## Database Schema

20+ models including: User, Brand, Model, Vehicle, VehicleImage, VehicleFeature, Location, Favorite, Enquiry, TestDriveBooking, Testimonial, FAQ, PageContent, SeoMetadata, AuditLog, Notification.

## Development Commands

```bash
npm run dev          # Start frontend dev server
npm run dev:api      # Start backend dev server
npm run build        # Build frontend
npm run build:api    # Build backend
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes (dev)
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

## Design

The design follows a "premium, quiet, professional" aesthetic with:
- Warm ivory background (#F7F7F2)
- Deep charcoal text (#171A18)
- Muted sage accent (#7D8A78)
- Clean typography (Inter font family)
- Cinematic GSAP scroll animations
- Responsive mobile-first layout

---

*This is a demo project with sample data. Not connected to real inventory.*
