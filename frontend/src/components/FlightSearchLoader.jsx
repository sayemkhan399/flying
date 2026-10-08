import { useId } from "react";
import { MapPin } from "lucide-react";

export default function FlightSearchLoader({ origin, destination }) {
  const animationId = useId().replaceAll(":", "");

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label={`Searching for flights from ${origin} to ${destination}`}
      className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm"
    >
      <div className="bg-linear-to-br from-rose-950 via-rose-900 to-rose-800 px-6 py-6 text-white sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-rose-200">
              Flight search in progress
            </p>
            <h2 className="mt-1 text-lg font-black sm:text-xl">
              Finding your next flight
            </h2>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300" />
          </div>
        </div>

        <div className="relative mt-7 h-36 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] sm:h-40">
          <div aria-hidden="true" className="absolute inset-0 opacity-20">
            <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-white/50" />
            <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-white/50" />
            <div className="absolute inset-y-0 left-1/4 border-l border-dashed border-white/50" />
            <div className="absolute inset-y-0 left-2/4 border-l border-dashed border-white/50" />
            <div className="absolute inset-y-0 left-3/4 border-l border-dashed border-white/50" />
          </div>

          <svg
            aria-hidden="true"
            viewBox="0 0 400 140"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id={`route-${animationId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fda4af" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <path
              d="M 34 98 Q 200 14 366 98"
              fill="none"
              stroke={`url(#route-${animationId})`}
              strokeDasharray="5 7"
              strokeLinecap="round"
              strokeWidth="2"
              opacity="0.8"
            />
            <circle cx="34" cy="98" r="5" fill="#fff" />
            <circle cx="366" cy="98" r="5" fill="#fff" />
            <text
              fontSize="23"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white"
            >
              ✈
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                rotate="auto"
                path="M 34 98 Q 200 14 366 98"
              />
            </text>
          </svg>

          <div className="absolute inset-x-4 bottom-3 flex items-end justify-between sm:inset-x-6">
            <div className="max-w-[42%]">
              <MapPin aria-hidden="true" className="mb-1 h-4 w-4 text-rose-200" />
              <span className="block truncate text-xs font-black tracking-widest text-white sm:text-sm">
                {origin || "FROM"}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-rose-200">Origin</span>
            </div>
            <div className="max-w-[42%] text-right">
              <MapPin aria-hidden="true" className="mb-1 ml-auto h-4 w-4 text-rose-200" />
              <span className="block truncate text-xs font-black tracking-widest text-white sm:text-sm">
                {destination || "TO"}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-rose-200">Destination</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs font-medium text-rose-100">
          Comparing available fares. This may take a few moments.
        </p>
      </div>
    </section>
  );
}
