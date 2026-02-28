const crypto = require("crypto");

const SESSION_COOKIE_NAME = "deedlock_session";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getBaseUrl(req) {
  return process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
}

function getFrontendUrl() {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

function getGoogleRedirectUri(req) {
  return process.env.GOOGLE_REDIRECT_URI || `${getBaseUrl(req)}/api/auth/google/callback`;
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${value}`];
  if (options.httpOnly !== false) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};

  return header.split(";").reduce((cookies, part) => {
    const [rawName, ...rest] = part.trim().split("=");
    cookies[rawName] = decodeURIComponent(rest.join("="));
    return cookies;
  }, {});
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET");
  }
  return secret;
}

function createSignedPayload(payload, ttlMs) {
  const body = JSON.stringify({
    ...payload,
    exp: Date.now() + ttlMs,
  });
  const encoded = base64UrlEncode(body);
  const signature = signValue(encoded, getSessionSecret());
  return `${encoded}.${signature}`;
}

function verifySignedPayload(token) {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = signValue(encoded, getSessionSecret());
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  const parsed = JSON.parse(base64UrlDecode(encoded));
  if (!parsed.exp || parsed.exp < Date.now()) return null;
  return parsed;
}

function buildGoogleAuthUrl(req, redirectPath = "/register") {
  const state = createSignedPayload(
    {
      redirectPath,
      nonce: crypto.randomUUID(),
      iat: Date.now(),
    },
    OAUTH_STATE_TTL_MS,
  );

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: getGoogleRedirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(req, code) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: getGoogleRedirectUri(req),
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed with ${response.status}`);
  }

  return response.json();
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Google userinfo failed with ${response.status}`);
  }

  const profile = await response.json();
  return {
    provider: "google",
    provider_user_id: String(profile.sub || ""),
    email: String(profile.email || ""),
    name: String(profile.name || profile.email || "Unknown User"),
    given_name: String(profile.given_name || ""),
    family_name: String(profile.family_name || ""),
    picture: String(profile.picture || ""),
    email_verified: Boolean(profile.email_verified),
  };
}

function createSessionCookieValue(user) {
  return createSignedPayload(
    {
      sub: user.provider_user_id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider,
      email_verified: user.email_verified,
    },
    SESSION_TTL_MS,
  );
}

function readSession(req) {
  const cookies = parseCookies(req);
  return verifySignedPayload(cookies[SESSION_COOKIE_NAME]);
}

function setSessionCookie(res, user) {
  const secure =
    process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, createSessionCookieValue(user), {
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      secure,
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    }),
  );
}

function clearSessionCookie(res) {
  const secure =
    process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      secure,
      maxAge: 0,
    }),
  );
}

function requireAuth(req, res, next) {
  try {
    const session = readSession(req);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = session;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

function getSafeRedirectPath(value) {
  if (!value || typeof value !== "string") return "/register";
  if (!value.startsWith("/")) return "/register";
  if (value.startsWith("//")) return "/register";
  return value;
}

module.exports = {
  SESSION_COOKIE_NAME,
  buildGoogleAuthUrl,
  clearSessionCookie,
  createSessionCookieValue,
  exchangeCodeForTokens,
  fetchGoogleProfile,
  getFrontendUrl,
  getSafeRedirectPath,
  parseCookies,
  readSession,
  requireAuth,
  setSessionCookie,
  verifySignedPayload,
};
