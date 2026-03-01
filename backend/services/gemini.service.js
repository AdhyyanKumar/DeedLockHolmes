const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL_FLASH = process.env.GEMINI_MODEL_FLASH || "gemini-2.5-flash";
const GEMINI_MODEL_PRO = process.env.GEMINI_MODEL_PRO || "gemini-2.5-pro";
const GEMINI_MODEL_FLASH_FALLBACKS = (
  process.env.GEMINI_MODEL_FLASH_FALLBACKS ||
  "gemini-2.5-flash,gemini-2.0-flash,gemini-2.0-flash-lite,gemini-1.5-flash-002"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const GEMINI_MODEL_PRO_FALLBACKS = (
  process.env.GEMINI_MODEL_PRO_FALLBACKS ||
  "gemini-2.5-pro,gemini-1.5-pro-002,gemini-1.5-pro-latest"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT || 30000);
const GEMINI_MAX_DEED_TEXT_CHARS = Number(process.env.GEMINI_MAX_DEED_CHARS || 12000);
const STRICT_GEMINI = process.env.STRICT_GEMINI === "true";

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function riskLevelFromScore(score) {
  if (score <= 30) return "LOW";
  if (score <= 70) return "MEDIUM";
  return "HIGH";
}

function normalizeText(text, limit = GEMINI_MAX_DEED_TEXT_CHARS) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function safeLocaleNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString();
}

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timer = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Gemini timed out in ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timer]).finally(() => clearTimeout(timeoutId));
}

function parseJsonCandidate(rawText) {
  const text = String(rawText || "").trim();
  if (!text) return null;

  const noFence = text.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const start = noFence.indexOf("{");
  const end = noFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(noFence.slice(start, end + 1));
  } catch {
    return null;
  }
}

class GeminiService {
  constructor() {
    this.genAI = genAI;
    this.flashModelCandidates = [GEMINI_MODEL_FLASH, ...GEMINI_MODEL_FLASH_FALLBACKS].filter(
      (v, i, arr) => arr.indexOf(v) === i
    );
    this.proModelCandidates = [GEMINI_MODEL_PRO, ...GEMINI_MODEL_PRO_FALLBACKS].filter(
      (v, i, arr) => arr.indexOf(v) === i
    );
    this.lastWorkingModel = {
      flash: this.flashModelCandidates[0] || null,
      pro: this.proModelCandidates[0] || null,
    };
  }

  getModel(preferPro = false) {
    if (!this.genAI) return null;
    const key = preferPro ? "pro" : "flash";
    const modelName = this.lastWorkingModel[key];
    if (!modelName) return null;
    return this.genAI.getGenerativeModel({ model: modelName });
  }

  shouldTryNextModel(error) {
    const msg = String(error?.message || "").toLowerCase();
    return (
      msg.includes("not found") ||
      msg.includes("404") ||
      msg.includes("not supported for generatecontent") ||
      msg.includes("unsupported model")
    );
  }

