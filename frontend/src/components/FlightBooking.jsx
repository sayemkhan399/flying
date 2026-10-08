import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import api from "../api";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Contact,
  Armchair,
  Plane
} from "lucide-react";

export default function FlightBooking() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const flight = state?.flight;
  const search = state?.search;

  // Timer State (Starts at 19:20 = 1160 seconds)
  const [timeLeft, setTimeLeft] = useState(1160);
  
  // Step Navigation State (1: Booking Details, 2: Preview, 3: Payment)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [isSingleName, setIsSingleName] = useState(false);
  const [title, setTitle] = useState("Mr");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isFlightDetailsOpen, setIsFlightDetailsOpen] = useState(true);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [checkoutStarting, setCheckoutStarting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [savedBooking, setSavedBooking] = useState(null);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setBookingError("");
    setBookingSaving(true);
    try {
      const { data } = await api.post("/api/bookings", {
        flight,
        search,
        passenger: {
          title,
          firstName,
          lastName,
          singleName: isSingleName,
          dob,
          country,
          email,
          phone: phone.startsWith("+") ? phone : `+880${phone}`,
        },
      });
      setSavedBooking(data.booking);
      setCurrentStep(3);
      await startCheckout(data.booking.id);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/auth", {
          state: { from: "/booking", bookingState: { flight, search } },
        });
        return;
      }
      setBookingError(error.response?.data?.error || "Could not save your booking request. Please try again.");
    } finally {
      setBookingSaving(false);
    }
  };

  const startCheckout = async (bookingId) => {
    setBookingError("");
    setCheckoutStarting(true);
    try {
      const { data } = await api.post(`/api/bookings/${bookingId}/checkout`);
      if (typeof data.checkoutUrl !== "string") {
        throw new Error("The payment service returned an invalid checkout link.");
      }
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setBookingError(
        error.response?.data?.error ||
        error.message ||
        "Could not start secure payment. Please try again.",
      );
    } finally {
      setCheckoutStarting(false);
    }
  };

  if (!flight) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f4f6f9] p-6 text-center">
        <h1 className="text-2xl font-black text-gray-900">No flight selected</h1>
        <p className="max-w-md text-sm text-gray-600">
          Choose a flight from the search results before continuing to booking.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-full bg-[#6b0f1a] px-5 py-2.5 text-sm font-bold text-white"
        >
          Back to flight search
        </button>
      </main>
    );
  }

  const passengerCount = search?.passengers
    ? search.passengers.adults + search.passengers.childAges.length + search.passengers.infantAges.length
    : 1;
  const route = `${flight.departure.code} → ${flight.arrival.code}`;
  const tripType = search?.tripType ?? (flight.returnFlight ? "Round Trip" : "One Way");
  const formattedPrice = new Intl.NumberFormat("en", {
    style: "currency",
    currency: flight.currency || "USD",
    maximumFractionDigits: 2,
  }).format(flight.numericPrice);

  return (
    <div className="w-full min-h-screen bg-[#f4f6f9] font-sans text-gray-800 pb-12">
      
      {/* TOP HEADER: Dark Maroon Navbar with Step Tracker */}
      <header className="bg-[#6b0f1a] text-white py-3 px-4 md:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="self-start text-xs font-bold text-white/80 hover:text-white md:self-auto"
          >
            ← Back to flight search
          </button>
          
          {/* Header Timer Box */}
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            <Clock className="w-4 h-4 text-white/80" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
              Time Remaining
            </span>
            <span className="text-sm font-black text-white tracking-widest ml-1">
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Stepper Wizard */}
          <div className="flex items-center gap-3 sm:gap-8">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                currentStep >= 1 ? "bg-white text-[#6b0f1a]" : "bg-white/20 text-white"
              }`}>
                1
              </span>
              <span className={`text-xs font-extrabold ${currentStep === 1 ? "text-white" : "text-white/60"}`}>
                Booking Details
              </span>
            </div>

            <div className="w-8 sm:w-16 h-px bg-white/20"></div>

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                currentStep >= 2 ? "bg-white text-[#6b0f1a]" : "bg-white/20 text-white"
              }`}>
                2
              </span>
              <span className={`text-xs font-extrabold ${currentStep === 2 ? "text-white" : "text-white/60"}`}>
                Preview
              </span>
            </div>

            <div className="w-8 sm:w-16 h-px bg-white/20"></div>

            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                currentStep >= 3 ? "bg-white text-[#6b0f1a]" : "bg-white/20 text-white"
              }`}>
                3
              </span>
              <span className={`text-xs font-extrabold ${currentStep === 3 ? "text-white" : "text-white/60"}`}>
                Payment
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* MAIN CONTENT AREA: 2 Columns */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Flight Details + Form */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* 1. Expandable Flight Details Top Summary Box */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative">
              <div className="flex items-start justify-between">
                
                <div className="flex items-start gap-4">
                  {/* Airline Logo */}
                  <div className="w-12 h-12 rounded-2xl border border-gray-100 p-1.5 flex items-center justify-center bg-white shadow-2xs">
                    {flight.logoUrl ? (
                      <img src={flight.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Plane className="w-5 h-5 text-[#6b0f1a]" />
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-0.5">
                      Flight Details • {flight.airline}
                    </span>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">
                      {route}
                    </h2>
                    <p className="text-xs font-bold text-gray-500">{flight.code}</p>
                  </div>
                </div>

                {/* Accordion Toggle Arrow */}
                <button
                  onClick={() => setIsFlightDetailsOpen(!isFlightDetailsOpen)}
                  className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                >
                  {isFlightDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

              </div>

              {/* Sub details badges */}
              {isFlightDetailsOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-100">
                    {flight.departure.date}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-100 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" /> {flight.duration}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-[#6b0f1a] border border-rose-100">
                    {flight.stops}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-100 flex items-center gap-1">
                    <Armchair className="w-3 h-3 text-gray-400" /> {search?.cabinClass ?? "Selected cabin"}
                  </span>
                  {flight.returnFlight && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-100">
                      Return: {flight.returnFlight.date} · {flight.returnFlight.duration}
                    </span>
                  )}
                </div>
              )}
            </div>

            {savedBooking ? (
              <section role="status" className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm md:p-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Plane className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-center text-xl font-black text-gray-900">
                  Booking request saved
                </h3>
                <p className="mt-2 text-center text-sm leading-6 text-gray-600">
                  Your passenger and flight details are saved. Complete payment through Stripe to pay for this request.
                  Payment does not confirm or ticket your flight.
                </p>
                {bookingError && (
                  <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
                    {bookingError}
                  </p>
                )}
                <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-center">
                  <span className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                    Booking reference
                  </span>
                  <span className="mt-1 block break-all font-mono text-sm font-bold text-gray-900">
                    {savedBooking.id}
                  </span>
                  <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    Payment pending
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => startCheckout(savedBooking.id)}
                  disabled={checkoutStarting}
                  className="mt-5 w-full rounded-full bg-[#6b0f1a] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#520b14] disabled:cursor-wait disabled:opacity-60"
                >
                  {checkoutStarting ? "Opening secure payment..." : "Continue to secure payment"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-3 w-full rounded-full border border-gray-200 px-6 py-3.5 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50"
                >
                  Search more flights
                </button>
              </section>
            ) : (
            <form onSubmit={handleFormSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
              {bookingError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
                  {bookingError}
                </p>
              )}
              
              {/* Form Title */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-rose-50 text-[#6b0f1a] flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Passenger Details (Primary Contact)
                  </h3>
                  <span className="text-xs font-semibold text-gray-400">
                    Passenger 1 of {passengerCount}
                  </span>
                </div>
              </div>

              {/* Title Pills Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">
                    Title <span className="text-rose-600">*</span>
                  </label>

                  {/* Checkbox Single Name */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSingleName}
                      onChange={(e) => setIsSingleName(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#6b0f1a] focus:ring-[#6b0f1a]"
                    />
                    <span className="text-xs font-medium text-gray-600">
                      I have only a single name in my passport
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  {["Mr", "Mrs", "Ms"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTitle(item)}
                      className={`px-5 py-2 rounded-full text-xs font-bold transition border ${
                        title === item
                          ? "bg-[#6b0f1a] text-white border-[#6b0f1a] shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* First Name & Last Name Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    First Name (Given Name) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="First Name (Given Name)"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#6b0f1a] focus:bg-white transition"
                  />
                </div>

                {!isSingleName && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Last Name (Surname) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required={!isSingleName}
                      placeholder="Last Name (Surname)"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#6b0f1a] focus:bg-white transition"
                    />
                  </div>
                )}
              </div>

              {/* Date of Birth & Country Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Date of Birth <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#6b0f1a] focus:bg-white transition appearance-none"
                    />
                    <Calendar className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Country <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#6b0f1a] focus:bg-white transition appearance-none cursor-pointer"
                    >
                      <option value="Bangladesh">Bangladesh</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="India">India</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Contact Information Divider Section */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-4">
                  <Contact className="w-4 h-4 text-[#6b0f1a]" />
                  <h4 className="text-xs font-extrabold text-gray-900">
                    Contact Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Email <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#6b0f1a] focus:bg-white transition"
                    />
                  </div>

                  {/* Phone Input with BD Flag */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Phone Number <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex items-center bg-gray-50/50 border border-gray-200 rounded-2xl px-3 py-1.5 focus-within:border-[#6b0f1a] focus-within:bg-white transition">
                      <div className="flex items-center gap-1.5 border-r border-gray-200 pr-2 mr-2">
                        {/* BD Flag Visual */}
                        <div className="w-5 h-3.5 bg-emerald-700 rounded-xs relative flex items-center justify-center overflow-hidden">
                          <div className="w-2 h-2 bg-rose-600 rounded-full"></div>
                        </div>
                        <span className="text-xs font-bold text-gray-700">+880</span>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="1XXXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-transparent border-none text-xs font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save & Continue Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={bookingSaving}
                  className="w-full bg-[#6b0f1a] hover:bg-[#520b14] disabled:cursor-wait disabled:opacity-60 text-white font-extrabold py-3.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all text-sm active:scale-[0.99]"
                >
                  {bookingSaving ? "Saving request and opening payment..." : "Save request and continue to payment"}
                </button>
              </div>

            </form>
            )}

          </div>

          {/* RIGHT COLUMN: Sticky Fare Summary Card */}
          <div className="lg:col-span-4 sticky top-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
              
              {/* Timer Progress Bar */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <Clock className="w-4 h-4 text-rose-700" /> Time Remaining
                  </div>
                  <span className="text-base font-black text-gray-900 tracking-wider">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                
                {/* Progress Bar Track */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6b0f1a] transition-all duration-1000"
                    style={{ width: `${(timeLeft / 1160) * 100}%` }}
                  />
                </div>
              </div>

              {/* Fare Summary Body */}
              <div className="p-5 space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Fare Summary
                </h3>

                {/* Route Pill Tag */}
                <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                  <span className="px-3 py-1 bg-rose-50 text-[#6b0f1a] text-xs font-extrabold rounded-full border border-rose-100">
                    {route}
                  </span>
                  
                  {/* Mini Logo */}
                  <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center bg-white">
                    <Plane className="w-3 h-3 text-[#6b0f1a] rotate-45" />
                  </div>
                </div>

                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block">
                  {tripType.toUpperCase()}
                </span>

                {/* Breakdown List */}
                <div className="bg-gray-50/60 p-3.5 rounded-2xl space-y-2.5 text-xs">
                  <div className="font-extrabold text-gray-900 mb-1">
                    {passengerCount} Traveler{passengerCount === 1 ? "" : "s"}
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Total fare</span>
                    <span className="font-bold text-gray-900">{formattedPrice}</span>
                  </div>
                </div>

                {/* Sub Total */}
                <div className="flex justify-between items-center pt-1 text-xs font-bold text-gray-700">
                  <span>Sub Total</span>
                  <span className="text-sm font-black text-gray-900">{formattedPrice}</span>
                </div>
              </div>

              {/* Perforated Ticket Cutout Divider */}
              <div className="relative my-1 border-t border-dashed border-gray-200">
                <div className="w-4 h-4 bg-[#f4f6f9] rounded-full border-r border-gray-200 absolute -left-2 top-1/2 -translate-y-1/2"></div>
                <div className="w-4 h-4 bg-[#f4f6f9] rounded-full border-l border-gray-200 absolute -right-2 top-1/2 -translate-y-1/2"></div>
              </div>

              {/* Ticket Footer / You Pay */}
              <div className="p-5 bg-rose-50/40 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-black text-gray-900">You Pay</span>
                  <span className="text-[10px] text-gray-400 font-semibold">({passengerCount} Traveler{passengerCount === 1 ? "" : "s"})</span>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                    {formattedPrice}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}