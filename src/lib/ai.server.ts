import { GoogleGenAI } from "@google/genai";

// Server-only helper: Using official Google Gen AI SDK to support all key formats (including AQ.)
export async function callAI(opts: {
  instructions: string;
  content: Array<Record<string, unknown>>;
  schema?: { name: string; schema: Record<string, unknown> };
}): Promise<string> {
  const apiKey = process.env['GEMINI_API_KEY'] || process.env['VITE_GEMINI_API_KEY'];
  if (!apiKey) throw new Error("AI not configured");

  const ai = new GoogleGenAI({ apiKey });

  let userText = "";
  for (const c of opts.content) {
    if (c.type === "input_text" && typeof c.text === "string") {
      userText += c.text + "\n\n";
    }
  }

  const prompt = `${opts.instructions}\n\nUser Input:\n${userText}`;

  const requestOptions: any = {
    model: "gemini-1.5-flash",
    contents: prompt,
  };

  if (opts.schema) {
    requestOptions.config = {
      responseMimeType: "application/json",
      responseSchema: opts.schema.schema,
    };
  }

  const response = await ai.models.generateContent(requestOptions);
  const rawOutput = response.text;

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