  async generateContentWithFallback(content, preferPro = false) {
    if (!this.genAI) {
      throw new Error("Gemini model is not configured");
    }

    const candidates = preferPro ? this.proModelCandidates : this.flashModelCandidates;
    const key = preferPro ? "pro" : "flash";
    const ordered = [
      this.lastWorkingModel[key],
      ...candidates.filter((name) => name !== this.lastWorkingModel[key]),
    ].filter(Boolean);

    let lastError = null;
    for (const modelName of ordered) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await withTimeout(model.generateContent(content), GEMINI_TIMEOUT_MS);
        this.lastWorkingModel[key] = modelName;
        return { result, modelName };
      } catch (error) {
        lastError = error;
        if (!this.shouldTryNextModel(error)) {
          throw error;
        }
      }
    }

    throw lastError || new Error("No working Gemini model found");
  }

  parseFraudAnalysis(analysisText) {
    const raw = String(analysisText || "");
    const jsonCandidate = parseJsonCandidate(raw);
    if (jsonCandidate && typeof jsonCandidate === "object") {
      const score = clampNumber(jsonCandidate.riskScore, 0, 100, 50);
      return {
        score,
        level: riskLevelFromScore(score),
        confidence: clampNumber(jsonCandidate.confidence, 0, 100, 75),
        recommendation: String(jsonCandidate.recommendation || "REVIEW REQUIRED").toUpperCase(),
        factors: Array.isArray(jsonCandidate.factors)
          ? jsonCandidate.factors.map((f) => String(f)).slice(0, 8)
          : [],
      };
    }

    const scoreMatch =
      raw.match(/Risk Score:\s*(\d{1,3})/i) || raw.match(/"riskScore"\s*:\s*(\d{1,3})/i);
    const score = clampNumber(scoreMatch?.[1], 0, 100, 50);

    const levelMatch =
      raw.match(/Risk Level:\s*(LOW|MEDIUM|HIGH)/i) ||
      raw.match(/"riskLevel"\s*:\s*"(LOW|MEDIUM|HIGH)"/i);
    const level = levelMatch ? String(levelMatch[1]).toUpperCase() : riskLevelFromScore(score);

    const confidenceMatch =
      raw.match(/Confidence:\s*(\d{1,3})%/i) ||
      raw.match(/"confidence"\s*:\s*(\d{1,3})/i);
    const confidence = clampNumber(confidenceMatch?.[1], 0, 100, 75);

    const recommendationMatch = raw.match(
      /RECOMMENDATION:\s*\n?\s*(APPROVE|REVIEW REQUIRED|REJECT)/i
    );
    const recommendation = recommendationMatch
      ? recommendationMatch[1].toUpperCase()
      : level === "HIGH"
        ? "REVIEW REQUIRED"
        : "APPROVE";

    const findingsSection = raw.match(
      /KEY FINDINGS:\s*\n([\s\S]*?)(?=\n\n|DETAILED ANALYSIS|RECOMMENDATION|$)/i
    );
    const factors = findingsSection
      ? findingsSection[1]
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("•"))
          .map((line) => line.replace(/^•\s*/, ""))
      : [];

    return { score, level, confidence, recommendation, factors };
  }

  buildFraudAnalysisPrompt(deedText, propertyData = {}, transactionHistory = []) {
    const normalizedDeedText = normalizeText(deedText);
    const historyText = transactionHistory.length
      ? transactionHistory
          .map(
            (t) =>
              `- ${new Date(t.CREATED_AT || t.created_at || Date.now()).toLocaleDateString()}: ` +
              `$${safeLocaleNumber(t.SALE_PRICE || t.sale_price || 0)} to ${t.OWNER_NAME || t.owner_name || "Unknown"}`
          )
          .join("\n")
      : "No previous transaction history available.";

    return `You are an expert real estate fraud investigator analyzing a property deed.

DEED DOCUMENT TEXT:
"""
${normalizedDeedText || "[NO_TEXT_EXTRACTED]"}
"""

PROPERTY INFORMATION:
- Property ID: ${propertyData.propertyId || "N/A"}
- Address: ${propertyData.address || "N/A"}
- Current Owner: ${propertyData.ownerName || "N/A"}
- Sale Price: $${safeLocaleNumber(propertyData.salePrice)}
- Deed Hash: ${propertyData.deedHash || "N/A"}

PREVIOUS TRANSACTIONS:
${historyText}

ANALYSIS TASK (LESS STRICT):
Focus mainly on whether the deed appears to match the submitted property details and includes a real signature.
Use these practical rules:
1. Name, address, and price only need to be a close/approximate match (small wording differences are acceptable).
2. Signatures do NOT need exact spelling match to typed names.
3. Presence of signature is important, but do NOT require a notary seal/stamp/embosser.
4. "Prepared By: Automated Registry System" is acceptable and should not be treated as suspicious by itself.
5. Reject only for clear high-risk issues (major identity/address/price mismatch, obvious tampering, or missing execution signatures).

OUTPUT FORMAT (STRICT):
Risk Score: [0-100]
Risk Level: [LOW/MEDIUM/HIGH]
Confidence: [0-100]%

KEY FINDINGS:
• [bullet]
• [bullet]
• [bullet]

DETAILED ANALYSIS:
[2 short paragraphs]

RECOMMENDATION:
[APPROVE / REVIEW REQUIRED / REJECT] - [short reason]
`;
  }

  getFallbackAnalysis(propertyData = {}, reason = "Gemini unavailable") {
    let score = 20;
    const factors = [];
    const deedText = normalizeText(propertyData.deedText);

    const price = Number(propertyData.salePrice || 0);
    if (!Number.isFinite(price) || price <= 0) {
      score += 20;
      factors.push("Missing or non-positive sale price");
    } else if (price < 50000) {
      score += 12;
      factors.push("Potentially below-market sale price");
    }

    if (!propertyData.ownerName || String(propertyData.ownerName).trim().length < 4) {
      score += 15;
      factors.push("Incomplete owner information");
    }

    if (!propertyData.address || String(propertyData.address).trim().length < 8) {
      score += 15;
      factors.push("Incomplete property address");
    }

    if (!propertyData.deedHash || String(propertyData.deedHash).trim().length < 16) {
      score += 10;
      factors.push("Weak or missing deed hash");
    }

    const redFlagPhrases = [
      "quitclaim",
      "as-is",
      "without warranty",
      "urgent sale",
      "power of attorney",
      "cash only",
      "handwritten",
      "amended deed",
      "foreclosure",
      "liens",
    ];

    const hits = redFlagPhrases.filter((flag) => deedText.toLowerCase().includes(flag));
    if (hits.length > 0) {
      score += Math.min(30, hits.length * 6);
      factors.push(`Red-flag terms found: ${hits.slice(0, 4).join(", ")}`);
    }

    if (deedText.length > 0 && deedText.length < 80) {
      score += 10;
      factors.push("Very low deed text extraction quality");
    }

    const riskScore = clampNumber(score, 0, 100, 55);
    const riskLevel = riskLevelFromScore(riskScore);

    return {
      success: true,
      riskScore,
      riskLevel,
      confidence: 50,
      recommendation: riskLevel === "HIGH" ? "REVIEW REQUIRED" : "APPROVE",
      factors,
      analysis:
        `Fallback analysis (${reason}). ` +
        (factors.length ? factors.join("; ") : "Insufficient context for deeper analysis."),
      fallback: true,
      method: "fallback",
      timestamp: new Date().toISOString(),
    };
  }

  async extractTextFromPDF(pdfBuffer) {
    try {
      const parsed = await pdfParse(pdfBuffer);
      const extractedText = normalizeText(parsed.text);
      return {
        text: extractedText,
        numPages: Number(parsed.numpages || 0),
        info: parsed.info || {},
      };
    } catch (error) {
      return {
        text: "",
        numPages: 0,
        info: {},
        error: error.message,
      };
    }
  }

  async analyzeDeedText(deedText, propertyData, transactionHistory = []) {
    const prompt = this.buildFraudAnalysisPrompt(deedText, propertyData, transactionHistory);
    const { result, modelName } = await this.generateContentWithFallback(prompt, false);
    const response = await result.response;
    const analysisText = response.text();
    const parsed = this.parseFraudAnalysis(analysisText);

    return {
      success: true,
      riskScore: parsed.score,
      riskLevel: parsed.level,
      confidence: parsed.confidence,
      recommendation: parsed.recommendation,
      factors: parsed.factors,
      analysis: analysisText,
      method: "text",
      model: modelName,
      deedTextLength: normalizeText(deedText).length,
      timestamp: new Date().toISOString(),
    };
  }

  async analyzeDeedPDFVisually(pdfBuffer, propertyData = {}) {
    const base64PDF = Buffer.from(pdfBuffer).toString("base64");
    const prompt = `Analyze this property deed document for fraud indicators.

Property:
- Address: ${propertyData.address || "N/A"}
- Owner: ${propertyData.ownerName || "N/A"}
- Price: $${safeLocaleNumber(propertyData.salePrice)}

Look for visual tampering and major inconsistencies.
Use these rules:
- Name, address, and price can be approximate matches.
- Signatures may vary from typed names.
- Do not require a notary seal/stamp.
- "Prepared By: Automated Registry System" is acceptable.
- Reject only for clear serious issues such as obvious tampering, major mismatch, or missing execution signatures.
Return:
Risk Score: [0-100]
Risk Level: [LOW/MEDIUM/HIGH]
Confidence: [0-100]%
KEY FINDINGS:
• [bullet]
• [bullet]
RECOMMENDATION:
[APPROVE / REVIEW REQUIRED / REJECT] - [short reason]`;

    const { result, modelName } = await this.generateContentWithFallback(
      [
        prompt,
        {
          inlineData: {
            data: base64PDF,
            mimeType: "application/pdf",
          },
        },
      ],
      true
    );
    const response = await result.response;
    const analysisText = response.text();
    const parsed = this.parseFraudAnalysis(analysisText);

    return {
      success: true,
      riskScore: parsed.score,
      riskLevel: parsed.level,
      confidence: parsed.confidence,
      recommendation: parsed.recommendation,
      factors: parsed.factors,
      analysis: analysisText,
      method: "visual",
      model: modelName,
      timestamp: new Date().toISOString(),
    };
  }

  async analyzeDeedForFraud(pdfBuffer, propertyData = {}, transactionHistory = []) {
    try {
      const extraction = await this.extractTextFromPDF(pdfBuffer);
      const payload = {
        ...propertyData,
        deedText: extraction.text,
      };

      if (extraction.text && extraction.text.length >= 80) {
        const textResult = await this.analyzeDeedText(extraction.text, payload, transactionHistory);
        return {
          ...textResult,
          extraction: {
            method: "pdf_text",
            numPages: extraction.numPages,
            extractedChars: extraction.text.length,
          },
        };
      }

      const visualResult = await this.analyzeDeedPDFVisually(pdfBuffer, payload);
      return {
        ...visualResult,
        extraction: {
          method: "visual_pdf",
          numPages: extraction.numPages,
          extractedChars: extraction.text.length,
          extractionError: extraction.error || null,
        },
      };
    } catch (error) {
      if (STRICT_GEMINI) throw error;
      return this.getFallbackAnalysis(propertyData, error.message || "analysis failure");
    }
  }

  async detectFraudRisk(propertyData = {}) {
    try {
      if (propertyData.pdfBuffer && Buffer.isBuffer(propertyData.pdfBuffer)) {
        return await this.analyzeDeedForFraud(
          propertyData.pdfBuffer,
          propertyData,
          propertyData.transactionHistory || []
        );
      }

      if (propertyData.deedText && normalizeText(propertyData.deedText).length > 0) {
        return await this.analyzeDeedText(
          propertyData.deedText,
          propertyData,
          propertyData.transactionHistory || []
        );
      }

      return this.getFallbackAnalysis(propertyData, "No PDF/deed text provided");
    } catch (error) {
      if (STRICT_GEMINI) throw error;
      return this.getFallbackAnalysis(propertyData, error.message || "detectFraudRisk failure");
    }
  }

  async analyzeProperty(propertyData, transactionHistory = []) {
    const historyText = transactionHistory.length
      ? transactionHistory
          .map(
            (t) =>
              `- ${new Date(t.CREATED_AT || t.created_at || Date.now()).toLocaleDateString()}: ` +
              `$${safeLocaleNumber(t.SALE_PRICE || t.sale_price || 0)} owned by ${t.OWNER_NAME || t.owner_name || "Unknown"}`
          )
          .join("\n")
      : "No transaction history available.";

    const prompt = `You are a real estate investment advisor.
Analyze this property:
- Address: ${propertyData.address || "N/A"}
- Current Owner: ${propertyData.ownerName || "N/A"}
- Current Price: $${safeLocaleNumber(propertyData.salePrice)}

History:
${historyText}

Provide:
1. Price trend
2. Ownership stability
3. Risk assessment
4. Investment recommendation
Keep under 250 words.`;

    const { result, modelName } = await this.generateContentWithFallback(prompt, false);
    const response = await result.response;
    return {
      success: true,
      analysis: response.text(),
      model: modelName,
      timestamp: new Date().toISOString(),
    };
  }

  async generatePropertyDescription(propertyData) {
    const prompt = `Write a professional property listing description.
Address: ${propertyData.address || "N/A"}
Price: $${safeLocaleNumber(propertyData.salePrice)}
Owner: ${propertyData.ownerName || "N/A"}

Include:
- location value
- investment perspective
- blockchain-verification trust signal
Length: 120-180 words.`;

    const { result, modelName } = await this.generateContentWithFallback(prompt, false);
    const response = await result.response;
    return {
      success: true,
      description: response.text(),
      model: modelName,
      timestamp: new Date().toISOString(),
    };
  }

  async chatWithProperty(propertyId, userQuestion, propertyData, conversationHistory = []) {
    const historyText = conversationHistory.length
      ? conversationHistory.map((m) => `${m.role}: ${m.message}`).join("\n")
      : "No previous conversation.";

    const prompt = `You are a property registry assistant.
Property:
- ID: ${propertyData.propertyId || propertyId}
- Address: ${propertyData.address || "N/A"}
- Owner: ${propertyData.ownerName || "N/A"}
- Price: $${safeLocaleNumber(propertyData.salePrice)}

Conversation:
${historyText}

User Question:
${userQuestion}

Answer clearly in under 150 words.`;

    const { result, modelName } = await this.generateContentWithFallback(prompt, false);
    const response = await result.response;
    return {
      success: true,
      answer: response.text(),
      model: modelName,
      timestamp: new Date().toISOString(),
    };
  }

  async compareProperties(properties = []) {
    const list = properties
      .map(
        (p, i) =>
          `Property ${i + 1}: ${p.address || "N/A"}, owner ${p.ownerName || "N/A"}, price $${safeLocaleNumber(p.salePrice)}`
      )
      .join("\n");

    const prompt = `Compare these properties for investment quality:
${list}

Return:
1. Best choice with reason
2. Ranking
3. Key risk notes
Under 250 words.`;

    const { result, modelName } = await this.generateContentWithFallback(prompt, true);
    const response = await result.response;
    return {
      success: true,
      comparison: response.text(),
      model: modelName,
      timestamp: new Date().toISOString(),
    };
  }

  async healthCheck() {
    try {
      if (!this.genAI) {
        return {
          status: "unhealthy",
          apiKey: "missing",
          model: GEMINI_MODEL_FLASH,
          error: "GEMINI_API_KEY missing",
        };
      }
      const { result, modelName } = await this.generateContentWithFallback(
        "Reply only with OK",
        false
      );
      const response = await result.response;
      const text = response.text();
      return {
        status: text.toUpperCase().includes("OK") ? "healthy" : "degraded",
        model: modelName,
        apiKey: "configured",
        test: text.slice(0, 120),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        model: GEMINI_MODEL_FLASH,
        apiKey: GEMINI_API_KEY ? "configured" : "missing",
        error: error.message,
      };
    }
  }
}

module.exports = new GeminiService();
