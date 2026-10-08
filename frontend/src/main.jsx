import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FlightBooking from './components/FlightBooking.jsx'
import NotFound from './components/NotFound.jsx'
import SiteLayout from './components/SiteLayout.jsx'
import AuthForm from './components/AuthForm.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import AuthProvider from './auth/AuthProvider.jsx'
import Profile from './components/Profile.jsx'
import PaymentStatus from './components/PaymentStatus.jsx'
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/booking",
        element: (
          <RequireAuth>
            <FlightBooking />
          </RequireAuth>
        ),
      },
      {
        path: "/profile",
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
      {
        path: "/payment/success",
        element: (
          <RequireAuth>
            <PaymentStatus />
          </RequireAuth>
        ),
      },
      {
        path: "/payment/cancelled",
        element: (
          <RequireAuth>
            <PaymentStatus />
          </RequireAuth>
        ),
      },
      {
        path: "/auth",
        element: <AuthForm />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
