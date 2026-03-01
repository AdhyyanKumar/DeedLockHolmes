import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import InteractiveLandingLayer from "../components/InteractiveLandingLayer";

const ROTATING_SIGNALS = ["AI analysis.", "blockchain security.", "Google authentication."];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [signalIndex, setSignalIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSignalIndex((prev) => (prev + 1) % ROTATING_SIGNALS.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[calc(100dvh-5rem)] overflow-hidden bg-[#000000] px-4 py-8 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(110,231,183,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(110,231,183,0.08) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(34,197,94,0.09),transparent_35%),radial-gradient(circle_at_80%_28%,rgba(20,184,166,0.06),transparent_38%),radial-gradient(circle_at_52%_82%,rgba(16,185,129,0.05),transparent_34%)]" />
      <InteractiveLandingLayer />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mt-6 max-w-5xl text-left"
        >
          <div className="relative mt-2">
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl md:text-[4.25rem]">
              <span>
                Register property backed by{" "}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ROTATING_SIGNALS[signalIndex]}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="inline-block min-w-[13ch] text-[#62E6D8]"
                  >
                    {ROTATING_SIGNALS[signalIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
          </div>
          <p className="mt-5 max-w-4xl text-xl text-emerald-50/70 sm:text-2xl">
            Register property deeds with AI verification and immutable on-chain records.
          </p>
          {isAuthenticated ? (
            <div className="mt-10 flex flex-wrap items-center justify-start gap-4">
              <Link
                to="/register"
                className="rounded-full bg-white px-8 py-3 text-base font-semibold text-[#0F3B2E] transition hover:bg-emerald-100"
              >
                Register Property
              </Link>
              <Link
                to="/dashboard"
                className="rounded-full border-2 border-emerald-100/80 bg-transparent px-8 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="mt-10 flex flex-wrap items-center justify-start gap-4">
              <Link
                to="/?auth=login"
                className="rounded-full bg-white px-8 py-3 text-base font-semibold text-[#0F3B2E] transition hover:bg-emerald-100"
              >
                Login
              </Link>
              <Link
                to="/?auth=signup"
                className="rounded-full border-2 border-emerald-100/80 bg-transparent px-8 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Sign Up
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
