import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    inputValidator: () => ({ handler: (handler: unknown) => handler }),
  }),
}));
vi.mock("@/lib/ai.server", () => ({ callAI: vi.fn().mockResolvedValue("{}") }));

import { analyzeContract, chatContract, compareContracts, draftAgreement, generateChecklist } from "@/lib/ai.functions";
import { callAI } from "@/lib/ai.server";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

async function runAllTools() {
  await analyzeContract({ data: { text: "Lease", lang: "en" } });
  await chatContract({ data: { context: "Lease", messages: [], lang: "en" } });
  await compareContracts({ data: { a: "Old", b: "New", lang: "en" } });
  await draftAgreement({ data: { answers: {}, mode: "draft", lang: "en" } });
  await generateChecklist({ data: { text: "Lease", lang: "en" } });
}

describe("Server credential resolution across all five Gemini tools", () => {
  it("prefers GEMINI_API_KEY over VITE_GEMINI_API_KEY", async () => {
    vi.stubEnv("GEMINI_API_KEY", "AQ.primary-test");
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.fallback-test");
    await runAllTools();
    expect(callAI).toHaveBeenCalledTimes(5);
    for (const [options] of vi.mocked(callAI).mock.calls) expect(options.apiKey).toBe("AQ.primary-test");
  });

  it("uses VITE_GEMINI_API_KEY when the primary server key is empty", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.fallback-test");
    await runAllTools();
    expect(callAI).toHaveBeenCalledTimes(5);
    for (const [options] of vi.mocked(callAI).mock.calls) expect(options.apiKey).toBe("AQ.fallback-test");
  });
});