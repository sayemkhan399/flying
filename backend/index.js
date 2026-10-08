const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Duffel } = require("@duffel/api");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 5001;
const mongoUrl = process.env.MONGO_URL;
const client = mongoUrl ? new MongoClient(mongoUrl) : null;
const jwtSecret = process.env.JWT_SECRET;
const authConfigured = typeof jwtSecret === "string" && Buffer.byteLength(jwtSecret) >= 32;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const frontendUrl = (process.env.FRONTEND_ORIGIN || "http://localhost:5173").replace(/\/+$/, "");
let mongoConnected = false;
let mongoConnectionPromise = null;
const duffel = process.env.DUFFEL_ACCESS_TOKEN
  ? new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN })
  : null;

if (!duffel) {
  console.warn("Flight search is disabled: DUFFEL_ACCESS_TOKEN is not configured.");
}

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());
app.use(async (req, res, next) => {
  if (!client || mongoConnected) return next();

  try {
    await connectToMongoDB();
  } catch {
    // Database-backed routes return their existing unavailable response.
  }
  return next();
});

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe || !stripeWebhookSecret) {
    return res.status(503).json({ error: "Stripe webhooks are not configured." });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      stripeWebhookSecret,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error.message);
    return res.status(400).json({ error: "Invalid Stripe webhook signature." });
  }

  const db = requireDatabase(res);
  if (!db) return;

  const session = event.data.object;
  const bookingId = session.metadata?.bookingId;
  const userId = session.metadata?.userId;
  if (!ObjectId.isValid(bookingId ?? "") || !ObjectId.isValid(userId ?? "")) {
    return res.status(400).json({ error: "Stripe event is missing a valid booking or user reference." });
  }

  try {
    if (event.type === "checkout.session.completed" && session.payment_status === "paid") {
      await db.collection("bookings").updateOne(
        {
          _id: new ObjectId(bookingId),
          userId: new ObjectId(userId),
          stripeCheckoutSessionId: session.id,
          paymentStatus: { $ne: "paid" },
        },
        { $set: { paymentStatus: "paid", paidAt: new Date() } },
      );
    } else if (event.type === "checkout.session.expired") {
      await db.collection("bookings").updateOne(
        {
          _id: new ObjectId(bookingId),
          userId: new ObjectId(userId),
          stripeCheckoutSessionId: session.id,
          paymentStatus: { $ne: "paid" },
        },
        { $set: { paymentStatus: "unpaid" } },
      );
    }
    return res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);
    return res.status(500).json({ error: "Could not process the Stripe event." });
  }
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    duffelConfigured: Boolean(duffel),
    databaseConnected: mongoConnected,
    authConfigured,
    stripeConfigured: Boolean(stripe),
  });
});

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getDuffelErrorInfo(error) {
  return {
    status: error?.meta?.status ?? error?.status ?? null,
    requestId: error?.meta?.request_id ?? null,
    code: error?.errors?.[0]?.code ?? null,
    message: error?.errors?.map((item) => item.message).filter(Boolean).join(" ") ?? "",
  };
}

function isTransientDuffelError(error) {
  const { status, code } = getDuffelErrorInfo(error);
  return status === 429 || status >= 500 ||
    ["rate_limit_exceeded", "service_unavailable"].includes(code);
}

async function getCurrentDuffelOffer(offerId) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return (await duffel.offers.get(offerId)).data;
    } catch (error) {
      if (!isTransientDuffelError(error) || attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 400));
    }
  }
}

