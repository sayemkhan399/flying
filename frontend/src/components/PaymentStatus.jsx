import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import api from "../api";

export default function PaymentStatus() {
  const location = useLocation();
  const cancelled = location.pathname.endsWith("/cancelled");
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id");
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(!cancelled && Boolean(sessionId));
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cancelled) return undefined;
    let active = true;

    if (!sessionId) return undefined;

    api.get(`/api/payments/checkout-session/${encodeURIComponent(sessionId)}`)
      .then(({ data }) => {
        if (active) setPayment(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.error ||
            "Could not verify your payment. Refresh this page to try again.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cancelled, sessionId]);

  const bookingId = payment?.bookingId || params.get("booking_id");
  const paymentReferenceMissing = !cancelled && !sessionId;

  const continuePayment = async () => {
    if (!bookingId) return;
    setError("");
    setCheckoutLoading(true);
    try {
      const { data } = await api.post(`/api/bookings/${bookingId}/checkout`);
      if (typeof data.checkoutUrl !== "string") {
        throw new Error("The payment service returned an invalid checkout link.");
      }
      window.location.assign(data.checkoutUrl);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
        requestError.message ||
        "Could not start secure payment. Please try again.",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const paid = payment?.paymentStatus === "paid";
  const amount = payment?.amountTotal != null && payment?.currency
    ? (() => {
        const currency = payment.currency.toUpperCase();
        const fractionDigits = new Intl.NumberFormat("en", {
          style: "currency",
          currency,
        }).resolvedOptions().maximumFractionDigits;
        return new Intl.NumberFormat("en", {
          style: "currency",
          currency,
        }).format(payment.amountTotal / (10 ** fractionDigits));
      })()
    : null;

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f4f6f9] px-4 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-9">
        {loading && !cancelled ? (
          <>
            <h1 className="text-xl font-black text-gray-900">Verifying your payment</h1>
            <p className="mt-2 text-sm text-gray-600" role="status">Please wait while Stripe confirms the payment...</p>
          </>
        ) : (
          <>
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              <span className="text-2xl font-black">{paid ? "✓" : "!"}</span>
            </div>
            <h1 className="mt-4 text-2xl font-black text-gray-900">
              {cancelled ? "Payment not completed" : paid ? "Payment received" : "Payment not confirmed"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {cancelled
                ? "Checkout was cancelled. Your booking request is still saved, and you can return to Stripe to try again."
                : paid
                  ? "Stripe confirmed your payment. This pays for a booking request only; your flight is not ticketed or confirmed."
                  : "Stripe has not confirmed payment for this request. You can retry checkout or review the request in your profile."}
            </p>
            {amount && <p className="mt-4 text-lg font-extrabold text-gray-900">{amount}</p>}
            {bookingId && (
              <p className="mt-3 break-all font-mono text-xs text-gray-500">
                Booking reference: {bookingId}
              </p>
            )}
            {(error || paymentReferenceMissing) && (
              <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
                {error || "The payment reference is missing. Check your booking history for the latest status."}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {!paid && bookingId && (
                <button
                  type="button"
                  onClick={continuePayment}
                  disabled={checkoutLoading}
                  className="rounded-full bg-[#6b0f1a] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#520b14] disabled:cursor-wait disabled:opacity-60"
                >
                  {checkoutLoading ? "Opening secure payment..." : "Continue to payment"}
                </button>
              )}
              <Link
                to="/profile"
                className="rounded-full border border-gray-200 px-5 py-3 text-sm font-extrabold text-gray-700 transition hover:bg-gray-50"
              >
                View booking history
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
