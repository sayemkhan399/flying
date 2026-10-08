import { Link } from "react-router";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <h1 className="text-2xl font-black text-gray-900">Page not found</h1>
      <p className="text-sm text-gray-600">The page you requested does not exist.</p>
      <Link to="/" className="rounded-full bg-rose-900 px-5 py-2.5 text-sm font-bold text-white">
        Search flights
      </Link>
    </main>
  );
}
