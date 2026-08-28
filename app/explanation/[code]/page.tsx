"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { StudyFrame } from "@/components/StudyFrame";
import { getParticipantStimulus, type ParticipantStimulus } from "@/lib/api";
import { STUDY_SCENARIO_ID } from "@/lib/study-config";
import { readStudySession } from "@/lib/study-session";

const SHAP_INTRODUCTION = "The system looked at different information about Alex. These were the five most important factors in its decision.";
const SHAP_SIMPLE_EXPLANATION = "Most of these factors made the system more likely to reject Alex's application. Alex's credit enquiries worked in their favour, but the other important factors had a stronger effect. Overall, the system decided to reject the application.";
const SHAP_ACCURACY_NOTE = "This explanation shows which factors were important to the system's decision. It does not mean that any one factor alone caused the rejection.";
const SHAP_LABELS: Record<string, string> = {
  "Employment duration": "Employment",
  "Housing type": "Housing",
  "Credit enquiries in previous quarter": "Credit enquiries",
  "Income type": "Income type",
  "Credit-to-annuity ratio": "Loan-to-annuity comparison",
};
const LIME_INTRODUCTION = "The explanation highlights the following information from Alex's application.";
const LIME_SIMPLE_EXPLANATION = "For Alex's application, the system considered several important details. Alex applied for a cash loan, had been employed for 1.5 years, had employment as their source of income, and had an annuity amount of 30,000. These factors supported rejection in this explanation. Alex also had 1 credit enquiry in the previous quarter, which supported approval. When these factors were considered together, the system rejected Alex's application.";
const LIME_CLARIFICATION = "These factors should be considered together. No single factor on its own means that an application will be approved or rejected.";
const LIME_FACTORS = [
  { label: "Loan type", value: "Cash loan" },
  { label: "Employment", value: "1.5 years" },
  { label: "Source of income", value: "Employment" },
  { label: "Credit enquiries", value: "1 in the previous quarter" },
  { label: "Annuity amount", value: "30,000" },
];

function shapValue(label: string, value: string | number | null) {
  if (label === "Employment duration") return `${String(value)} years`;
  if (label === "Credit enquiries in previous quarter") return `${String(value)} in the last 3 months`;
  return String(value);
}

