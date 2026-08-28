import type { ExplanationMethod } from "@/lib/api";

const CODE_KEY = "participantCode";
const METHOD_KEY = "assignedMethod";
const INFORMATION_KEY = "informationViewed";
const CONSENT_KEY = "consentCompleted";
const QUESTIONNAIRE_KEY = "questionnaireTransitionViewed";

export const markInformationViewed = () => sessionStorage.setItem(INFORMATION_KEY, "true");
export const hasViewedInformation = () => sessionStorage.getItem(INFORMATION_KEY) === "true";
export const markConsentCompleted = () => sessionStorage.setItem(CONSENT_KEY, "true");
export const hasCompletedConsent = () => hasViewedInformation() && sessionStorage.getItem(CONSENT_KEY) === "true";
export const markQuestionnaireTransitionViewed = () => sessionStorage.setItem(QUESTIONNAIRE_KEY, "true");
export const hasViewedQuestionnaireTransition = () => sessionStorage.getItem(QUESTIONNAIRE_KEY) === "true";

export function saveStudySession(code: string, method: ExplanationMethod) {
  sessionStorage.setItem(CODE_KEY, code);
  sessionStorage.setItem(METHOD_KEY, method);
}

export function readStudySession(): { code: string; method: ExplanationMethod } | null {
  if (!hasCompletedConsent()) return null;
  const code = sessionStorage.getItem(CODE_KEY);
  const method = sessionStorage.getItem(METHOD_KEY) as ExplanationMethod | null;
  if (!code || !method || !["SHAP", "LIME", "DiCE"].includes(method)) return null;
  return { code, method };
}