function getDatabase() {
  if (!client || !mongoConnected) return null;
  return client.db();
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

function setSessionCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, jwtSecret, {
    expiresIn: "7d",
    issuer: "flying-api",
    audience: "flying-web",
  });

  res.cookie("flying_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function requireAuth(req, res, next) {
  if (!authConfigured) {
    return res.status(503).json({ error: "Authentication is not configured. Set a JWT_SECRET of at least 32 bytes in the backend environment." });
  }

  const token = req.cookies?.flying_session;
  if (!token) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }

  try {
    const payload = jwt.verify(token, jwtSecret, {
      issuer: "flying-api",
      audience: "flying-web",
    });
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return res.status(401).json({ error: "Your session is invalid. Please sign in again." });
    }
    req.userId = payload.sub;
    return next();
  } catch {
    res.clearCookie("flying_session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

function requireDatabase(res) {
  const db = getDatabase();
  if (!db) {
    res.status(503).json({ error: "Database is unavailable. Check MONGO_URL and the MongoDB connection." });
    return null;
  }
  return db;
}

app.get("/api/auth/me", (req, res) => {
  if (!authConfigured || !req.cookies?.flying_session) {
    return res.json({ user: null });
  }

  let payload;
  try {
    payload = jwt.verify(req.cookies.flying_session, jwtSecret, {
      issuer: "flying-api",
      audience: "flying-web",
    });
  } catch {
    res.clearCookie("flying_session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
    return res.json({ user: null });
  }

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    return res.json({ user: null });
  }

  const db = requireDatabase(res);
  if (!db) return;

  return db.collection("users").findOne(
    { _id: new ObjectId(payload.sub) },
    { projection: { name: 1, email: 1 } },
  ).then((user) => {
    if (!user) {
      res.clearCookie("flying_session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
      return res.json({ user: null });
    }
    return res.json({ user: publicUser(user) });
  }).catch((error) => {
    console.error("Failed to load authenticated user:", error);
    return res.status(500).json({ error: "Unable to load your account." });
  });
});

app.post("/api/auth/signup", async (req, res) => {
  if (!authConfigured) {
    return res.status(503).json({ error: "Authentication is not configured. Set a JWT_SECRET of at least 32 bytes in the backend environment." });
  }
  const db = requireDatabase(res);
  if (!db) return;

  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body?.password;
  if (name.length < 2 || name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ error: "Enter a name, a valid email, and a password of 8–72 bytes." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
      name,
      email,
      passwordHash,
      createdAt: new Date(),
    };
    const result = await db.collection("users").insertOne(user);
    user._id = result.insertedId;
    setSessionCookie(res, user._id.toString());
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists. Sign in instead." });
    }
    console.error("Account creation failed:", error);
    return res.status(500).json({ error: "Unable to create your account right now." });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  if (!authConfigured) {
    return res.status(503).json({ error: "Authentication is not configured. Set a JWT_SECRET of at least 32 bytes in the backend environment." });
  }
  const db = requireDatabase(res);
  if (!db) return;

  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body?.password;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== "string") {
    return res.status(400).json({ error: "Enter a valid email and password." });
  }

  try {
    const user = await db.collection("users").findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    setSessionCookie(res, user._id.toString());
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Sign in failed:", error);
    return res.status(500).json({ error: "Unable to sign in right now." });
  }
});

app.post("/api/auth/signout", (req, res) => {
  res.clearCookie("flying_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return res.json({ success: true });
});

app.post("/api/bookings", requireAuth, async (req, res) => {
  const db = requireDatabase(res);
  if (!db) return;
  if (!stripe) {
    return res.status(503).json({ error: "Payments are not configured. Set STRIPE_SECRET_KEY in the backend environment." });
  }
  if (!duffel) {
    return res.status(503).json({ error: "Flight price verification is unavailable. Set DUFFEL_ACCESS_TOKEN in the backend environment." });
  }

  const { flight, search, passenger } = req.body ?? {};
  const name = typeof passenger?.firstName === "string" ? passenger.firstName.trim() : "";
  const surname = typeof passenger?.lastName === "string" ? passenger.lastName.trim() : "";
  const email = typeof passenger?.email === "string" ? passenger.email.trim().toLowerCase() : "";
  const phone = typeof passenger?.phone === "string" ? passenger.phone.trim() : "";
  const country = typeof passenger?.country === "string" ? passenger.country.trim() : "";

  if (!flight || typeof flight.id !== "string" || flight.id.length > 100 ||
      typeof flight.airline !== "string" || flight.airline.length > 150 ||
      typeof flight.numericPrice !== "number" || !Number.isFinite(flight.numericPrice) || flight.numericPrice < 0 ||
      typeof flight.currency !== "string" || !/^[A-Z]{3}$/.test(flight.currency) ||
      typeof flight.departure?.code !== "string" || !/^[A-Z]{3}$/.test(flight.departure.code) ||
      typeof flight.arrival?.code !== "string" || !/^[A-Z]{3}$/.test(flight.arrival.code)) {
    return res.status(400).json({ error: "The selected flight details are invalid. Search again and select an available flight." });
  }

  if (!["Mr", "Mrs", "Ms"].includes(passenger?.title) ||
      name.length < 1 || name.length > 100 ||
      surname.length > 100 ||
      (!passenger.singleName && surname.length < 1) ||
      !isValidDate(passenger.dob) || passenger.dob > new Date().toISOString().slice(0, 10) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\+?[0-9\s()-]{7,24}$/.test(phone) || country.length < 2 || country.length > 100) {
    return res.status(400).json({ error: "Complete all required passenger and contact details with valid values." });
  }

  const searchSnapshot = {
    origin: search?.origin,
    destination: search?.destination,
    departureDate: search?.departureDate,
    returnDate: search?.returnDate || null,
    tripType: search?.tripType,
    cabinClass: search?.cabinClass,
    passengers: search?.passengers,
  };
  if (!/^[A-Z]{3}$/.test(searchSnapshot.origin ?? "") ||
      !/^[A-Z]{3}$/.test(searchSnapshot.destination ?? "") ||
      !isValidDate(searchSnapshot.departureDate) ||
      !["One Way", "Round Trip"].includes(searchSnapshot.tripType) ||
      !["Economy", "Premium Economy", "Business", "First Class"].includes(searchSnapshot.cabinClass) ||
      flight.departure.code !== searchSnapshot.origin ||
      flight.arrival.code !== searchSnapshot.destination ||
      (searchSnapshot.tripType === "Round Trip" &&
        (!isValidDate(searchSnapshot.returnDate) || searchSnapshot.returnDate < searchSnapshot.departureDate)) ||
      (searchSnapshot.tripType === "One Way" && searchSnapshot.returnDate)) {
    return res.status(400).json({ error: "The flight search details are missing or invalid. Search again before booking." });
  }

  try {
    let currentOffer;
    try {
      currentOffer = await getCurrentDuffelOffer(flight.id);
    } catch (error) {
      const details = getDuffelErrorInfo(error);
      console.error("Duffel could not verify the selected offer:", details);
      if (isTransientDuffelError(error)) {
        return res.status(503).json({
          error: "Duffel is temporarily unavailable while checking this fare. Please try again shortly.",
          requestId: details.requestId,
        });
      }
      if (![404, 409, 422].includes(details.status)) {
        return res.status(502).json({
          error: details.message || "Duffel could not verify this fare. Please try again.",
          requestId: details.requestId,
        });
      }
      return res.status(409).json({ error: "This flight offer is no longer available. Search again before booking." });
    }

    const currentPrice = Number(currentOffer.total_amount);
    const currency = currentOffer.total_currency;
    if (!Number.isFinite(currentPrice) || currentPrice <= 0 ||
        typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
      return res.status(409).json({ error: "The flight offer has an invalid price. Search again before booking." });
    }
    if (currentPrice !== flight.numericPrice || currency !== flight.currency) {
      return res.status(409).json({ error: "The fare has changed since your search. Return to the results and select the updated fare." });
    }

    const booking = {
      userId: new ObjectId(req.userId),
      status: "request_saved",
      paymentStatus: "unpaid",
      offerId: flight.id,
      flight: {
        airline: flight.airline,
        airlineCode: typeof flight.airlineCode === "string" ? flight.airlineCode : "",
        code: typeof flight.code === "string" ? flight.code : "",
        route: `${flight.departure.code} → ${flight.arrival.code}`,
        departure: flight.departure,
        arrival: flight.arrival,
        returnFlight: flight.returnFlight ?? null,
        duration: typeof flight.duration === "string" ? flight.duration : "",
        stops: typeof flight.stops === "string" ? flight.stops : "",
        price: currentPrice,
        currency,
      },
      search: searchSnapshot,
      passenger: {
        title: passenger.title,
        firstName: name,
        lastName: surname,
        singleName: Boolean(passenger.singleName),
        dateOfBirth: passenger.dob,
        country,
        email,
        phone,
      },
      createdAt: new Date(),
    };
    const result = await db.collection("bookings").insertOne(booking);
    return res.status(201).json({
      booking: {
        id: result.insertedId.toString(),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      },
      message: "Booking request saved. Continue to secure payment; payment does not confirm ticketing.",
    });
  } catch (error) {
    console.error("Booking request could not be saved:", error);
    return res.status(500).json({ error: "Unable to save your booking request right now." });
  }
});

app.post("/api/bookings/:bookingId/checkout", requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Payments are not configured. Set STRIPE_SECRET_KEY in the backend environment." });
  }
  if (!ObjectId.isValid(req.params.bookingId)) {
    return res.status(400).json({ error: "The booking reference is invalid." });
  }

  const db = requireDatabase(res);
  if (!db) return;

  try {
    const bookingId = new ObjectId(req.params.bookingId);
    const booking = await db.collection("bookings").findOne({
      _id: bookingId,
      userId: new ObjectId(req.userId),
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking request not found." });
    }
    if (booking.paymentStatus === "paid") {
      return res.status(409).json({ error: "This booking request has already been paid." });
    }

    if (booking.stripeCheckoutSessionId) {
      const existingSession = await stripe.checkout.sessions.retrieve(booking.stripeCheckoutSessionId);
      if (existingSession.status === "open" && existingSession.url) {
        return res.json({ checkoutUrl: existingSession.url });
      }
      if (existingSession.payment_status === "paid") {
        await db.collection("bookings").updateOne(
          {
            _id: bookingId,
            userId: new ObjectId(req.userId),
            paymentStatus: { $ne: "paid" },
          },
          { $set: { paymentStatus: "paid", paidAt: new Date() } },
        );
        return res.status(409).json({ error: "This booking request has already been paid." });
      }
    }

    const stripeCurrency = booking.flight.currency.toLowerCase();
    const fractionDigits = new Intl.NumberFormat("en", {
      style: "currency",
      currency: booking.flight.currency,
    }).resolvedOptions().maximumFractionDigits;
    const amount = Math.round(booking.flight.price * (10 ** fractionDigits));
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 99_999_999) {
      return res.status(400).json({ error: "This fare cannot be processed by Stripe in its current currency." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: stripeCurrency,
          product_data: {
            name: `Flight booking request ${bookingId}`,
            description: booking.flight.route,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      customer_email: booking.passenger.email,
      metadata: {
        bookingId: bookingId.toString(),
        userId: req.userId,
      },
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancelled?booking_id=${bookingId}`,
    }, {
      idempotencyKey: `booking-${bookingId}-${booking.checkoutAttempt ?? 0}`,
    });
    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    await db.collection("bookings").updateOne(
      { _id: bookingId, userId: new ObjectId(req.userId) },
      {
        $set: {
          stripeCheckoutSessionId: session.id,
          paymentStatus: "checkout_pending",
        },
        $inc: { checkoutAttempt: 1 },
      },
    );

    return res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Stripe Checkout session creation failed:", error);
    return res.status(502).json({ error: "Could not start secure payment. Please try again." });
  }
});

app.get("/api/payments/checkout-session/:sessionId", requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Payments are not configured." });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (session.metadata?.userId !== req.userId ||
        !ObjectId.isValid(session.metadata?.bookingId ?? "")) {
      return res.status(404).json({ error: "Payment session not found." });
    }

    const db = requireDatabase(res);
    if (!db) return;
    const bookingId = new ObjectId(session.metadata.bookingId);
    const booking = await db.collection("bookings").findOne({
      _id: bookingId,
      userId: new ObjectId(req.userId),
      stripeCheckoutSessionId: session.id,
    });
    if (!booking) {
      return res.status(404).json({ error: "Payment session not found." });
    }

    if (session.payment_status === "paid") {
      await db.collection("bookings").updateOne(
        {
          _id: bookingId,
          userId: new ObjectId(req.userId),
          paymentStatus: { $ne: "paid" },
        },
        { $set: { paymentStatus: "paid", paidAt: new Date() } },
      );
    }

    return res.json({
      bookingId: bookingId.toString(),
      paymentStatus: session.payment_status === "paid" ? "paid" : "unpaid",
      ticketStatus: booking.status,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (error) {
    console.error("Stripe Checkout session verification failed:", error);
    return res.status(502).json({ error: "Could not verify payment status. Refresh this page to try again." });
  }
});

app.get("/api/bookings", requireAuth, async (req, res) => {
  const db = requireDatabase(res);
  if (!db) return;

  try {
    const bookings = await db.collection("bookings")
      .find({ userId: new ObjectId(req.userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    return res.json({
      bookings: bookings      .map(({ _id, status, paymentStatus, flight, search, passenger, createdAt, paidAt }) => ({
        id: _id.toString(),
        status,
        paymentStatus: paymentStatus ?? "unpaid",
        flight,
        search,
        passenger,
        createdAt,
        paidAt: paidAt ?? null,
      })),
    });
  } catch (error) {
    console.error("Could not retrieve user bookings:", error);
    return res.status(500).json({ error: "Unable to load your bookings right now." });
  }
});

function validateSearch(body) {
  const { origin, destination, departureDate, returnDate, passengers, cabinClass, tripType } = body ?? {};

  if (!/^[A-Z]{3}$/.test(origin ?? "") || !/^[A-Z]{3}$/.test(destination ?? "") || origin === destination) {
    return "Choose different origin and destination airports using their 3-letter IATA codes.";
  }

  if (!isValidDate(departureDate) || Date.parse(`${departureDate}T00:00:00Z`) < Date.now() - 86_400_000) {
    return "Choose a valid departure date that is not in the past.";
  }

  if (returnDate && (!isValidDate(returnDate) || returnDate < departureDate)) {
    return "Choose a valid return date on or after the departure date.";
  }

  if (tripType === "Round Trip" && !returnDate) {
    return "Choose a return date for a round-trip search.";
  }

  if (tripType === "Multi City") {
    return "Multi-city flight searches are not supported yet.";
  }

  if (!["One Way", "Round Trip"].includes(tripType) || (tripType === "One Way" && returnDate)) {
    return "Choose a one-way or round-trip search.";
  }

  const adults = passengers?.adults;
  const childAges = passengers?.childAges ?? [];
  const infantAges = passengers?.infantAges ?? [];
  const agesAreValid = (ages, min, max) =>
    Array.isArray(ages) && ages.every((age) => Number.isInteger(age) && age >= min && age <= max);

  if (!Number.isInteger(adults) || adults < 1 ||
      !agesAreValid(childAges, 2, 17) || !agesAreValid(infantAges, 0, 1)) {
    return "Enter valid passenger counts and ages for every child and infant.";
  }

  if (adults + childAges.length + infantAges.length > 9) {
    return "Duffel flight searches support up to 9 passengers.";
  }

  if (infantAges.length > adults) {
    return "There cannot be more infants than adults.";
  }

  if (!["Economy", "Premium Economy", "Business", "First Class"].includes(cabinClass)) {
    return "Choose a valid cabin class.";
  }

  return null;
}

function getDurationMinutes(duration) {
  const parts = duration?.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!parts) return 0;
  return Number(parts[1] ?? 0) * 1440 +
    Number(parts[2] ?? 0) * 60 +
    Number(parts[3] ?? 0);
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return [hours ? `${hours} hour${hours === 1 ? "" : "s"}` : "", remainingMinutes ? `${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}` : ""]
    .filter(Boolean)
    .join(" ") || "Duration unavailable";
}

function formatFlightDate(dateTime) {
  const date = dateTime?.slice(0, 10);
  if (!date) return "Date unavailable";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatFlightTime(dateTime) {
  return dateTime?.match(/T(\d{2}:\d{2})/)?.[1] ?? "--:--";
}

function mapOffer(offer) {
  const slice = offer.slices?.[0];
  const returnSlice = offer.slices?.[1];
  const segments = slice?.segments ?? [];
  const returnSegments = returnSlice?.segments ?? [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const firstReturnSegment = returnSegments[0];
  const lastReturnSegment = returnSegments[returnSegments.length - 1];
  const durationMinutes = getDurationMinutes(slice?.duration);
  const returnDurationMinutes = getDurationMinutes(returnSlice?.duration);
  const numericPrice = Number(offer.total_amount);

  return {
    id: offer.id,
    airline: offer.owner?.name ?? "Airline",
    airlineCode: offer.owner?.iata_code ?? "",
    code: segments.map((segment) =>
      `${segment.marketing_carrier?.iata_code ?? ""}-${segment.marketing_carrier_flight_number ?? ""}`
    ).join(" / "),
    logoUrl: offer.owner?.logo_symbol_url ?? "",
    departure: {
      date: formatFlightDate(firstSegment?.departing_at),
      time: formatFlightTime(firstSegment?.departing_at),
      rawTime: Number(formatFlightTime(firstSegment?.departing_at).replace(":", "")),
      code: firstSegment?.origin?.iata_code ?? slice?.origin?.iata_code ?? "",
    },
    returnFlight: returnSlice ? {
      date: formatFlightDate(firstReturnSegment?.departing_at),
      departureTime: formatFlightTime(firstReturnSegment?.departing_at),
      origin: firstReturnSegment?.origin?.iata_code ?? returnSlice.origin?.iata_code ?? "",
      arrivalTime: formatFlightTime(lastReturnSegment?.arriving_at),
      destination: lastReturnSegment?.destination?.iata_code ?? returnSlice.destination?.iata_code ?? "",
      duration: formatDuration(returnDurationMinutes),
      stops: returnSegments.length <= 1
        ? "Non stop"
        : `${returnSegments.length - 1} Stop${returnSegments.length > 2 ? "s" : ""}`,
    } : null,
    arrival: {
      date: formatFlightDate(lastSegment?.arriving_at),
      time: formatFlightTime(lastSegment?.arriving_at),
      code: lastSegment?.destination?.iata_code ?? slice?.destination?.iata_code ?? "",
    },
    duration: formatDuration(durationMinutes),
    durationMinutes,
    stops: segments.length <= 1 ? "Non stop" : `${segments.length - 1} Stop${segments.length > 2 ? "s" : ""}`,
    refundable: offer.conditions?.refund_before_departure?.allowed ? "Refundable" : "See fare conditions",
    isRefundable: Boolean(offer.conditions?.refund_before_departure?.allowed),
    seatsLeft: "",
    baggage: "See fare conditions",
    currency: offer.total_currency,
    numericPrice: Number.isFinite(numericPrice) ? numericPrice : 0,
    price: Number.isFinite(numericPrice)
      ? new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(numericPrice)
      : offer.total_amount,
    originalPrice: "",
    timeSlot: (() => {
      const hour = Number(formatFlightTime(firstSegment?.departing_at).slice(0, 2));
      if (hour < 6) return "night";
      if (hour < 12) return "morning";
      if (hour < 18) return "afternoon";
      return "evening";
    })(),
  };
}

app.post("/api/flights/search", async (req, res) => {
  const validationError = validateSearch(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  if (!duffel) {
    return res.status(503).json({
      error: "Flight search is not configured. Set DUFFEL_ACCESS_TOKEN in the backend environment.",
    });
  }

  const { origin, destination, departureDate, returnDate, passengers, cabinClass } = req.body;
  const cabinClasses = {
    Economy: "economy",
    "Premium Economy": "premium_economy",
    Business: "business",
    "First Class": "first",
  };
  const duffelPassengers = [
    ...Array.from({ length: passengers.adults }, () => ({ type: "adult" })),
    ...passengers.childAges.map((age) => ({ age })),
    ...passengers.infantAges.map((age) => ({ age })),
  ];
  const slices = [{ origin, destination, departure_date: departureDate }];

  if (returnDate) {
    slices.push({ origin: destination, destination: origin, departure_date: returnDate });
  }

  try {
    const response = await duffel.offerRequests.create({
      slices,
      passengers: duffelPassengers,
      cabin_class: cabinClasses[cabinClass],
      return_offers: true,
    });
    const flights = (response.data.offers ?? [])
      .map(mapOffer)
      .sort((a, b) => a.numericPrice - b.numericPrice);

    return res.json({ flights });
  } catch (error) {
    const details = getDuffelErrorInfo(error);
    console.error("Duffel flight search failed:", details);
    const status = isTransientDuffelError(error) ? 503 : 502;
    return res.status(status).json({
      error: details.message ||
        "Duffel could not complete the flight search. Check the search details and try again.",
      requestId: details.requestId,
    });
  }
});

async function connectToMongoDB() {
  if (!client) {
    throw new Error("MONGO_URL is not set in the backend environment");
  }
  if (mongoConnected) return client;
  if (mongoConnectionPromise) return mongoConnectionPromise;

  mongoConnectionPromise = (async () => {
    try {
      await client.connect();
      await client.db().collection("users").createIndex({ email: 1 }, { unique: true });
      await client.db().collection("bookings").createIndex({ userId: 1, createdAt: -1 });
      mongoConnected = true;
      console.log("You successfully connected to MongoDB!");
      return client;
    } catch (err) {
      console.error("Failed to connect to MongoDB:", err);
      throw err;
    } finally {
      mongoConnectionPromise = null;
    }
  })();
  return mongoConnectionPromise;
}

async function disconnectFromMongoDB() {
  if (client) await client.close();
  mongoConnected = false;
  mongoConnectionPromise = null;
}

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    if (!client) {
      console.warn("MongoDB is not configured; flight search can still be used.");
      return;
    }

    connectToMongoDB().catch((err) => {
      console.error("MongoDB is unavailable; flight search can still be used, but database-backed operations may fail:", err);
    });
  });
}

module.exports = { app, connectToMongoDB, disconnectFromMongoDB };
