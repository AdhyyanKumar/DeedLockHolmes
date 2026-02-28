import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { beginOAuthLogin } from "../api/authApi";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);

  function onSubmit() {
    setLoading(true);
    beginOAuthLogin("/register");
  }

  return (
    <section className="grid-stage mx-auto max-w-6xl p-6 md:p-10">
      <div className="grid-stage-content grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
            New Operator
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Create your registry account.
          </h1>
          <p className="max-w-xl text-lg text-emerald-50/90">
            Start with Google OAuth, then let the backend persist your profile and
            audit trail in Snowflake.
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
          <h2 className="text-xl font-semibold text-ink">Sign Up</h2>
          <p className="mt-1 text-sm text-slate-500">
            Account creation is handled by Google. After consent, the app stores
            your profile and auth event metadata in Snowflake.
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
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Login
            </Link>
          </p>
        </motion.form>
      </div>
    </section>
  );
}
