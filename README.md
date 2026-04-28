# GoBron Admin Panel

Admin panel for GoBron football field booking system with real-time API integration.

## Features

- 📊 Real-time dashboard with statistics
- 📅 Complete booking management (view, confirm, reject, cancel)
- ➕ Manual booking creation
- ⚽ Field management with images and amenities
- 🔔 Push notifications (PWA)
- 📱 Mobile-first responsive design
- 🎨 Modern UI with Tailwind CSS
- 🔐 JWT authentication with auto-refresh
- 📤 CSV export for bookings

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Chart.js
- PWA Support
- REST API Integration

## API Integration

This application is fully integrated with the GoBron backend API:

### Endpoints Used:
- **Auth**: `/auth/login/`, `/auth/register/`, `/auth/token/refresh/`, `/auth/logout/`, `/auth/me/`
- **Dashboard**: `/admin/dashboard/stats/`
- **Bookings**: `/admin/bookings/`, `/admin/bookings/{id}/`, `/admin/bookings/{id}/confirm/`, `/admin/bookings/{id}/reject/`, `/admin/bookings/{id}/cancel/`, `/admin/bookings/manual/`, `/admin/bookings/export/`
- **Fields**: `/admin/fields/`, `/admin/fields/{id}/`, `/admin/fields/{id}/images/`, `/admin/fields/{id}/amenities/`, `/admin/fields/{id}/slots/`
- **Notifications**: `/admin/notifications/`, `/admin/notifications/mark-all-read/`

### Authentication
- JWT token-based authentication
- Automatic token refresh on 401 errors
- Secure token storage in localStorage

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd football-admin
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure API URL in `.env`:
```env
VITE_API_URL=https://gobronapi.webportfolio.uz/api
VITE_ENV=development
```

5. Start development server:
```bash
npm run dev
```

6. Build for production:
```bash
npm run build
```

## Environment Variables

- `VITE_API_URL` - Backend API base URL (required)
- `VITE_ENV` - Environment (development/production)

## Project Structure

```
src/
├── api/
│   ├── index.ts        # API client with all endpoints
│   └── mockData.ts     # Mock data (deprecated, not used)
├── components/
│   ├── bookings/       # Booking-related components
│   ├── fields/         # Field management components
│   ├── settings/       # Settings components
│   └── shared/         # Reusable UI components
├── context/            # React context providers (Auth, Toast, Notifications)
├── pages/              # Main page components
├── types/              # TypeScript interfaces
└── utils/              # Helper functions
```

## Key Features

### Booking Management
- View all bookings with filters (status, date range, field, search)
- Detailed booking view with client info
- Confirm/reject/cancel bookings
- Manual booking creation with slot selection
- Export bookings to CSV

### Dashboard
- Today's bookings count with trend
- Monthly revenue statistics
- Booking status breakdown
- 14-day booking chart
- Recent bookings list

### Field Management
- Create/edit/delete fields
- Upload and manage field images
- Add amenities
- Set pricing and working hours
- View available slots

## Deployment

### Vercel Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables:
   - `VITE_API_URL=https://gobronapi.webportfolio.uz/api`
   - `VITE_ENV=production`
4. Deploy!

The `vercel.json` configuration ensures:
- SPA routing works correctly (no 404 on page refresh)
- Proper caching for static assets
- Security headers

### Manual Deployment

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy dist folder to your hosting
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
