import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CalendarDays, Plane, UserRound } from "lucide-react";
import api from "../api";
import useAuth from "../auth/useAuth";

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function formatPrice(price, currency) {
  if (!Number.isFinite(price) || !/^[A-Z]{3}$/.test(currency ?? "")) {
    return "Price unavailable";
  }
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(price);
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/api/bookings")
      .then(({ data }) => {
        if (!Array.isArray(data.bookings)) {
          throw new Error("The booking service returned an invalid response.");
        }
        if (active) setBookings(data.bookings);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.error ||
            "Could not load your booking history. Please try again.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSignOut = async () => {
    setSignOutError("");
    try {
      await signOut();
    } catch (requestError) {
      setSignOutError(
        requestError.response?.data?.error ||
        "Could not sign out. Please try again.",
      );
    }
  };

  return (
    <main className="min-h-[70vh] bg-[#f4f6f9] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="flex flex-col justify-between gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-900">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{user?.name || "Your profile"}</h1>
              <p className="mt-1 text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="self-start rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-900 sm:self-auto"
          >
            Sign out
          </button>
          {signOutError && (
            <p role="alert" className="text-sm font-semibold text-red-700 sm:basis-full">
              {signOutError}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">Booking history</h2>
            <p className="mt-1 text-sm text-gray-600">
              Your saved flight booking requests, newest first.
            </p>
          </div>

          {loading ? (
            <p className="rounded-2xl border border-gray-100 bg-white p-6 text-sm font-semibold text-gray-600" role="status">
              Loading your booking history...
            </p>
          ) : error ? (
            <p className="rounded-2xl border border-red-200 bg-white p-6 text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
              <Plane className="mx-auto h-8 w-8 text-rose-800" />
              <h3 className="mt-3 font-extrabold text-gray-900">No bookings yet</h3>
              <p className="mt-1 text-sm text-gray-600">Your saved booking requests will appear here.</p>
              <Link
                to="/"
                className="mt-4 inline-flex rounded-full bg-rose-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-950"
              >
                Search flights
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {bookings.map((booking) => (
                <li key={booking.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <p className="flex items-center gap-2 text-lg font-black text-gray-900">
                        <Plane className="h-4 w-4 text-rose-800" />
                        {booking.flight?.route || "Flight route unavailable"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-700">
                        {booking.flight?.airline || "Airline unavailable"}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                      {booking.status === "request_saved" ? "Request saved" : booking.status}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 text-sm sm:grid-cols-3">
                    <p className="flex items-center gap-2 text-gray-600">
                      <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
                      Travel: {formatDate(booking.search?.departureDate)}
                    </p>
                    <p className="text-gray-600">
                      Passenger: {[booking.passenger?.firstName, booking.passenger?.lastName]
                        .filter(Boolean)
                        .join(" ") || "Not available"}
                    </p>
                    <p className="font-bold text-gray-900">
                      {formatPrice(booking.flight?.price, booking.flight?.currency)}
                    </p>
                    <p className="font-semibold text-gray-600">
                      Payment: <span className={booking.paymentStatus === "paid" ? "font-extrabold text-emerald-700" : "font-extrabold text-amber-700"}>
                        {booking.paymentStatus === "paid" ? "Paid" : "Pending"}
                      </span>
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Saved {formatDate(booking.createdAt)}. Payment does not mean this flight has been ticketed or confirmed.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
