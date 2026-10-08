import { Link, NavLink, useLocation } from "react-router";
import { UserRound } from "lucide-react";
import logo from "../assets/Logo.png";
import useAuth from "../auth/useAuth";

export default function Header() {
  const { user, loading } = useAuth();
  const location = useLocation();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Flying home" className="shrink-0">
          <img src={logo} alt="Flying" className="h-10 w-auto object-contain" />
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-full px-3 py-2 text-sm font-bold transition ${
                isActive ? "bg-rose-50 text-rose-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            Flights
          </NavLink>
          <Link
            to="/booking"
            className="hidden rounded-full px-3 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 sm:inline-flex"
          >
            Booking
          </Link>
          {!loading && (user ? (
            <Link
              to="/profile"
              aria-label="Open profile"
              title="Profile"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-900 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-900"
            >
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : (
            <Link
              to="/auth"
              state={{ backgroundLocation: location }}
              className="rounded-full bg-rose-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-900"
            >
              Sign In
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
