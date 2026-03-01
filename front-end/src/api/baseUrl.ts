const EXPLICIT_BASE = import.meta.env.VITE_API_BASE_URL?.trim();

function inferBaseUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3001/api";
    }
  }
  return "https://deed-lock-holmes.vercel.app/api";
}

export const API_BASE_URL = EXPLICIT_BASE || inferBaseUrl();
