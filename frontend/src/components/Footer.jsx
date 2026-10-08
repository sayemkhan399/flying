import { ArrowRight, Plane } from "lucide-react";
import { Link } from "react-router";
import logo from "../assets/Logo.png";

const footerLinkClass = "text-sm text-gray-500 transition hover:text-rose-900";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <section>
          <Link to="/" aria-label="Flying home" className="inline-flex">
            <img src={logo} alt="Flying" className="h-10 w-auto object-contain" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
            Find your next journey. Compare live flight offers and plan your trip with Flying.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900">
            <Plane className="h-4 w-4" />
            Your next trip starts here
          </div>
        </section>

        <section>
          <h2 className="text-sm font-extrabold text-gray-900">Explore</h2>
          <ul className="mt-4 space-y-3">
            <li><Link className={footerLinkClass} to="/">Search flights</Link></li>
            <li><Link className={footerLinkClass} to="/booking">Your booking</Link></li>
            <li><Link className={footerLinkClass} to="/auth">Sign in to your account</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-extrabold text-gray-900">Popular destinations</h2>
          <ul className="mt-4 space-y-3">
            <li><span className={footerLinkClass}>Dhaka to Cox&apos;s Bazar</span></li>
            <li><span className={footerLinkClass}>Dhaka to Kuala Lumpur</span></li>
            <li><span className={footerLinkClass}>Dhaka to Bangkok</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-extrabold text-gray-900">Need help?</h2>
          <p className="mt-4 text-sm leading-6 text-gray-500">
            Review the airline and fare conditions shown with an offer before selecting a flight. Prices and availability can change.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-rose-900 hover:text-rose-700"
          >
            Browse flights <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>

      <div className="border-t border-gray-100">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p className="text-xs font-medium text-gray-500">
            © {new Date().getFullYear()} Flying. All rights reserved.
          </p>
          <p className="max-w-2xl text-xs leading-5 text-gray-400">
            Flight prices and availability are provided by airlines and may change before booking.
          </p>
        </div>
      </div>
    </footer>
  );
}
