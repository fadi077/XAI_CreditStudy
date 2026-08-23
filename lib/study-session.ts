import type { ExplanationMethod } from "@/lib/api";

const CODE_KEY = "participantCode";
const METHOD_KEY = "assignedMethod";

export function saveStudySession(code: string, method: ExplanationMethod) {
  sessionStorage.setItem(CODE_KEY, code);
  sessionStorage.setItem(METHOD_KEY, method);
}

export function readStudySession(): { code: string; method: ExplanationMethod } | null {
  const code = sessionStorage.getItem(CODE_KEY);
  const method = sessionStorage.getItem(METHOD_KEY) as ExplanationMethod | null;
  if (!code || !method || !["SHAP", "LIME", "DiCE"].includes(method)) return null;
  return { code, method };
}
