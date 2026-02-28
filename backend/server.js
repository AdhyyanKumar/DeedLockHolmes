require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { sha256Hex } = require("./hash");
const { analyzeDeed } = require("./gemini");
const {
  connectSnowflake,
  ensureSchema,
  insertAnalyticsRow,
  insertAuthEvent,
  listAnalyticsRows,
  upsertAuthUser,
} = require("./snowflake");
const { registerOnChain } = require("./solana");
const crypto = require("crypto");
const {
  buildGoogleAuthUrl,
  clearSessionCookie,
  exchangeCodeForTokens,
  fetchGoogleProfile,
  getFrontendUrl,
  getSafeRedirectPath,
  readSession,
  requireAuth,
  setSessionCookie,
  verifySignedPayload,
} = require("./auth");

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(
  cors({
    origin: getFrontendUrl(),
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

async function withSnowflake(task) {
  const conn = await connectSnowflake();
  try {
    await ensureSchema(conn);
    return await task(conn);
  } finally {
    conn.destroy();
  }
}

async function logAuthEvent(event) {
  try {
    await withSnowflake((conn) => insertAuthEvent(conn, event));
  } catch (error) {
    console.error("Snowflake auth event insert failed:", error.message);
  }
}

app.get("/auth/google/start", (req, res) => {
  const redirectPath = getSafeRedirectPath(req.query.redirect);
  res.redirect(buildGoogleAuthUrl(req, redirectPath));
});

app.get("/auth/google/callback", async (req, res) => {
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

    await withSnowflake(async (conn) => {
      await upsertAuthUser(conn, profile);
      await insertAuthEvent(conn, {
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
    });

    setSessionCookie(res, profile);
    return res.redirect(`${getFrontendUrl()}${getSafeRedirectPath(verifiedState.redirectPath)}`);
  } catch (error) {
    console.error(error);
    return res.status(500).send(error.message);
  }
});

app.get("/auth/me", (req, res) => {
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

app.post("/auth/logout", async (req, res) => {
  const session = readSession(req);
  clearSessionCookie(res);

  if (session) {
    await logAuthEvent({
      id: crypto.randomUUID(),
      provider: session.provider,
      provider_user_id: session.sub,
      email: session.email,
      name: session.name,
      event_type: "logout",
      redirect_path: "/",
      ip_address: req.ip,
      user_agent: req.get("user-agent") || "",
    });
  }

  return res.json({ ok: true });
});

app.get("/properties", async (req, res) => {
  try {
    const rows = await withSnowflake((conn) => listAnalyticsRows(conn, 100));
    const items = rows.map((row) => ({
      id: row.ID,
      address: row.PROPERTY_ADDRESS,
      owner: row.OWNER_NAME,
      confidenceScore: Number(row.GEMINI_CONFIDENCE ?? 0),
      fraudRisk:
        Number(row.FRAUD_RISK ?? 0) >= 80
          ? "High"
          : Number(row.FRAUD_RISK ?? 0) >= 50
            ? "Medium"
            : "Low",
      timestamp: new Date(row.CREATED_AT).toISOString(),
      accountAddress: row.PROPERTY_PDA,
      explorerUrl: `https://explorer.solana.com/tx/${row.TX_SIGNATURE}?cluster=devnet`,
      transferCount: 0,
    }));

    return res.json({ items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/register", requireAuth, upload.single("deed"), async (req, res) => {
  try {
    const property_address = req.body.property_address || "";
    const owner_name = req.body.owner_name || "";

    if (!req.file) return res.status(400).json({ error: "Missing deed file" });
    if (!property_address) return res.status(400).json({ error: "Missing property_address" });
    if (!owner_name) return res.status(400).json({ error: "Missing owner_name" });

    const deedBuffer = req.file.buffer;
    const deed_hash = sha256Hex(deedBuffer);

    const parsed = await pdfParse(deedBuffer);
    const deedText = parsed.text || "";

    const { fraud_risk, confidence, notes } = await analyzeDeed({ deedText, deedHash: deed_hash });

    const { txSig, propertyPda } = await registerOnChain({
      deedHash: deed_hash,
      propertyAddress: property_address,
      ownerName: owner_name,
      confidence,
      fraudRisk: fraud_risk,
    });

    try {
      await withSnowflake((conn) =>
        insertAnalyticsRow(conn, {
          id: crypto.randomUUID(),
          property_address,
          owner_name,
          deed_hash,
          gemini_confidence: confidence,
          fraud_risk,
          tx_signature: txSig,
          property_pda: propertyPda,
          notes,
          registered_by_provider: req.user.provider,
          registered_by_provider_user_id: req.user.sub,
          registered_by_email: req.user.email,
          registered_by_name: req.user.name,
        }),
      );
    } catch (error) {
      console.error("Snowflake insert failed:", error.message);
    }

    return res.json({
      property: {
        id: crypto.randomUUID(),
        address: property_address,
        owner: owner_name,
        confidenceScore: confidence,
        fraudRisk: fraud_risk >= 80 ? "High" : fraud_risk >= 50 ? "Medium" : "Low",
        timestamp: new Date().toISOString(),
        accountAddress: propertyPda,
        explorerUrl: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
        transferCount: 0,
      },
      tx_signature: txSig,
      fraud_risk,
      confidence,
      notes,
      explorer: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend running on :${port}`));
