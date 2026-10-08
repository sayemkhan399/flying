import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, X } from "lucide-react";
import logo from "../assets/Logo.png";
import useAuth from "../auth/useAuth";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return undefined;

    dialog.showModal();
    return () => dialog.close();
  }, []);

  const closeDialog = () => {
    if (location.state?.backgroundLocation) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const credentials = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      if (isSignUp) {
        await signUp({ ...credentials, name: formData.get("name") });
      } else {
        await signIn(credentials);
      }

      navigate(
        location.state?.from ||
          location.state?.backgroundLocation?.pathname ||
          "/",
        {
        replace: true,
        state: location.state?.bookingState,
        },
      );
    } catch (error) {
      setMessage(error.response?.data?.error || "Could not connect to the account service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMode = () => {
    setIsSignUp((value) => !value);
    setMessage("");
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-title"
      aria-describedby="auth-description"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) closeDialog();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-white/50 bg-white p-6 text-gray-800 shadow-2xl shadow-slate-950/30 backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm sm:p-9"
    >
      <section>
        <div className="mb-7 text-center">
          <button
            type="button"
            onClick={closeDialog}
            aria-label="Close sign in"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <img
            src={logo}
            alt="Flying"
            className="mx-auto mb-4 h-14 w-auto max-w-48 object-contain"
          />
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            <span id="auth-title">
              {isSignUp ? "Create your account" : "Welcome back"}
            </span>
          </h1>
          <p id="auth-description" className="mt-2 text-sm leading-6 text-gray-500">
            {isSignUp
              ? "Create an account to make planning your trips easier."
              : "Sign in to continue planning your next trip."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isSignUp && (
            <div>
              <label htmlFor="auth-name" className="mb-1.5 block text-sm font-bold text-gray-700">
                Full name
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-rose-700 focus:bg-white focus:ring-2 focus:ring-rose-100"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-sm font-bold text-gray-700">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-rose-700 focus:bg-white focus:ring-2 focus:ring-rose-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-sm font-bold text-gray-700">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={8}
                required
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-rose-700 focus:bg-white focus:ring-2 focus:ring-rose-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-900"
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                  : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {message && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-800">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-rose-900 py-3 text-sm font-extrabold text-white transition hover:bg-rose-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-900 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? "Already have an account?" : "New to Flying?"}{" "}
          <button
            type="button"
            onClick={changeMode}
            className="font-bold text-rose-900 hover:text-rose-700"
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </button>
        </p>

      </section>
    </dialog>
  );
}
