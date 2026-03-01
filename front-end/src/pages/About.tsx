import { motion } from "framer-motion";

const creators = [
  {
    name: "Adhyyan Kumar",
    paragraph:
      "Adhyyan leads the frontend experience for DeedLock Holmes, designing and implementing the interface users interact with across registration, browsing, and verification flows. He focuses on clarity, trust signals, and a responsive, polished user journey.",
  },
  {
    name: "Yashovardhan Saraswat",
    paragraph:
      "Yashovardhan owns backend systems and service reliability, including APIs, data persistence, and integration pipelines across Render and supporting services. His work ensures that registration, transfer, and analytics operations are secure, consistent, and production-ready.",
  },
  {
    name: "Ansh Mathur",
    paragraph:
      "Ansh works across the stack, bridging frontend interactions with backend logic to keep features cohesive end to end. He contributes to implementation across UI, API contracts, and application behavior so that product improvements ship quickly and reliably.",
  },
];

export default function AboutPage() {
  return (
    <section className="relative min-h-[calc(100vh-6rem)] overflow-hidden bg-[#000000] px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(110,231,183,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(110,231,183,0.08) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,197,94,0.1),transparent_36%),radial-gradient(circle_at_82%_24%,rgba(20,184,166,0.08),transparent_40%),radial-gradient(circle_at_50%_82%,rgba(16,185,129,0.06),transparent_34%)]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
            About Us
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            What DeedLock Holmes Is About
          </h1>
          <p className="mt-3 max-w-4xl text-base leading-relaxed text-emerald-50/85">
            DeedLock Holmes is built to make property deed registration more trustworthy by
            combining AI-based fraud screening, authenticated user actions, and immutable
            blockchain-backed records. Our goal is to reduce fake deed risk, improve auditability,
            and give buyers, owners, and registrars a transparent source of truth.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {creators.map((creator) => (
            <article
              key={creator.name}
              className="rounded-2.5xl border border-emerald-200/30 bg-white/10 p-5 shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/75 hover:shadow-[0_0_0_1px_rgba(45,212,191,0.35),0_0_28px_rgba(16,185,129,0.22)]"
            >
              <h2 className="text-lg font-semibold text-white">{creator.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-emerald-50/85">{creator.paragraph}</p>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
