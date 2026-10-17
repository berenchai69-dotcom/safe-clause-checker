export async function callAI(opts: {
  instructions: string;
  content: Array<Record<string, unknown>>;
  schema?: { name: string; schema: Record<string, unknown> };
}): Promise<string> {
  // فحص المفتاح بكل الطرق الممكنة لبيئة سِيرفر Netlify و Nitro
  const apiKey = 
    process.env['GEMINI_API_KEY'] || 
    process.env['VITE_GEMINI_API_KEY'];

  if (!apiKey) {
    throw new Error("CRITICAL: GEMINI_API_KEY is not set in Netlify environment variables!");
  }

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
    throw new Error(`Gemini API Failed [${res.status}]: ${errText}`);
  }

  const data = await res.json();
  const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawOutput) {
    throw new Error("Received empty response body from Gemini API");
  }

  let cleaned = rawOutput.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  return cleaned;
}