function displayAmount(value: string | number | null) {
  const amount = Number(value);
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function ExplanationPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [stimulus, setStimulus] = useState<ParticipantStimulus | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const session = readStudySession();
    if (!session) { router.replace("/information"); return; }
    if (decodeURIComponent(params.code ?? "") !== STUDY_SCENARIO_ID) { setError("This study scenario is not available."); return; }
    getParticipantStimulus(session.code).then(setStimulus).catch(() => setError("The assigned explanation is temporarily unavailable."));
  }, [params.code, router]);

  return <StudyFrame step="Step 5 of 7 — Explanation">
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</p>}
      {!stimulus && !error && <p role="status">Loading your assigned explanation…</p>}
      {stimulus && <><p className="text-sm font-semibold uppercase tracking-wide text-accent">Assigned explanation</p><h1 className="mt-2 text-3xl font-bold text-navy">{stimulus.assigned_method === "DiCE" ? "Understanding the decision" : "Why did the system reject Alex's application?"}</h1><div className="mt-6 rounded-xl bg-navy p-5 text-white"><p className="text-sm text-[#B8C4E0]">{stimulus.assigned_method === "DiCE" ? "Application decision" : "System decision"}</p><p className="mt-1 text-xl font-semibold">{stimulus.prediction.decision}</p></div>{stimulus.assigned_method === "SHAP" ? <><p className="mt-8 text-slate-600">{SHAP_INTRODUCTION}</p><ol className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line">{stimulus.explanation.factors.map(factor => { const supportedRejection = factor.direction.startsWith("increases"); const Icon = supportedRejection ? ArrowUp : ArrowDown; return <li data-testid="shap-factor" key={factor.rank} className="grid gap-3 p-4 sm:grid-cols-[2rem_1fr_auto] sm:items-center"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-bold text-navy">{factor.rank}</span><div><p className="font-semibold text-ink">{SHAP_LABELS[factor.label] ?? factor.label}</p><p className="mt-0.5 text-sm text-slate-500">{shapValue(factor.label, factor.value)}</p></div><p className={`flex items-center gap-1 text-sm font-semibold ${supportedRejection ? "text-[#9A3412]" : "text-[#166534]"}`}><Icon className="h-4 w-4" />{supportedRejection ? "Supported rejection" : "Supported approval"}</p></li>; })}</ol><section className="mt-7 rounded-xl bg-surface p-5"><h2 className="text-lg font-bold text-navy">Simple explanation</h2><p className="mt-2 leading-7 text-slate-700">{SHAP_SIMPLE_EXPLANATION}</p></section><p className="mt-4 text-sm leading-6 text-slate-500">{SHAP_ACCURACY_NOTE}</p></> : stimulus.assigned_method === "LIME" ? <><p className="mt-8 text-slate-600">{LIME_INTRODUCTION}</p><ol className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line">{stimulus.explanation.factors.map((factor, index) => { const supportedRejection = factor.direction.startsWith("increases"); const Icon = supportedRejection ? ArrowUp : ArrowDown; const display = LIME_FACTORS[index]; return <li data-testid="lime-factor" key={factor.rank} className="grid gap-3 p-4 sm:grid-cols-[2rem_1fr_auto] sm:items-center"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-bold text-navy">{factor.rank}</span><div><p className="font-semibold text-ink">{display.label}</p><p className="mt-0.5 text-sm text-slate-500">{display.value}</p></div><p className={`flex items-center gap-1 text-sm font-semibold ${supportedRejection ? "text-[#9A3412]" : "text-[#166534]"}`}><Icon className="h-4 w-4" />{supportedRejection ? "Supported rejection" : "Supported approval"}</p></li>; })}</ol><section className="mt-7 rounded-xl bg-surface p-5"><h2 className="text-lg font-bold text-navy">What does this explanation mean?</h2><p className="mt-2 leading-7 text-slate-700">{LIME_SIMPLE_EXPLANATION}</p></section><p className="mt-4 text-sm leading-6 text-slate-500">{LIME_CLARIFICATION}</p></> : <><section className="mt-8"><h2 className="text-xl font-bold text-navy">What could have changed the decision?</h2><p className="mt-2 leading-7 text-slate-600">The application was assessed using the information provided. The following combination of loan details would have resulted in a different decision:</p><div className="mt-5 space-y-3 sm:hidden">{stimulus.explanation.changes.map(change => <div data-testid="dice-mobile-change" key={change.label} className="rounded-xl border border-line p-4"><h3 className="font-semibold text-ink">{change.label}</h3><dl className="mt-3 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-500">Alex&apos;s application</dt><dd className="mt-1 font-semibold text-slate-700">{displayAmount(change.original_value)}</dd></div><div><dt className="text-slate-500">Details that would change the decision</dt><dd className="mt-1 font-semibold text-navy">{displayAmount(change.alternative_value)}</dd></div></dl></div>)}</div><div className="mt-5 hidden overflow-hidden rounded-xl border border-line sm:block"><table className="w-full border-collapse text-left"><thead className="bg-surface text-sm text-slate-700"><tr><th scope="col" className="p-4 font-semibold">Application detail</th><th scope="col" className="p-4 font-semibold">Alex&apos;s application</th><th scope="col" className="p-4 font-semibold">Details that would change the decision</th></tr></thead><tbody className="divide-y divide-line">{stimulus.explanation.changes.map(change => <tr data-testid="dice-change" key={change.label}><th scope="row" className="p-4 font-semibold text-ink">{change.label}</th><td className="p-4 text-slate-700">{displayAmount(change.original_value)}</td><td className="p-4 font-semibold text-navy">{displayAmount(change.alternative_value)}</td></tr>)}</tbody></table></div></section><section className="mt-7 rounded-xl border border-[#B7D7C4] bg-[#F0F8F3] p-5"><h2 className="text-sm font-semibold text-[#245C3A]">Result with these changes</h2><p className="mt-1 text-xl font-bold text-[#245C3A]">Application approved</p></section><section className="mt-7 rounded-xl bg-surface p-5"><h2 className="text-lg font-bold text-navy">What does this mean?</h2><div className="mt-3 space-y-3 leading-7 text-slate-700"><p>Alex&apos;s application included a requested credit amount of 600,000, an annuity amount of 30,000, and goods priced at 500,000. Based on these and the other information provided, the application was rejected.</p><p>If the requested credit amount had been 76,410, the annuity amount 6,187.50, and the goods price 67,500, while all other information remained the same, the application would have been approved.</p><p>These three amounts are considered together. This does not mean that changing just one of them would result in approval. It shows how different application details could have changed the system&apos;s decision.</p></div></section><aside className="mt-4 rounded-xl border border-line p-4"><h2 className="font-semibold text-ink">Important information</h2><p className="mt-1 text-sm leading-6 text-slate-600">This explanation is provided to help you understand the decision. It is not financial advice and does not guarantee the outcome of another application.</p></aside></>}<button type="button" onClick={() => router.push("/questionnaire")} className={`mt-8 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-semibold text-white ${stimulus.assigned_method === "DiCE" ? "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2" : ""}`}>Continue to questionnaire transition <ArrowRight className="h-4 w-4" /></button></>}
    </section>
  </StudyFrame>;
}
