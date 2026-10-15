import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const langName = (l: string) => (l === "ar" ? "Arabic" : "English");
const SAFETY =
  "You are ClauseCheck, an educational real-estate contract assistant for ordinary tenants and buyers. Be plain-spoken and practical. You are not a lawyer; never claim to give legal advice.";

const clauseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "text", "level", "explanation", "questions"],
  properties: {
    title: { type: "string" },
    text: { type: "string" },
    level: { type: "string", enum: ["green", "yellow", "red"] },
    explanation: { type: "string" },
    questions: { type: "array", items: { type: "string" } },
  },
};

export const analyzeContract = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      text: z.string().max(60000).optional(),
      file: z.object({ name: z.string(), mime: z.string(), dataUrl: z.string() }).optional(),
      lang: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    const content: Array<Record<string, unknown>> = [];
    if (data.text) content.push({ type: "input_text", text: `Contract:\n${data.text}` });
    if (data.file) {
      if (data.file.mime.startsWith("image/"))
        content.push({ type: "input_image", image_url: data.file.dataUrl });
      else content.push({ type: "input_file", filename: data.file.name, file_data: data.file.dataUrl });
      content.push({ type: "input_text", text: "Read (OCR if needed) and analyze the attached contract." });
    }
    const out = await callAI({
      instructions: `${SAFETY} Split the contract into its key clauses. Label each green (standard & fair), yellow (be cautious / clarify) or red (risky / unfair). For yellow and red clauses give 2-3 specific questions to ask the landlord or a lawyer; for green, an empty list. Keep 'text' a short excerpt. Write a short executive summary with actionable advice. Respond in ${langName(data.lang)}.`,
      content,
      schema: {
        name: "contract_analysis",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["title", "summary", "advice", "clauses"],
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            advice: { type: "array", items: { type: "string" } },
            clauses: { type: "array", items: clauseSchema },
          },
        },
      },
    });
    return JSON.parse(out) as import("./types").Analysis;
  });

export const chatContract = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      context: z.string().max(60000),
      messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
      lang: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    const convo = data.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const text = await callAI({
      instructions: `${SAFETY} Answer questions about this specific contract analysis. Be concise, use markdown. Respond in ${langName(data.lang)}.\n\nCONTRACT CONTEXT:\n${data.context}`,
      content: [{ type: "input_text", text: `${convo}\n\nASSISTANT:` }],
    });
    return { text };
  });

export const compareContracts = createServerFn({ method: "POST" })
  .inputValidator(z.object({ a: z.string().max(40000), b: z.string().max(40000), lang: z.string() }))
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    const out = await callAI({
      instructions: `${SAFETY} Compare an OLD and NEW version of a contract. List every meaningful change, flag hidden rent hikes, shifted maintenance duties, new penalties etc. Respond in ${langName(data.lang)}.`,
      content: [{ type: "input_text", text: `OLD:\n${data.a}\n\nNEW:\n${data.b}` }],
      schema: {
        name: "comparison",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["summary", "changes"],
          properties: {
            summary: { type: "string" },
            changes: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["topic", "before", "after", "level", "impact"],
                properties: {
                  topic: { type: "string" },
                  before: { type: "string" },
                  after: { type: "string" },
                  level: { type: "string", enum: ["green", "yellow", "red"] },
                  impact: { type: "string" },
                },
              },
            },
          },
        },
      },
    });
    return JSON.parse(out) as import("./types").Comparison;
  });

export const draftAgreement = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ answers: z.record(z.string()), mode: z.enum(["draft", "termsheet"]), lang: z.string() }),
  )
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    const text = await callAI({
      instructions: `${SAFETY} ${data.mode === "draft" ? "Write a balanced, fair residential lease draft agreement protecting both parties, with numbered clauses and blanks for names." : "Write a negotiation term sheet checklist the tenant can bring to the landlord meeting: key terms, target positions, questions, red lines, as markdown checkboxes."} Use markdown. Respond in ${langName(data.lang)}. End with a one-line educational disclaimer.`,
      content: [{ type: "input_text", text: JSON.stringify(data.answers, null, 2) }],
    });
    return { text };
  });

export const generateChecklist = createServerFn({ method: "POST" })
  .inputValidator(z.object({ text: z.string().max(40000), lang: z.string() }))
  .handler(async ({ data }) => {
    const { callAI } = await import("./ai.server");
    const out = await callAI({
      instructions: `${SAFETY} Create a move-in inspection checklist tailored to the contract terms (who maintains what). Group items by room/system: AC, plumbing, electrical & meters, walls & floors, kitchen, doors & locks, etc. Respond in ${langName(data.lang)}.`,
      content: [{ type: "input_text", text: data.text || "Standard apartment lease, no contract provided." }],
      schema: {
        name: "checklist",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["groups"],
          properties: {
            groups: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "items"],
                properties: { name: { type: "string" }, items: { type: "array", items: { type: "string" } } },
              },
            },
          },
        },
      },
    });
    return JSON.parse(out) as { groups: { name: string; items: string[] }[] };
  });
