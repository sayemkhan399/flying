# FLYING

## Deploy to Vercel

Import the repository into Vercel and keep the project root set to the repository
root. The root `vercel.json` installs both applications, builds the Vite frontend,
serves the `frontend/dist` output, and sends `/api/*` requests to the Express
serverless function.

Add these environment variables in the Vercel project settings for Production
(and Preview if those deployments need the integrations):

| Variable | Purpose |
| --- | --- |
| `MONGO_URL` | MongoDB connection string |
| `JWT_SECRET` | Random secret of at least 32 bytes |
| `DUFFEL_ACCESS_TOKEN` | Duffel API access token for flight search |
| `STRIPE_SECRET_KEY` | Stripe secret key for checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `FRONTEND_ORIGIN` | Deployed frontend origin, such as `https://your-app.vercel.app` |

`PORT` is not needed on Vercel. `VITE_API_URL` is also not needed when the API
and frontend are deployed under the same domain; the frontend uses relative
`/api` requests by default.

After deploying, configure the Stripe webhook endpoint as
`https://your-app.vercel.app/api/payments/webhook` and subscribe to
`checkout.session.completed` and `checkout.session.expired`.

For local development, run the backend and frontend separately using the scripts
in `backend/package.json` and `frontend/package.json`. The frontend Vite server
proxies `/api` requests to `http://localhost:5001`.
