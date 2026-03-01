import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyProperties } from "../api/propertyApi";
import PropertyCard from "../components/PropertyCard";
import type { FraudRisk, Property } from "../types/property";

type RiskFilter = "All" | FraudRisk;
type SortBy = "Newest" | "Oldest" | "Highest Confidence";

function MyPropertiesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="h-64 animate-pulse rounded-2.5xl border border-emerald-200/30 bg-white/10 p-5 shadow-card"
        >
          <div className="h-4 w-3/4 rounded bg-emerald-100/25" />
          <div className="mt-3 h-3 w-1/2 rounded bg-emerald-100/25" />
          <div className="mt-6 h-3 w-2/3 rounded bg-emerald-100/25" />
          <div className="mt-2 h-3 w-1/2 rounded bg-emerald-100/25" />
          <div className="mt-2 h-3 w-1/3 rounded bg-emerald-100/25" />
          <div className="mt-6 h-10 rounded-xl bg-emerald-100/25" />
        </div>
      ))}
    </div>
  );
}

export default function MyPropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("All");
  const [sortBy, setSortBy] = useState<SortBy>("Newest");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getMyProperties()
      .then((data) => {
        if (mounted) setItems(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = items.filter((property) => {
      if (riskFilter !== "All" && property.fraudRisk !== riskFilter) return false;
      if (!term) return true;
      return (
        property.address.toLowerCase().includes(term) ||
        property.owner.toLowerCase().includes(term) ||
        (property.accountAddress ?? "").toLowerCase().includes(term)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === "Highest Confidence") {
        return b.confidenceScore - a.confidenceScore;
      }
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortBy === "Oldest" ? diff : -diff;
    });
  }, [items, riskFilter, search, sortBy]);

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

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
            Portfolio View
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            My Properties
          </h1>
        </div>

        <div className="rounded-2.5xl border border-emerald-200/30 bg-white/10 p-4 shadow-card backdrop-blur sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by address, owner, or account"
              className="rounded-xl border border-emerald-200/35 bg-[#0A2E23]/55 px-3 py-2.5 text-sm text-emerald-50 outline-none ring-emerald-200/40 placeholder:text-emerald-200/60 focus:ring"
            />
            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
              className="rounded-xl border border-emerald-200/35 bg-[#0A2E23]/55 px-3 py-2.5 text-sm text-emerald-50 outline-none ring-emerald-200/40 focus:ring"
            >
              <option>All</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              className="rounded-xl border border-emerald-200/35 bg-[#0A2E23]/55 px-3 py-2.5 text-sm text-emerald-50 outline-none ring-emerald-200/40 focus:ring"
            >
              <option>Newest</option>
              <option>Oldest</option>
              <option>Highest Confidence</option>
            </select>
          </div>
        </div>

        {loading ? (
          <MyPropertiesSkeleton />
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2.5xl border border-emerald-200/30 bg-white/10 p-10 text-center shadow-card backdrop-blur">
            <h2 className="text-lg font-semibold text-white">No properties registered yet</h2>
            <p className="mt-2 text-sm text-emerald-50/85">
              Register your first property to see it in your portfolio.
            </p>
            <Link
              to="/register"
              className="mt-4 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0F3B2E] hover:bg-emerald-100"
            >
              Register Property
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredItems.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

