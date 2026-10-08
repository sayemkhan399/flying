import { Navigate, useLocation } from "react-router";
import useAuth from "../auth/useAuth";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center" role="status">
        <span className="text-sm font-semibold text-gray-600">Checking your sign-in...</span>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{
          from: location.pathname,
          bookingState: location.state,
          backgroundLocation: location,
        }}
      />
    );
  }

  return children;
}
