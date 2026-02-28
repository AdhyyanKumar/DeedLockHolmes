import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, User2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupMock } from "../api/authApi";
import { useAuth } from "../components/AuthProvider";
import { showToast } from "../utils/toast";

export default function SignupPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    const user = await signupMock(name, email);
    setUser(user);
    setLoading(false);
    showToast(`Account created for ${user.name}`);
    navigate("/register");
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
            Start registering deeds, monitor fraud risk, and track immutable records
            in a single trusted dashboard.
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={onSubmit}
          className="rounded-2.5xl border border-emerald-200/30 bg-white/95 p-6 shadow-card sm:p-8"
        >
          <h2 className="text-xl font-semibold text-ink">Sign Up</h2>
          <p className="mt-1 text-sm text-slate-500">Mock auth for MVP frontend demo.</p>

        <label className="mt-6 block text-sm text-slate-700">
          Full Name
          <span className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-[#FCFBF8] px-3 py-2.5">
            <User2 className="h-4 w-4 text-slate-500" />
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              type="text"
              placeholder="Alex Morgan"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
            />
          </span>
        </label>

        <label className="mt-4 block text-sm text-slate-700">
          Email
          <span className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-[#FCFBF8] px-3 py-2.5">
            <Mail className="h-4 w-4 text-slate-500" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="you@company.com"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
            />
          </span>
        </label>

        <label className="mt-4 block text-sm text-slate-700">
          Password
          <span className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-[#FCFBF8] px-3 py-2.5">
            <Lock className="h-4 w-4 text-slate-500" />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Create password"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
            />
          </span>
        </label>

        <button
          disabled={!name || !email || !password || loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-[#e85d00] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {loading ? "Creating account..." : "Create Account"}
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
