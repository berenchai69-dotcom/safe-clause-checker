import { afterEach, describe, expect, it, vi } from "vitest";
import { callAI } from "@/lib/ai.server";

const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const options = { instructions: "Test", content: [{ type: "input_text", text: "Test contract" }] };
const success = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Result" }] } }] }));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Gemini authentication", () => {
  it("uses Bearer exclusively for AQ. keys at the required endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(success());
    vi.stubGlobal("fetch", fetchMock);
    await expect(callAI({ ...options, apiKey: "AQ.test-credential" })).resolves.toBe("Result");
    expect(fetchMock).toHaveBeenCalledWith(endpoint, expect.objectContaining({ headers: {
      "Content-Type": "application/json", Authorization: "Bearer AQ.test-credential",
    } }));
  });

  it("uses x-goog-api-key exclusively for traditional keys", async () => {
    const fetchMock = vi.fn().mockResolvedValue(success());
    vi.stubGlobal("fetch", fetchMock);
    await callAI({ ...options, apiKey: "AIzaSy-test-credential" });
    expect(fetchMock).toHaveBeenCalledWith(endpoint, expect.objectContaining({ headers: {
      "Content-Type": "application/json", "x-goog-api-key": "AIzaSy-test-credential",
    } }));
  });

  it("throws a diagnostic 401 instead of producing demo output and redacts credentials", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: {
      status: "UNAUTHENTICATED", message: "Rejected AQ.test-credential",
      details: [{ reason: "ACCESS_TOKEN_TYPE_UNSUPPORTED" }],
    } }), { status: 401 })));
    await expect(callAI({ ...options, apiKey: "AQ.test-credential" })).rejects.toThrow("Gemini request failed [401]: ACCESS_TOKEN_TYPE_UNSUPPORTED");
    expect(logger).toHaveBeenCalledWith("Gemini request failed", expect.objectContaining({
      status: 401, code: "UNAUTHENTICATED", reason: "ACCESS_TOKEN_TYPE_UNSUPPORTED", message: "Rejected [REDACTED]",
    }));
    expect(JSON.stringify(logger.mock.calls)).not.toContain("AQ.test-credential");
  });

  it("fails explicitly before fetching when no key is configured", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(callAI({ ...options, apiKey: undefined })).rejects.toThrow("MISSING_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("logs network failures without exposing request credentials", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failure")));
    await expect(callAI({ ...options, apiKey: "AQ.test-credential" })).rejects.toThrow("NETWORK_ERROR");
  });

  it("rejects an empty successful response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));
    await expect(callAI({ ...options, apiKey: "AQ.test-credential" })).rejects.toThrow("EMPTY_RESPONSE");
  });
});