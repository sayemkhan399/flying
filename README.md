# <img src="https://raw.githubusercontent.com/sayemkhan399/flying/main/frontend/src/assets/Logo.png" alt="FLYING logo" width="180" />

FLYING is a modern flight booking platform that lets users search for flights, create bookings, and complete secure payments in one streamlined experience.

## Overview

This project combines a React frontend, an Express backend, and MongoDB to deliver a complete travel booking workflow. It integrates with external services such as Duffel for live flight offers and Stripe for secure checkout.

## Features

- Real-time flight search using Duffel API
- User signup and sign-in with JWT-based authentication
- Booking creation with passenger details
- Secure Stripe payment checkout
- MongoDB-backed booking and user management
- Responsive design for desktop and mobile users
- Production-ready Vercel setup

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- Stripe React components

### Backend
- Node.js
- Express.js
- MongoDB
- JWT
- bcryptjs
- Stripe
- Duffel API

## Project Structure

```text
flying/
├── backend/
│   ├── .env.example
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── api/
│   └── [...path].js
├── README.md
├── vercel.json
└── .DS_Store
```

## Local Setup

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file based on `.env.example` and add your credentials.

```bash
npm start
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

The backend runs on:

```text
http://localhost:5001
```

## Environment Variables

### Backend

```env
PORT=5001
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
DUFFEL_ACCESS_TOKEN=your_duffel_token
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## API Highlights

- `POST /api/flights/search` — search flights
- `POST /api/auth/signup` — create an account
- `POST /api/auth/signin` — sign in
- `POST /api/bookings` — create a booking
- `POST /api/bookings/:bookingId/checkout` — start Stripe checkout
- `GET /api/payments/checkout-session/:sessionId` — verify payment status
- `POST /api/payments/webhook` — handle Stripe webhook events

## Deployment

This repository is configured for deployment on Vercel. The root `vercel.json` file serves the frontend build and forwards API requests to the backend.

For production deployment, add the required environment variables in the Vercel dashboard and configure the Stripe webhook endpoint at:

```text
https://your-app.vercel.app/api/payments/webhook
```

## License

This project is open for learning and personal development use.

## Author

Sayem Khan

GitHub: https://github.com/sayemkhan399
