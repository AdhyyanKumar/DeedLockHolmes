import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { beginOAuthLogin } from "../api/authApi";
import { useAuth } from "../components/AuthProvider";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirectTo =
        (location.state as { from?: string } | null)?.from ?? "/register";
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, location.state, navigate]);

  function onSubmit() {
    setLoading(true);
    const redirectTo =
      (location.state as { from?: string } | null)?.from ?? "/register";
    beginOAuthLogin(redirectTo);
  }

  return (
    <section className="grid-stage mx-auto max-w-6xl p-6 md:p-10">
      <div className="grid-stage-content grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
            Official Access
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Secure registry sign in.
          </h1>
          <p className="max-w-xl text-lg text-emerald-50/90">
            Access your property records, fraud intelligence, and immutable account
            mappings with your Google account.
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="rounded-2.5xl border border-emerald-200/30 bg-white/95 p-6 shadow-card sm:p-8"
        >
          <h2 className="text-xl font-semibold text-ink">Login</h2>
          <p className="mt-1 text-sm text-slate-500">
            Google OAuth is now the only sign-in method for the registry.
          </p>

        <button
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-[#e85d00] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {loading ? "Redirecting..." : "Continue with Google"}
          <ArrowRight className="h-4 w-4" />
        </button>

          <p className="mt-4 text-sm text-slate-600">
            Need an account?{" "}
            <Link to="/signup" className="font-semibold text-brand hover:underline">
              Review access
            </Link>
          </p>
        </motion.form>
      </div>
    </section>
  );
}
