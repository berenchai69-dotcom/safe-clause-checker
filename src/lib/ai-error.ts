export function aiErrorMessage(error: unknown, lang: string): string {
  const detail = error instanceof Error && error.message.startsWith("Gemini request failed")
    ? error.message
    : "";
  const message = lang === "ar"
    ? "تعذّر إكمال طلب الذكاء الاصطناعي. لم يتم إنشاء نتيجة. يرجى المحاولة مجدداً أو مراجعة إعدادات Gemini."
    : "AI request failed. No result was generated. Please retry or check the Gemini configuration.";
  return detail ? `${message} ${detail}` : message;
}