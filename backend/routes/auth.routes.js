const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const {
  buildGoogleAuthUrl,
  clearSessionCookie,
  exchangeCodeForTokens,
  fetchGoogleProfile,
  getFrontendUrl,
  getSafeRedirectPath,
  readSession,
  setSessionCookie,
  verifySignedPayload,
} = require("../auth");
const mongoService = require("../services/mongo.service");

router.get("/google/start", (req, res) => {
  const redirectPath = getSafeRedirectPath(req.query.redirect);
  res.redirect(buildGoogleAuthUrl(req, redirectPath));
});

router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).send("Missing OAuth code or state");
    }

    const verifiedState = verifySignedPayload(String(state));
    if (!verifiedState) {
      return res.status(400).send("Invalid OAuth state");
    }

    const tokens = await exchangeCodeForTokens(req, String(code));
    const profile = await fetchGoogleProfile(tokens.access_token);

    const requireDb = process.env.AUTH_REQUIRE_DB === "true";
    try {
      await mongoService.upsertAuthUser(profile);
      await mongoService.insertAuthEvent({
        id: crypto.randomUUID(),
        provider: profile.provider,
        provider_user_id: profile.provider_user_id,
        email: profile.email,
        name: profile.name,
        event_type: "login",
        redirect_path: verifiedState.redirectPath,
        ip_address: req.ip,
        user_agent: req.get("user-agent") || "",
      });
    } catch (dbError) {
      console.error("Auth DB persistence failed:", dbError.message);
      if (requireDb) {
        clearSessionCookie(res);
        return res.redirect(`${getFrontendUrl()}/login?auth=login&error=db_unavailable`);
      }
    }

    setSessionCookie(res, profile);
    return res.redirect(`${getFrontendUrl()}${getSafeRedirectPath(verifiedState.redirectPath)}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    clearSessionCookie(res);
    return res.redirect(`${getFrontendUrl()}/login?auth=login&error=oauth_callback_failed`);
  }
});

router.get("/me", (req, res) => {
  const session = readSession(req);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    user: {
      provider: session.provider,
      providerUserId: session.sub,
      email: session.email,
      name: session.name,
      picture: session.picture,
      emailVerified: session.email_verified,
    },
  });
});

router.post("/logout", async (req, res) => {
  try {
    clearSessionCookie(res);
    // Keep logout lightweight and always successful.
    return res.json({ ok: true });
  } catch (error) {
    console.error("Logout route error:", error.message);
    clearSessionCookie(res);
    return res.json({ ok: true });
  }
});

module.exports = router;

