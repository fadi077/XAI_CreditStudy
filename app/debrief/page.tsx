import { CheckCircle2, ClipboardList } from "lucide-react";
import { StudyFrame } from "@/components/StudyFrame";
import { QUESTIONNAIRE_URL } from "@/lib/study-config";

export default function Debrief() {
  return <StudyFrame step="Step 4 of 4 — Debrief">
    <section className="rounded-2xl border border-line bg-white p-6 text-center shadow-card sm:p-10">
      <CheckCircle2 className="mx-auto h-12 w-12 text-[#2A7D4F]" />
      <h1 className="mt-5 text-3xl font-bold text-navy">Explanation viewing complete</h1>
      <div className="mx-auto mt-5 max-w-2xl space-y-3 leading-7 text-slate-600"><p>This project compares ways of explaining automated credit-risk predictions.</p><p>The scenario was fictional and was not a personal financial decision. Questionnaire responses are anonymous and the approved questionnaire will be the next step once its link is configured.</p></div>
      {QUESTIONNAIRE_URL ? <a href={QUESTIONNAIRE_URL} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"><ClipboardList className="h-5 w-5" />Continue to questionnaire</a> : <button disabled className="mt-8 inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-300 px-6 py-3 font-semibold text-slate-600"><ClipboardList className="h-5 w-5" />Questionnaire not yet available</button>}
      {!QUESTIONNAIRE_URL && process.env.NODE_ENV === "development" && <p className="mt-3 text-sm text-amber-700">Researcher note: configure NEXT_PUBLIC_QUESTIONNAIRE_URL after approval.</p>}
    </section>
  </StudyFrame>;
}
