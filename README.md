# GoBron Admin Panel

Admin panel for GoBron football field booking system.

## Features

- 📊 Dashboard with statistics
- 📅 Booking management
- ⚽ Field management
- 🔔 Push notifications (PWA)
- 📱 Mobile-first responsive design
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Chart.js
- PWA Support

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

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. The project is configured to use production API:
```env
VITE_API_URL=http://103.6.169.242/api
VITE_ENV=development
```

**Note:** This project uses the production API (http://103.6.169.242/api) for all environments. No localhost setup required.

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
├── api/           # API client and endpoints
├── assets/        # Static assets
├── components/    # React components
├── context/       # React context providers
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries
├── pages/         # Page components
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
