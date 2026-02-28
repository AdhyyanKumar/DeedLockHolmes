import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#F8F6F1",
        line: "#E6E1D7",
        brand: "#FF6600",
        brandSoft: "#FFF0E5",
      },
      boxShadow: {
        card: "0 12px 30px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        "2.5xl": "1.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
