import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Moon,
  SunMedium,
  Sun,
  Sunset,
  RotateCcw,
  Check,
  Plane,
  Clock,
  Sparkles,
  Zap,
  Filter,
  X
} from "lucide-react";
import FlightCard from "./FlightCard";
import FlightSearchLoader from "./FlightSearchLoader";

export default function FlightSection({ flights = [], search, isLoading, error, hasSearched, onSelect }) {
  // Sidebar Filter States
  const [maxPriceOverride, setMaxPriceOverride] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null); // 'night', 'morning', 'afternoon', 'evening'
  const [selectedStops, setSelectedStops] = useState([]);
  const [refundableOnly, setRefundableOnly] = useState(false);
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [sortBy, setSortBy] = useState("cheapest"); // 'cheapest', 'fastest', 'earliest'
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Accordion Expand/Collapse States
  const [openSections, setOpenSections] = useState({
    price: true,
    schedules: true,
    stops: true,
    airlines: true,
    refundable: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Time Slots Config
  const timeSlots = [
    { id: "night", label: "Night", time: "00:00 - 06:00", icon: Moon },
    { id: "morning", label: "Morning", time: "06:01 - 12:00", icon: SunMedium },
    { id: "afternoon", label: "Afternoon", time: "12:01 - 18:00", icon: Sun },
    { id: "evening", label: "Evening", time: "18:01 - 23:59", icon: Sunset },
  ];

  const prices = flights.map((flight) => flight.numericPrice).filter(Number.isFinite);
  const priceFloor = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const priceCeiling = prices.length ? Math.ceil(Math.max(...prices)) : 0;
  const minPrice = priceFloor;
  const maxPrice = Math.min(maxPriceOverride ?? priceCeiling, priceCeiling);
  const currency = flights[0]?.currency ?? "USD";
  const formatPrice = (amount) => new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

  const airlineOptions = useMemo(() => {
    const airlines = new Map();
    flights.forEach((flight) => {
      if (!flight.airlineCode) return;
      const current = airlines.get(flight.airlineCode);
      airlines.set(flight.airlineCode, {
        id: flight.airlineCode,
        name: flight.airline,
        count: (current?.count ?? 0) + 1,
      });
    });
    return Array.from(airlines.values());
  }, [flights]);

  const handleAirlineToggle = (code) => {
    setSelectedAirlines((prev) =>
      prev.includes(code) ? prev.filter((a) => a !== code) : [...prev, code]
    );
  };

  const handleReset = () => {
    setMaxPriceOverride(null);
    setSelectedTimeSlot(null);
    setSelectedStops([]);
    setRefundableOnly(false);
    setSelectedAirlines([]);
  };

  // Filter Logic
  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      if (flight.numericPrice < minPrice || flight.numericPrice > maxPrice) return false;
      if (selectedTimeSlot && flight.timeSlot !== selectedTimeSlot) return false;
      if (selectedStops.length > 0 && !selectedStops.includes(flight.stops)) return false;
      if (refundableOnly && !flight.isRefundable) return false;
      if (selectedAirlines.length > 0 && !selectedAirlines.includes(flight.airlineCode)) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === "cheapest") return a.numericPrice - b.numericPrice;
      if (sortBy === "fastest") return a.durationMinutes - b.durationMinutes;
      if (sortBy === "earliest") return a.departure.rawTime - b.departure.rawTime;
      return 0;
    });
  }, [flights, minPrice, maxPrice, selectedTimeSlot, selectedStops, refundableOnly, selectedAirlines, sortBy]);

  const selectedDate = search?.departureDate
    ? new Date(`${search.departureDate}T00:00:00Z`).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
    : "Choose a flight search";

  // Sidebar Component Template
  const filterSidebar = (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-5 space-y-6">
      {/* 1. Date Selector Navigation Header */}
      <div className="bg-linear-to-r from-rose-50/80 to-orange-50/50 rounded-2xl p-3 border border-rose-100/60 flex items-center justify-between shadow-2xs">
        <button 
          className="w-8 h-8 rounded-full bg-white border border-rose-100 text-gray-700 flex items-center justify-center hover:bg-rose-800 hover:text-white shadow-xs transition-all duration-200 active:scale-95"
          aria-label="Previous Day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="text-center">
          <span className="block text-[9px] font-extrabold uppercase tracking-widest text-rose-800/70">
            Departure Date
          </span>
          <span className="text-xs font-black text-gray-900 tracking-tight">
            {selectedDate}
          </span>
        </div>

        <button 
          className="w-8 h-8 rounded-full bg-white border border-rose-100 text-gray-700 flex items-center justify-center hover:bg-rose-800 hover:text-white shadow-xs transition-all duration-200 active:scale-95"
          aria-label="Next Day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Filter Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-50 rounded-lg">
            <SlidersHorizontal className="w-4 h-4 text-rose-800" />
          </div>
          <h3 className="text-sm font-black text-gray-900 tracking-tight">Filters</h3>
        </div>
        <button 
          onClick={handleReset}
          className="text-[11px] font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1 bg-rose-50/50 hover:bg-rose-100/60 px-2.5 py-1 rounded-full transition-all duration-150"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* 3. Price Range Accordion */}
      <div className="border-b border-gray-100 pb-5">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between text-xs font-extrabold text-gray-900 hover:text-rose-800 transition"
        >
          <span>Price Range</span>
          {openSections.price ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {openSections.price && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-xs font-black text-gray-900 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <span className="text-rose-900">{formatPrice(minPrice)}</span>
              <span className="text-gray-300 font-normal">to</span>
              <span className="text-rose-900">{formatPrice(maxPrice)}</span>
            </div>

            <div className="relative w-full pt-1">
              <input
                type="range"
                min={priceFloor}
                max={priceCeiling}
                disabled={priceFloor === priceCeiling}
                value={maxPrice}
                onChange={(e) => setMaxPriceOverride(Number(e.target.value))}
                className="w-full accent-rose-800 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-gray-400">
              <span>Min Price</span>
              <span>Max Price</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Flight Schedules Accordion */}
      <div className="border-b border-gray-100 pb-5">
        <button
          onClick={() => toggleSection("schedules")}
          className="w-full flex items-center justify-between text-xs font-extrabold text-gray-900 hover:text-rose-800 transition"
        >
          <span>Flight Schedules</span>
          {openSections.schedules ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {openSections.schedules && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500 font-semibold">Departure {search?.origin ?? ""}</span>
              <span className="text-rose-800/80 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded-full">Anytime</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((slot) => {
                const Icon = slot.icon;
                const isSelected = selectedTimeSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() =>
                      setSelectedTimeSlot(isSelected ? null : slot.id)
                    }
                    className={`p-2.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? "bg-rose-900 text-white border-rose-900 shadow-md shadow-rose-900/20 scale-[1.02]"
                        : "bg-gray-50/70 border-gray-100 text-gray-800 hover:bg-gray-100/80 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-rose-200" : "text-rose-800"}`} />
                      <span className="text-xs font-bold">{slot.label}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${isSelected ? "text-rose-100" : "text-gray-400"}`}>
                      {slot.time}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Stops Filter */}
      <div className="border-b border-gray-100 pb-5">
        <button
          onClick={() => toggleSection("stops")}
          className="w-full flex items-center justify-between text-xs font-extrabold text-gray-900 hover:text-rose-800 transition"
        >
          <span>Stops</span>
          {openSections.stops ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {openSections.stops && (
          <div className="mt-4 flex items-center gap-2">
            {["Non stop", "1 Stop", "2+ Stops"].map((stop) => {
              const active = selectedStops.includes(stop);
              return (
                <button
                  key={stop}
                  onClick={() =>
                    setSelectedStops((prev) =>
                      active ? prev.filter((s) => s !== stop) : [...prev, stop]
                    )
                  }
                  className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold border text-center transition-all duration-150 ${
                    active
                      ? "bg-rose-900 text-white border-rose-900 shadow-sm"
                      : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {stop}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Airlines Accordion */}
      <div className="border-b border-gray-100 pb-5">
        <button
          onClick={() => toggleSection("airlines")}
          className="w-full flex items-center justify-between text-xs font-extrabold text-gray-900 hover:text-rose-800 transition"
        >
          <span>Airlines</span>
          {openSections.airlines ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {openSections.airlines && (
          <div className="mt-4 space-y-3">
            {airlineOptions.map((airline) => {
              const isChecked = selectedAirlines.includes(airline.id);
              return (
                <div
                  key={airline.id}
                  onClick={() => handleAirlineToggle(airline.id)}
                  className="flex items-center justify-between cursor-pointer group p-1.5 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                        isChecked
                          ? "bg-rose-900 border-rose-900 text-white shadow-xs"
                          : "border-gray-300 group-hover:border-rose-600 bg-white"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-3" />}
                    </div>
                    <span className="text-xs font-bold text-gray-800 group-hover:text-gray-900">
                      {airline.name}
                    </span>
                  </div>

                  <span className="text-[11px] font-extrabold text-gray-400">
                    ({airline.count})
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Refundability Toggle Option */}
      <div>
        <button
          onClick={() => toggleSection("refundable")}
          className="w-full flex items-center justify-between text-xs font-extrabold text-gray-900 hover:text-rose-800 transition"
        >
          <span>Refundability</span>
          {openSections.refundable ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {openSections.refundable && (
          <div className="mt-4 flex items-center justify-between p-2.5 bg-gray-50/80 rounded-2xl border border-gray-100">
            <span className="text-xs text-gray-700 font-bold">
              Refundable Only
            </span>
            <button
              onClick={() => setRefundableOnly(!refundableOnly)}
              className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                refundableOnly ? "bg-rose-900" : "bg-gray-200"
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  refundableOnly ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div id="flight-results" className="w-full max-w-7xl mx-auto px-4 py-6 font-sans">
      
      {/* Mobile Filter Toggle Banner */}
      <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-900">
            {filteredFlights.length} Flights Available
          </span>
        </div>
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center gap-1.5 bg-rose-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
        >
          <Filter className="w-3.5 h-3.5" /> Filter Results
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xs bg-white h-full overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-base text-gray-900">Filter Flights</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterSidebar}
          </div>
        </div>
      )}

      {/* MAIN LAYOUT: Sidebar (Left) + Flight List Cards (Right) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT COLUMN: Sticky Filter Sidebar (Desktop) */}
        <aside className="hidden lg:block w-77.5 shrink-0 sticky top-6">
          {filterSidebar}
        </aside>

        {/* RIGHT COLUMN: Flight Results List & Header Controls */}
        <main className="flex-1 w-full space-y-4">
          
          {/* Top Sort & Summary Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-900">
                Flights found:
              </span>
              <span className="bg-rose-50 text-rose-900 border border-rose-100 text-xs font-black px-2.5 py-0.5 rounded-full">
                {filteredFlights.length}
              </span>
            </div>

            {/* Quick Sort Tabs */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
              {[
                { id: "cheapest", label: "Cheapest", icon: Sparkles },
                { id: "fastest", label: "Fastest", icon: Zap },
                { id: "earliest", label: "Earliest", icon: Clock },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = sortBy === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSortBy(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      active
                        ? "bg-white text-rose-900 shadow-xs"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-rose-800" : "text-gray-400"}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards List Section */}
          <div className="space-y-4">
            {isLoading ? (
              <FlightSearchLoader origin={search?.origin} destination={search?.destination} />
            ) : error ? (
              <div role="alert" className="rounded-3xl border border-red-200 bg-white p-8 text-center">
                <h3 className="text-lg font-black text-gray-900">Flight search failed</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            ) : !hasSearched ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center text-sm font-semibold text-gray-600">
                Choose your route and travel dates above to search live flight offers.
              </div>
            ) : filteredFlights.length > 0 ? (
              filteredFlights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} onSelect={onSelect} />
              ))
            ) : (
              /* Empty State */
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-rose-50 text-rose-800 rounded-full flex items-center justify-center mx-auto">
                  <Plane className="w-8 h-8 rotate-45" />
                </div>
                <h3 className="text-lg font-black text-gray-900">No Flights Match Your Filter</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Try broadening your price range or clearing airline/time slot filters to view available options.
                </p>
                <button
                  onClick={handleReset}
                  className="bg-rose-900 text-white font-bold px-6 py-2 rounded-full text-xs shadow-md hover:bg-rose-950 transition"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}