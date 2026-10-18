const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

type Failure = { status: number; code: string; reason?: string; message: string };

function fail(details: Failure): never {
  console.error("Gemini request failed", { provider: "gemini", endpoint: GEMINI_ENDPOINT, ...details });
  throw new Error(`Gemini request failed [${details.status}]: ${details.reason || details.code}`);
}

export async function callAI(opts: {
  apiKey: string | undefined;
  instructions: string;
  content: Array<Record<string, unknown>>;
  schema?: { name: string; schema: Record<string, unknown> };
}): Promise<string> {
  const apiKey = opts.apiKey?.trim();
  if (!apiKey) {
    fail({ status: 0, code: "MISSING_API_KEY", message: "GEMINI_API_KEY is not configured." });
  }

  let userText = "";
  for (const c of opts.content) {
    if (c["type"] === "input_text" && typeof c["text"] === "string") {
      userText += c["text"] + "\n\n";
    }
  }
  let prompt = `${opts.instructions}\n\nUser Input:\n${userText}`;
  if (opts.schema) {
    prompt += `\n\nRespond strictly in raw JSON matching this schema, without markdown or codeblocks:\n${JSON.stringify(opts.schema.schema)}`;
  }
  const generationConfig: Record<string, unknown> = { temperature: 0.2 };
  if (opts.schema) generationConfig["responseMimeType"] = "application/json";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey.startsWith("AQ.")) headers["Authorization"] = `Bearer ${apiKey}`;
  else headers["x-goog-api-key"] = apiKey;

  let res: Response;
  try {
    res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
    });
  } catch {
    fail({ status: 0, code: "NETWORK_ERROR", message: "Could not reach Gemini." });
  }
  if (!res.ok) {
    // Only log structured provider fields, never request headers or contract content.
    const payload = await res.json().catch(() => null) as {
      error?: { status?: string; message?: string; details?: Array<{ reason?: string }> };
    } | null;
    const sanitize = (value: string) => value.split(apiKey).join("[REDACTED]").replace(/(?:AQ\.|AIza)[A-Za-z0-9_.-]+/g, "[REDACTED]").slice(0, 1000);
    fail({
      status: res.status,
      code: sanitize(payload?.error?.status || "HTTP_ERROR"),
      reason: payload?.error?.details?.find((detail) => typeof detail.reason === "string")?.reason
        ? sanitize(payload.error.details.find((detail) => typeof detail.reason === "string")?.reason || "")
        : undefined,
      message: sanitize(payload?.error?.message || "Gemini rejected the request."),
    });
  }
  let data: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  try { data = await res.json(); }
  catch { fail({ status: res.status, code: "INVALID_RESPONSE", message: "Gemini returned invalid JSON." }); }
  const rawOutput = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
  if (!rawOutput?.trim()) {
    fail({ status: res.status, code: "EMPTY_RESPONSE", message: "Gemini returned no text." });
  }
  const cleaned = rawOutput.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  if (opts.schema) {
    try { JSON.parse(cleaned); }
    catch { fail({ status: res.status, code: "INVALID_JSON", message: "Gemini returned invalid structured output." }); }
  }
  return cleaned;
}
