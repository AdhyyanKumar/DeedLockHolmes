export interface AuthUser {
  provider: string;
  providerUserId: string;
  name: string;
  email: string;
  picture?: string;
  emailVerified?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function beginOAuthLogin(redirectPath = "/register") {
  const params = new URLSearchParams({ redirect: redirectPath });
  window.location.href = `${API_BASE_URL}/auth/google/start?${params.toString()}`;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const payload = await apiFetch<{ authenticated: boolean; user?: AuthUser }>("/auth/me", {
      headers: {},
    });
    return payload.authenticated ? payload.user ?? null : null;
  } catch {
    return null;
  }
}

export async function logoutUser() {
  await apiFetch<{ ok: boolean }>("/auth/logout", {
    method: "POST",
  });
}
