require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { sha256Hex } = require("./hash");
const { analyzeDeed } = require("./gemini");
const { connectSnowflake, insertAnalyticsRow } = require("./snowflake");
const { registerOnChain } = require("./solana");
const crypto = require("crypto");

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/register", upload.single("deed"), async (req, res) => {
  try {
    const property_address = req.body.property_address || "";
    const owner_name = req.body.owner_name || "";

    if (!req.file) return res.status(400).json({ error: "Missing deed file" });
    if (!property_address) return res.status(400).json({ error: "Missing property_address" });
    if (!owner_name) return res.status(400).json({ error: "Missing owner_name" });

    const deedBuffer = req.file.buffer;
    const deed_hash = sha256Hex(deedBuffer);

    // Extract text (PDF only). If you upload plain text, use req.file.buffer.toString()
    const parsed = await pdfParse(deedBuffer);
    const deedText = parsed.text || "";

    const { fraud_risk, confidence, notes } = await analyzeDeed({ deedText, deedHash: deed_hash });

    const { txSig, propertyPda } = await registerOnChain({
      deedHash: deed_hash,
      propertyAddress: property_address,
      ownerName: owner_name,
      confidence,
      fraudRisk: fraud_risk
    });

    // Snowflake log (best effort)
    try {
      const conn = await connectSnowflake();
      await insertAnalyticsRow(conn, {
        id: crypto.randomUUID(),
        property_address,
        owner_name,
        deed_hash,
        gemini_confidence: confidence,
        fraud_risk,
        tx_signature: txSig
      });
      conn.destroy();
    } catch (e) {
      // do not fail the main flow if Snowflake fails
      console.error("Snowflake insert failed:", e.message);
    }

    res.json({
      property_pda: propertyPda,
      tx_signature: txSig,
      fraud_risk,
      confidence,
      notes,
      explorer: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend running on :${port}`));