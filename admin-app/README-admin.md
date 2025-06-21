# GreenSentinel Admin Dashboard

Admin dashboard for the GreenSentinel incident management system, built with Next.js 14, TypeScript, and Chakra UI.

## Features

- **Authentication**: JWT-based authentication system
- **Incident Management**: View, sort, and filter reported incidents with interactive map
- **Statistics**: KPI charts for incidents and response times
- **User Management**: User administration with CRUD operations
- **Real-time Updates**: WebSocket integration for live incident updates

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Chakra UI
- **Data Fetching**: SWR for client-side data fetching with revalidation
- **Charts**: Recharts for statistical visualization
- **Mapping**: React-Leaflet for incident location mapping
- **Testing**: Vitest and React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Environment Setup

Create a `.env.local` file based on `.env.example`:

```
NEXT_PUBLIC_API_BASE=https://api.greensentinel.dev
NEXT_PUBLIC_WS_BASE=ws://api.greensentinel.dev/ws/incidents
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm run start
```

### Testing

```bash
npm run test
```

## Project Structure

- `/app`: Next.js application routes
  - `/login`: Authentication page
  - `/dashboard`: Protected admin pages
    - `/incidents`: Incident management
    - `/stats`: Statistics and KPIs
    - `/users`: User management
- `/components`: Reusable UI components
- `/lib`: Utilities and API functions
- `/public`: Static assets

## Authentication

The dashboard uses JWT authentication via cookies. Login credentials are sent to `/login` endpoint and the token is stored in a cookie named `gs_admin_token`.
