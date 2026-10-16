// Server-only helper: Direct free integration with Google Gemini API
export async function callAI(opts: {
  instructions: string;
  content: Array<Record<string, unknown>>;
  schema?: { name: string; schema: Record<string, unknown> };
}): Promise<string> {
  const apiKey = process.env['GEMINI_API_KEY'] || process.env['VITE_GEMINI_API_KEY'] || "AIzaSyDummyKeyForFallback";

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

  // Call Gemini REST API
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

  // Clean rawOutput if markdown json wrappers exist
  let cleaned = rawOutput.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  return cleaned;
}
