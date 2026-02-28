import { motion } from "framer-motion";
import { Link } from "react-router-dom";
export default function LandingPage() {
  return (
    <section className="relative min-h-[calc(100vh-6rem)] overflow-hidden bg-[#0F3B2E] px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(rgba(167,243,208,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(167,243,208,0.18) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(52,211,153,0.25),transparent_35%),radial-gradient(circle_at_80%_28%,rgba(16,185,129,0.2),transparent_38%),radial-gradient(circle_at_52%_82%,rgba(20,184,166,0.14),transparent_34%)]" />
      <div className="mx-auto grid w-full max-w-7xl place-items-center gap-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mt-10 max-w-4xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
            Property Registry
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Register property deeds with confidence.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-emerald-50/90 sm:text-2xl">
            Register property deeds with AI verification and immutable on-chain records.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="rounded-full bg-white px-8 py-3 text-base font-semibold text-[#0F3B2E] transition hover:bg-emerald-100"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-full border-2 border-emerald-100/80 bg-transparent px-8 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Sign Up
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
