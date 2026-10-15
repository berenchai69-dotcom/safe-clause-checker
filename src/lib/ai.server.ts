// Server-only helper: streams a Responses call through Lovable AI Gateway and returns final text.
export async function callAI(opts: {
  instructions: string;
  content: Array<Record<string, unknown>>;
  schema?: { name: string; schema: Record<string, unknown> };
}): Promise<string> {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error("AI not configured");
  const body: Record<string, unknown> = {
    model: "openai/gpt-6-astra",
    instructions: opts.instructions,
    input: [{ role: "user", content: opts.content }],
    stream: true,
    store: false,
    reasoning: { effort: "low" },
  };
  if (opts.schema) {
    body['text'] = {
      format: { type: "json_schema", name: opts.schema.name, schema: opts.schema.schema, strict: true },
    };
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "response.output_text.delta") out += ev.delta;
        if (ev.type === "response.failed" || ev.type === "error") throw new Error("AI failed");
      } catch (e) {
        if (e instanceof Error && e.message === "AI failed") throw e;
      }
    }
  }
  if (!out) throw new Error("Empty AI response");
  return out;
}
