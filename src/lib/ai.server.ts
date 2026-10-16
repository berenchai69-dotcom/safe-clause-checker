// Server-only helper: Direct integration supporting AQ. keys via x-goog-api-key header
export async function callAI(opts: {
  instructions: string;
  content: Array<Record<string, unknown>>;
  schema?: { name: string; schema: Record<string, unknown> };
}): Promise<string> {
  const apiKey = process.env['GEMINI_API_KEY'] || process.env['VITE_GEMINI_API_KEY'];
  if (!apiKey) throw new Error("AI not configured");

  // Process text input
  let userText = "";
  for (const c of opts.content) {
    if (c.type === "input_text" && typeof c.text === "string") {
      userText += c.text + "\n\n";
    }
  }

  const systemInstruction = opts.instructions;
  let prompt = `${systemInstruction}\n\nUser Input:\n${userText}`;

  if (opts.schema) {
    prompt += `\n\nCRITICAL: You MUST respond strictly in raw JSON format matching this JSON schema. Do not wrap in markdown or codeblocks. Output valid JSON only.\nSchema structure: ${JSON.stringify(
      opts.schema.schema
    )}`;
  }

  // Official endpoint for Gemini 1.5 Flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

  const body: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };

  if (opts.schema) {
    (body.generationConfig as Record<string, unknown>)["responseMimeType"] = "application/json";
  }

  // Send request with x-goog-api-key header for AQ. keys support
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API Error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawOutput) {
    throw new Error("Empty AI response from Gemini");
  }

  let cleaned = rawOutput.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  return cleaned;
}
