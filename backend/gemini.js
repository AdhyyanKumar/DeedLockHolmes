async function analyzeDeed({ deedText, deedHash }) {
  const key = process.env.GEMINI_API_KEY;
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  const prompt = `
You are a fraud analyst. Given deed content and its SHA-256 hash, return ONLY valid JSON:
{"fraud_risk":0-100,"confidence":0-100,"notes":"short"}
DeedHash: ${deedHash}
DeedText: ${deedText.slice(0, 6000)}
`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 }
    })
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini error ${res.status}: ${t}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Try to parse JSON from model response
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`Gemini returned non-JSON: ${text}`);
  }
  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

  // Clamp
  const fraud_risk = Math.max(0, Math.min(100, Number(parsed.fraud_risk)));
  const confidence = Math.max(0, Math.min(100, Number(parsed.confidence)));
  const notes = String(parsed.notes || "");

  return { fraud_risk, confidence, notes };
}

module.exports = { analyzeDeed };