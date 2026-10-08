import { useEffect, useState, useRef } from "react";
import {
  Plane,
  ArrowLeftRight,
  Search,
  Flame,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ArrowRight,
  X,
  Plus,
  Minus,
  MapPin,
  ChevronDown
} from "lucide-react";

const AIRPORTS = [
  { code: "DAC", city: "Dhaka", name: "Hazrat Shahjalal International Airport", country: "Bangladesh" },
  { code: "CXB", city: "Cox's Bazar", name: "Cox's Bazar Airport", country: "Bangladesh" },
  { code: "CGP", city: "Chittagong", name: "Shah Amanat International Airport", country: "Bangladesh" },
  { code: "ZYL", city: "Sylhet", name: "Osmani International Airport", country: "Bangladesh" },
  { code: "KUL", city: "Kuala Lumpur", name: "Kuala Lumpur International Airport", country: "Malaysia" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport", country: "Thailand" },
  { code: "DXB", city: "Dubai", name: "Dubai International Airport", country: "UAE" },
  { code: "IST", city: "Istanbul", name: "Istanbul Airport", country: "Turkey" },
  { code: "CAN", city: "Guangzhou", name: "Guangzhou Baiyun International Airport", country: "China" },
  { code: "LHR", city: "London", name: "Heathrow Airport", country: "United Kingdom" },
  { code: "SIN", city: "Singapore", name: "Changi Airport", country: "Singapore" }
];

const AIRLINES = [
  "Biman Bangladesh Airlines",
  "US-Bangla Airlines",
  "Air Astra",
  "Emirates",
  "Qatar Airways",
  "Singapore Airlines",
  "Thai Airways",
  "Malaysia Airlines",
  "Flydubai"
];

const TRENDING_ROUTES = [
  { id: 1, from: "DAC", to: "KUL", type: "ONE WAY", price: "৳22,061", fromCity: "Dhaka", toCity: "Kuala Lumpur" },
  { id: 2, from: "DAC", to: "KUL", type: "RETURN", price: "৳48,556", fromCity: "Dhaka", toCity: "Kuala Lumpur" },
  { id: 3, from: "DAC", to: "CAN", type: "RETURN", price: "৳64,820", fromCity: "Dhaka", toCity: "Guangzhou" },
  { id: 4, from: "DAC", to: "BKK", type: "RETURN", price: "৳32,150", fromCity: "Dhaka", toCity: "Bangkok" },
  { id: 5, from: "DAC", to: "DXB", type: "RETURN", price: "৳52,400", fromCity: "Dhaka", toCity: "Dubai" },
  { id: 6, from: "DAC", to: "IST", type: "RETURN", price: "৳78,900", fromCity: "Dhaka", toCity: "Istanbul" },
];

const HERO_SLIDES = [
  "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?q=80&w=2000&auto=format&fit=crop",
];

export default function Hero({ onSearch, isSearching }) {
  const [activeTab, setActiveTab] = useState("Flight");
  const [tripType, setTripType] = useState("One Way");
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  // Flight Selection States
  const [fromAirport, setFromAirport] = useState(AIRPORTS[0]); // DAC
  const [toAirport, setToAirport] = useState(AIRPORTS[1]); // CXB
  
  // Date States
  const [departureDate, setDepartureDate] = useState("2026-10-13");
  const [returnDate, setReturnDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [year, month] = "2026-10-13".split("-").map(Number);
    return new Date(year, month - 1, 1);
  });

  // Passenger & Class States
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [childAges, setChildAges] = useState([]);
  const [infantAges, setInfantAges] = useState([]);
  const [cabinClass, setCabinClass] = useState("Economy");
  const [searchValidationError, setSearchValidationError] = useState("");

  // Preferred Airlines
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [showAirlineDropdown, setShowAirlineDropdown] = useState(false);

  // Modals / Popovers States
  const [activeModal, setActiveModal] = useState(null); // 'from' | 'to' | 'departure' | 'return' | 'passengers' | 'summary' | null
  const [airportSearch, setAirportSearch] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  // Scroll ref for trending routes
  const trendingContainerRef = useRef(null);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setActiveHeroSlide((currentSlide) => (currentSlide + 1) % HERO_SLIDES.length);
    }, 5000);

    return () => clearInterval(slideInterval);
  }, []);

  // Swap From & To airports
  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => {
      const temp = fromAirport;
      setFromAirport(toAirport);
      setToAirport(temp);
      setIsSwapping(false);
    }, 200);
  };

  // Scroll handler for trending routes
  const scrollTrending = (direction) => {
    if (trendingContainerRef.current) {
      const scrollAmount = direction === "left" ? -250 : 250;
      trendingContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Auto-fill route from Trending card
  const handleSelectTrendingRoute = (route) => {
    const origin = AIRPORTS.find(a => a.code === route.from) || AIRPORTS[0];
    const destination = AIRPORTS.find(a => a.code === route.to) || AIRPORTS[1];
    setFromAirport(origin);
    setToAirport(destination);
    if (route.type === "RETURN") {
      setTripType("Round Trip");
      if (!returnDate) setReturnDate("2026-10-20");
    } else {
      setTripType("One Way");
      setReturnDate("");
    }
  };

  // Total Passenger Calculation
  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  const updatePassengerCount = (key, amount) => {
    const nextCount = Math.max(key === "adults" ? 1 : 0, passengers[key] + amount);
    setPassengers((current) => ({ ...current, [key]: nextCount }));

    if (key === "children") {
      setChildAges((current) => Array.from({ length: nextCount }, (_, index) => current[index] ?? ""));
    } else if (key === "infants") {
      setInfantAges((current) => Array.from({ length: nextCount }, (_, index) => current[index] ?? ""));
    }
  };

  const searchFlights = () => {
    if (tripType === "Round Trip" && !returnDate) {
      setSearchValidationError("Choose a return date before searching.");
      return;
    }

    if (tripType === "Multi City") {
      setSearchValidationError("Multi-city flight searches are not supported yet.");
      return;
    }

    if (childAges.some((age) => age === "") || infantAges.some((age) => age === "")) {
      setSearchValidationError("Choose an age for every child and infant.");
      return;
    }

    setSearchValidationError("");
    setActiveModal(null);
    onSearch({
      origin: fromAirport.code,
      destination: toAirport.code,
      departureDate,
      returnDate: tripType === "Round Trip" ? returnDate : null,
      tripType,
      cabinClass,
      passengers: {
        adults: passengers.adults,
        childAges: childAges.map(Number),
        infantAges: infantAges.map(Number),
      },
    });
  };

  // Formatting date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return { formatted: `${day} ${month}, ${year}`, dayName };
  };

  const depDateInfo = formatDateDisplay(departureDate);
  const retDateInfo = formatDateDisplay(returnDate);
  const activeDateValue = activeModal === "return" ? returnDate : departureDate;
  const [calendarYear, calendarMonthIndex] = [
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
  ];
  const firstWeekday = (new Date(calendarYear, calendarMonthIndex, 1).getDay() + 6) % 7;
  const daysInCalendarMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const calendarDays = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInCalendarMonth }, (_, index) => index + 1),
  ];
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const dateKey = (year, month, day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const dateLabel = (value) => {
    if (!value) return "Select a date";
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const localToday = new Date();
  localToday.setHours(0, 0, 0, 0);
  const minDepartureDate = dateKey(localToday.getFullYear(), localToday.getMonth(), localToday.getDate());

  const openDatePicker = (type) => {
    const currentValue = type === "return" ? returnDate : departureDate;
    const [year, month] = (currentValue || departureDate).split("-").map(Number);
    setCalendarMonth(new Date(year, month - 1, 1));
    setActiveModal(type);
  };

  const selectCalendarDate = (date) => {
    if (activeModal === "departure") {
      setDepartureDate(date);
      if (returnDate && returnDate < date) setReturnDate("");
    } else {
      setReturnDate(date);
    }
  };

  // Filtered airports for search modal
  const filteredAirports = AIRPORTS.filter(a =>
    a.city.toLowerCase().includes(airportSearch.toLowerCase()) ||
    a.code.toLowerCase().includes(airportSearch.toLowerCase()) ||
    a.name.toLowerCase().includes(airportSearch.toLowerCase())
  );

  const toggleAirline = (airline) => {
    if (selectedAirlines.includes(airline)) {
      setSelectedAirlines(selectedAirlines.filter(a => a !== airline));
    } else {
      setSelectedAirlines([...selectedAirlines, airline]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans p-3 sm:p-6 lg:p-10 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        
        {}
        <div className="relative rounded-3xl overflow-hidden min-h-90 sm:min-h-100 shadow-xl flex flex-col justify-between p-4 sm:p-8">
          {HERO_SLIDES.map((image, index) => (
            <div
              key={image}
              aria-hidden="true"
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                activeHeroSlide === index ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url('${image}')` }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/40" aria-hidden="true" />

          {/* Top Left Floating Promo Card */}
          <div className="relative z-10 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl max-w-full sm:max-w-xs shadow-xl border border-white/40 transform transition hover:scale-[1.01]">
            <p className="text-[10px] font-extrabold tracking-wider text-rose-800 uppercase mb-1">
              BOOK FLIGHTS, VISAS, HOTELS & HOLIDAYS
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">
              Where to <span className="text-rose-600">Next?</span>
            </h2>
            
            <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-100/90 p-2 rounded-xl border border-gray-200/60">
              {/* DAC Boxes */}
              <div className="flex gap-0.5">
                {['D', 'A', 'C'].map((char, i) => (
                  <span key={i} className="w-5 h-6 sm:w-6 sm:h-7 bg-white rounded border border-gray-300/80 flex items-center justify-center font-bold text-xs text-gray-800 shadow-sm">
                    {char}
                  </span>
                ))}
              </div>

              {/* Animated Plane Icon */}
              <Plane className="w-3.5 h-3.5 text-rose-600 rotate-45 mx-0.5 shrink-0" />

              {/* IST Boxes */}
              <div className="flex gap-0.5">
                {['I', 'S', 'T'].map((char, i) => (
                  <span key={i} className="w-5 h-6 sm:w-6 sm:h-7 bg-white rounded border border-gray-300/80 flex items-center justify-center font-bold text-xs text-gray-800 shadow-sm">
                    {char}
                  </span>
                ))}
              </div>

              {/* Fly To & Action Button */}
              <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                <div className="text-right leading-tight">
                  <span className="block text-[8px] uppercase text-gray-400 font-bold">FLY TO</span>
                  <span className="block text-xs font-extrabold text-gray-900">Istanbul</span>
                </div>
                <button 
                  onClick={() => handleSelectTrendingRoute({ from: 'DAC', to: 'IST', type: 'RETURN' })}
                  className="w-7 h-7 bg-rose-700 hover:bg-rose-800 text-white rounded-full flex items-center justify-center transition shadow-sm active:scale-95"
                  title="Quick book Istanbul flight"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Top Right Carousel Pagination Indicators */}
          <div className="absolute top-6 right-6 z-10 flex gap-1.5" aria-label="Hero image slides">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveHeroSlide(index)}
                aria-label={`Show slide ${index + 1}`}
                aria-pressed={activeHeroSlide === index}
                className={`h-1.5 rounded-full shadow-sm transition-all ${
                  activeHeroSlide === index ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          <div className="relative z-10 h-12 sm:h-16"></div>
        </div>

        {}
        <div className="relative -mt-16 sm:-mt-20 z-20 max-w-7xl mx-auto px-2 sm:px-4">
          
          {/* Centered Floating Category Navigation Tabs */}
          <div className="flex justify-center -mb-5.5 relative z-30">
            <div className="bg-white rounded-full p-1.5 shadow-xl flex items-center gap-1 border border-gray-100">
              {[
                { name: "Flight", icon: Plane },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-rose-700 text-white shadow-md shadow-rose-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-rose-700"}`} />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Search Panel Box */}
          <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-8 pt-10 sm:pt-12 border border-gray-100">
            
            {/* Trip Type Selector */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
              {["One Way", "Round Trip", "Multi City"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setTripType(type);
                    if (type === "Round Trip" && !returnDate) {
                      setReturnDate("2026-10-20");
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                    tripType === type
                      ? "bg-rose-50 text-rose-700 border border-rose-200 shadow-sm"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {tripType === type && <span className="w-2 h-2 rounded-full bg-rose-600"></span>}
                  {type}
                </button>
              ))}
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 relative">
              
              {/* FROM Field */}
              <div 
                onClick={() => { setAirportSearch(""); setActiveModal('from'); }}
                className="md:col-span-3 bg-gray-50/90 hover:bg-gray-100/80 p-3.5 rounded-2xl border border-gray-200/80 cursor-pointer transition flex flex-col justify-between group hover:border-rose-300"
              >
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-0.5">
                  FROM
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight group-hover:text-rose-700 transition">
                    {fromAirport.city}
                  </h3>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5 font-medium">
                    {fromAirport.code} - {fromAirport.name}
                  </p>
                </div>
              </div>

              {/* Swap Origin/Destination Button */}
              <div className="md:col-span-0 absolute left-1/2 md:left-[24.5%] top-26.25 md:top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleSwap(); }}
                  className={`w-9 h-9 bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white hover:bg-rose-800 active:scale-90 transition-transform duration-300 ${isSwapping ? 'rotate-180' : ''}`}
                  title="Swap Origin and Destination"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              {/* TO Field */}
              <div 
                onClick={() => { setAirportSearch(""); setActiveModal('to'); }}
                className="md:col-span-3 bg-gray-50/90 hover:bg-gray-100/80 p-3.5 rounded-2xl border border-gray-200/80 cursor-pointer transition flex flex-col justify-between group hover:border-rose-300 md:pl-6"
              >
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-0.5">
                  TO
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight group-hover:text-rose-700 transition">
                    {toAirport.city}
                  </h3>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5 font-medium">
                    {toAirport.code} - {toAirport.name}
                  </p>
                </div>
              </div>

              {/* DEPARTURE Field */}
              <div 
                onClick={() => openDatePicker('departure')}
                className="md:col-span-2 bg-gray-50/90 hover:bg-gray-100/80 p-3.5 rounded-2xl border border-gray-200/80 cursor-pointer transition flex flex-col justify-between group hover:border-rose-300"
              >
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-0.5">
                  DEPARTURE
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight group-hover:text-rose-700 transition">
                    {depDateInfo ? depDateInfo.formatted : "Select Date"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                    {depDateInfo ? depDateInfo.dayName : "Choose departure"}
                  </p>
                </div>
              </div>

              {/* RETURN Field */}
              <div 
                onClick={() => {
                  if (tripType === "One Way") setTripType("Round Trip");
                  openDatePicker('return');
                }}
                className="md:col-span-2 bg-gray-50/90 hover:bg-gray-100/80 p-3.5 rounded-2xl border border-gray-200/80 cursor-pointer transition flex flex-col justify-between group hover:border-rose-300"
              >
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-0.5">
                  RETURN
                </span>
                <div>
                  <h3 className={`text-base sm:text-lg font-black leading-tight group-hover:text-rose-700 transition ${retDateInfo ? 'text-gray-900' : 'text-gray-700'}`}>
                    {retDateInfo ? retDateInfo.formatted : "Add Return"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                    {retDateInfo ? retDateInfo.dayName : "Save more on round trips"}
                  </p>
                </div>
              </div>

              {/* PASSENGER & CLASS Field */}
              <div 
                onClick={() => setActiveModal('passengers')}
                className="md:col-span-2 bg-gray-50/90 hover:bg-gray-100/80 p-3.5 rounded-2xl border border-gray-200/80 cursor-pointer transition flex flex-col justify-between group hover:border-rose-300"
              >
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-0.5">
                  PASSENGER & CLASS
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight group-hover:text-rose-700 transition truncate">
                    {totalPassengers} Passenger{totalPassengers > 1 ? 's' : ''}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium truncate">
                    {cabinClass}
                  </p>
                </div>
              </div>

            </div>

            {/* Preferred Airline Filter Option */}
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowAirlineDropdown(!showAirlineDropdown)}
                  className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1.5 transition py-1"
                >
                  <Search className="w-3.5 h-3.5" /> 
                  <span>Add preferred Airline</span>
                  {selectedAirlines.length > 0 && (
                    <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                      {selectedAirlines.length}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>

                {/* Airline Dropdown */}
                {showAirlineDropdown && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                      <span className="text-xs font-extrabold text-gray-800">Select Airlines</span>
                      {selectedAirlines.length > 0 && (
                        <button 
                          onClick={() => setSelectedAirlines([])}
                          className="text-[10px] text-rose-600 font-bold hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {AIRLINES.map((airline) => (
                        <label 
                          key={airline} 
                          className="flex items-center gap-2 text-xs font-medium text-gray-700 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                        >
                          <input 
                            type="checkbox"
                            checked={selectedAirlines.includes(airline)}
                            onChange={() => toggleAirline(airline)}
                            className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                          />
                          <span className="truncate">{airline}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Active Airline Tags display */}
              {selectedAirlines.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedAirlines.map(airline => (
                    <span key={airline} className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      {airline}
                      <X className="w-2.5 h-2.5 cursor-pointer hover:text-rose-900" onClick={() => toggleAirline(airline)} />
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Floating Centered Main Search Button */}
          <div className="flex justify-center -mt-6 relative z-30">
            <button 
              onClick={() => setActiveModal('summary')}
              className="bg-rose-700 hover:bg-rose-800 text-white font-extrabold px-10 sm:px-14 py-3.5 rounded-full shadow-lg shadow-rose-200/80 flex items-center gap-2.5 text-base sm:text-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
              <span>Search</span>
            </button>
          </div>

        </div>

        {}
        <div className="mt-8 max-w-5xl mx-auto px-2 sm:px-4">
          <div className="bg-white rounded-full shadow-md border border-gray-100 p-2 sm:p-2.5 px-4 flex items-center gap-3 overflow-hidden">
            
            {/* Flame Badge Title */}
            <div className="flex items-center gap-2.5 shrink-0 border-r border-gray-200 pr-4">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Flame className="w-4 h-4 fill-rose-600" />
              </div>
              <div className="hidden sm:block">
                <h4 className="text-xs font-black text-gray-900 leading-none">Trending Routes</h4>
                <span className="text-[10px] text-gray-400 font-medium leading-tight">Most searched - lowest fare</span>
              </div>
            </div>

            {/* Scrollable Routes List */}
            <div 
              ref={trendingContainerRef}
              className="flex items-center gap-4 overflow-x-auto scrollbar-none py-1 scroll-smooth w-full"
            >
              {TRENDING_ROUTES.map((route) => (
                <div 
                  key={route.id}
                  onClick={() => handleSelectTrendingRoute(route)}
                  className="flex items-center gap-2 shrink-0 text-xs cursor-pointer hover:bg-rose-50/60 p-1 px-2.5 rounded-full transition border border-transparent hover:border-rose-100"
                >
                  <span className="w-5 h-5 rounded-full bg-rose-700 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                    {route.id}
                  </span>
                  <span className="font-extrabold text-gray-800">
                    {route.from} <span className="text-gray-400 font-normal">→</span> {route.to}
                  </span>
                  {route.type === "RETURN" && (
                    <span className="bg-gray-100 text-[9px] text-gray-500 font-bold px-1.5 py-0.5 rounded uppercase">
                      RETURN
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">from</span>
                  <span className="font-extrabold text-gray-900">{route.price}</span>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="ml-auto flex items-center gap-1 pl-2 shrink-0 border-l border-gray-100">
              <button 
                onClick={() => scrollTrending('left')}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => scrollTrending('right')}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {}
      {/* 1. Airport Selector Modal (FROM / TO) */}
      {(activeModal === 'from' || activeModal === 'to') && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-gray-900">
                Select {activeModal === 'from' ? 'Departure' : 'Arrival'} Airport
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Airport Search Bar */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search city, airport or code..."
                value={airportSearch}
                onChange={(e) => setAirportSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent font-medium"
                autoFocus
              />
            </div>

            {/* Airport List */}
            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {filteredAirports.map((ap) => {
                const isSelected = activeModal === 'from' ? fromAirport.code === ap.code : toAirport.code === ap.code;
                return (
                  <div
                    key={ap.code}
                    onClick={() => {
                      if (activeModal === 'from') setFromAirport(ap);
                      else setToAirport(ap);
                      setActiveModal(null);
                    }}
                    className={`p-3 rounded-2xl cursor-pointer flex items-center justify-between transition ${
                      isSelected ? "bg-rose-50 border border-rose-200 text-rose-900" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-rose-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-black text-sm text-gray-900">{ap.city}, {ap.country}</div>
                        <div className="text-xs text-gray-500">{ap.name}</div>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700">
                      {ap.code}
                    </span>
                  </div>
                );
              })}
              {filteredAirports.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">No airports found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Date Picker Modal */}
      {(activeModal === 'departure' || activeModal === 'return') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-title"
            className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="bg-linear-to-br from-rose-950 via-rose-900 to-rose-800 px-5 py-5 text-white sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-rose-100">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]">
                      Plan your journey
                    </span>
                  </div>
                  <h3 id="calendar-title" className="text-xl font-black tracking-tight sm:text-2xl">
                    Choose {activeModal === "departure" ? "departure" : "return"} date
                  </h3>
                  <p className="mt-1 text-xs font-medium text-rose-100/90">
                    {fromAirport.code} <span aria-hidden="true">→</span> {toAirport.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label="Close calendar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className={`rounded-2xl border p-3 transition ${
                  activeModal === "departure"
                    ? "border-white/30 bg-white/15"
                    : "border-white/10 bg-black/10"
                }`}>
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest text-rose-100">
                    Departure
                  </span>
                  <span className="mt-1 block text-sm font-bold text-white">
                    {dateLabel(departureDate)}
                  </span>
                </div>
                <div className={`rounded-2xl border p-3 transition ${
                  activeModal === "return"
                    ? "border-white/30 bg-white/15"
                    : "border-white/10 bg-black/10"
                }`}>
                  <span className="block text-[9px] font-extrabold uppercase tracking-widest text-rose-100">
                    Return
                  </span>
                  <span className="mt-1 block text-sm font-bold text-white">
                    {dateLabel(returnDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-gray-900">
                    {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h4>
                  <p className="mt-0.5 text-[11px] font-medium text-gray-400">Select a travel date</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    disabled={calendarYear === localToday.getFullYear() && calendarMonthIndex === localToday.getMonth()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-900"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => (
                  <span key={weekday} className="py-2 text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
                    {weekday}
                  </span>
                ))}
                {calendarDays.map((day, index) => {
                  if (!day) return <span key={`empty-${index}`} aria-hidden="true" />;

                  const date = dateKey(calendarYear, calendarMonthIndex, day);
                  const minimumDate = activeModal === "return" ? departureDate : minDepartureDate;
                  const disabled = date < minimumDate;
                  const selected = date === activeDateValue;
                  const today = date === minDepartureDate;

                  return (
                    <button
                      key={date}
                      type="button"
                      disabled={disabled}
                      aria-pressed={selected}
                      aria-label={new Date(calendarYear, calendarMonthIndex, day).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      onClick={() => selectCalendarDate(date)}
                      className={`mx-auto flex aspect-square w-full max-w-11 items-center justify-center rounded-2xl text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose-700 ${
                        selected
                          ? "bg-rose-900 text-white shadow-md shadow-rose-900/20"
                          : disabled
                            ? "cursor-not-allowed text-gray-300"
                            : today
                              ? "border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100"
                              : "text-gray-700 hover:bg-rose-50 hover:text-rose-900"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500">
                  {activeDateValue ? dateLabel(activeDateValue) : "No date selected"}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  disabled={!activeDateValue}
                  className="rounded-xl bg-rose-900 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-rose-900/15 transition hover:bg-rose-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirm date
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Passengers & Cabin Class Selector Modal */}
      {activeModal === 'passengers' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-gray-900">Passengers & Cabin Class</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Passenger Counter list */}
            <div className="space-y-4 border-b border-gray-100 pb-4 mb-4">
              {[
                { key: "adults", label: "Adults", sub: "12 years and above" },
                { key: "children", label: "Children", sub: "2 - 11 years" },
                { key: "infants", label: "Infants", sub: "Below 2 years" }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <div className="font-black text-sm text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-400 font-medium">{item.sub}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        updatePassengerCount(item.key, -1);
                      }}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-extrabold text-base w-4 text-center">{passengers[item.key]}</span>
                    <button 
                      onClick={() => updatePassengerCount(item.key, 1)}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {childAges.map((age, index) => (
                <label key={`child-${index}`} className="flex items-center justify-between gap-3 text-xs font-bold text-gray-700">
                  Child {index + 1} age
                  <select
                    value={age}
                    onChange={(event) => setChildAges((current) => current.map((value, i) => i === index ? event.target.value : value))}
                    className="rounded-lg border border-gray-200 bg-white p-2"
                  >
                    <option value="">Select age</option>
                    {Array.from({ length: 16 }, (_, i) => i + 2).map((value) => (
                      <option key={value} value={value}>{value} years</option>
                    ))}
                  </select>
                </label>
              ))}
              {infantAges.map((age, index) => (
                <label key={`infant-${index}`} className="flex items-center justify-between gap-3 text-xs font-bold text-gray-700">
                  Infant {index + 1} age
                  <select
                    value={age}
                    onChange={(event) => setInfantAges((current) => current.map((value, i) => i === index ? event.target.value : value))}
                    className="rounded-lg border border-gray-200 bg-white p-2"
                  >
                    <option value="">Select age</option>
                    {[0, 1].map((value) => (
                      <option key={value} value={value}>{value} {value === 1 ? "year" : "years"}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            {/* Cabin Class Selection */}
            <div className="mb-6">
              <label className="block text-xs font-extrabold text-gray-500 uppercase mb-2">Cabin Class</label>
              <div className="grid grid-cols-2 gap-2">
                {["Economy", "Premium Economy", "Business", "First Class"].map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setCabinClass(cls)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      cabinClass === cls 
                        ? "bg-rose-50 border-rose-600 text-rose-700" 
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-rose-700 hover:bg-rose-800 text-white font-extrabold py-3 rounded-2xl transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 4. Search Summary Result Modal */}
      {activeModal === 'summary' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Plane className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-gray-900">Flight Search Summary</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="bg-gray-50 p-3.5 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-400 font-bold block">ROUTE</span>
                  <span className="font-extrabold text-gray-900 text-base">
                    {fromAirport.code} ({fromAirport.city}) → {toAirport.code} ({toAirport.city})
                  </span>
                </div>
                <span className="bg-rose-100 text-rose-800 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase">
                  {tripType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <span className="text-[10px] text-gray-400 font-bold block">DEPARTURE</span>
                  <span className="font-bold text-gray-800">{depDateInfo?.formatted || 'N/A'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <span className="text-[10px] text-gray-400 font-bold block">RETURN</span>
                  <span className="font-bold text-gray-800">{retDateInfo?.formatted || 'None'}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block">PASSENGERS</span>
                  <span className="font-bold text-gray-800">{totalPassengers} Total ({passengers.adults} Adult, {passengers.children} Child)</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold block">CLASS</span>
                  <span className="font-bold text-rose-700">{cabinClass}</span>
                </div>
              </div>

              {selectedAirlines.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">PREFERRED AIRLINES</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedAirlines.map(al => (
                      <span key={al} className="bg-white border text-[10px] font-bold px-2 py-0.5 rounded-md text-gray-700">
                        {al}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {searchValidationError && (
              <p role="alert" className="mb-3 text-sm font-semibold text-red-700">
                {searchValidationError}
              </p>
            )}
            <button 
              onClick={searchFlights}
              disabled={isSearching}
              className="w-full bg-rose-700 hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60 text-white font-extrabold py-3.5 rounded-2xl transition shadow-lg shadow-rose-200"
            >
              {isSearching ? "Searching flights..." : "Search available flights"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}