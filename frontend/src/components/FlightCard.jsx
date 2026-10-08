import  { useState } from "react";
import { ChevronDown, ChevronUp, Check, Luggage, Armchair, Plane } from "lucide-react";

export default function FlightCard({
  flight,
  onSelect,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const parsePrice = (price) => {
    if (typeof price === "number") return Number.isFinite(price) ? price : null;
    const normalizedPrice = String(price ?? "").replace(/[^\d.]/g, "");
    if (!normalizedPrice) return null;
    const parsedPrice = Number(normalizedPrice);
    return Number.isFinite(parsedPrice) ? parsedPrice : null;
  };
  const currentPrice = parsePrice(flight.numericPrice ?? flight.price);
  const originalPrice = parsePrice(flight.originalPrice);
  const discountPercentage =
    originalPrice !== null && currentPrice !== null && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  return (
    <div className="w-full max-w-4xl font-sans transition-all duration-200">
      {/* Ticket Container */}
      <div className="relative bg-white rounded-[28px] border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT SECTION: Flight Information */}
        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between relative">
          
          {/* Main Flight Path Layout */}
          <div className="grid grid-cols-12 gap-3 items-center">
            
            {/* Airline Logo & Name */}
            <div className="col-span-12 sm:col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl border border-gray-100 p-2 flex items-center justify-center bg-white shadow-2xs mb-2">
                <img
                  src={flight.logoUrl}
                  alt={flight.airline}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    // Fallback visual if logo image fails to load
                    e.target.onerror = null;
                    e.target.parentElement.innerHTML = `<span class="text-xs font-black text-rose-800 tracking-tighter">US BANGLA</span>`;
                  }}
                />
              </div>
              <h4 className="text-xs font-extrabold text-gray-900 leading-tight">
                {flight.airline}
              </h4>
              <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-900 bg-rose-50 border border-rose-100/80">
                {flight.code}
              </span>
            </div>

            {/* Departure Info */}
            <div className="col-span-4 sm:col-span-3 text-center sm:text-left">
              <span className="block text-[11px] font-semibold text-gray-500 leading-tight">
                {flight.departure.date}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                {flight.departure.time}
              </h3>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {flight.departure.code}
              </span>
            </div>

            {/* Flight Path Graphic & Duration */}
            <div className="col-span-4 sm:col-span-3 text-center px-1">
              <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                {flight.duration}
              </span>
              
              {/* Timeline graphic with hollow start ring, plane icon, and solid end point */}
              <div className="flex items-center justify-center gap-1 my-1">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-rose-800 bg-white shrink-0"></div>
                <div className="flex-1 border-b-2 border-dashed border-gray-300 relative flex items-center justify-center">
                  <Plane className="w-3.5 h-3.5 text-rose-800 rotate-90 absolute bg-white px-0.5" />
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-rose-900 shrink-0"></div>
              </div>

              <span className="text-xs font-extrabold text-gray-900 block mt-0.5">
                {flight.stops}
              </span>
            </div>

            {/* Arrival Info */}
            <div className="col-span-4 sm:col-span-3 text-center sm:text-right">
              <span className="block text-[11px] font-semibold text-gray-500 leading-tight">
                {flight.arrival.date}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                {flight.arrival.time}
              </h3>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {flight.arrival.code}
              </span>
            </div>

          </div>

          {/* Divider Line */}
          <div className="my-4 border-t border-dashed border-gray-200" />

          {/* Bottom Action Badges & View Details Button */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* View Details Dropdown Button */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200/80 bg-white text-xs font-bold text-gray-800 hover:bg-gray-50 transition"
            >
              <span>View Details</span>
              {showDetails ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-600" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
              )}
            </button>

            {/* Refundable Tag */}
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
              flight.isRefundable
                ? "text-emerald-700 bg-emerald-50/80 border-emerald-200/60"
                : "text-gray-600 bg-gray-50 border-gray-200"
            }`}>
              {flight.isRefundable && <Check className="w-3 h-3 stroke-3" />}
              {flight.refundable}
            </span>

            {/* Seats Left Badge */}
            {flight.seatsLeft && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-purple-700 bg-purple-50/80 border border-purple-200/60">
                <Armchair className="w-3 h-3" />
                {flight.seatsLeft}
              </span>
            )}

            {/* Baggage Allowance Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-sky-700 bg-sky-50/80 border border-sky-200/60">
              <Luggage className="w-3 h-3" />
              {flight.baggage}
            </span>

          </div>
        </div>

        {/* Dotted Vertical Perforated Ticket Divider (Desktop) */}
        <div className="hidden md:flex flex-col items-center justify-between relative py-2">
          {/* Top Ticket Punch Hole cutout */}
          <div className="w-4 h-4 bg-[#f4f6f9] rounded-full border-b border-gray-200 absolute -top-2 left-1/2 -translate-x-1/2 z-10"></div>
          
          <div className="h-full border-l-2 border-dashed border-gray-200/80 my-2"></div>
          
          {/* Bottom Ticket Punch Hole cutout */}
          <div className="w-4 h-4 bg-[#f4f6f9] rounded-full border-t border-gray-200 absolute -bottom-2 left-1/2 -translate-x-1/2 z-10"></div>
        </div>

        {/* Horizontal Ticket Cutout (Mobile view) */}
        <div className="md:hidden relative border-t border-dashed border-gray-200">
          <div className="w-4 h-4 bg-[#f4f6f9] rounded-full border-r border-gray-200 absolute -left-2 top-1/2 -translate-y-1/2 z-10"></div>
          <div className="w-4 h-4 bg-[#f4f6f9] rounded-full border-l border-gray-200 absolute -right-2 top-1/2 -translate-y-1/2 z-10"></div>
        </div>

        {/* RIGHT SECTION: Price & Call-to-Action */}
        <div className="w-full md:w-56 bg-gray-50/50 p-5 md:p-6 flex flex-col justify-center items-center text-center relative border-l-0 md:border-l border-gray-100">
          
          {/* Currency Label */}
          <span className="text-[10px] font-extrabold text-rose-800 tracking-wider uppercase mb-0.5">
            {flight.currency}
          </span>

          {/* Main Discounted Price */}
          <div className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">
            ${flight.price}
          </div>

          {discountPercentage !== null && (
            <span className="mb-1 inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-rose-900">
              {discountPercentage}% off
            </span>
          )}

          {/* Original Strikethrough Price */}
          {discountPercentage !== null && (
            <div className="text-xs font-bold text-gray-400 line-through mb-4">
              {flight.originalPrice}
            </div>
          )}

          {/* Select Flight Button */}
          <button
            onClick={() => onSelect && onSelect(flight)}
            className="w-full bg-rose-900 hover:bg-rose-950 text-white font-bold py-2.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-150 text-sm active:scale-95"
          >
            Select Flight
          </button>
        </div>

      </div>

      {/* EXPANDABLE DETAILS DRAWER */}
      {showDetails && (
        <div className="bg-gray-50/90 rounded-b-2xl border-x border-b border-gray-200/80 p-4 mx-3 -mt-2 pt-5 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            {/* Flight Segment Summary */}
            <div className="bg-white p-3 rounded-xl border border-gray-200/60 shadow-2xs">
              <span className="font-extrabold text-gray-900 block mb-1">Flight Details</span>
              <p className="text-gray-600">{flight.code || "Flight details provided by the airline"}</p>
              <p className="text-gray-600">Review the fare conditions before booking.</p>
            </div>

            {flight.returnFlight && (
              <div className="bg-white p-3 rounded-xl border border-gray-200/60 shadow-2xs">
                <span className="font-extrabold text-gray-900 block mb-1">Return flight</span>
                <p className="text-gray-600">{flight.returnFlight.date}</p>
                <p className="text-gray-600">
                  {flight.returnFlight.origin} {flight.returnFlight.departureTime} → {flight.returnFlight.destination} {flight.returnFlight.arrivalTime}
                </p>
                <p className="text-gray-600">{flight.returnFlight.duration} · {flight.returnFlight.stops}</p>
              </div>
            )}

            {/* Baggage Info */}
            <div className="bg-white p-3 rounded-xl border border-gray-200/60 shadow-2xs">
              <span className="font-extrabold text-gray-900 block mb-1">Baggage Allowance</span>
              <p className="text-gray-600">Baggage allowance varies by fare.</p>
              <p className="text-gray-600">Confirm included baggage with the airline.</p>
            </div>

            {/* Fare Breakdown & Cancellation */}
            <div className="bg-white p-3 rounded-xl border border-gray-200/60 shadow-2xs">
              <span className="font-extrabold text-gray-900 block mb-1">Cancellation Fee</span>
              <p className="text-gray-600">{flight.refundable}</p>
              <p className="text-gray-600">Check the airline's fare rules for fees.</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}